@echo off
setlocal enabledelayedexpansion

:: MetaLife OS - Windows 설치 스크립트

echo.
echo ████████╗ ██╗   ██╗ ██████╗ ██████╗ ██╗██╗  █████╗ ██████╗ 
echo ██╔════╝ ██║   ██║██╔════╝██╔═══██╗██║██╗██╔═══██╗██╔══██╗
echo ██████╗  ██║   ██║██║     ██║   ██║███████║██║   ██║██████╔╝
echo ██╔══╝  ╚██╗ ██╔╝██║     ██║   ██║╚════██║██║   ██║██╔═══╝ 
echo ████████╗ ╚████╔╝ ╚██████╗╚██████╔╝     ██║╚██████╔╝███████║ 
echo ╚══════╝  ╚═══╝   ╚═════╝ ╚═════╝      ╚═╝╚═════╝ ╚══════╝ 
echo.
echo 🌟 통합 AI 생산성 플랫폼
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo [INFO] MetaLife OS 설치 시작...

:: 1. 필수 조건 확인
echo.
echo [INFO] 📋 필수 조건 확인...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js가 설치되지 않았습니다. https://nodejs.org/
    exit /b 1
) else (
    for /f "tokens=2" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [SUCCESS] Node.js: %NODE_VERSION%
)

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python이 설치되지 않았습니다.
    exit /b 1
) else (
    for /f "tokens=2" %%i in ('python --version') do set PYTHON_VERSION=%%i
    echo [SUCCESS] Python: %PYTHON_VERSION%
)

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Docker가 설치되지 않았습니다. 설치 권장: https://docker.com/
) else (
    for /f "tokens=3" %%i in ('docker --version') do set DOCKER_VERSION=%%i
    echo [SUCCESS] Docker: v%DOCKER_VERSION%
)

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git이 설치되지 않았습니다. https://git-scm.com/
    exit /b 1
) else (
    for /f "tokens=3" %%i in ('git --version') do set GIT_VERSION=%%i
    echo [SUCCESS] Git: v%GIT_VERSION%
)

:: 2. 환경 변수 설정
echo.
echo [INFO] 🔧 환경 변수 설정...

if not exist .env (
    copy .env.example .env
    echo [SUCCESS] .env 파일 생성됨
    echo [WARNING] .env 파일을 편집하여 API 키들을 설정하세요.
) else (
    echo [STATUS] .env 파일이 이미 존재합니다.
)

:: 3. 의존성 설치
echo.
echo [INFO] 📦 의존성 설치...

echo [STATUS] Node.js 의존성 설치 중...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Node.js 의존성 설치 실패
    exit /b 1
)
echo [SUCCESS] Node.js 의존성 설치 완료

:: Python 가상환경 설정
for %%s in ("api" "content-automation" "agents\shared") do (
    if exist "apps\%%s" (
        echo [STATUS] %%s 가상환경 설정 중...
        cd apps\%%s
        
        if not exist venv (
            python -m venv venv
            echo [SUCCESS] %%s 가상환경 생성됨
        )
        
        venv\Scripts\activate
        if exist requirements.txt (
            pip install -r requirements.txt
            echo [SUCCESS] %%s 의존성 설치 완료
        )
        cd ..\..
    )
)

:: 4. Docker 이미지 빌드
echo.
echo [INFO] 🐳 Docker 이미지 빌드...

docker build -t metalifeos-web -f apps\web\Dockerfile.dev .
if %errorlevel% neq 0 (
    echo [ERROR] 웹 애플리케이션 이미지 빌드 실패
) else (
    echo [SUCCESS] 웹 애플리케이션 이미지 빌드 완료
)

if exist apps\api\Dockerfile.dev (
    docker build -t metalifeos-api -f apps\api\Dockerfile.dev .
    if %errorlevel% neq 0 (
        echo [ERROR] API 서버 이미지 빌드 실패
    ) else (
        echo [SUCCESS] API 서버 이미지 빌드 완료
    )
)

if exist apps\content-automation\Dockerfile.dev (
    docker build -t metalifeos-content -f apps\content-automation\Dockerfile.dev .
    if %errorlevel% neq 0 (
        echo [ERROR] 콘텐츠 자동화 이미지 빌드 실패
    ) else (
        echo [SUCCESS] 콘텐츠 자동화 이미지 빌드 완료
    )
)

:: 5. 서비스 시작
echo.
echo [INFO] 🚀 MetaLife OS 서비스 시작...

docker-compose -f docker-compose.dev.yml up -d
if %errorlevel% neq 0 (
    echo [ERROR] 서비스 시작 실패
    exit /b 1
)

echo [SUCCESS] 모든 서비스 시작됨

timeout /t 5 >nul

echo.
echo [INFO] 🌐 접속 정보:
echo 📱 웹 애플리케이션: http://localhost:3000
echo 🤖 API 서버: http://localhost:8000
echo 📊 모니터링 (Grafana): http://localhost:3001
echo 🔍 검색 엔진: http://localhost:8080
echo 🎨 미디어 생성: http://localhost:8188
echo.
echo [SUCCESS] ✨ MetaLife OS가 성공적으로 시작되었습니다!

pause