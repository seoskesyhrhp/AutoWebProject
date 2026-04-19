# ========================
# 阶段1: Maven构建
# ========================
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /build

# 先复制pom.xml，利用Docker缓存加速依赖下载
COPY springboot/pom.xml .
COPY springboot/.m2 ./.m2

# 下载依赖（pom.xml不变时缓存有效）
RUN mvn -Dmaven.repo.local=.m2 dependency:go-offline -B || true

# 复制源代码和资源
COPY springboot/src ./src
COPY static ../static
COPY templates ../templates
COPY json ../json

# 执行胖打包
RUN mvn -Dmaven.repo.local=.m2 -Pbundle-frontend package -DskipTests -Dspring-boot.repackage.skip=false

# ========================
# 阶段2: 运行时镜像
# ========================
FROM eclipse-temurin:17-jre-alpine

LABEL maintainer="autoweb" \
      description="AutoWebProject Spring Boot Service" \
      version="1.0.1"

# 安装必要工具和字体（支持中文）
RUN apk add --no-cache curl tzdata fontconfig && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone && \
    apk del tzdata

# 创建非root用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# 从构建阶段复制JAR
COPY --from=builder /build/target/autoweb-springboot-1.0.1.jar app.jar

# 创建数据目录
RUN mkdir -p /app/json /app/static/target /app/data && \
    chown -R appuser:appgroup /app

# 切换非root用户
USER appuser

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8000/ || exit 1

# JVM参数（容器环境优化）
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:MaxMetaspaceSize=256m \
  -XX:+UseG1GC -XX:MaxGCPauseMillis=200 \
  -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/ \
  -XX:+UseContainerSupport"

ENV SPRING_PROFILES_ACTIVE="prod"

# 启动命令
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar --spring.profiles.active=${SPRING_PROFILES_ACTIVE}"]
