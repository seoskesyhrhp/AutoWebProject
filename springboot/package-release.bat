@echo off
setlocal
cd /d %~dp0

set APP_NAME=autoweb-springboot
set APP_VERSION=1.0.1
set JAR_NAME=%APP_NAME%-%APP_VERSION%.jar
set RELEASE_DIR=release

if not exist target\%JAR_NAME% (
    echo Jar not found: target\%JAR_NAME%
    echo Please build first: mvn clean package -DskipTests
    pause
    exit /b 1
)

echo Cleaning old release directory...
if exist %RELEASE_DIR% rmdir /s /q %RELEASE_DIR%

echo Removing runtime leftovers...
if exist app.pid del /f /q app.pid >nul 2>nul
if exist app.out.log del /f /q app.out.log >nul 2>nul
if exist app.err.log del /f /q app.err.log >nul 2>nul

echo Creating release directory...
mkdir %RELEASE_DIR%
mkdir %RELEASE_DIR%\target

echo Copying runtime files...
copy /y start.bat %RELEASE_DIR%\ >nul
copy /y stop.bat %RELEASE_DIR%\ >nul
copy /y start-no-console.vbs %RELEASE_DIR%\ >nul
copy /y launch4j.xml %RELEASE_DIR%\ >nul
if exist icon.ico copy /y icon.ico %RELEASE_DIR%\ >nul
copy /y target\%JAR_NAME% %RELEASE_DIR%\target\ >nul

if exist ..\static (
    echo Copying static assets...
    xcopy /e /i /y ..\static %RELEASE_DIR%\static >nul
)

if exist jre (
    echo Copying bundled JRE...
    xcopy /e /i /y jre %RELEASE_DIR%\jre >nul
) else (
    echo No bundled JRE found under %CD%\jre
    echo This release will rely on system Java 17 or winget auto-install at first start.
    echo To make a self-contained package, put JRE into springboot\jre and run package-release.bat again.
)

echo Release package ready: %CD%\%RELEASE_DIR%
echo You can now use Launch4j with %RELEASE_DIR%\launch4j.xml
pause
