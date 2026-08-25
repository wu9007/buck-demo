#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve, join, relative, basename } from 'node:path';

const ISSUES_URL = 'https://github.com/wu9007/buck/issues';
const rootDir = resolve(process.argv[2] ?? process.cwd());
const failures = [];
const capabilityCatalog = loadBrickCapabilityCatalog(rootDir);
const openApiBoundaryRoots = new Set();
const ignoredDirs = new Set([
  '.git',
  '.gradle',
  '.idea',
  '.npm',
  '.vscode',
  'build',
  'dist',
  'node_modules',
  'out',
  'target'
]);

main();

function main() {
  checkRequiredDocs();
  checkForbiddenProcessDocs();
  checkModuleAdoptionDecisionDoc();
  checkGithubActionsConventions();
  checkLocalMockBackendEntrypoints();
  checkFrontendMockDataEntrypoints();
  checkBackendStructure();
  checkBackendBuildConventions();
  checkCrossModuleMigrationReferences();
  checkIamBootstrapRuntimeConfigSurface();
  checkFrontendConventions();
  checkForbiddenParallelImplementations();
  checkAnonymousMcpNotEnabled();
  checkSoftDeleteUniqueIndexes();

  if (failures.length > 0) {
    console.error('Buck business structure check failed.');
    console.error('业务应用必须复用 Buck core/modules 基础能力。基础能力不足时，先提交中文 Issue，不允许在业务仓库自造平行机制。');
    console.error(`Buck Issues: ${ISSUES_URL}`);
    if (capabilityCatalog.path) {
      console.error(`已读取 BrickCapabilityCatalog: ${capabilityCatalog.path}`);
    }
    for (const failure of failures) {
      console.error(`\n- ${failure.message}`);
      if (failure.path) {
        console.error(`  path: ${failure.path}`);
      }
      if (failure.fix) {
        console.error(`  fix: ${failure.fix}`);
      }
    }
    process.exitCode = 1;
    return;
  }

  console.log('Buck business structure check passed.');
}

function checkFrontendConventions() {
  const frontendDir = join(rootDir, 'frontend');
  if (!existsSync(frontendDir)) {
    return;
  }

  for (const file of walkFiles(frontendDir)) {
    if (!file.endsWith('.vue')) {
      continue;
    }
    const content = safeReadFile(file);
    for (const drawerTag of findBrickConsoleDrawerTags(content)) {
      if (usesFixedPixelDrawerSize(drawerTag)) {
        fail(
          toRel(file),
          'BrickConsoleDrawer 不允许使用固定像素 size。',
          '删除 size 使用 Buck 默认 52%，或使用经业务负责人验收的百分比/响应式尺寸；确需例外时写入 docs/business/module-adoption-decision.md。'
        );
      }
    }
    if (containsLocalFilterToolbarCopy(content)) {
      fail(
        toRel(file),
        '业务前端禁止复制本地筛选工具条样式。',
        '列表筛选区使用 @wildbuck/core-ui-frontend/patterns 暴露的 BrickFilterToolbar；字段、文案和 QueryCriteria 仍由业务页面持有。'
      );
    }
    if (containsElementPlusRiskConfirm(content)) {
      fail(
        toRel(file),
        '业务前端危险确认必须复用 BrickRiskConfirm。',
        '删除 ElMessageBox.confirm 危险确认，改用 @wildbuck/core-ui-frontend/patterns 的 BrickRiskConfirm 承载删除、重置、强制下线、密钥轮换或全局配置保存确认。'
      );
    }
    if (containsNativeTopbarActions(content)) {
      fail(
        toRel(file),
        '业务前端 topbar-actions 不允许直接使用原生 <button>。',
        '顶部栏正式动作统一使用 BrickConsoleShell 的 topbar-actions slot + Element Plus ElButton 或同等公开组件语义，不要在业务仓库拼原生按钮、ASCII 符号按钮或局部样式。'
      );
    }
    if (containsSystemThemeAsDataTheme(content)) {
      fail(
        toRel(file),
        '业务前端禁止把 system 当作 data-theme 或渲染 theme token。',
        'system 只是主题偏好。使用 createBrickConsoleAppearanceRuntime() 或 resolveBrickConsoleAppearanceTheme() 得到 resolvedTheme，把 resolvedTheme 绑到 data-theme 与 Shell :theme，把 preference 绑到 theme-preference。'
      );
    }
    if (containsDangerDialogWithoutBrickRiskConfirm(content)) {
      fail(
        toRel(file),
        '业务前端危险确认不允许继续用 ElDialog 本地收口。',
        '删除、重置、强制下线、密钥轮换或全局配置保存这类危险确认统一使用 @wildbuck/core-ui-frontend/patterns 的 BrickRiskConfirm；ElDialog 只保留普通短确认。'
      );
    }
    if (containsLikelyActionBarDrift(content)) {
      fail(
        toRel(file),
        '业务前端正式底部动作区必须收口到 BrickActionBar。',
        '表单、配置卡片和抽屉底部出现保存/确认/取消/重置等正式动作时，统一使用 @wildbuck/core-ui-frontend/patterns 的 BrickActionBar，不再手写 footer div、局部按钮栈或自定义颜色顺序。'
      );
    }
    if (containsPlaceholderBusinessPageData(content)) {
      fail(
        toRel(file),
        '业务前端正式页面不允许交付本地示例数据或占位列表页。',
        '如果 docs/business/requirements.md、menus.md、acceptance.md 等已经把该页定义为正式能力，就接入真实查询、真实详情或真实业务动作；不要以本地 mock 记录、示例数组或占位数据通过验收。'
      );
    }
    if (containsStaticElementPlusOptions(content)) {
      fail(
        toRel(file),
        '业务前端禁止硬编码 el-option 选项。',
        formatOptionCatalogFix()
      );
    }
    if (containsHardcodedOptionArray(content)) {
      fail(
        toRel(file),
        '业务前端禁止在页面内维护硬编码选项数组。',
        formatOptionCatalogFix()
      );
    }
    if (containsRouteMetadataNavigationSource(content)) {
      fail(
        toRel(file),
        '运行时左侧导航必须以 IAM 当前主体菜单投影为源头。',
        '采用 IAM 的业务系统从 /iam/current-principal/workspace 的 navigationMenus 构造侧栏；route metadata 只负责路由组件绑定，不决定菜单名称、排序、分组、启停和可见性。'
      );
    }
  }
}

function loadBrickCapabilityCatalog(root) {
  const catalogRoots = ['buck', 'brick-next']
    .map((name) => join(root, 'docs', name))
    .filter((catalogRoot) => existsSync(catalogRoot));
  if (catalogRoots.length === 0) {
    return emptyCapabilityCatalog();
  }

  const candidates = catalogRoots.flatMap((catalogRoot) => listChildDirs(catalogRoot)
    .map((version) => join(catalogRoot, version, 'capabilities', 'capability-catalog.json')))
    .filter((file) => existsSync(file))
    .sort((left, right) => left.localeCompare(right, 'zh-Hans-CN', { numeric: true }));
  const catalogPath = candidates.at(-1);
  if (!catalogPath) {
    return emptyCapabilityCatalog();
  }

  try {
    const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
    return summarizeCapabilityCatalog(catalogPath, catalog);
  } catch {
    return {
      ...emptyCapabilityCatalog(),
      path: toRel(catalogPath),
    };
  }
}

function emptyCapabilityCatalog() {
  return {
    path: '',
    optionCodes: [],
    queryCodes: [],
  };
}

function summarizeCapabilityCatalog(catalogPath, catalog) {
  const optionCodes = [];
  const queryCodes = [];

  for (const module of catalog.modules ?? []) {
    for (const entry of module.optionProviders?.entries ?? []) {
      if (entry.code) {
        optionCodes.push(entry.code);
      }
    }
    for (const entry of module.queryDefinitions?.entries ?? []) {
      queryCodes.push(...(entry.queryCodes ?? []));
    }
  }

  return {
    path: toRel(catalogPath),
    optionCodes: uniqueSorted(optionCodes),
    queryCodes: uniqueSorted(queryCodes),
  };
}

function formatOptionCatalogFix() {
  const base = '下拉、单选、多选、标签和字典选项先复用 BrickCapabilityCatalog 中已有 optionCode；缺少时在后端实现 BrickOptionProvider，前端通过 @wildbuck/core-option-frontend 或 /brick/options/list 加载后使用 v-for 渲染。';
  if (!capabilityCatalog.path) {
    return `${base} 发布资料包应提交 docs/buck/<version>/capabilities/capability-catalog.json 供业务 agent 先查能力目录。`;
  }
  if (capabilityCatalog.optionCodes.length === 0) {
    return `${base} 已读取 ${capabilityCatalog.path}，当前目录没有静态发现 optionCode；如果确属 Buck 缺口，提交中文 Issue。`;
  }
  return `${base} 已读取 ${capabilityCatalog.path}，请先核对这些 optionCode：${capabilityCatalog.optionCodes.slice(0, 12).join(', ')}。`;
}

