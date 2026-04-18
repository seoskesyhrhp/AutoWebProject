#!/bin/bash

# Spring Boot 服务启动脚本（带内存限制和监控）

JAR_FILE="target/autoweb-springboot-1.0.1.jar"
LOG_FILE="/tmp/autoweb.log"
PID_FILE="/tmp/autoweb.pid"

# JVM 内存配置（根据服务器内存调整）
# -Xmx512m: 最大堆内存 512MB
# -Xms256m: 初始堆内存 256MB
# -XX:MaxMetaspaceSize=256m: 最大元空间 256MB
# -XX:+HeapDumpOnOutOfMemoryError: OOM时生成堆转储
# -XX:HeapDumpPath: 堆转储文件路径
export JAVA_OPTS="-Xmx512m -Xms256m -XX:MaxMetaspaceSize=256m \
  -XX:+HeapDumpOnOutOfMemoryError \
  -XX:HeapDumpPath=/tmp/autoweb-oom.hprof \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200"

# 检查 JAR 文件是否存在
if [ ! -f "$JAR_FILE" ]; then
  echo "[ERROR] JAR文件不存在: $JAR_FILE"
  echo "[INFO] 请先执行: ./cmd.sh"
  exit 1
fi

# 检查是否已在运行
if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE")
  if kill -0 "$OLD_PID" 2>/dev/null; then
    echo "[WARN] 服务已在运行 (PID: $OLD_PID)"
    echo "[INFO] 如需重启，请先执行: kill $OLD_PID"
    exit 1
  else
    rm -f "$PID_FILE"
  fi
fi

echo "[INFO] 启动 Spring Boot 服务..."
echo "[INFO] JVM 参数: $JAVA_OPTS"
echo "[INFO] 日志文件: $LOG_FILE"

# 启动服务
nohup java $JAVA_OPTS -jar "$JAR_FILE" > "$LOG_FILE" 2>&1 &
NEW_PID=$!
echo $NEW_PID > "$PID_FILE"

echo "[INFO] 服务 PID: $NEW_PID"
echo "[INFO] 等待服务启动..."

# 等待服务启动（最多30秒）
for i in {1..30}; do
  if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "[SUCCESS] 服务启动成功!"
    echo "[INFO] 访问地址: http://localhost:8000"
    echo "[INFO] 查看日志: tail -f $LOG_FILE"
    exit 0
  fi
  if ! kill -0 $NEW_PID 2>/dev/null; then
    echo "[ERROR] 服务启动失败，请查看日志: $LOG_FILE"
    rm -f "$PID_FILE"
    exit 1
  fi
  sleep 1
done

echo "[WARN] 服务启动超时，请手动检查日志: tail -f $LOG_FILE"
