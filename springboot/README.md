# AutoWebProject 使用文档（Spring Boot 单体版）

当前仓库已完成合并：`springboot` 与 `web_spring` 统一为一个 Spring Boot 项目，仅保留本目录作为启动入口。

## 运行环境

- JDK：`17`
- Maven：`3.8+`（建议）
- Spring Boot：`3.3.4`

## 快速启动

```bash
cd springboot
mvn -Dmaven.repo.local=.m2 spring-boot:run
```

默认端口：`8000`

启动成功后可访问：

- 首页：`http://localhost:8000/`
- 任务页路由（SPA 入口）：`http://localhost:8000/task`
- 健康检查：`http://localhost:8000/health`

## 部署与启动方式

### 一键升级（推荐）

本目录已提供一键升级脚本：`upgrade.sh`

首次使用请赋权：

```bash
cd springboot
chmod +x upgrade.sh
```

Docker 部署一键升级（重新打包并滚动到最新镜像，默认瘦包）：

```bash
cd springboot
./upgrade.sh docker
```

Docker 全打包升级（胖包，包含 `static/`）：

```bash
cd springboot
./upgrade.sh docker full
```

Jar 部署一键升级（重新打包并重启本地 Jar，默认瘦包）：

```bash
cd springboot
./upgrade.sh jar
```

Jar 全打包升级（胖包，包含 `static/`）：

```bash
cd springboot
./upgrade.sh jar full
```

Jar 模式换端口升级：

```bash
cd springboot
PORT=8123 ./upgrade.sh jar
```

也可通过第二个参数或环境变量控制打包模式：

```bash
# 第二个参数：slim|full
./upgrade.sh jar slim
./upgrade.sh jar full

# 或环境变量
PACKAGE_MODE=full ./upgrade.sh jar
```

### 1) Maven 开发模式启动

```bash
cd springboot
mvn -Dmaven.repo.local=.m2 spring-boot:run
```

### 2) 项目打包（生成可执行 Jar）

默认打**瘦包**：**`templates/`（HTML）已打入 Jar**，保证生产环境 `/ehs` 等页面路由可用；体积大的 **`static/` 默认不打入**，需与 Jar 分开部署或使用 `-Pbundle-frontend` 打胖包（见下文）。

```bash
cd springboot
mvn -Dmaven.repo.local=.m2 clean package -DskipTests
```

若需**连 `static/` 一并打入 Jar**（单文件体积会显著增大，例如数百 MB），使用：

```bash
cd springboot
mvn -Dmaven.repo.local=.m2 -Pbundle-frontend clean package -DskipTests
```

打包产物默认在：`target/`

```bash
ls target/*.jar
```

#### 瘦包部署目录（生产推荐）

在服务器上需保证 **`static/`** 能被解析到：`app.project-root` 指向的目录下应有 `static/`（`templates/` 已在瘦包 Jar 内，可不拷贝）。  
开发时 Jar 在 `springboot/target/`、默认 `app.project-root: ../` 即仓库根的 `static/`。  
生产若 Jar 与 `static/` 同级，使用：`--spring.profiles.active=prod`（见 `application-prod.yml`）。

示例（Jar 与 static 同级，`templates` 可不拷贝）：

```text
/opt/autoweb/
  autoweb-springboot-1.0.1.jar
  static/
```

```bash
cd /opt/autoweb
java -jar autoweb-springboot-1.0.1.jar --spring.profiles.active=prod
```

### 3) Jar 包启动

```bash
cd springboot
java -jar target/autoweb-springboot-1.0.1.jar
```

（瘦包且仍从 `springboot` 目录启动时，默认 `app.project-root: ../` 会指向仓库根的 `static/`；页面 HTML 来自 Jar 内 `classpath:/templates/`。）

### 4) 换端口启动（临时）

```bash
cd springboot
java -jar target/autoweb-springboot-1.0.1.jar --server.port=8123
```

也可以使用环境变量：

```bash
cd springboot
SERVER_PORT=8123 java -jar target/autoweb-springboot-1.0.1.jar
```

测试环境跳过夜间限制（`isNightTime`）示例：

```bash
cd springboot
java -jar target/autoweb-springboot-1.0.1.jar --app.skip-night-time-check=true
```

### 5) 后台启动（Linux/macOS）

```bash
cd springboot
nohup java -jar target/autoweb-springboot-1.0.1.jar --server.port=8000 > app.log 2>&1 &
```

查看日志：

```bash
tail -f app.log
```

### 5.1) Windows 双击启动 / 打包 exe

#### 方式 A：直接双击 `start.bat`（最简单）

本目录已提供：