function checkBackendBuildConventions() {
  const backendDir = join(rootDir, 'backend');
  if (!existsSync(backendDir)) {
    return;
  }

  const buildFiles = [...walkFiles(backendDir)]
    .filter((file) => basename(file) === 'build.gradle' || basename(file) === 'build.gradle.kts');
  if (buildFiles.length === 0) {
    fail(
      'backend',
      '缺少后端 Gradle 构建文件。',
      '业务后端必须保留发布模板中的 Lombok、MapStruct 和 annotationProcessor 依赖约定。'
    );
    return;
  }

  const content = buildFiles.map((file) => safeReadFile(file)).join('\n');
  for (const requirement of [
    {
      pattern: /org\.projectlombok:lombok/u,
      message: '后端缺少 Lombok 依赖。',
      fix: '保留 compileOnly/annotationProcessor org.projectlombok:lombok，版本由 buck-bom 统一约束。'
    },
    {
      pattern: /org\.mapstruct:mapstruct/u,
      message: '后端缺少 MapStruct 运行依赖。',
      fix: '保留 implementation org.mapstruct:mapstruct，版本由 buck-bom 统一约束。'
    },
    {
      pattern: /org\.mapstruct:mapstruct-processor/u,
      message: '后端缺少 MapStruct annotationProcessor。',
      fix: '保留 annotationProcessor org.mapstruct:mapstruct-processor，DTO/Entity 转换统一走 MapStruct，可继承 BrickDtoMapper。'
    },
    {
      pattern: /spring-boot-starter-validation|buck-starter-application/u,
      message: '后端缺少 Bean Validation 入口。',
      fix: '保留 buck-starter-application 或显式添加 org.springframework.boot:spring-boot-starter-validation；Controller 入参 DTO 使用 @Valid 和 jakarta.validation.constraints。'
    },
    {
      pattern: /annotationProcessor/u,
      message: '后端缺少 annotationProcessor 配置。',
      fix: 'Lombok 和 MapStruct 都依赖注解处理器，不能删除 annotationProcessor 配置。'
    }
  ]) {
    if (!requirement.pattern.test(content)) {
      fail('backend', requirement.message, requirement.fix);
    }
  }
}

function checkIamBootstrapRuntimeConfigSurface() {
  const resourcesDir = join(rootDir, 'backend', 'src', 'main', 'resources');
  if (!existsSync(resourcesDir)) {
    return;
  }

  for (const file of walkFiles(resourcesDir)) {
    if (!/\.(?:properties|ya?ml)$/iu.test(file)) {
      continue;
    }
    const content = safeReadFile(file);
    if (containsLegacyIamBootstrapSeedConfig(content)) {
      fail(
        toRel(file),
        '业务配置中存在旧 IAM bootstrap 主数据配置。',
        '默认运维账号、角色、根组织和员工档案由 IAM 模块内置种子初始化；业务仓库只保留 brick.iam.bootstrap.enabled、catalog-enabled、admin.enabled、admin.initial-password 和 admin.grant-registered-permissions，其中生产环境至少覆盖 brick.iam.bootstrap.admin.initial-password。'
      );
    }
  }
}

function containsLegacyIamBootstrapSeedConfig(content) {
  if (/(?:BRICK_IAM_ROOT_ORGANIZATION_|BRICK_IAM_ADMIN_(?:PRINCIPAL_ID|USERNAME|ROLE_ID|ROLE_NAME|EMPLOYEE_)|BRICK_IAM_BOOTSTRAP_ADMIN_)/u
    .test(content)) {
    return true;
  }
  if (/brick\.iam\.bootstrap\.organization\./u.test(content)) {
    return true;
  }
  if (/brick\.iam\.bootstrap\.admin\.(?:principal-id|username|role-id|role-name|employee(?:\.|-))/u
    .test(content)) {
    return true;
  }
  return /iam:\s*\n[\s\S]{0,800}bootstrap:\s*\n[\s\S]{0,1200}(?:organization\s*:|root-id\s*:|root-code\s*:|root-name\s*:|principal-id\s*:|username\s*:|role-id\s*:|role-name\s*:|employee\s*:|employee-id\s*:|employee-name\s*:)/u
    .test(content);
}

function checkRequiredDocs() {
  requireFile(
    'docs/business/backend-structure.md',
    '缺少后端结构决策文档。',
    '按发布资料包模板补齐单模块/多模块选择、包名前缀、功能点目录和迁移目录。'
  );
  requireFile(
    'docs/business/module-adoption-decision.md',
    '缺少 Buck 模块采用决策文档。',
    '先完成 IAM、安全设置、审计、应用中心、core:query、core:option、core:orm-plus 等能力命中判断。'
  );
}

function checkModuleAdoptionDecisionDoc() {
  const path = 'docs/business/module-adoption-decision.md';
  const content = readOptional(path);
  if (!content) {
    return;
  }

  const requiredCapabilities = [
    'IAM',
    '通知配置',
    '安全设置',
    '审计',
    '应用中心',
    'core:query',
    'core:option',
    'core:orm-plus'
  ];
  const missingCapabilities = requiredCapabilities.filter((capability) => !content.includes(capability));
  if (missingCapabilities.length > 0) {
    fail(
      path,
      'docs/business/module-adoption-decision.md 必须覆盖正式模块和核心能力命中结论。',
      `至少记录这些能力的命中/采用判断：${requiredCapabilities.join('、')}。当前缺少：${missingCapabilities.join('、')}；命中但不采用时写明原因、替代方案、风险和确认人。`
    );
  }

  if (!/命中/u.test(content) || !/(采用|不采用)/u.test(content) || !/(原因|理由)/u.test(content) || !/确认人/u.test(content)) {
    fail(
      path,
      'docs/business/module-adoption-decision.md 缺少标准决策字段。',
      '采用决策文档至少写清“命中结论、采用或不采用、原因/理由、确认人”；不要只写一句“采用 Buck core/module”。'
    );
  }
}

function checkForbiddenProcessDocs() {
  for (const path of [
    'docs/superpowers/plans',
    'docs/superpowers/specs',
    'docs/superpowers/reviews'
  ]) {
    if (existsSync(join(rootDir, path))) {
      fail(
        path,
        '业务仓库禁止沉淀过程性计划文档。',
        '临时设计、实施计划、Context Ledger、Quality Utility Tree、Tool Output Strategy 和验证计划写入业务 issue comment 或 MR 描述；docs/business 只保留稳定业务事实。'
      );
    }
  }
}

function checkGithubActionsConventions() {
  const path = '.github/workflows/ci.yml';
  requireFile(
    path,
    '缺少业务仓库 .github/workflows/ci.yml。',
    '从发布资料包 templates/github-actions.yml 初始化，并保留 verify_brick_rules 门禁。'
  );
  const content = readOptional(path);
  if (!content) {
    return;
  }

  const verifyBlock = findTopLevelYamlBlock(content, 'verify_brick_rules');
  if (!verifyBlock) {
    fail(
      path,
      '业务仓库必须保留 verify_brick_rules job。',
      'CI 必须执行 node docs/buck/<version>/rules/check-business-structure.mjs .，不能删除业务结构和能力复用门禁。'
    );
    return;
  }

  if (!/verify_brick_rules/u.test(verifyBlock)) {
    fail(
      path,
      'verify_brick_rules job 必须保留在 GitHub Actions 中。',
      '把 verify_brick_rules 放在 .github/workflows/ci.yml，确保发布和部署前先通过 Buck 规则门禁。'
    );
  }

  if (!/node\s+docs\/(?:buck|brick-next)\/[^/\n]+\/rules\/check-business-structure\.mjs\s+\./u.test(verifyBlock)) {
    fail(
      path,
      'verify_brick_rules job 必须执行业务结构检查脚本。',
      '保留 node docs/buck/<version>/rules/check-business-structure.mjs .，不要删脚本或替换成空命令。'
    );
  }

  if (/if:\s*false\b/u.test(verifyBlock)) {
    fail(
      path,
      'verify_brick_rules job 不允许跳过。',
      '不要把 verify_brick_rules 设为 if: false；门禁必须自动阻断。'
    );
  }

  if (/continue-on-error:\s*true\b/u.test(verifyBlock)) {
    fail(
      path,
      'verify_brick_rules job 不允许 continue-on-error: true。',
      '去掉 continue-on-error: true；发布不能绕过 Buck 规则失败。'
    );
  }
}

function checkLocalMockBackendEntrypoints() {
  for (const path of ['package.json', 'frontend/package.json']) {
    const content = readOptional(path);
    if (!content) {
      continue;
    }
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      continue;
    }
    const scripts = parsed.scripts ?? {};
    for (const [name, command] of Object.entries(scripts)) {
      if (isMockBackendScriptName(name) || isMockBackendScriptCommand(String(command))) {
        fail(
          path,
          '业务仓库禁止保留本地 mock 后端验收入口。',
          `删除 package scripts 中的 ${name}，以及对应的 mock-backend 脚本；启动前端调试前必须先启动真实后端，并通过 BUSINESS_API_BASE_URL 或 127.0.0.1:8080 代理。`
        );
      }
    }
  }

  const frontendScriptsDir = join(rootDir, 'frontend', 'scripts');
  if (!existsSync(frontendScriptsDir)) {
    return;
  }
  for (const file of walkFiles(frontendScriptsDir)) {
    if (/mock[-_]backend\.(?:mjs|cjs|js|ts)$/iu.test(basename(file))) {
      fail(
        toRel(file),
        '业务仓库禁止保留本地 mock 后端验收入口。',
        '删除 frontend/scripts/mock-backend.*；前端不得构造 mock 菜单、mock 权限或 mock 业务数据，IAM 菜单、权限、审计、OpenAPI、调用记录等正式链路只能用真实后端和数据库验收。'
      );
    }
  }
}

