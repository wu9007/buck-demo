# 使用事件样例

主规则见 [usage-event.md](usage-event.md)。本文只放 Logback 路由、后端构造和前端 tracker 片段，不改字段白名单或事件矩阵。

## 日志路由

完整 Logback 基线优先用 release bundle 的 `templates/backend-minimal/src/main/resources/logback-spring.xml`。独立文件：

```xml
<configuration>
    <property name="LOG_HOME" value="${LOG_HOME:-logs}" />

    <appender name="BRICK_USAGE_EVENT_FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>${LOG_HOME}/usage-event.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>${LOG_HOME}/usage-event.%d{yyyy-MM-dd}.log</fileNamePattern>
            <maxHistory>14</maxHistory>
        </rollingPolicy>
        <encoder>
            <pattern>%msg%n</pattern>
        </encoder>
    </appender>

    <logger name="io.github.wu9007.buck.usage" level="INFO" additivity="false">
        <appender-ref ref="BRICK_USAGE_EVENT_FILE" />
    </logger>
</configuration>
```

已有统一 appender 时按 marker 分流：

```xml
<appender name="BRICK_USAGE_EVENT_MARKER_FILE" class="ch.qos.logback.core.FileAppender">
    <file>${LOG_HOME:-logs}/usage-event.log</file>
    <filter class="ch.qos.logback.classic.filter.MarkerFilter">
        <marker>BRICK_USAGE_EVENT</marker>
        <onMatch>ACCEPT</onMatch>
        <onMismatch>DENY</onMismatch>
    </filter>
    <encoder>
        <pattern>%msg%n</pattern>
    </encoder>
</appender>
```

本地验证：

```bash
rg -n 'brick.usage-event.enabled=true' src/main/resources application.yml application.properties
grep -n '"eventType"' logs/usage-event.log
grep -n 'BRICK_USAGE_EVENT' logs/application.log
```

`%msg%n` 只含 JSON line，不一定含 marker 文本。不要另写一套 JSON line 格式、埋点 endpoint 或 logger 名。

## 后端语义构造

```java
import io.github.wu9007.buck.core.usageevent.model.BrickUsageEvent;
import io.github.wu9007.buck.core.usageevent.model.BrickUsageEvents;
import io.github.wu9007.buck.core.usageevent.publish.BrickUsageEventPublisher;

BrickUsageEvent event = BrickUsageEvents.action()
    .appCode("business-app")
    .moduleCode("application-center")
    .featureCode("application")
    .pageCode("application-page")
    .actionCode("save")
    .durationMs(42)
    .success();

publisher.publish(event);
```

`BrickUsageEvents.action()` 默认补齐 `schemaVersion`、`eventId`、`occurredAt` 和当前 `traceId`（缺失则为 `unknown`）。终止方法：`success()`、`failure()`、`cancelled()` / `canceled()`、`abandoned()`。非法 code、负数 `durationMs`、明文主体或越权结果抛 `IllegalArgumentException`。新增业务代码优先用语义构造器；前端已发同一动作时后端不要重复发。

## 前端 tracker

```js
import {
  bootstrapUsageEventsFromClientMeta,
  createModuleUsageTracker,
} from '@wildbuck/core-usage-event-frontend';

await bootstrapUsageEventsFromClientMeta();

const tracker = createModuleUsageTracker('security-setting', {
  pages: {
    passwordPolicy: {
      featureCode: 'password-policy',
      pageCode: 'password-policy-page',
      routeName: 'security-setting.password-policy',
    },
  },
  features: {
    passwordPolicyConfig: {
      featureCode: 'password-policy-config',
      pageCode: 'password-policy-page',
      routeName: 'security-setting.password-policy',
      viewActionCode: 'open-config',
    },
  },
});

await tracker.trackPage('passwordPolicy');
await tracker.trackOpen('passwordPolicyConfig');
await tracker.trackAction('passwordPolicyConfig', 'save', async () => {
  await savePasswordPolicy();
});
await tracker.trackActionResult('passwordPolicyConfig', 'cancel', 'CANCELLED');
```

兼容覆盖（测试/迁移；常规接入不要再写 `enabled/appCode/endpoint`）：

```js
import { configureUsageEvents, trackActionComplete } from '@wildbuck/core-usage-event-frontend';

configureUsageEvents({ enabled: true, appCode: 'business-app' });

await trackActionComplete({
  moduleCode: 'security-setting',
  featureCode: 'password-policy',
  pageCode: 'password-policy-page',
  actionCode: 'save',
});
```
