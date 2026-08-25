# Buck 业务后端镜像模板。
# 默认使用架构组已验证的内网 JDK17 镜像；如业务组有自有镜像，可在 CI 中通过
# --build-arg BRICK_RUNTIME_IMAGE=<image> 覆盖。镜像名包含 jdk8 只是历史命名，
# 当前模板按 JDK17 构建和运行要求使用它。
ARG BRICK_RUNTIME_IMAGE=ghcr.io/library/ubuntu/ubuntu25-jdk17-jdk8:1.0
FROM ${BRICK_RUNTIME_IMAGE}

WORKDIR /opt/app
COPY app.jar /opt/app/app.jar

ENV TZ=Asia/Shanghai
ENV JVMOPTIONS="-Xms512m -Xmx1024m -Dfile.encoding=UTF-8"
ENV PARAMS=""

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JVMOPTIONS -jar /opt/app/app.jar $PARAMS"]