function isMockBackendScriptName(name) {
  return /^(?:mock:backend|mock-backend|mock_backend|backend:mock|backend-mock)$/iu.test(name);
}

function isMockBackendScriptCommand(command) {
  return /\bmock[-_]backend\.(?:mjs|cjs|js|ts)\b/iu.test(command)
    || /\bmock[-_]backend\b/iu.test(command);
}

function checkFrontendMockDataEntrypoints() {
  const frontendSrcDir = join(rootDir, 'frontend', 'src');
  if (!existsSync(frontendSrcDir)) {
    return;
  }
  for (const file of walkFiles(frontendSrcDir)) {
    if (!isFrontendSourceFile(file)) {
      continue;
    }
    const rel = toRel(file);
    const content = safeReadFile(file);
    if (isLocalMockDataPath(rel) || containsLocalMockDataSignal(content)) {
      fail(
        rel,
        '业务前端禁止保留本地 mock 数据入口。',
        '删除本地 mock 菜单、mock 权限和 mock 业务数据；启动前端调试前必须先启动真实后端，所有菜单、权限和业务列表都从真实后端接口返回。'
      );
    }
  }
}

function isFrontendSourceFile(file) {
  return /\.(?:vue|mjs|cjs|js|ts|jsx|tsx|json)$/iu.test(file) && !/\.d\.ts$/iu.test(file);
}

function isLocalMockDataPath(path) {
  return /(?:^|\/)(?:__mocks__|mock|mocks|fixtures)(?:\/|$)/iu.test(path)
    || /(?:mock|fixture)[-_]?(?:menu|menus|permission|permissions|auth|iam|data|records|rows|list|backend)/iu.test(basename(path));
}

function containsLocalMockDataSignal(content) {
  return /\bmock(?:Backend|Menus?|Permissions?|Routes?|Records?|Rows?|Data|List|Iam|Auth)\b/u.test(content)
    || /\b(?:mock|fixture)[-_]?(?:backend|menu|menus|permission|permissions|auth|iam|data|records|rows|list)\b/iu.test(content)
    || /(?:mock|模拟)\s*(?:菜单|权限|业务数据|列表数据|调用记录|IAM)/iu.test(content);
}

function checkBackendStructure() {
  const backendDir = join(rootDir, 'backend');
  if (!existsSync(backendDir)) {
    fail('backend', '缺少 backend/ 目录。', '业务仓库必须有统一 backend/ 入口。');
    return;
  }

  const backendDocs = readOptional('docs/business/backend-structure.md');
  const backendEntries = listChildDirs(backendDir);
  const hasSingleModule = existsSync(join(backendDir, 'src', 'main', 'java'));
  const commonModules = backendEntries.filter((entry) => entry.endsWith('-module-common'));
  const componentModules = backendEntries.filter((entry) => /-module-[^-]+$/.test(entry) && !entry.endsWith('-module-common'));
  const bootModules = backendEntries.filter((entry) => entry.endsWith('-boot'));
  const hasMultiModule = commonModules.length > 0 || componentModules.length > 0 || bootModules.length > 0;

  if (hasSingleModule && hasMultiModule) {
    fail(
      'backend',
      'backend 同时出现单模块和多模块结构。',
      '选择一种结构；默认单模块，只有明确构件化时才使用 <app>-module-common / <app>-module-<component> / <app>-boot。'
    );
  }

  if (!hasSingleModule && !hasMultiModule) {
    fail(
      'backend',
      'backend 目录没有识别到标准单模块或多模块结构。',
      '单模块使用 backend/src/main/java；多模块使用 <app>-module-common、<app>-module-<component>、<app>-boot。'
    );
  }

  if (hasSingleModule && !backendDocs.includes('单模块')) {
    fail('docs/business/backend-structure.md', '单模块后端没有在后端结构决策中明确声明。', '写明“结构选择：单模块”。');
  }
  if (hasMultiModule && !backendDocs.includes('多模块')) {
    fail('docs/business/backend-structure.md', '多模块后端没有在后端结构决策中明确声明。', '写明“结构选择：多模块”。');
  }

  if (hasMultiModule) {
    if (commonModules.length !== 1) {
      fail('backend', '多模块后端必须且只能有一个 <app>-module-common。', '把跨构件契约集中到 common 模块。');
    }
    if (bootModules.length !== 1) {
      fail('backend', '多模块后端必须且只能有一个 <app>-boot。', '只有 boot 模块是可运行应用。');
    }
    if (componentModules.length < 1) {
      fail('backend', '多模块后端至少需要一个 <app>-module-<component>。', '业务构件实现放到 component 模块。');
    }
  }

  if (hasSingleModule) {
    checkJavaSourceRoots(join(backendDir, 'src', 'main', 'java'), 'single');
  }
  for (const commonModule of commonModules) {
    checkJavaSourceRoots(join(backendDir, commonModule, 'src', 'main', 'java'), 'common');
  }
  for (const componentModule of componentModules) {
    checkJavaSourceRoots(join(backendDir, componentModule, 'src', 'main', 'java'), 'component');
  }
  for (const bootModule of bootModules) {
    checkJavaSourceRoots(join(backendDir, bootModule, 'src', 'main', 'java'), 'boot');
  }

  for (const dir of walkDirs(backendDir)) {
    const name = basename(dir);
    const rel = toRel(dir);
    if (name === 'innerapi' && !isAllowedInnerApi(dir, hasMultiModule)) {
      fail(
        rel,
        'innerapi 只能出现在多模块结构的 bus/innerapi 下。',
        '单模块删除 innerapi；多模块把契约放 common，把实现放 component 的 bus/innerapi。'
      );
    }
    if (['controller', 'service', 'repository', 'dto'].includes(name)
      && !isUnderAppletFeature(dir)
      && !isUnderModuleOpenApiBoundary(dir)) {
      fail(
        rel,
        `${name}/ 必须放在 applet/<feature>/ 下，或作为模块级 openapi 边界目录。`,
        '业务功能点统一使用 applet/<feature>/controller,dto,repository,service,provider；仅当对外 OpenAPI 作为模块级根目录边界时，允许使用 openapi/controller,dto,service。'
      );
    }
  }
}

function checkJavaSourceRoots(sourceRoot, mode) {
  if (!existsSync(sourceRoot)) {
    return;
  }
  for (const packageRoot of findPackageRoots(sourceRoot)) {
    checkPackageRoot(packageRoot, mode);
  }
}

function findPackageRoots(sourceRoot) {
  const roots = new Set();
  for (const file of walkFiles(sourceRoot)) {
    const fileName = basename(file);
    if (fileName.endsWith('Application.java') || fileName.endsWith('AutoConfiguration.java')) {
      roots.add(dirname(file));
    }
  }
  for (const dir of walkDirs(sourceRoot)) {
    if (basename(dir) === 'applet') {
      roots.add(dirname(dir));
    }
  }
  return [...roots];
}

function checkPackageRoot(packageRoot, mode) {
  const rootAllowed = {
    single: new Set(['applet', 'client', 'config', 'constant', 'exception', 'openapi', 'provider', 'remote', 'utils']),
    common: new Set(['annotation', 'bus', 'constant', 'joints', 'utils']),
    component: new Set(['applet', 'bus', 'client', 'config', 'constant', 'exception', 'openapi', 'provider', 'remote', 'util', 'utils']),
    boot: new Set(['config', 'constant', 'exception', 'utils'])
  }[mode];

  for (const child of listChildDirs(packageRoot)) {
    if (!rootAllowed.has(child)) {
      fail(
        toRel(join(packageRoot, child)),
        '目录不在标准后端结构白名单中。',
        `当前结构只允许这些一级目录：${[...rootAllowed].join(', ')}。基础能力不足时向 brick-next 提中文 Issue，不要新增平行目录。`
      );
    }
  }

  const appletDir = join(packageRoot, 'applet');
  if (existsSync(appletDir)) {
    checkAppletDirectory(appletDir);
  }

  const openApiDir = join(packageRoot, 'openapi');
  if (existsSync(openApiDir)) {
    openApiBoundaryRoots.add(openApiDir);
  }

  const busDir = join(packageRoot, 'bus');
  if (existsSync(busDir)) {
    checkBusDirectory(busDir);
  }
}

