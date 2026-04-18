#!/bin/bash

# 服务监控脚本 - 检测卡死并自动重启
# 建议配合 crontab 使用: */5 * * * * /path/to/monitor.sh

# WORK_DIR="/usr/desktop/Webdemo/Djangodemo/ehs"
WORK_DIR="/root"
PID_FILE="${WORK_DIR}/springboot.pid"
HEALTH_URL="http://localhost:8123/health"
MAX_RESPONSE_TIME=30  # 最大响应时间（秒）
RESTART_SCRIPT="${WORK_DIR}/restartJavaService.sh"
LOG_FILE="/tmp/monitor.log"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 检查进程是否存在
check_process() {
    if [[ ! -f "$PID_FILE" ]]; then
        log "ERROR: PID文件不存在"
        return 1
    fi
    
    PID=$(cat "$PID_FILE" 2>/dev/null)
    if [[ -z "$PID" ]]; then
        log "ERROR: PID文件为空"
        return 1
    fi
    
    if ! ps -p "$PID" > /dev/null 2>&1; then
        log "ERROR: 进程不存在 (PID: $PID)"
        return 1
    fi
    
    return 0
}

# 检查服务响应
check_response() {
    if command -v curl &> /dev/null; then
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$MAX_RESPONSE_TIME" "$HEALTH_URL" 2>/dev/null)
        if [[ "$HTTP_CODE" == "200" ]]; then
            return 0
        fi
    elif command -v wget &> /dev/null; then
        if wget -q -O /dev/null --timeout="$MAX_RESPONSE_TIME" "$HEALTH_URL" 2>/dev/null; then
            return 0
        fi
    fi
    
    log "WARN: 服务无响应或响应异常"
    return 1
}

# 检查资源使用
check_resources() {
    PID=$(cat "$PID_FILE" 2>/dev/null)
    if [[ -z "$PID" ]]; then
        return 1
    fi
    
    # 检查CPU使用率（持续高CPU可能是卡死）
    CPU_USAGE=$(ps -p "$PID" -o %cpu= 2>/dev/null | tr -d ' ')
    if [[ -n "$CPU_USAGE" && "${CPU_USAGE%.*}" -gt 95 ]]; then
        log "WARN: CPU使用率过高: ${CPU_USAGE}%"
        # 连续3次高CPU才认为卡死
        HIGH_CPU_COUNT=$(cat /tmp/high_cpu_count 2>/dev/null || echo "0")
        HIGH_CPU_COUNT=$((HIGH_CPU_COUNT + 1))
        echo "$HIGH_CPU_COUNT" > /tmp/high_cpu_count
        if [[ "$HIGH_CPU_COUNT" -ge 3 ]]; then
            log "ERROR: 连续3次检测到高CPU，服务可能卡死"
            rm -f /tmp/high_cpu_count
            return 1
        fi
    else
        rm -f /tmp/high_cpu_count 2>/dev/null
    fi
    
    # 检查内存使用
    MEM_USAGE=$(ps -p "$PID" -o %mem= 2>/dev/null | tr -d ' ')
    if [[ -n "$MEM_USAGE" && "${MEM_USAGE%.*}" -gt 90 ]]; then
        log "WARN: 内存使用率过高: ${MEM_USAGE}%"
    fi
    
    return 0
}

# 执行重启
restart_service() {
    log "INFO: 开始重启服务..."
    if [[ -x "$RESTART_SCRIPT" ]]; then
        cd "$WORK_DIR" && "$RESTART_SCRIPT" >> "$LOG_FILE" 2>&1
        log "INFO: 重启完成"
    else
        log "ERROR: 重启脚本不存在或无执行权限: $RESTART_SCRIPT"
        exit 1
    fi
}

# 主逻辑
main() {
    log "INFO: 开始监控检查..."
    
    # 1. 检查进程
    if ! check_process; then
        log "ERROR: 进程检查失败，执行重启"
        restart_service
        exit 0
    fi
    
    # 2. 检查响应
    if ! check_response; then
        log "ERROR: 服务响应检查失败，执行重启"
        restart_service
        exit 0
    fi
    
    # 3. 检查资源
    if ! check_resources; then
        log "ERROR: 资源检查失败，执行重启"
        restart_service
        exit 0
    fi
    
    log "INFO: 服务运行正常"
}

# 执行
main
