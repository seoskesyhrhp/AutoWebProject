@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

set "SILENT_MODE=0"
if /i "%~1"=="/silent" set "SILENT_MODE=1"

chcp 65001 >nul

set "PORT=%PORT%"
if "%PORT%"=="" set "PORT=8000"

set "JAR_NAME=autoweb-springboot-1.0.1.jar"
set "JAR_PATH=target\%JAR_NAME%"
set "PID_FILE=app.pid"
set "OUT_LOG=app.out.log"
set "ERR_LOG=app.err.log"
set "MAX_WAIT=30"
set "JAVA_CMD="
set "NO_PAUSE=%NO_PAUSE%"

if "%SILENT_MODE%"=="0" (
    echo ============================================
    echo AutoWeb Spring Boot 启动脚本
    echo ============================================
    echo 当前目录: %CD%
    echo 目标JAR: %JAR_NAME%
    echo 使用端口: %PORT%
    echo.
)

if exist "%PID_FILE%" (
    if "%SILENT_MODE%"=="0" echo 发现现有PID文件，正在停止旧进程...
    set "NO_PAUSE=1"
    call stop.bat
    set "NO_PAUSE="
    timeout /t 1 /nobreak >nul
)

if not exist "%JAR_PATH%" (
    if "%SILENT_MODE%"=="0" (
        echo 错误: 未找到JAR文件
        echo 路径: %CD%\%JAR_PATH%
    )
    goto :fail
)

call :resolve_java17
if not defined JAVA_CMD (
    if "%SILENT_MODE%"=="0" (
        echo 错误: 未找到可用的 Java 17
        echo 请手动安装 Java 17，或将 JRE 放到 jre\bin\java.exe
    )
    goto :fail
)

if "%SILENT_MODE%"=="0" (
    echo 已找到合适的Java运行时:
    "%JAVA_CMD%" -version 2>&1 | findstr /i /c:"version" /c:"openjdk"
    echo 路径: %JAVA_CMD%
    echo.
)

call :check_port_available %PORT%
if errorlevel 1 (
    if "%SILENT_MODE%"=="0" echo 错误: 端口 %PORT% 已被占用
    goto :fail
)

if exist "%OUT_LOG%" del /f /q "%OUT_LOG%" >nul 2>nul
if exist "%ERR_LOG%" del /f /q "%ERR_LOG%" >nul 2>nul
if exist "%PID_FILE%" del /f /q "%PID_FILE%" >nul 2>nul

if "%SILENT_MODE%"=="0" (
    echo 正在启动应用 (端口: %PORT%)...
    echo 命令: %JAVA_CMD% -jar "%JAR_PATH%" --spring.profiles.active=prod --server.port=%PORT%
    echo 日志文件: %OUT_LOG%, %ERR_LOG%
    echo.
)

powershell -NoProfile -Command "$p = Start-Process -FilePath '%JAVA_CMD%' -ArgumentList @('-jar','%JAR_PATH%','--spring.profiles.active=prod','--server.port=%PORT%') -RedirectStandardOutput '%OUT_LOG%' -RedirectStandardError '%ERR_LOG%' -PassThru; if ($p -and $p.Id) { Set-Content -Path '%PID_FILE%' -Value $p.Id } else { exit 1 }"
if errorlevel 1 goto :fail

if not exist "%PID_FILE%" goto :fail

set /p APP_PID=<"%PID_FILE%"
if "%APP_PID%"=="" goto :fail

set "READY=0"
for /L %%i in (1,1,%MAX_WAIT%) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT% ^| findstr LISTENING') do (
        if "%%a"=="%APP_PID%" set "READY=1"
    )
    if "!READY!"=="1" goto :ready
    tasklist /fi "PID eq %APP_PID%" 2>nul | findstr "%APP_PID%" >nul
    if errorlevel 1 goto :fail
    timeout /t 1 /nobreak >nul
)

goto :show_logs

:ready
if "%SILENT_MODE%"=="0" (
    echo.
    echo ============================================
    echo 启动成功! PID: %APP_PID%
    echo 访问地址: http://localhost:%PORT%
    echo ============================================
)
goto :show_logs

:resolve_java17
if exist "jre\bin\java.exe" (
    set "JAVA_CMD=%CD%\jre\bin\java.exe"
    exit /b 0
)

call :find_installed_java17
if defined JAVA_CMD exit /b 0

call :check_system_java17
if defined JAVA_CMD exit /b 0

if "%SILENT_MODE%"=="0" echo Java 17 not found. Trying to install Eclipse Temurin 17 with winget...
where winget >nul 2>nul
if errorlevel 1 exit /b 1

winget install --id EclipseAdoptium.Temurin.17.JRE -e --accept-package-agreements --accept-source-agreements
if errorlevel 1 (
    winget install --id EclipseAdoptium.Temurin.17.JDK -e --accept-package-agreements --accept-source-agreements
)

call :find_installed_java17
if defined JAVA_CMD exit /b 0

call :check_system_java17
exit /b 0

:find_installed_java17
for /d %%d in ("%ProgramFiles%\Eclipse Adoptium\jre-17*" "%ProgramFiles%\Eclipse Adoptium\jdk-17*" "%ProgramFiles%\Java\jre-17*" "%ProgramFiles%\Java\jdk-17*" "%ProgramFiles%\Microsoft\jdk-17*") do (
    if exist "%%~fd\bin\java.exe" (
        set "JAVA_CMD=%%~fd\bin\java.exe"
        exit /b 0
    )
)
exit /b 0

:check_system_java17
where java >nul 2>nul || exit /b 0
java -version 2>&1 | findstr /i /c:"version \"17" /c:"openjdk 17" >nul
if not errorlevel 1 set "JAVA_CMD=java"
exit /b 0

:check_port_available
netstat -ano 2>nul | findstr ":%1 " | findstr "LISTENING" >nul
if errorlevel 1 exit /b 0
exit /b 1

:show_logs
if "%SILENT_MODE%"=="0" (
    echo 日志文件:
    echo   Stdout: %CD%\%OUT_LOG%
    echo   Stderr: %CD%\%ERR_LOG%
)
if "%SILENT_MODE%"=="0" if "%NO_PAUSE%"=="" pause
exit /b 0

:fail
if "%SILENT_MODE%"=="0" (
    echo.
    echo 失败日志:
    echo   Stdout: %CD%\%OUT_LOG%
    echo   Stderr: %CD%\%ERR_LOG%
)
if "%SILENT_MODE%"=="0" if "%NO_PAUSE%"=="" pause
exit /b 1
