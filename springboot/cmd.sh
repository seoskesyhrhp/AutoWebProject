#!/bin/bash

# 设置Maven内存参数，避免打包卡死
export MAVEN_OPTS="-Xmx2g -Xms512m -XX:MaxMetaspaceSize=512m"

# 清理目标目录
rm -rf /Users/mac/desktop/web/java/target/* 2>/dev/null || true
rm -rf /Users/mac/Desktop/project/desktop/SmartChatSystem/AutoWebProject/springboot/target/* 2>/dev/null || true

echo "[INFO] [$(date +%Y%m%d_%H%M%S)] Cleaning and building the project..."

# 使用后台进程+超时机制，防止打包卡死
(
  cd /Users/mac/Desktop/project/desktop/SmartChatSystem/AutoWebProject/springboot
  mvn -Dmaven.repo.local=.m2 -Pbundle-frontend clean package -DskipTests -Dspring-boot.repackage.skip=false
) &
MVN_PID=$!

# 等待最多300秒(5分钟)
wait $MVN_PID &
WAIT_PID=$!

# 超时检查
for i in {1..300}; do
  if ! kill -0 $WAIT_PID 2>/dev/null; then
    break
  fi
  sleep 1
done

# 如果还在运行，强制终止
if kill -0 $WAIT_PID 2>/dev/null; then
  echo "[ERROR] Maven打包超时(300s)，强制终止..."
  kill -9 $MVN_PID 2>/dev/null
  kill -9 $WAIT_PID 2>/dev/null
  exit 1
fi

wait $WAIT_PID
BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -eq 0 ]; then
  echo "[INFO] [$(date +%Y%m%d_%H%M%S)] Build completed successfully."
else
  echo "[ERROR] [$(date +%Y%m%d_%H%M%S)] Build failed with exit code: $BUILD_EXIT_CODE"
  exit 1
fi
