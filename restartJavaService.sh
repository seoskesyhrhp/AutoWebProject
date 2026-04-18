#!/bin/bash

# 设置工作目录
WORK_DIR="/usr/desktop/Webdemo/Djangodemo/ehs/"
cd "$WORK_DIR" || {
    echo "错误: 无法进入目录 $WORK_DIR"
    exit 1
}

# 配置文件
PID_FILE="springboot.pid"
JAR_FILE="target/autoweb-springboot-1.0.1.jar"
LOG_FILE="springboot.log"
APP_NAME="internal-chat"
MAX_WAIT=30
PORT=8123  # 根据实际端口调整
SPRING_PROFILES_ACTIVE="prod"  # default|prod|test|dev

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# 检查系统资源（防止服务因资源不足卡退）
check_system_resources() {
    log_info "检查系统资源..."
    
    # 检查内存
    if command -v free &> /dev/null; then
        AVAILABLE_MEM=$(free -m | awk '/^Mem:/{print $7}')
        if [[ "$AVAILABLE_MEM" -lt 512 ]]; then
            log_warn "可用内存不足: ${AVAILABLE_MEM}MB，建议至少512MB"
        else
            log_info "可用内存: ${AVAILABLE_MEM}MB"
        fi
    fi
    
    # 检查磁盘空间
    DISK_USAGE=$(df . | tail -1 | awk '{print $5}' | sed 's/%//')
    if [[ "$DISK_USAGE" -gt 90 ]]; then
        log_error "磁盘空间不足: ${DISK_USAGE}%，请清理磁盘"
        return 1
    elif [[ "$DISK_USAGE" -gt 80 ]]; then
        log_warn "磁盘空间紧张: ${DISK_USAGE}%"
    else
        log_info "磁盘使用: ${DISK_USAGE}%"
    fi
    
    # 检查文件描述符限制
    ULIMIT_N=$(ulimit -n)
    if [[ "$ULIMIT_N" -lt 4096 ]]; then
        log_warn "文件描述符限制较低: $ULIMIT_N，建议设置为4096+"
        ulimit -n 4096 2>/dev/null && log_info "已调整文件描述符限制为4096"
    fi
    
    return 0
}

# 检查Java环境
check_java() {
    if ! command -v java &> /dev/null; then
        log_error "Java未安装或不在PATH中"
        # return 1
        # Java Environment
        export JAVA_HOME=/usr/local/java
        export CLASSPATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar
        export PATH=$JAVA_HOME/bin:$PATH        
    fi
    
    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
    if [[ "$JAVA_VERSION" -lt 11 ]]; then
        log_error "Java版本过低，需要Java 11+，当前版本: $JAVA_VERSION"
        return 1
    fi
    
    log_info "Java版本: $(java -version 2>&1 | head -n 1)"
    return 0
}

# 检查JAR文件
check_jar() {
    if [[ ! -f "$JAR_FILE" ]]; then
        log_error "JAR文件不存在: $JAR_FILE"
        log_error "请确保已构建项目或在正确目录下"
        return 1
    fi
    
    JAR_SIZE=$(stat -c%s "$JAR_FILE" 2>/dev/null || stat -f%z "$JAR_FILE")
    if [[ "$JAR_SIZE" -eq 0 ]]; then
        log_error "JAR文件为空: $JAR_FILE"
        return 1
    fi
    
    log_info "JAR文件: $JAR_FILE (大小: $(numfmt --to=iec $JAR_SIZE))"
    return 0
}

# 停止旧进程
stop_old_process() {
    if [[ ! -f "$PID_FILE" ]]; then
        log_warn "PID文件不存在: $PID_FILE"
        return 0
    fi
    
    OLD_PID=$(cat "$PID_FILE" 2>/dev/null)
    if [[ -z "$OLD_PID" ]]; then
        log_warn "PID文件为空"
        rm -f "$PID_FILE"
        return 0
    fi
    
    # 检查进程是否存在
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        log_info "正在停止旧进程 (PID: $OLD_PID)..."
        
        # 先尝试优雅关闭
        kill "$OLD_PID" 2>/dev/null
        
        # 等待进程退出
        local count=0
        while [[ $count -lt 10 ]] && ps -p "$OLD_PID" > /dev/null 2>&1; do
            sleep 1
            ((count++))
        done
        
        # 如果进程还在，强制杀死
        if ps -p "$OLD_PID" > /dev/null 2>&1; then
            log_warn "进程仍在运行，强制杀死..."
            kill -9 "$OLD_PID" 2>/dev/null
            sleep 2
        fi
        
        if ps -p "$OLD_PID" > /dev/null 2>&1; then
            log_error "无法停止进程: $OLD_PID"
            return 1
        else
            log_info "进程已停止: $OLD_PID"
        fi
    else
        log_warn "进程不存在: $OLD_PID"
    fi
    
    # 清理PID文件
    rm -f "$PID_FILE"
    return 0
}

