#!/bin/bash
# 优化后的Spring Boot部署脚本

# 定义变量
PROJECT_DIR="/Users/mac/Desktop/project/desktop/SmartChatSystem/AutoWebProject/springboot"  # 修改为你的实际路径
TARGET_DIR="$HOME/desktop/web/java/target"
JAR_FILE="target/autoweb-springboot-1.0.1.jar"
JAR_NAME="autoweb-springboot-1.0.1.jar"
WORK_DIR="$HOME/desktop/web/java"
LOG_DIR="$WORK_DIR/logs"
BACKUP_DIR="$WORK_DIR/backup"
PID_FILE="$WORK_DIR/app.pid"

# 创建必要的目录
mkdir -p "$BACKUP_DIR" "$LOG_DIR"

# 函数：停止应用
stop_application() {
    echo "正在停止应用..."
    
    # 查找并停止Java进程
    JAVA_PID=$(pgrep -f "java.*$JAR_NAME")
    
    if [ ! -z "$JAVA_PID" ]; then
        echo "发现运行中的Java进程(PID: $JAVA_PID)"
        
        # 尝试优雅停止
        echo "发送SIGTERM信号..."
        kill -15 $JAVA_PID
        sleep 5
        
        # 检查进程是否还在运行
        if ps -p $JAVA_PID > /dev/null 2>&1; then
            echo "进程仍在运行，发送SIGKILL信号..."
            kill -9 $JAVA_PID
            sleep 2
        fi
        
        echo "应用已停止"
    else
        echo "没有找到运行的Java进程"
    fi
    
    # 清理PID文件
    if [ -f "$PID_FILE" ]; then
        rm -f "$PID_FILE"
    fi
}

# 函数：备份旧版本
backup_old_version() {
    echo "备份旧版本..."
    
    if [ -f "$TARGET_DIR/$JAR_NAME" ]; then
        BACKUP_NAME="${JAR_NAME%.jar}_$(date +%Y%m%d_%H%M%S).jar"
        mv "$TARGET_DIR/$JAR_NAME" "$BACKUP_DIR/$BACKUP_NAME"
        echo "✅ 已备份到: $BACKUP_DIR/$BACKUP_NAME"
        
        # 清理旧的备份（保留最近7天）
        find "$BACKUP_DIR" -name "*.jar" -mtime +7 -delete
    else
        echo "没有找到旧的JAR文件，无需备份"
    fi
}

# 函数：构建应用
build_application() {
    echo "进入项目目录: $PROJECT_DIR"
    cd "$PROJECT_DIR" || {
        echo "❌ 无法进入项目目录: $PROJECT_DIR"
        exit 1
    }
    
    echo "执行升级脚本..."
    if [ ! -f "cmd.sh" ]; then
        echo "❌ 未找到cmd.sh脚本"
        exit 1
    fi
    
    # 确保脚本有执行权限
    chmod +x cmd.sh
    
    # 执行升级
    if ! sh cmd.sh; then
        echo "❌ 升级脚本执行失败!"
        exit 1
    fi
    
    # 检查JAR文件是否生成
    if [ ! -f "$JAR_FILE" ]; then
        echo "❌ 未找到生成的JAR文件: $JAR_FILE"
        echo "当前目录内容:"
        ls -la target/ 2>/dev/null || echo "target目录不存在"
        exit 1
    fi
    
    echo "✅ 构建成功: $(ls -lh $JAR_FILE)"
}

# 函数：部署JAR
deploy_jar() {
    echo "部署JAR文件..."
    
    # 移动JAR文件
    mv -f "$JAR_FILE" "$TARGET_DIR/$JAR_NAME"
    
    if [ $? -eq 0 ]; then
        echo "✅ JAR文件已部署到: $TARGET_DIR/$JAR_NAME"
    else
        echo "❌ JAR文件部署失败"
        exit 1
    fi
}

# 函数：启动应用
start_application() {
    echo "启动应用..."
    
    cd "$TARGET_DIR" || {
        echo "❌ 无法进入目标目录: $TARGET_DIR"
        exit 1
    }
    
    # 检查JAR文件是否存在
    if [ ! -f "$JAR_NAME" ]; then
        echo "❌ 目标目录中不存在JAR文件: $JAR_NAME"
        exit 1
    fi

    # 进入工作目录
    cd "$WORK_DIR" || {
        echo "无法进入工作目录: $WORK_DIR"
        exit 1
    }
    echo "进入工作目录: $(pwd)"
    # 设置JVM参数（根据实际情况调整）
    JVM_OPTS="-Xms512m -Xmx1024m"
    JVM_OPTS="$JVM_OPTS -XX:+UseG1GC"
    JVM_OPTS="$JVM_OPTS -XX:+HeapDumpOnOutOfMemoryError"
    JVM_OPTS="$JVM_OPTS -XX:HeapDumpPath=$WORK_DIR/heapdump.hprof"
    
    # 应用参数
    APP_OPTS="--server.port=8000"
    APP_OPTS="$APP_OPTS --spring.profiles.active=default" # default|prod|test|dev
    
    # 日志文件
    LOG_FILE="$LOG_DIR/app_$(date +%Y%m%d_%H%M%S).log"
    
    echo "JVM参数: $JVM_OPTS"
    echo "应用参数: $APP_OPTS"
    echo "日志文件: $LOG_FILE"
    
    # 停止旧服务
    stop_application

    # 启动应用
    nohup java $JVM_OPTS -jar "$JAR_FILE" $APP_OPTS > "$LOG_FILE" 2>&1 &
    
    # 保存PID
    PID=$!
    echo $PID > "$PID_FILE"
    
    echo "✅ 应用已启动，PID: $PID"
    echo "使用以下命令查看日志: tail -f $LOG_FILE"
    
    # 创建最新日志的软链接
    ln -sf "$LOG_FILE" "$LOG_DIR/latest.log"
}

# 函数：健康检查
check_health() {
    echo "等待应用启动..."
    
    local max_attempts=10
    local attempt=1
    local health_url="http://localhost:8000/health"
    
    echo "进行健康检查 ($health_url)..."
    
    while [ $attempt -le $max_attempts ]; do
        echo "检查 $attempt/$max_attempts..."
        
        # 尝试连接应用
        if curl -s --max-time 5 "$health_url" > /dev/null 2>&1; then
            echo "✅ 应用启动成功!"
            echo "请访问 http://localhost:8000/ 查看结果"
            return 0
        fi
        
        # 检查进程是否存活
        if [ ! -f "$PID_FILE" ] || ! ps -p $(cat "$PID_FILE") > /dev/null 2>&1; then
            echo "❌ 应用进程已退出，请检查日志: $LOG_DIR/latest.log"
            return 1
        fi
        
        sleep 3
        ((attempt++))
    done
    
    echo "❌ 应用启动超时，请检查日志"
    return 1
}

# 主函数
main() {
    echo "========================================"
    echo "Spring Boot应用部署脚本"
    echo "开始时间: $(date)"
    echo "========================================"
    
    # 执行部署流程
    stop_application
    backup_old_version
    build_application
    deploy_jar
    start_application
    check_health
    
    if [ $? -eq 0 ]; then
        echo "========================================"
        echo "✅ 部署成功!"
        echo "完成时间: $(date)"
        echo "========================================"
    else
        echo "========================================"
        echo "❌ 部署失败!"
        echo "========================================"
        exit 1
    fi
}

# 执行主函数
main