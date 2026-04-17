#!/bin/bash

# 设置Maven内存参数
export MAVEN_OPTS="-Xmx2g -Xms512m -XX:MaxMetaspaceSize=512m"

echo "[INFO] [$(date +%Y%m%d_%H%M%S)] 开始胖打包..."
echo "[INFO] 使用 bundle-frontend profile，包含 static/ 和 templates/"

# 进入项目目录
cd /Users/mac/Desktop/project/desktop/SmartChatSystem/AutoWebProject/springboot

# 使用Maven的clean目标清理，避免rm交互问题
echo "[INFO] 清理target目录..."
rm -rf /Users/mac/desktop/web/java/target/* 
mvn clean -q

# 执行打包
echo "[INFO] 开始编译打包..."
mvn -Dmaven.repo.local=.m2 -Pbundle-frontend package -DskipTests -Dspring-boot.repackage.skip=false

BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -eq 0 ]; then
  echo ""
  echo "[SUCCESS] [$(date +%Y%m%d_%H%M%S)] 胖打包完成!"
  echo "[INFO] JAR文件位置: target/autoweb-springboot-1.0.1.jar"
  ls -lh target/*.jar 2>/dev/null | awk '{print "[INFO] 文件大小: " $5 " " $9}'
else
  echo ""
  echo "[ERROR] [$(date +%Y%m%d_%H%M%S)] 打包失败，退出码: $BUILD_EXIT_CODE"
  exit 1
fi