function checkAppletDirectory(appletDir) {
  const featureAllowed = new Set(['config', 'controller', 'dto', 'provider', 'repository', 'service']);
  for (const feature of listChildDirs(appletDir)) {
    const featureDir = join(appletDir, feature);
    for (const child of listChildDirs(featureDir)) {
      if (!featureAllowed.has(child)) {
        fail(
          toRel(join(featureDir, child)),
          '功能点目录不在 applet/<feature> 标准白名单中。',
          `功能点只允许这些一级目录：${[...featureAllowed].join(', ')}。通用能力必须复用 Buck core/modules。`
        );
      }
    }
    checkFeatureDtoMapperBoundary(featureDir);
  }
}

function checkFeatureDtoMapperBoundary(featureDir) {
  const dtoDir = join(featureDir, 'dto');
  const repositoryDir = join(featureDir, 'repository');
  if (!hasJavaSource(dtoDir) || !hasRepositoryEntitySource(repositoryDir)) {
    return;
  }

  const mapperDir = join(featureDir, 'service', 'mapper');
  const mapperFiles = existsSync(mapperDir)
    ? [...walkFiles(mapperDir)].filter((file) => /\.(java|kt)$/u.test(file))
    : [];
  const hasSpringMapper = mapperFiles.some((file) => {
    const content = safeReadFile(file);
    return isMapStructMapperSource(content) && hasSpringMapStructComponentModel(content);
  });

  if (!hasSpringMapper) {
    fail(
      toRel(mapperDir),
      '功能点同时存在 dto 和 repository entity 时，必须提供 MapStruct 转换 mapper。',
      'Entity 与 DTO/Command/Response/Page/Detail 转换统一放在 applet/<feature>/service/mapper，并声明 @Mapper(componentModel = "spring")。'
    );
  }
}

function checkBusDirectory(busDir) {
  const busAllowed = new Set(['eventpublisher', 'innerapi']);
  for (const child of listChildDirs(busDir)) {
    if (!busAllowed.has(child)) {
      fail(
        toRel(join(busDir, child)),
        'bus 目录不在多模块协作标准白名单中。',
        'bus 下只允许 eventpublisher 和 innerapi。'
      );
    }
  }
}

function checkAnonymousMcpNotEnabled() {
  const configRoots = ['backend', 'src', 'config', 'deploy', 'k8s', 'helm']
    .map((dir) => join(rootDir, dir))
    .filter((dir) => existsSync(dir));
  for (const root of configRoots.length > 0 ? configRoots : [rootDir]) {
    for (const file of walkFiles(root)) {
      if (!/\.(yml|yaml|properties)$/u.test(file)) {
        continue;
      }
      const rel = toRel(file);
      if (rel.includes('node_modules') || rel.includes('/build/') || rel.includes('/dist/')) {
        continue;
      }
      const content = safeReadFile(file);
      if (/allow-anonymous\s*[:=]\s*true/u.test(content) || /brick\.mcp\.allow-anonymous\s*=\s*true/u.test(content)) {
        fail(
          rel,
          '禁止在业务仓启用 brick.mcp.allow-anonymous=true。',
          'MCP 默认需认证。验证壳的匿名设置不能复制到生产；保持 brick.mcp.allow-anonymous=false 或删除该键。'
        );
      }
    }
  }
}