- `start.bat`：后台启动服务，并写入 `app.pid` / `app.out.log` / `app.err.log`；优先使用 `jre\bin\java.exe`，若缺少 Java 17 会尝试通过 `winget` 自动安装
- `stop.bat`：优先按 `app.pid` 停止；失败时再按端口停止；被 `start.bat` 内部调用时会静默执行
- `start-no-console.vbs`：无黑窗口启动 `start.bat`

使用步骤：

```bat
cd springboot
start.bat
```

默认端口：`8000`

执行后会后台启动，并生成：

- `app.pid`：进程 PID
- `app.out.log`：标准输出日志
- `app.err.log`：错误输出日志

脚本会在启动后等待端口就绪（默认最多约 `10` 秒）；若端口未监听成功，请查看 `app.err.log`。

启动时会按以下顺序查找 Java：

1. `springboot/jre/bin/java.exe`
2. 系统 `PATH` 中的 `java`（要求版本 `17`）
3. 若未找到 Java 17，则尝试使用 `winget` 自动安装 `Eclipse Temurin 17 JRE`

如果机器没有 `winget`，请手动安装 Java 17，或直接把 JRE 放到 `springboot/jre/` 目录。

脚本会优先从常见安装目录（如 `Eclipse Adoptium`、`Java`、`Microsoft` 的 `17` 版本目录）直接查找 `java.exe`，因此安装完成后通常不需要重开终端。

如需换端口，可在 Windows 命令行先设置环境变量再启动：

```bat
cd springboot
set PORT=8123
start.bat
```

停止服务（优先读取 `app.pid`；若失败，再按端口处理。若已设置 `PORT` 环境变量则优先使用）：

```bat
cd springboot
stop.bat
```

也可以显式指定端口：

```bat
cd springboot
set PORT=8123
stop.bat
```

如果希望双击时不显示黑色命令行窗口，可直接双击：

- `start-no-console.vbs`

该脚本会以静默模式调用 `start.bat /silent`，后台启动服务，正常情况下不会显示黑色命令行窗口。

`start.bat` 实际执行的是：

```bat
java -jar target\autoweb-springboot-1.0.1.jar --spring.profiles.active=prod --server.port=%PORT%
```

#### 方式 B：打包成 `.exe`（推荐 Launch4j）

本项目是 Spring Boot Web 服务，推荐做法不是转原生程序，而是：**`jar + exe` 外壳**。

本目录已额外提供：

- `package-release.bat`：整理 Windows 发布目录（会清理 `app.pid` / `app.out.log` / `app.err.log` 残留）
- `launch4j.xml`：Launch4j 配置模板（已带版本信息）
- `icon.ico`：可选 exe 图标文件，放在 `springboot/` 目录即可被自动带入发布包

推荐步骤：

1. 先执行 Maven 打包，生成 `target/autoweb-springboot-1.0.1.jar`
2. 双击或执行 `package-release.bat`
3. 在生成的 `release/` 目录中使用 `launch4j.xml` 生成 `exe`
4. 如需免安装 Java，可将 `jre/` 一并放入 `release/` 目录；如果 `springboot/jre/` 已存在，`package-release.bat` 会自动复制

整理发布目录：

```bat
cd springboot
package-release.bat
```

Launch4j 建议参数：

- Output file：`autoweb-springboot.exe`
- Jar：`target/autoweb-springboot-1.0.1.jar`
- Min JRE version：`17`
- Program arguments：`--spring.profiles.active=prod --server.port=8000`

推荐发布目录结构：

```text
release/
  start.bat
  stop.bat
  start-no-console.vbs
  launch4j.xml
  target/
    autoweb-springboot-1.0.1.jar
  static/
  jre/
```

如果你已经准备好了 `springboot/jre/`，执行 `package-release.bat` 时会自动复制到 `release/jre/`，这样目标机器无需单独安装 Java。

如果没有提供 `springboot/jre/`，打出来的发布包会依赖目标机器上的系统 Java 17，或依赖 `start.bat` 首次启动时通过 `winget` 自动安装。

如果测试时要跳过夜间限制，可追加：

```text
--app.skip-night-time-check=true
```

如需自定义 exe 图标：

1. 准备一个 `icon.ico`
2. 放到 `springboot/icon.ico`
3. 执行 `package-release.bat`
4. 使用 `release/launch4j.xml` 生成 exe

如果未提供 `icon.ico`，则使用 Launch4j 默认图标。

推荐 `icon.ico` 至少包含这些尺寸，避免 Windows 显示发糊：

- `16x16`
- `32x32`
- `48x48`
- `64x64`
- `128x128`
- `256x256`

建议：

- 使用透明背景
- 原始设计稿尽量从 `256x256` 或更大导出
- 最终保存为标准多尺寸 `.ico` 文件，而不是单尺寸 png 改后缀

### 6) Docker 启动