# 备份旧日志
backup_old_log() {
    if [[ -f "$LOG_FILE" ]]; then
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        BACKUP_LOG="${LOG_FILE}.${TIMESTAMP}.bak"
        if cp "$LOG_FILE" "$BACKUP_LOG"; then
            log_info "备份旧日志: $BACKUP_LOG"
            # 压缩大日志文件
            LOG_SIZE=$(stat -c%s "$LOG_FILE" 2>/dev/null || stat -f%z "$LOG_FILE")
            if [[ "$LOG_SIZE" -gt 10485760 ]]; then  # 大于10MB
                gzip -f "$BACKUP_LOG" 2>/dev/null
                log_info "已压缩日志文件"
            fi
        fi
    fi
}

# 启动新进程
start_new_process() {
    log_info "正在启动应用..."
    
    # 添加启动参数（优化内存和GC，防止服务卡退）
    JAVA_OPTS="-Xms512m -Xmx1024m \
        -XX:MaxMetaspaceSize=256m \
        -XX:+HeapDumpOnOutOfMemoryError \
        -XX:HeapDumpPath=/tmp/${APP_NAME}-oom.hprof \
        -XX:+UseG1GC \
        -XX:MaxGCPauseMillis=200 \
        -XX:+UnlockExperimentalVMOptions \
        -XX:+UseContainerSupport"
    SERVER_PORT="--server.port=$PORT"
    if [[ -n "$SPRING_PROFILES_ACTIVE" ]]; then
        PROFILES_OPTS="--spring.profiles.active=$SPRING_PROFILES_ACTIVE"
    else
        PROFILES_OPTS="--spring.profiles.active=prod"
    fi
    
    # 启动命令
    nohup java $JAVA_OPTS -jar "$JAR_FILE" $PROFILES_OPTS $SERVER_PORT > "$LOG_FILE" 2>&1 &
    NEW_PID=$!
    
    echo "$NEW_PID" > "$PID_FILE"
    log_info "应用已启动，PID: $NEW_PID"
    log_info "日志文件: $LOG_FILE"
    
    return 0
}

# 等待应用启动
wait_for_startup() {
    log_info "等待应用启动 (最多等待 ${MAX_WAIT}秒)..."
    
    local count=0
    local started=0
    
    while [[ $count -lt $MAX_WAIT ]]; do
        # 检查进程是否存在
        if ! ps -p "$NEW_PID" > /dev/null 2>&1; then
            log_error "进程已退出，启动失败"
            tail -20 "$LOG_FILE"
            return 1
        fi
        
        # 检查端口是否监听
        if command -v netstat &> /dev/null; then
            if netstat -tuln 2>/dev/null | grep -q ":$PORT "; then
                started=1
                break
            fi
        elif command -v ss &> /dev/null; then
            if ss -tuln 2>/dev/null | grep -q ":$PORT "; then
                started=1
                break
            fi
        fi
        
        # 检查日志中是否有启动成功标志
        if [[ -f "$LOG_FILE" ]]; then
            if tail -20 "$LOG_FILE" 2>/dev/null | grep -q "Started.*Application\|启动成功\|Started.*in.*seconds"; then
                started=1
                break
            fi
        fi
        
        sleep 1
        ((count++))
        
        # 显示进度
        if [[ $((count % 5)) -eq 0 ]]; then
            log_info "已等待 ${count} 秒..."
        fi
    done
    
    if [[ $started -eq 1 ]]; then
        log_info "应用启动成功，耗时 ${count} 秒"
        return 0
    else
        log_warn "应用可能仍在启动中..."
        return 0
    fi
}

