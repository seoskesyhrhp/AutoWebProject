# ========================
# 基于本地已构建的JAR包构建Docker镜像
# 构建前提: 先执行 mvn clean package -Pbundle -DskipTests
# ========================
FROM eclipse-temurin:17-jre-alpine

LABEL maintainer="autoweb" \
      description="AutoWebProject Spring Boot Service" \
      version="1.0.1"

# 安装必要工具、时区数据、字体（支持中文）
RUN apk add --no-cache curl tzdata fontconfig && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone && \
    apk del tzdata

# 创建非root用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# 复制JAR包
COPY springboot/target/autoweb-springboot-1.0.1.jar app.jar

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

# JVM参数（容器环境优化，防止卡退）
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:MaxMetaspaceSize=256m \
  -XX:+UseG1GC -XX:MaxGCPauseMillis=200 \
  -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/ \
  -XX:+UseContainerSupport"

ENV SPRING_PROFILES_ACTIVE="prod"

# 启动命令
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar --spring.profiles.active=${SPRING_PROFILES_ACTIVE}"]
