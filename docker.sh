#!/bin/bash

# Docker 构建与运行脚本
# 用法: ./docker.sh [build|run|stop|logs|health|restart|save]

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 配置
IMAGE_NAME="autoweb-springboot"
IMAGE_TAG="1.0.1"
CONTAINER_NAME="autoweb"
PORT=8000
WORK_DIR="$(cd "$(dirname "$0")" && pwd)"

# 挂载目录
TEMPLATES_DIR="${WORK_DIR}/templates"
JSON_DIR="${WORK_DIR}/json"
STATIC_DIR="${WORK_DIR}/static"

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 构建 JAR 包
build_jar() {
    log_info "开始构建 JAR 包..."
    cd "${WORK_DIR}/springboot"
    mvn clean package -Pbundle-frontend -DskipTests
    if [ $? -ne 0 ]; then
        log_error "JAR 包构建失败"
        exit 1
    fi
    log_info "JAR 包构建成功"
    cd "$WORK_DIR"
}

# 构建 Docker 镜像
build_image() {
    log_info "开始构建 Docker 镜像: ${IMAGE_NAME}:${IMAGE_TAG} ..."
    docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" .
    if [ $? -ne 0 ]; then
        log_error "Docker 镜像构建失败"
        exit 1
    fi
    log_info "Docker 镜像构建成功"
    docker images "${IMAGE_NAME}:${IMAGE_TAG}"
}

# 完整构建
build_all() {
    build_jar
    build_image
}

# 运行容器
run() {
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_warn "容器 ${CONTAINER_NAME} 已存在，先删除..."
        docker rm -f "$CONTAINER_NAME" > /dev/null 2>&1
    fi

    mkdir -p "$TEMPLATES_DIR" "$JSON_DIR" "$STATIC_DIR"

    log_info "启动容器 ${CONTAINER_NAME} ..."
    docker run -d \
        --name "$CONTAINER_NAME" \
        -p "${PORT}:${PORT}" \
        -v "${TEMPLATES_DIR}:/app/templates" \
        -v "${JSON_DIR}:/app/json" \
        -v "${STATIC_DIR}:/app/static" \
        --restart unless-stopped \
        "${IMAGE_NAME}:${IMAGE_TAG}"

    if [ $? -ne 0 ]; then
        log_error "容器启动失败"
        exit 1
    fi

    log_info "容器启动成功，等待服务就绪..."
    sleep 8
    health
}

# 停止容器
stop() {
    log_info "停止容器 ${CONTAINER_NAME} ..."
    docker stop "$CONTAINER_NAME" 2>/dev/null
    docker rm "$CONTAINER_NAME" 2>/dev/null
    log_info "容器已停止并删除"
}

# 查看日志
logs() {
    docker logs -f "$CONTAINER_NAME"
}

# 健康检查
health() {
    STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null)
    if [ -z "$STATUS" ]; then
        if curl -s -o /dev/null -w "%{http_code}" "http://localhost:${PORT}/" | grep -q "200|302"; then
            log_info "服务运行正常 (HTTP 200)"
        else
            log_warn "服务未响应"
        fi
    else
        log_info "容器健康状态: ${STATUS}"
    fi
    docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null
}

# 重启容器
restart() {
    log_info "重启容器 ${CONTAINER_NAME} ..."
    docker restart "$CONTAINER_NAME" 2>/dev/null || run
    sleep 5
    health
}

# 导出镜像为tar文件（离线部署）
save() {
    TAR_FILE="${WORK_DIR}/${IMAGE_NAME}-${IMAGE_TAG}.tar"
    log_info "导出 Docker 镜像到: ${TAR_FILE} ..."
    docker save -o "$TAR_FILE" "${IMAGE_NAME}:${IMAGE_TAG}"
    if [ $? -ne 0 ]; then
        log_error "镜像导出失败"
        exit 1
    fi

    FILE_SIZE=$(ls -lh "$TAR_FILE" | awk '{print $5}')
    log_info "导出成功! 文件大小: ${FILE_SIZE}"
    log_info ""
    log_info "离线部署方法:"
    log_info "  1. 复制 ${TAR_FILE} 到目标服务器"
    log_info "  2. 加载镜像: docker load -i ${IMAGE_NAME}-${IMAGE_TAG}.tar"
    log_info "  3. 运行容器: docker run -d --name ${CONTAINER_NAME} -p ${PORT}:${PORT} \\-"
    log_info "     -v /path/to/templates:/app/templates \\-"
    log_info "     -v /path/to/json:/app/json \\-"
    log_info "     -v /path/to/static:/app/static \\-"
    log_info "     ${IMAGE_NAME}:${IMAGE_TAG}"

    read -p "是否压缩为 .tar.gz？[y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        GZ_FILE="${TAR_FILE}.gz"
        log_info "压缩中..."
        gzip -f "$TAR_FILE"
        GZ_SIZE=$(ls -lh "$GZ_FILE" | awk '{print $5}')
        log_info "压缩完成: ${GZ_FILE} (${GZ_SIZE})"
    fi
}

# 帮助
help() {
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  build     完整构建（JAR包 + Docker镜像）"
    echo "  jar       仅构建 JAR 包"
    echo "  image     仅构建 Docker 镜像（需先构建JAR包）"
    echo "  run       启动容器"
    echo "  stop      停止并删除容器"
    echo "  logs      查看实时日志"
    echo "  health    健康检查"
    echo "  restart   重启容器"
    echo "  save      导出镜像为tar文件（离线部署）"
    echo ""
    echo "示例:"
    echo "  $0 build      # 首次部署：构建并启动"
    echo "  $0 run        # 启动服务"
    echo "  $0 logs       # 查看日志"
    echo "  $0 save       # 导出镜像用于离线部署"
}

# 主入口
case "${1}" in
    build)   build_all ;;
    jar)     build_jar ;;
    image)   build_image ;;
    run)     run ;;
    stop)    stop ;;
    logs)    logs ;;
    health)  health ;;
    restart) restart ;;
    save)    save ;;
    *)       help ;;
esac