# 检查应用状态
check_application_status() {
    log_info "检查应用状态..."
    
    # 1. 检查进程
    if ps -p "$NEW_PID" > /dev/null 2>&1; then
        log_info "✓ 进程运行中: $NEW_PID"
    else
        log_error "✗ 进程不存在"
        return 1
    fi
    
    # 2. 检查端口
    if command -v lsof &> /dev/null; then
        if lsof -i:"$PORT" -n -P 2>/dev/null | grep -q "$NEW_PID"; then
            log_info "✓ 端口监听: $PORT"
        fi
    fi
    
    # 3. 检查日志最后几行
    if [[ -f "$LOG_FILE" ]]; then
        log_info "最后日志:"
        tail -5 "$LOG_FILE" | while IFS= read -r line; do
            echo "  $line"
        done
    fi
    
    return 0
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 尝试连接应用
    local health_url="http://localhost:${PORT}/health"
    
    if command -v curl &> /dev/null; then
        if curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$health_url" | grep -q "200"; then
            log_info "✓ 健康检查通过"
            return 0
        fi
    elif command -v wget &> /dev/null; then
        if wget -q -O /dev/null --timeout=5 "$health_url"; then
            log_info "✓ 健康检查通过"
            return 0
        fi
    fi
    
    # 检查应用根路径
    if command -v curl &> /dev/null; then
        if curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost:${PORT}/" | grep -q "200\|302\|401"; then
            log_info "✓ 应用可访问"
            return 0
        fi
    fi
    
    log_warn "健康检查未通过，但应用进程仍在运行"
    return 1
}

# 显示进程信息
show_process_info() {
    echo -e "\n${BLUE}=== 应用状态信息 ===${NC}"
    
    # 显示进程
    echo -e "${YELLOW}当前运行的Java进程:${NC}"
    ps -ef | grep -E "java.*internal-chat.*jar" | grep -v grep || {
        echo "未找到相关Java进程"
    }
    
    # 显示端口占用
    echo -e "\n${YELLOW}端口 $PORT 占用情况:${NC}"
    if command -v lsof &> /dev/null; then
        lsof -i:"$PORT" -n -P
    elif command -v netstat &> /dev/null; then
        netstat -tulpn 2>/dev/null | grep ":$PORT " || netstat -tuln 2>/dev/null | grep ":$PORT "
    else
        ss -tulpn 2>/dev/null | grep ":$PORT " || ss -tuln 2>/dev/null | grep ":$PORT "
    fi
    
    # 显示资源使用
    echo -e "\n${YELLOW}资源使用情况:${NC}"
    if [[ -f "$PID_FILE" ]]; then
        PID=$(cat "$PID_FILE" 2>/dev/null)
        if [[ -n "$PID" ]]; then
            ps -p "$PID" -o pid,ppid,%cpu,%mem,rss,vsz,cmd
        fi
    fi
    
    # 显示磁盘空间
    echo -e "\n${YELLOW}磁盘空间:${NC}"
    df -h . | tail -1
    
    # 显示日志文件大小
    if [[ -f "$LOG_FILE" ]]; then
        echo -e "\n${YELLOW}日志文件:${NC}"
        ls -lh "$LOG_FILE" "$PID_FILE" 2>/dev/null
    fi
}

# 主函数
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}   内部聊天服务重启脚本${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo "工作目录: $WORK_DIR"
    echo "JAR文件: $JAR_FILE"
    echo "日志文件: $LOG_FILE"
    echo -e "${BLUE}----------------------------------------${NC}"
    
    # 检查环境和资源
    check_system_resources || exit 1
    check_java || exit 1
    check_jar || exit 1
    
    # 停止旧进程
    stop_old_process || {
        log_warn "停止旧进程失败，尝试继续..."
    }
    
    # 备份日志
    backup_old_log
    
    # 启动新进程
    start_new_process
    
    # 等待启动
    wait_for_startup
    
    # 检查状态
    check_application_status
    
    # 健康检查
    health_check
    
    # 显示信息
    show_process_info
    
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}Web服务已重启完成${NC}"
    echo -e "${GREEN}PID: $NEW_PID${NC}"
    echo -e "${GREEN}日志文件: $LOG_FILE${NC}"
    echo -e "${GREEN}查看实时日志: tail -f $LOG_FILE${NC}"
    echo -e "${GREEN}停止服务: ./stop.sh 或 kill -9 $NEW_PID${NC}"
    echo -e "${GREEN}========================================${NC}"
}

# 执行主函数
main


