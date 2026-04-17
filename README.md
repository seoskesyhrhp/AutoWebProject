# AutoWebProject - 电梯安全巡检系统

电梯安全巡检自动化系统，支持设备管理、图像采集上传、智能解析校验、巡检任务调度等功能。

## 技术栈

### 后端

- **Java 17** + **Spring Boot 3.3.4**
- **Python 3.8+** + **FastAPI** + **Uvicorn**
- **Thymeleaf** 模板引擎

### 前端

- Vue.js 2.x
- Element UI
- Axios

## 项目结构

```
AutoWebProject/
├── springboot/           # Java后端服务
│   ├── src/              # Java源代码
│   └── pom.xml           # Maven配置
├── templates/            # 前端页面模板
│   ├── ehs/              # EHS巡检相关页面
│   ├── index/            # 首页
│   └── task/             # 任务管理
├── static/               # 静态资源
│   ├── ehs/              # EHS模块资源
│   ├── js/               # JavaScript库
│   └── upload/           # 上传组件
├── json/                 # 数据存储
├── utils/                # Python工具模块
├── main.py               # Python主入口
└── requirements.txt      # Python依赖
```

## 功能模块

### 1. 设备管理

- 电梯信息维护
- 楼层与轿厢标识

### 2. 图像采集与上传

- 自动拍照
- 图像压缩
- 水印嵌入
- 分片上传
- 失败重试

### 3. 智能解析与校验

- 二维码识别
- 文本OCR提取
- 合规性校验

### 4. 巡检任务调度

- 定时巡检任务
- 手动触发巡检
- 异常告警推送

### 5. 数据归档与配置

- JSON日志归档
- 配置文件管理
- 历史记录查询

## 快速开始

### 环境要求

- JDK 17+
- Maven 3.6+
- Python 3.8+
- Node.js 16+ (可选，用于前端开发)

### Java服务启动

```bash
# 进入springboot目录
cd springboot

# 编译打包（瘦包，26MB，不含static）
mvn clean package

# 编译打包（胖包，307MB，含static资源）
mvn clean package -Pbundle-frontend

# 运行
java -jar target/autoweb-springboot-1.0.1.jar
```

### Python服务启动

```bash
# 安装依赖
pip install -r requirements.txt

# 启动服务
python main.py

# 或使用Gunicorn
./startGunicorn.sh
```

## API接口

### EHS模块

| 方法     | 路径                                    | 说明         |
| -------- | --------------------------------------- | ------------ |
| GET/POST | `/ehs/json/`                            | 获取巡检数据 |
| POST     | `/ehs/upload`                           | 单图上传     |
| POST     | `/ehs/SaveObjectPhotos/batch`           | 批量图片上传 |
| DELETE   | `/ehs/files/{checkAreaCode}/{filename}` | 删除图片     |

### 大文件切片上传

| 方法   | 路径                    | 说明           |
| ------ | ----------------------- | -------------- |
| POST   | `/upload/init`          | 初始化上传任务 |
| POST   | `/upload/chunk`         | 上传切片       |
| POST   | `/upload/merge`         | 合并切片       |
| GET    | `/upload/progress/{id}` | 获取上传进度   |
| GET    | `/upload/check/{id}`    | 检查已上传切片 |
| DELETE | `/upload/cancel/{id}`   | 取消上传       |
| GET    | `/upload/files`         | 列出已上传文件 |
| GET    | `/upload/info`          | 获取系统信息   |

### 示例

**获取巡检数据**

```bash
curl -X GET http://localhost:8080/ehs/json/?taskDate=2026-04-13
```

**上传图片**

```bash
curl -X POST http://localhost:8080/ehs/upload \
  -F "check_area_code=RPOP000223122900734" \
  -F "file=@image.jpg"
```

**批量上传**

```bash
curl -X POST http://localhost:8080/ehs/SaveObjectPhotos/batch \
  -H "Content-Type: application/json" \
  -d '{
    "checkAreaCode": "RPOP000223122900734",
    "imageUrls": ["http://example.com/img1.jpg", "http://example.com/img2.jpg"]
  }'
```

**大文件切片上传**

```bash
# 1. 初始化上传
curl -X POST http://localhost:8080/upload/init \
  -d "fileId=abc123" \
  -d "filename=large_file.zip" \
  -d "fileSize=104857600" \
  -d "totalChunks=10" \
  -d "fileMd5=d41d8cd98f00b204e9800998ecf8427e"

# 2. 上传切片
for i in {0..9}; do
  curl -X POST http://localhost:8080/upload/chunk \
    -F "fileId=abc123" \
    -F "chunkIndex=$i" \
    -F "chunk=@chunk_$i.bin"
done

# 3. 合并切片
curl -X POST http://localhost:8080/upload/merge -d "fileId=abc123"
```

## 页面说明

### EHS巡检图片管理 (`/ehs/taskImg.html`)

- 支持按日期筛选巡检任务
- 显示星期信息
- 图片预览与批量选择
- 一键保存到EHS系统
- 批量删除（双确认）

### 自动上传页面 (`/ehs/autoUpload.html`)

- 自动化图片上传流程
- 压缩与水印处理
- 上传进度监控

### 大文件切片上传 (`/ehs/upload`)

- 支持**断网续传**：网络中断后可继续上传
- 支持**文件秒传**：MD5校验，相同文件直接返回
- 支持**文件替换**：同名文件自动覆盖
- 支持**大文件**：无文件大小限制
- **智能路径**：
  - Linux服务器：`/usr/desktop/Webdemo/Djangodemo/ehs/target`
  - 开发环境：`static/target`

## 配置说明

### Maven打包配置

项目支持两种打包模式：

1. **瘦包模式**（默认）
   - 包含templates，不含static
   - 大小约26MB
   - static资源需外部部署

2. **胖包模式**（推荐）

   ```bash
   mvn clean package -Pbundle-frontend
   ```

   - 包含templates和static
   - 大小约307MB
   - 可独立部署

### 重要配置

若templates目录不在`src/main/resources`下，需在pom.xml中显式配置resources：

```xml
<resource>
    <directory>${project.basedir}/../templates</directory>
    <targetPath>templates</targetPath>
</resource>
```

## 最近更新

### v1.0.2 (2026-04-13)

- 新增大文件切片上传功能
  - 支持断网续传
  - 支持文件秒传（MD5校验）
  - 支持文件替换
  - 智能路径选择（Linux/开发环境）

### v1.0.1 (2026-04-13)

- 新增EHS图片批量删除功能（双确认防误操作）
- 重构getJson方法，优化数据结构兼容性
- 完善HTTP请求头配置
- 新增星期显示功能
- 前端数据结构自动检测（扁平/嵌套数组兼容）

## 开发规范

### 双确认规范

敏感操作（如批量删除）需实现双重确认：

1. 前端弹出确认对话框
2. 后端API再次校验操作权限

### 数据兼容性

- getTaskDate返回数据支持扁平数组和嵌套数组两种格式
- 使用自动检测机制适配不同数据结构

## 许可证

MIT License