当前仓库根目录 `Dockerfile` 为历史 Python 服务镜像，不适用于本 Spring Boot 服务。  
本目录已提供可直接使用的容器文件：

- `springboot/Dockerfile`
- `springboot/docker-compose.yml`

镜像基于**瘦包 Jar**（`templates` 已在 Jar 内），构建上下文为**仓库根目录**（`docker-compose` 已配置），镜像内单独复制 `static/`，并设置 `--spring.profiles.active=prod`。请先在本机完成 Maven 打包再构建镜像。

构建并启动：

```bash
cd springboot
mvn -Dmaven.repo.local=.m2 clean package -DskipTests
docker compose build
docker compose up -d
```

（勿再在 `springboot` 目录下单独执行 `docker build .`，旧方式与当前 Dockerfile 路径不一致。）

换端口映射：

```bash
docker run -d --name autoweb-springboot -p 8123:8000 autoweb-springboot:latest
```

使用 Compose 启动：

```bash
cd springboot
docker compose up -d --build
```

停止并删除容器：

```bash
cd springboot
docker compose down
```

### 7) Nginx 反向代理（示例）

假设 Spring Boot 运行在本机 `8000` 端口，Nginx 配置可参考：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

检查并重载：

```bash
sudo nginx -t
sudo nginx -s reload
```

## 页面路由说明

- `GET /`：系统首页入口（由后端控制器返回）
- `GET /task`、`GET /task/`：转发到 `src/main/resources/static/index.html`
- 旧页面兼容路由：
  - `/ehs`
  - `/ehs/index`
  - `/ehs/taskImg`
  - `/ehs/watermark`
  - `/system`
  - `/router`
  - `/explorer`

## 主要接口清单

### 基础接口

- `GET /health`
- `POST /getSystemProgram/`
- `POST /SystemProgram/`
- `POST /SystemProgram/all/`

### EHS 业务接口（`/ehs`）

- `GET /ehs/status/`
- `GET /ehs/status/{id}`
- `POST /ehs/obtainInspectionData`
- `POST /ehs/main/`
- `POST /ehs/list`（兼容 `/ehs/list/`）
- `POST /ehs/getPictures/`
- `POST /ehs/SaveObjectPhotos/`
- `GET /ehs/json/`
- `GET /ehs/files/{checkAreaCode}`（兼容尾斜杠）
- `DELETE /ehs/files/{checkAreaCode}/{filename}`（兼容尾斜杠）
- `POST /ehs/upload`（兼容 `/ehs/upload/`）

### 合并后的任务接口（原 web_spring）

- `POST /api/list`（逻辑与 `/ehs/list` 保持一致）
- `POST /api/jobs/start`
- `GET /api/jobs/{id}`

`/api/list` 请求体参数（与 `/ehs/list` 一致）：

- `ct_code`：远程 EHS 查询参数，字符串，可选；未提供时通常需配合 `enableTest=true`
- `enableTest`：布尔值；`true` 时读取本地缓存文件 `json/ehp/CommonMessageList.json`

示例：

```bash
curl -X POST "http://localhost:8000/api/list" \
  -H "Content-Type: application/json" \
  -d '{"enableTest": true}'
```

## 关键配置

配置文件：`src/main/resources/application.yml`

重点配置项：

- `server.port`：服务端口（默认 `8000`）
- `spring.servlet.multipart.*`：上传大小限制
- `spring.thymeleaf.prefix`：模板目录（默认 `file:${app.project-root:../}/templates/`）
- `app.project-root`：项目根目录（开发默认 `../`；生产启用 profile `prod` 时为 `./`，见 `application-prod.yml`）
- `app.skip-night-time-check`：是否跳过夜间限制（默认 `false`，测试时可设为 `true`）
- `ehs.*`：EHS 远端服务地址、token、任务参数、延时策略

## 静态资源与模板

- 静态资源（新控制台）：`src/main/resources/static/`
  - 页面：`index.html`
  - 脚本：`js/app.js`
  - 样式：`css/app.css`
- 旧模板目录：`${app.project-root}/templates/`

## 常见问题

- **`/task` 打不开**
  - 确认已使用最新代码（`WebConfig` 已配置 `/task -> forward:/index.html`）。
- **远端 EHS 接口调用失败**
  - 检查 `application.yml` 中 `ehs.base-url` 与 `ehs.session-token`。
- **文件上传报错**
  - 检查 `spring.servlet.multipart.max-file-size` 与 `max-request-size`。

## 最近更新

- 新增 `/ehs/upload` 文件上传接口（与 Python 版本对齐）
- 新增 `DELETE /ehs/files/{checkAreaCode}/{filename}` 文件删除接口
- 默认打包改为瘦包（26MB），static 资源需外部部署
- 胖包使用 `-Pbundle-frontend` 参数（307MB，包含 static）
