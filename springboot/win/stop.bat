@echo off
setlocal EnableDelayedExpansion
cd /d %~dp0

set PID_FILE=app.pid
set TARGET_PORT=%PORT%
if "%TARGET_PORT%"=="" set /p TARGET_PORT=Enter port to stop (default 8000): 
if "%TARGET_PORT%"=="" set TARGET_PORT=8000

set FOUND=0
if exist %PID_FILE% (
    set /p APP_PID=<%PID_FILE%
    if not "!APP_PID!"=="" (
        echo Stopping AutoWeb Spring Boot by PID !APP_PID! ...
        taskkill /PID !APP_PID! /F
        if not errorlevel 1 (
            set FOUND=1
            del /f /q %PID_FILE% >nul 2>nul
        )
    )
)

if "!FOUND!"=="0" (
    echo PID stop failed or PID file missing. Fallback to port %TARGET_PORT%...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%TARGET_PORT% ^| findstr LISTENING') do (
        echo Killing PID %%a
        taskkill /PID %%a /F
        set FOUND=1
    )
    if not "!FOUND!"=="0" del /f /q %PID_FILE% >nul 2>nul
)

if "!FOUND!"=="0" (
    echo No running process found by PID file or port %TARGET_PORT%.
)

echo Done.
if /i not "%NO_PAUSE%"=="1" pause