function checkForbiddenParallelImplementations() {
  const backendDir = join(rootDir, 'backend');
  if (!existsSync(backendDir)) {
    return;
  }

  const fileRules = [
    {
      pattern: /(User|Role|Menu|Permission|Session)Controller\.(java|kt)$/u,
      message: '禁止自建 IAM 治理 controller。',
      fix: '采用 modules:iam；如 IAM 能力不足，先向 brick-next 提 Issue。'
    },
    {
      pattern: /(Login|Auth|Token)Controller\.(java|kt)$/u,
      message: '禁止自建登录、认证或 token controller。',
      fix: '采用 core:authentication / core:authorization。'
    },
    {
      pattern: /(Jwt|Token).*Filter\.(java|kt)$/u,
      message: '禁止自建 JWT/token filter。',
      fix: '采用 core:authorization 的鉴权链。'
    },
    {
      pattern: /(TraceId|RequestLog|RequestLogging|Observability).*(Filter|Interceptor)\.(java|kt)$/u,
      message: '业务仓库禁止自建生产排障 traceId 或请求日志 Filter。',
      fix: '采用 core:observability 提供 traceId、MDC、响应头和请求完成日志；业务代码不要记录请求/响应 body。'
    },
    {
      pattern: /(AuditLog|AuditRecord).*(Entity|DO|Controller|Mapper|Repository|Service)\.(java|kt)$/u,
      message: '禁止自建审计日志表、实体、查询 controller 或 service。',
      fix: '审计发布走 core:audit，审计落库和查询采用 modules:audit。'
    },
    {
      pattern: /(Option|Dict|Dictionary)Controller\.(java|kt)$/u,
      message: '禁止自建选项/字典 controller。',
      fix: '下拉、单选、多选、标签和字典选项统一实现 BrickOptionProvider。'
    },
    {
      pattern: /(UniversalQuery|QueryController).*\.(java|kt)$/u,
      message: '禁止自建万能查询 controller 或查询框架。',
      fix: '列表筛选、分页、排序统一走 core:query。'
    }
  ];

  const contentRules = [
    {
      pattern: /@(RequestMapping|GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping)\s*\([\s\S]{0,160}['"]\/api\//u,
      message: '业务 Controller 映射禁止包含 /api 代理前缀。',
      fix: '发布包默认 /api 是前端代理前缀；后端 Controller 使用真实业务路径，例如 @RequestMapping("/face-archives")。'
    },
    {
      pattern: /@(RequestMapping|GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping)\s*\([\s\S]{0,160}['"]\/admin(?:\/|['"])/u,
      message: '业务 Controller 映射不应默认使用 /admin 前缀。',
      fix: 'Controller path 使用真实业务域语义，例如 /face/vendors 或 /esign/beijing-ca-config；是否可访问由 Buck authentication/authorization 和权限点决定。确有网关级 /admin 语义时，先写入 docs/business/module-adoption-decision.md 并回流 Buck 规则缺口。'
    },
    {
      pattern: /\b(org\.springframework\.jdbc|JdbcTemplate|NamedParameterJdbcTemplate|java\.sql\.)\b/u,
      message: '业务后端禁止直接 JDBC 或 Spring JDBC。',
      fix: '持久化通过契约、MyBatis-Plus 和 core:orm-plus。'
    },
    {
      pattern: /\bUniversalQuery\b|万能查询/u,
      message: '禁止在业务后端实现本地万能查询机制。',
      fix: '用 core:query 定义 queryCode、字段白名单、操作符白名单和执行边界。'
    },
    {
      pattern: /\bAuditLog(Entity|DO|Mapper|Repository|Controller|Service)\b|audit_log/u,
      message: '禁止在业务后端实现本地审计日志机制。',
      fix: '用 core:audit 发布事件，采用 modules:audit 落库和查询。'
    },
    {
      pattern: /OncePerRequestFilter[\s\S]*\/openapi[\s\S]*(HMAC|SM3|signature|签名|canonical|timestamp|nonce|防重放|replay)|\/openapi[\s\S]*(HMAC|SM3|signature|签名|canonical|timestamp|nonce|防重放|replay)[\s\S]*OncePerRequestFilter/iu,
      message: '禁止业务仓库自建 OpenAPI HMAC Filter。',
      fix: '通用 /openapi/** OAuth2 client credentials、HMAC-SM3 签名、timestamp、nonce 防重放、scope/action 主校验和访问日志归 core:oauth2/core:openapi；业务组织接入的 OAuth2 client 通过 core:oauth2 SPI 接入，HMAC 只能作为 Bearer 后置完整性扩展实现 OpenApiHmacIntegrityCredentialProvider、OpenApiHmacIntegrityValidator，集群环境替换 OpenApiHmacNonceStore。'
    },
    {
      pattern: /\/openapi[\s\S]{0,400}(HMAC|SM3|signature|签名|canonical)[\s\S]{0,400}(nonce|防重放|replay)|\/openapi[\s\S]{0,400}(nonce|防重放|replay)[\s\S]{0,400}(HMAC|SM3|signature|签名|canonical)/iu,
      message: '禁止业务仓库自建 OpenAPI HMAC-SM3 签名和 nonce 防重放主链路。',
      fix: '使用 core:oauth2/core:openapi 的机器访问协议能力；业务代码通过 core:oauth2 SPI 提供 OAuth2 client/scope/action，需要防重放/防篡改时通过 OpenApiHmacIntegrityCredentialProvider 提供签名密钥，通过 OpenApiHmacIntegrityValidator 提供业务二次完整性校验，集群环境替换 OpenApiHmacNonceStore。'
    }
  ];

  for (const file of walkFiles(backendDir)) {
    if (!/\.(java|kt|groovy|xml|yml|yaml|properties|js|ts|vue|sql)$/u.test(file)) {
      continue;
    }
    const rel = toRel(file);
    const base = basename(file);
    for (const rule of fileRules) {
      if (rule.pattern.test(base)) {
        fail(rel, rule.message, rule.fix);
      }
    }
    const content = safeReadFile(file);
    for (const rule of contentRules) {
      if (rule.pattern.test(content)) {
        fail(rel, rule.message, rule.fix);
      }
    }
    if (/\.(java|kt)$/u.test(file) && isBusinessServiceSource(rel) && exposesServicePublicContractRecord(content)) {
      fail(
        rel,
        '业务 service 禁止暴露 public nested DTO/Command/Response/Page/Detail record。',
        'DTO、Command、Query、Request、Response、Page 和 Detail 等接口契约类型默认放到 applet/<feature>/dto；采用模块级 openapi 接口边界时允许放到 openapi/dto；service 只承载业务流程，不把内部嵌套 record 作为公共契约。'
      );
    }
    if (/\.(java|kt)$/u.test(file) && isBusinessControllerSource(rel) && controllerReturnsServiceType(content)) {
      fail(
        rel,
        '业务 Controller 公共接口禁止返回 service 包类型。',
        'Controller 入参和返回值使用所属边界 dto 包下的请求、响应、分页或详情类型；功能点边界使用 applet/<feature>/dto，模块级 openapi 边界使用 openapi/dto；service 包类型不能泄漏到 HTTP 契约。'
      );
    }
    if (/\.(java|kt)$/u.test(file) && isBusinessControllerSource(rel) && controllerDependsOnPersistenceMapper(content)) {
      fail(
        rel,
        '业务 Controller 禁止依赖 DTO/持久化转换 mapper 或 repository Entity/DO。',
        'Controller 只接收和返回所属边界 dto 契约类型；功能点边界使用 applet/<feature>/dto，模块级 openapi 边界使用 openapi/dto；BrickDtoMapper、service/mapper MapStruct mapper 和 repository Entity/DO 只能由 service 层持有并编排转换。'
      );
    }
    if (/\.(java|kt)$/u.test(file) && isBusinessControllerSource(rel) && hasRequestBodyWithoutValid(content)) {
      fail(
        rel,
        '业务 Controller 的 @RequestBody 入参必须使用 Bean Validation。',
        '在参数上声明 @Valid 或 @Validated，并在 dto 的 Request/Command/Query 类型字段上使用 @NotBlank、@NotNull、@Size、@Pattern、@Min、@Max 等约束；业务规则仍放 service。'
      );
    }
    if (/\.(java|kt)$/u.test(file) && isBusinessDtoRequestSource(rel) && lacksBeanValidationConstraints(content)) {
      fail(
        rel,
        '业务请求 DTO 缺少 Bean Validation 约束。',
        'Request/Command/Query DTO 至少为关键字段声明 jakarta.validation.constraints 约束；不要只在 service 中事后校验空值和长度。'
      );
    }
    if (/\.(java|kt)$/u.test(file) && isBusinessControllerOrServiceSource(rel)
      && containsManualListQueryBypass(content)) {
      fail(
        rel,
        '业务页面列表查询禁止绕过 core:query 手写 MyBatis-Plus 筛选或排序。',
        '面向页面的列表筛选、分页、排序必须通过 BrickQueryDefinition、QueryCriteria 和 BrickQueryExecutor；内部按主键、唯一键或固定外键的精确读取可用 MyBatis-Plus，但不能自定义页面列表协议。'
      );
    }
    if (/\.(java|kt)$/u.test(file) && isBusinessApiBoundarySource(rel)
      && containsManualTemporalStringification(content)) {
      fail(
        rel,
        '业务接口禁止在进入 Buck API/Jackson 之前把时间强类型手工转成 String。',
        'HTTP 契约和 DTO 保持 LocalDateTime、LocalDate、LocalTime、Instant 等强类型，统一交给 core:api 的日期时间格式化配置输出；不要在 controller/service/provider 或 service/mapper MapStruct mapper 里手写 DateTimeFormatter、SimpleDateFormat、temporal.toString() 或 @Mapping(expression = "java(...toString())") 作为接口出参。'
      );
    }
    if (/\.(java|kt)$/u.test(file) && isMainSource(rel) && isMapStructMapperSource(content)) {
      if (!rel.includes('/service/mapper/')) {
        fail(
          rel,
          'MapStruct Mapper 必须放在 applet/<feature>/service/mapper 下。',
          'MapStruct 只负责业务 DTO/Command 与 Entity 转换，可继承 BrickDtoMapper；MyBatis-Plus 持久化 Dao 仍属于 repository 边界。'
        );
      }
      if (!hasSpringMapStructComponentModel(content)) {
        fail(
          rel,
          'MapStruct Mapper 必须使用 componentModel = "spring"。',
          '声明 @Mapper(componentModel = "spring")，由 Spring 注入到 service；不要手动 new mapper。'
        );
      }
    }
    if (/\.(java|kt)$/u.test(file) && /@TableId\b/u.test(content)
      && !/@TableId\s*\([^)]*type\s*=\s*IdType\.ASSIGN_ID/su.test(content)) {
      fail(
        rel,
        '业务持久化实体主键必须使用 MyBatis-Plus ASSIGN_ID 策略。',
        '表主键统一为 string(20)，实体写 @TableId(value = "...", type = IdType.ASSIGN_ID)；需要固定 ID 时插入前显式赋值，不要改成 IdType.INPUT。'
      );
    }
    if (/\.sql$/u.test(file) && rel.includes('/src/main/resources/db_')) {
      for (const tableName of findCreateTablesWithoutPrimaryKey(content)) {
        fail(
          rel,
          `迁移表 ${tableName} 缺少 primary key。`,
          '每张业务表必须有单一 string(20) 主键；建表 DDL 中声明 primary key，实体使用 IdType.ASSIGN_ID。'
        );
      }
    }
  }
}

function checkCrossModuleMigrationReferences() {
  const backendDir = join(rootDir, 'backend');
  if (!existsSync(backendDir)) {
    return;
  }

  const sqlFiles = [...walkFiles(backendDir)]
    .filter((file) => file.endsWith('.sql') && toRel(file).includes('/src/main/resources/db_'));
  const migrationModules = migrationModuleNamesFromBackend(backendDir);
  if (migrationModules.length < 2) {
    return;
  }

  for (const file of sqlFiles) {
    const rel = toRel(file);
    const owner = migrationModuleNameFromPath(rel);
    if (!owner) {
      continue;
    }
    const ownerPrefixes = moduleTablePrefixes(owner);
    const otherModules = migrationModules.filter((moduleName) => moduleName !== owner);
    const normalized = stripSqlComments(safeReadFile(file));
    for (const tableName of referencedSqlTables(normalized)) {
      const normalizedTable = normalizeSqlIdentifier(tableName);
      if (ownerPrefixes.some((prefix) => normalizedTable.startsWith(prefix))) {
        continue;
      }
      const matchedModule = otherModules.find((moduleName) => moduleTablePrefixes(moduleName)
        .some((prefix) => normalizedTable.startsWith(prefix)));
      if (matchedModule) {
        fail(
          rel,
          '模块迁移目录禁止引用其他业务模块表。',
          `迁移目录 db_${owner} 引用了 ${normalizedTable}，该表看起来属于 db_${matchedModule}；跨模块关系通过 service、innerapi、事件或 SPI 表达，不能用 Flyway 外键、DML 修补或同步脚本耦合。`
        );
      }
    }
  }
}

function findBrickConsoleDrawerTags(content) {
  return [...content.matchAll(/<BrickConsoleDrawer\b[\s\S]*?(?:\/>|>)/gu)].map((match) => match[0]);
}

function usesFixedPixelDrawerSize(tag) {
  return /\bsize\s*=\s*["']\s*\d+(?:\.\d+)?px\s*["']/iu.test(tag)
    || /(?:^|\s):size\s*=\s*["']\s*['"`]\s*\d+(?:\.\d+)?px\s*['"`]\s*["']/iu.test(tag)
    || /\bv-bind:size\s*=\s*["']\s*['"`]\s*\d+(?:\.\d+)?px\s*['"`]\s*["']/iu.test(tag);
}

function containsStaticElementPlusOptions(content) {
  return /<el-option\b(?=[^>]*\blabel\s*=\s*["'][^"']+["'])(?=[^>]*\bvalue\s*=\s*["'][^"']+["'])(?![^>]*\bv-for\s*=)[^>]*>/iu
    .test(content);
}

function containsHardcodedOptionArray(content) {
  return /\b(?:const|let|var)\s+\w*(?:Options|OptionList|Statuses)\w*\s*=\s*(?:ref\s*\(\s*)?\[\s*\{[\s\S]{0,500}\b(?:label|value)\s*:\s*['"`][^'"`]+['"`][\s\S]{0,500}\b(?:label|value)\s*:/u
    .test(content);
}

function containsRouteMetadataNavigationSource(content) {
  const derivesMenusFromRoutes = /\b(?:const|let|var)\s+\w*(?:Menus|MenuItems|Navigation|NavItems|Sidebar)\w*\s*=\s*(?:\w*Routes|routes|moduleRoutes)\s*\.\s*map\s*\([\s\S]{0,700}\b(?:route|item)\.meta\b/iu
    .test(content)
    || /\b(?:routes|moduleRoutes)\s*\.\s*map\s*\([\s\S]{0,700}\b(?:route|item)\.meta\b/iu.test(content);
  if (!derivesMenusFromRoutes) {
    return false;
  }
  return /(?:BrickConsoleShell|navigation-menus|sidebar|menus|菜单|导航)/iu.test(content);
}

function containsLocalFilterToolbarCopy(content) {
  return /\bclass\s*=\s*["'][^"']*(?:filter-bar|query-toolbar|universal-query-toolbar)[^"']*["']/iu.test(content)
    || /\.(?:filter-bar|query-toolbar|universal-query-toolbar)(?:\b|[_{:-])/iu.test(content);
}

function containsElementPlusRiskConfirm(content) {
  return /\bElMessageBox\.confirm\s*\(/u.test(content) && /(?:删除|重置|强制|下线|密钥|保存[^"'`。；;]{0,12}配置|全局|不可恢复|危险|delete|remove|reset|revoke|disable|force)/iu.test(content);
}

function containsNativeTopbarActions(content) {
  for (const block of findSlotTemplateBlocks(content, 'topbar-actions')) {
    if (/<button\b/iu.test(block)) {
      return true;
    }
  }
  return false;
}

function containsSystemThemeAsDataTheme(content) {
  return /data-theme\s*=\s*["']system["']/iu.test(content)
    || /:data-theme\s*=\s*["']system["']/iu.test(content)
    || /:theme\s*=\s*["']system["']/iu.test(content);
}

function containsDangerDialogWithoutBrickRiskConfirm(content) {
  for (const block of findElementPlusDialogBlocks(content)) {
    if (/(?:删除|重置|强制|下线|轮换|密钥|保存[^"'`。；;]{0,12}配置|全局|不可恢复|危险|delete|remove|reset|revoke|disable|force)/iu.test(block)) {
      return true;
    }
  }
  return false;
}

function containsLikelyActionBarDrift(content) {
  if (/BrickActionBar/u.test(content)) {
    return false;
  }
  if (!hasFormalSaveAction(content)) {
    return false;
  }
  return containsFooterSlotButtons(content)
    || containsNamedActionContainer(content)
    || containsMultipleFormalActionButtons(content);
}

function containsPlaceholderBusinessPageData(content) {
  if (/(?:本地示例数据|示例数据|占位(?:列表页|数据|记录|页面)|\bmock\b\s*(?:记录|数据|列表|record|records|data|list|page|table)?)/iu.test(content)) {
    return true;
  }
  if (/\b(?:placeholder|mock)\s*[-_ ]*(?:data|page|list|record|records|table|rows)\b/iu.test(content)
    || /\b(?:data|page|list|record|records|table|rows)\s*[-_ ]*placeholder\b/iu.test(content)) {
    return true;
  }
  if (!/(?:<el-table\b|:data\s*=|v-for\s*=)/iu.test(content)) {
    return false;
  }
  return /\b(?:const|let|var)\s+\w*(?:Rows|Logs|Items|Records|TableData|ListData|List)\w*\s*=\s*(?:ref\s*\(\s*)?\[\s*\{[\s\S]{0,1600}\}\s*\]/u
    .test(content);
}

function findSlotTemplateBlocks(content, slotName) {
  return [...content.matchAll(new RegExp(
    `<template\\b[^>]*(?:#${escapeRegExp(slotName)}|v-slot:${escapeRegExp(slotName)})[^>]*>([\\s\\S]*?)<\\/template>`,
    'giu'
  ))].map((match) => match[1]);
}

function findElementPlusDialogBlocks(content) {
  return [...content.matchAll(/<el-dialog\b[\s\S]*?<\/el-dialog>/giu)].map((match) => match[0]);
}

function hasFormalSaveAction(content) {
  return /(?:保存|确认|提交|创建|更新|save|submit|confirm)/iu.test(content)
    && (/(?:<el-form\b|<form\b|<BrickConsoleDrawer\b)/iu.test(content)
      || containsFooterSlotButtons(content)
      || containsNamedActionContainer(content)
      || containsMultipleFormalActionButtons(content));
}

function containsFooterSlotButtons(content) {
  return /<template\b[^>]*(?:#footer|v-slot:footer)[^>]*>[\s\S]*?<el-button\b[\s\S]*?<\/template>/iu.test(content);
}

function containsNamedActionContainer(content) {
  return /\bclass\s*=\s*["'][^"']*(?:action-bar|actions|form-actions|drawer-actions|footer-actions|panel-actions|dialog-actions)[^"']*["']/iu.test(content);
}

function containsMultipleFormalActionButtons(content) {
  const buttons = [...content.matchAll(/<el-button\b[\s\S]*?>[\s\S]{0,120}?<\/el-button>/giu)].map((match) => match[0]);
  let hasPrimary = false;
  let hasSecondary = false;
  for (const button of buttons) {
    if (/(?:保存|确认|提交|创建|更新|save|submit|confirm)/iu.test(button)) {
      hasPrimary = true;
    }
    if (/(?:取消|关闭|返回|重置|cancel|close|back|reset)/iu.test(button)) {
      hasSecondary = true;
    }
  }
  return hasPrimary && hasSecondary;
}

function isMapStructMapperSource(content) {
  return /\bimport\s+org\.mapstruct\.Mapper\s*;/u.test(content)
    || /@org\.mapstruct\.Mapper\b/u.test(content)
    || /@Mapper\s*\([^)]*componentModel\s*=/su.test(content);
}

function hasSpringMapStructComponentModel(content) {
  return /@(?:org\.mapstruct\.)?Mapper\s*\([^)]*componentModel\s*=\s*"spring"[^)]*\)/su.test(content);
}

function isMainSource(rel) {
  return rel.includes('/src/main/java/') || rel.includes('/src/main/kotlin/');
}

function isBusinessServiceSource(rel) {
  return isMainSource(rel) && rel.includes('/service/') && !rel.includes('/service/mapper/');
}

function isBusinessControllerSource(rel) {
  return isMainSource(rel) && rel.includes('/controller/');
}

function isBusinessControllerOrServiceSource(rel) {
  return isBusinessControllerSource(rel) || isBusinessServiceSource(rel);
}

function isBusinessApiBoundarySource(rel) {
  return isMainSource(rel)
    && (rel.includes('/controller/')
      || rel.includes('/service/')
      || rel.includes('/provider/'));
}

function isBusinessDtoRequestSource(rel) {
  return isMainSource(rel)
    && rel.includes('/dto/')
    && /(?:Request|Command|Query)\.(?:java|kt)$/u.test(rel);
}

function hasRequestBodyWithoutValid(content) {
  for (const match of content.matchAll(/\(([^;{}]*@RequestBody[^;{}]*)\)/gmsu)) {
    for (const parameter of splitParameters(match[1])) {
      if (/@RequestBody\b/u.test(parameter) && !/@(?:Valid|Validated)\b/u.test(parameter)) {
        return true;
      }
    }
  }
  return false;
}

function splitParameters(parameters) {
  const items = [];
  let current = '';
  let depth = 0;
  for (const char of parameters) {
    if (char === '(' || char === '<' || char === '[') {
      depth += 1;
    } else if (char === ')' || char === '>' || char === ']') {
      depth = Math.max(0, depth - 1);
    }
    if (char === ',' && depth === 0) {
      items.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) {
    items.push(current);
  }
  return items;
}

function lacksBeanValidationConstraints(content) {
  if (!/\b(?:record|class)\s+\w+/u.test(content)) {
    return false;
  }
  return !/(?:jakarta\.validation\.constraints\.|@(NotBlank|NotEmpty|NotNull|Size|Pattern|Min|Max|Positive|PositiveOrZero|Email|Past|PastOrPresent|Future|FutureOrPresent)\b)/u
    .test(content);
}

function containsManualListQueryBypass(content) {
  return usesMybatisPlusWrapperQuery(content) && hasPageListQuerySignal(content);
}

function containsManualTemporalStringification(content) {
  if (containsTemporalFormatterUsage(content) || containsMapStructTemporalStringification(content)) {
    return true;
  }

  const hasTemporalContext = /\b(LocalDateTime|LocalDate|LocalTime|Instant|OffsetDateTime|ZonedDateTime)\b/u.test(content)
    || /^\s*import\s+java\.time\./gmu.test(content);
  if (!hasTemporalContext) {
    return false;
  }

  return /return\s+[^;\n]*(?:\.format\s*\(|\.toString\s*\(\s*\)|String\.valueOf\s*\()/u.test(content)
    || /\bString\s+\w+\s*=\s*[^;\n]*(?:\.format\s*\(|\.toString\s*\(\s*\)|String\.valueOf\s*\()/u.test(content)
    || /@Mapping[\s\S]{0,200}(?:DateTimeFormatter|SimpleDateFormat|\.toString\s*\()/u.test(content);
}

function containsTemporalFormatterUsage(content) {
  return /\bDateTimeFormatter\b/u.test(content)
    || /\bSimpleDateFormat\b/u.test(content);
}

function containsMapStructTemporalStringification(content) {
  for (const mapping of findAnnotationBlocks(content, 'Mapping')) {
    if (/(?:DateTimeFormatter|SimpleDateFormat)/u.test(mapping)) {
      return true;
    }
    if (!/(?:\.\s*toString\s*\(\s*\)|String\.valueOf\s*\()/u.test(mapping)) {
      continue;
    }
    if (hasTemporalMappingSignal(mapping)) {
      return true;
    }
  }
  return false;
}

function hasTemporalMappingSignal(mapping) {
  return /\b(?:target|source)\s*=\s*"[^"]*(?:At|Date|Time|Timestamp|DateTime|_at|_date|_time)[^"]*"/u.test(mapping)
    || /\bget[A-Z][A-Za-z0-9_$]*(?:At|Date|Time|Timestamp|DateTime)\s*\(/u.test(mapping)
    || /\b(?:LocalDateTime|LocalDate|LocalTime|Instant|OffsetDateTime|ZonedDateTime)\b/u.test(mapping);
}

function findAnnotationBlocks(content, annotationName) {
  const blocks = [];
  const pattern = new RegExp(`@(?:org\\.mapstruct\\.)?${annotationName}\\s*\\(`, 'gu');
  for (const match of content.matchAll(pattern)) {
    let depth = 1;
    let inString = false;
    let escaped = false;
    for (let index = match.index + match[0].length; index < content.length; index += 1) {
      const char = content[index];
      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }
      if (char === '"') {
        inString = true;
        continue;
      }
      if (char === '(') {
        depth += 1;
      } else if (char === ')') {
        depth -= 1;
        if (depth === 0) {
          blocks.push(content.slice(match.index, index + 1));
          break;
        }
      }
    }
  }
  return blocks;
}

function usesMybatisPlusWrapperQuery(content) {
  return /\bselect(?:List|Page)\s*\(/u.test(content)
    && /\b(?:LambdaQueryWrapper|QueryWrapper|Wrappers\s*\.\s*(?:lambdaQuery|query))\b/u.test(content);
}

function hasPageListQuerySignal(content) {
  return /\.(?:like|likeLeft|likeRight|orderBy|orderByAsc|orderByDesc)\s*\(/u.test(content)
    || /\bselectPage\s*\(/u.test(content)
    || /\bnew\s+Page\s*</u.test(content);
}

function exposesServicePublicContractRecord(content) {
  return /\bpublic\s+(?:static\s+)?record\s+\w*(?:DTO|Dto|Command|Query|Request|Response|Page|Detail)\b/u.test(content);
}

function controllerReturnsServiceType(content) {
  const serviceTypeNames = serviceTypeImports(content);
  for (const returnType of publicMethodReturnTypes(content)) {
    if (returnTypeReferencesServicePackage(returnType, serviceTypeNames)) {
      return true;
    }
  }
  return false;
}

function serviceTypeImports(content) {
  const names = new Set();
  for (const match of content.matchAll(/^\s*import\s+([\w.]+\.service(?:\.[\w]+)+)\s*;/gmu)) {
    const parts = match[1].split('.');
    const serviceIndex = parts.lastIndexOf('service');
    const importedParts = parts.slice(serviceIndex + 1);
    for (const part of importedParts) {
      names.add(part);
    }
  }
  return names;
}

function controllerDependsOnPersistenceMapper(content) {
  return importsBrickDtoMapper(content)
    || importsServiceMapper(content)
    || importsRepositoryEntityOrDo(content);
}

function importsBrickDtoMapper(content) {
  return /^\s*import\s+io\.github\.wu9007\.buck\.core\.api\.mapper\.BrickDtoMapper\s*;?\s*$/gmu.test(content)
    || /\bio\.github\.wu9007\.buck\.core\.api\.mapper\.BrickDtoMapper\b/u.test(content);
}

function importsServiceMapper(content) {
  return /^\s*import\s+[\w.]+\.service\.mapper(?:\.[\w$*]+)+\s*;?\s*$/gmu.test(content);
}

function importsRepositoryEntityOrDo(content) {
  return /^\s*import\s+[\w.]+\.repository\.(?:[A-Z][\w$]*(?:Entity|DO)|\*)\s*;?\s*$/gmu.test(content)
    || /\b[\w.]+\.repository\.[A-Z][\w$]*(?:Entity|DO)\b/u.test(content);
}

function publicMethodReturnTypes(content) {
  const types = [];
  const methodPattern = /(?:^|[;\n{}])\s*(?:@\w+(?:\([^)]*\))?\s*)*(?:public|protected)\s+(?!class\b|interface\b|enum\b|record\b)(?:static\s+)?(?:final\s+)?([A-Za-z_$][\w$.\s<>,?&\[\]]*?)\s+\w+\s*\([^;{}]*\)\s*(?:throws\s+[^{;]+)?\{/gmsu;
  for (const match of content.matchAll(methodPattern)) {
    types.push(match[1].replace(/\s+/gu, ' ').trim());
  }
  return types;
}

function returnTypeReferencesServicePackage(returnType, serviceTypeNames) {
  const compact = returnType.replace(/\s+/gu, '');
  if (/\b[\w.]+\.service\.[\w.]+/u.test(compact)) {
    return true;
  }
  if (/\b\w+Service\./u.test(compact)) {
    return true;
  }
  for (const name of serviceTypeNames) {
    if (new RegExp(`(?:^|[<,?&\\s.])${escapeRegExp(name)}(?:$|[>,?&\\s.\\[]|\\.)`, 'u').test(returnType)) {
      return true;
    }
  }
  return false;
}

function hasJavaSource(dir) {
  return existsSync(dir) && [...walkFiles(dir)].some((file) => /\.(java|kt)$/u.test(file));
}

function hasRepositoryEntitySource(dir) {
  if (!existsSync(dir)) {
    return false;
  }
  return [...walkFiles(dir)].some((file) => {
    if (!/\.(java|kt)$/u.test(file)) {
      return false;
    }
    const fileName = basename(file);
    if (/(Entity|DO)\.(java|kt)$/u.test(fileName)) {
      return true;
    }
    const content = safeReadFile(file);
    return /@TableName\b/u.test(content) || /@BrickPersistentEntity\b/u.test(content);
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, 'zh-Hans-CN', { numeric: true }));
}

function migrationModuleNamesFromBackend(backendDir) {
  return uniqueSorted([...walkDirs(backendDir)]
    .map((dir) => migrationModuleNameFromPath(toRel(dir)))
    .filter(Boolean));
}

function migrationModuleNameFromPath(path) {
  const match = path.match(/\/src\/main\/resources\/db_([^/]+)\//u);
  return match ? normalizeModuleName(match[1]) : '';
}

function normalizeModuleName(value) {
  return String(value ?? '')
    .replace(/[^a-zA-Z0-9_]+/gu, '_')
    .replace(/_+/gu, '_')
    .replace(/^_|_$/gu, '')
    .toLowerCase();
}

function moduleTablePrefixes(moduleName) {
  const normalized = normalizeModuleName(moduleName);
  const parts = normalized.split('_').filter(Boolean);
  const prefixes = [`${normalized}_`];
  if (parts.length > 1) {
    prefixes.push(`${parts.at(-1)}_`);
  }
  return uniqueSorted(prefixes);
}

function referencedSqlTables(sql) {
  const tables = [];
  const patterns = [
    /\breferences\s+([`"]?[\w.]+[`"]?)/giu,
    /\balter\s+table\s+([`"]?[\w.]+[`"]?)/giu,
    /\binsert\s+into\s+([`"]?[\w.]+[`"]?)/giu,
    /\bupdate\s+([`"]?[\w.]+[`"]?)/giu,
    /\bdelete\s+from\s+([`"]?[\w.]+[`"]?)/giu,
    /\b(?:from|join)\s+([`"]?[\w.]+[`"]?)/giu
  ];
  for (const pattern of patterns) {
    for (const match of sql.matchAll(pattern)) {
      tables.push(match[1]);
    }
  }
  return uniqueSorted(tables);
}

function findCreateTablesWithoutPrimaryKey(sql) {
  const missing = [];
  const normalized = stripSqlComments(sql);
  const pattern = /create\s+table(?:\s+if\s+not\s+exists)?\s+([`"]?[\w.]+[`"]?)\s*\(([\s\S]*?)\)\s*;/giu;
  for (const match of normalized.matchAll(pattern)) {
    if (!/\bprimary\s+key\b/iu.test(match[2])) {
      missing.push(match[1].replace(/[`"]/g, ''));
    }
  }
  return missing;
}

function checkSoftDeleteUniqueIndexes() {
  const backendDir = join(rootDir, 'backend');
  if (!existsSync(backendDir)) {
    return;
  }

  const sqlFiles = [...walkFiles(backendDir)]
    .filter((file) => file.endsWith('.sql') && toRel(file).includes('/src/main/resources/db_'))
    .sort((left, right) => left.localeCompare(right, 'zh-Hans-CN', { numeric: true }));
  if (sqlFiles.length === 0) {
    return;
  }

  const softDeleteTables = new Map();
  const activeUniqueIndexes = new Map();
  for (const file of sqlFiles) {
    const rel = toRel(file);
    const normalized = stripSqlComments(safeReadFile(file));
    for (const table of parseCreateTables(normalized)) {
      if (table.hasDataStatus) {
        softDeleteTables.set(table.tableName, rel);
      }
      for (const index of table.uniqueIndexes) {
        activeUniqueIndexes.set(uniqueIndexKey(index), {
          ...index,
          path: rel
        });
      }
    }
    for (const index of parseStandaloneUniqueIndexes(normalized)) {
      activeUniqueIndexes.set(uniqueIndexKey(index), {
        ...index,
        path: rel
      });
    }
    for (const dropped of parseDroppedUniqueIndexes(normalized)) {
      activeUniqueIndexes.delete(uniqueIndexKey(dropped));
    }
  }

  for (const index of activeUniqueIndexes.values()) {
    if (!softDeleteTables.has(index.tableName) || index.columns.includes('data_status')) {
      continue;
    }
    fail(
      index.path,
      '软删表唯一索引必须包含 data_status。',
      `表 ${index.tableName} 的唯一索引 ${index.indexName || index.columns.join(',')} 必须改成 (..., data_status)；BrickBaseDao.deleteById() 是逻辑删除，删除行仍占用原业务键。`
    );
  }
}

function parseCreateTables(sql) {
  const tables = [];
  const pattern = /create\s+table(?:\s+if\s+not\s+exists)?\s+([`"]?[\w.]+[`"]?)\s*\(([\s\S]*?)\)\s*;/giu;
  for (const match of sql.matchAll(pattern)) {
    const tableName = normalizeSqlIdentifier(match[1]);
    const body = match[2];
    tables.push({
      tableName,
      hasDataStatus: /\bdata_status\b/iu.test(body),
      uniqueIndexes: parseInlineUniqueIndexes(tableName, body)
    });
  }
  return tables;
}

function parseInlineUniqueIndexes(tableName, body) {
  const indexes = [];
  const pattern = /(?:constraint\s+([`"]?[\w.]+[`"]?)\s+)?unique(?:\s+key|\s+index)?\s*(?:([`"]?[\w.]+[`"]?))?\s*\(([^)]+)\)/giu;
  for (const match of body.matchAll(pattern)) {
    const indexName = normalizeOptionalSqlIdentifier(match[1] || match[2]);
    indexes.push({
      tableName,
      indexName,
      columns: parseSqlColumns(match[3])
    });
  }
  return indexes;
}

function parseStandaloneUniqueIndexes(sql) {
  return [
    ...parseCreateUniqueIndexes(sql),
    ...parseAlterTableAddConstraintUniqueIndexes(sql),
    ...parseAlterTableAddUniqueIndexes(sql)
  ];
}

function parseCreateUniqueIndexes(sql) {
  const indexes = [];
  const pattern = /create\s+unique\s+index(?:\s+if\s+not\s+exists)?\s+([`"]?[\w.]+[`"]?)\s+on\s+([`"]?[\w.]+[`"]?)\s*\(([^)]+)\)\s*;/giu;
  for (const match of sql.matchAll(pattern)) {
    indexes.push({
      indexName: normalizeOptionalSqlIdentifier(match[1]),
      tableName: normalizeSqlIdentifier(match[2]),
      columns: parseSqlColumns(match[3])
    });
  }
  return indexes;
}

function parseAlterTableAddConstraintUniqueIndexes(sql) {
  const indexes = [];
  const pattern = /alter\s+table\s+([`"]?[\w.]+[`"]?)\s+add\s+constraint\s+([`"]?[\w.]+[`"]?)\s+unique\s*\(([^)]+)\)\s*;/giu;
  for (const match of sql.matchAll(pattern)) {
    indexes.push({
      indexName: normalizeOptionalSqlIdentifier(match[2]),
      tableName: normalizeSqlIdentifier(match[1]),
      columns: parseSqlColumns(match[3])
    });
  }
  return indexes;
}

function parseAlterTableAddUniqueIndexes(sql) {
  const indexes = [];
  const pattern = /alter\s+table\s+([`"]?[\w.]+[`"]?)\s+add\s+unique(?:\s+index|\s+key)?\s+([`"]?[\w.]+[`"]?)\s*\(([^)]+)\)\s*;/giu;
  for (const match of sql.matchAll(pattern)) {
    indexes.push({
      indexName: normalizeOptionalSqlIdentifier(match[2]),
      tableName: normalizeSqlIdentifier(match[1]),
      columns: parseSqlColumns(match[3])
    });
  }
  return indexes;
}

function parseDroppedUniqueIndexes(sql) {
  return [
    ...parseDroppedCreateIndexStatements(sql),
    ...parseDroppedAlterTableIndexes(sql)
  ];
}

function parseDroppedCreateIndexStatements(sql) {
  const dropped = [];
  const pattern = /drop\s+index(?:\s+if\s+exists)?\s+([`"]?[\w.]+[`"]?)\s+on\s+([`"]?[\w.]+[`"]?)\s*;/giu;
  for (const match of sql.matchAll(pattern)) {
    dropped.push({
      indexName: normalizeOptionalSqlIdentifier(match[1]),
      tableName: normalizeSqlIdentifier(match[2]),
      columns: []
    });
  }
  return dropped;
}

function parseDroppedAlterTableIndexes(sql) {
  const dropped = [];
  const pattern = /alter\s+table\s+([`"]?[\w.]+[`"]?)\s+drop\s+(?:constraint|index)\s+([`"]?[\w.]+[`"]?)\s*;/giu;
  for (const match of sql.matchAll(pattern)) {
    dropped.push({
      indexName: normalizeOptionalSqlIdentifier(match[2]),
      tableName: normalizeSqlIdentifier(match[1]),
      columns: []
    });
  }
  return dropped;
}

function parseSqlColumns(columns) {
  return columns
    .split(',')
    .map((column) => normalizeSqlIdentifier(column.trim().split(/\s+/u)[0]))
    .filter(Boolean)
    .map((column) => column.split('.').at(-1));
}

function normalizeSqlIdentifier(identifier) {
  return identifier.replace(/[`"]/gu, '').trim().toLowerCase();
}

function normalizeOptionalSqlIdentifier(identifier) {
  return identifier ? normalizeSqlIdentifier(identifier) : '';
}

function uniqueIndexKey(index) {
  return `${index.tableName}::${index.indexName || index.columns.join(',')}`;
}

function stripSqlComments(sql) {
  return sql.replace(/--.*$/gmu, '').replace(/\/\*[\s\S]*?\*\//gu, '');
}

function findTopLevelYamlBlock(content, key) {
  const lines = content.split(/\r?\n/u);
  let start = -1;
  let indentLength = 0;
  const keyPattern = new RegExp(`^(\\s*)${key}:\\s*(?:#.*)?$`);
  for (let idx = 0; idx < lines.length; idx += 1) {
    const match = lines[idx].match(keyPattern);
    if (match) {
      start = idx;
      indentLength = match[1].length;
      break;
    }
  }
  if (start < 0) {
    return '';
  }

  let end = lines.length;
  for (let idx = start + 1; idx < lines.length; idx += 1) {
    if (!lines[idx].trim()) {
      continue;
    }
    const lineIndent = lines[idx].match(/^(\s*)/u)[1].length;
    if (lineIndent <= indentLength && /^\s*\S[\w.-]*:/u.test(lines[idx])) {
      end = idx;
      break;
    }
  }
  return lines.slice(start, end).join('\n');
}

function requireFile(path, message, fix) {
  if (!existsSync(join(rootDir, path))) {
    fail(path, message, fix);
  }
}

function readOptional(path) {
  const fullPath = join(rootDir, path);
  return existsSync(fullPath) ? safeReadFile(fullPath) : '';
}

function isAllowedInnerApi(dir, hasMultiModule) {
  if (!hasMultiModule) {
    return false;
  }
  const parts = toRel(dir).split('/');
  const idx = parts.lastIndexOf('innerapi');
  return idx > 0 && parts[idx - 1] === 'bus';
}

function isUnderAppletFeature(dir) {
  const parts = toRel(dir).split('/');
  const name = basename(dir);
  const idx = parts.lastIndexOf(name);
  return idx >= 2 && parts[idx - 2] === 'applet' && Boolean(parts[idx - 1]);
}

function isUnderModuleOpenApiBoundary(dir) {
  const name = basename(dir);
  if (!['controller', 'service', 'dto'].includes(name)) {
    return false;
  }
  return openApiBoundaryRoots.has(dirname(dir));
}

function listChildDirs(dir) {
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir)
    .filter((entry) => statSync(join(dir, entry)).isDirectory());
}

function* walkDirs(dir) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (!statSync(fullPath).isDirectory()) {
      continue;
    }
    if (ignoredDirs.has(entry)) {
      continue;
    }
    yield fullPath;
    yield* walkDirs(fullPath);
  }
}

function* walkFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (!ignoredDirs.has(entry)) {
        yield* walkFiles(fullPath);
      }
      continue;
    }
    if (stat.isFile()) {
      yield fullPath;
    }
  }
}

function safeReadFile(file) {
  return readFileSync(file, 'utf8');
}

function fail(path, message, fix) {
  failures.push({
    path,
    message,
    fix
  });
}

function toRel(path) {
  return relative(rootDir, path).replaceAll('\\', '/');
}
