#!/bin/bash

# MetaLife OS - 일괄 설치 및 실행 스크립트

echo "🌟 MetaLife OS 설치 시작..."

# 색상 스크립트 오류 방지
set -e

# 색상 코드 색상
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 색상 출력 함수
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}$1${NC}"
}

# 필수 조건 체크
check_prerequisites() {
    print_header "📋 필수 조건 확인..."
    
    # Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        print_success "Node.js: v$NODE_VERSION"
    else
        print_error "Node.js가 설치되지 않았습니다. https://nodejs.org/"
        exit 1
    fi
    
    # Python
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
        print_success "Python: v$PYTHON_VERSION"
    else
        print_error "Python 3가 설치되지 않았습니다."
        exit 1
    fi
    
    # Docker
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        print_success "Docker: v$DOCKER_VERSION"
    else
        print_warning "Docker가 설치되지 않았습니다. 설치 권장: https://docker.com/"
    fi
    
    # Git
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version | cut -d' ' -f3)
        print_success "Git: v$GIT_VERSION"
    else
        print_error "Git이 설치되지 않았습니다. https://git-scm.com/"
        exit 1
    fi
}

# 환경 변수 설정
setup_environment() {
    print_header "🔧 환경 변수 설정..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_success ".env 파일 생성됨"
        print_warning ".env 파일을 편집하여 API 키들을 설정하세요."
    else
        print_status ".env 파일이 이미 존재합니다."
    fi
}

# 의존성 설치
install_dependencies() {
    print_header "📦 의존성 설치..."
    
    # Node.js 의존성
    print_status "Node.js 의존성 설치 중..."
    npm install
    print_success "Node.js 의존성 설치 완료"
    
    # Python 가상환경 및 의존성
    print_status "Python 가상환경 설정 중..."
    
    # 여러 서비스를 위한 가상환경 생성
    for service in "api content-automation agents/shared"; do
        if [ -d "apps/$service" ]; then
            cd "apps/$service"
            if [ ! -d "venv" ]; then
                python3 -m venv venv
                print_success "$service 가상환경 생성됨"
            fi
            
            # 가상환경 활성화 및 의존성 설치
            source venv/bin/activate
            if [ -f "requirements.txt" ]; then
                pip install -r requirements.txt
                print_success "$service 의존성 설치 완료"
            fi
            cd - > /dev/null
        fi
    done
}

# Docker 이미지 빌드
build_docker_images() {
    print_header "🐳 Docker 이미지 빌드..."
    
    # 메인 애플리케이션
    docker build -t metalifeos-web -f apps/web/Dockerfile.dev .
    print_success "웹 애플리케이션 이미지 빌드 완료"
    
    # API 서버
    if [ -f "apps/api/Dockerfile.dev" ]; then
        docker build -t metalifeos-api -f apps/api/Dockerfile.dev .
        print_success "API 서버 이미지 빌드 완료"
    fi
    
    # 콘텐츠 자동화
    if [ -f "apps/content-automation/Dockerfile.dev" ]; then
        docker build -t metalifeos-content -f apps/content-automation/Dockerfile.dev .
        print_success "콘텐츠 자동화 이미지 빌드 완료"
    fi
}

# 데이터베이스 초기화
init_database() {
    print_header "🗄️ 데이터베이스 초기화..."
    
    # Docker를 사용하여 PostgreSQL 시작
    docker-compose -f docker-compose.dev.yml up -d postgres redis
    
    # 데이터베이스가 준비될 때까지 대기
    print_status "데이터베이스 준비 대기 중..."
    sleep 10
    
    # 마이그레이션 실행
    if [ -d "apps/api" ]; then
        cd apps/api
        source venv/bin/activate
        python -c "from app.database.session import init_db; init_db()"
        print_success "데이터베이스 초기화 완료"
        cd - > /dev/null
    fi
}

# 서비스 시작
start_services() {
    print_header "🚀 MetaLife OS 서비스 시작..."
    
    # 개발 환경 Docker Compose 시작
    docker-compose -f docker-compose.dev.yml up -d
    
    print_success "모든 서비스 시작됨"
    echo ""
    print_header "🌐 접속 정보:"
    echo -e "${CYAN}📱 웹 애플리케이션:${NC} http://localhost:3000"
    echo -e "${CYAN}🤖 API 서버:${NC} http://localhost:8000"
    echo -e "${CYAN}📊 모니터링 (Grafana):${NC} http://localhost:3001"
    echo -e "${CYAN}🔍 검색 엔진:${NC} http://localhost:8080"
    echo -e "${CYAN}🎨 미디어 생성:${NC} http://localhost:8188"
    echo ""
    echo -e "${GREEN}✨ MetaLife OS가 성공적으로 시작되었습니다!${NC}"
}

# 상태 확인
check_services() {
    print_header "📊 서비스 상태 확인..."
    
    # 서비스 상태 체크
    services=("web:3000" "api:8000" "postgres:5432" "redis:6379")
    
    for service in "${services[@]}"; do
        service_name=$(echo $service | cut -d':' -f1)
        port=$(echo $service | cut -d':' -f2)
        
        if curl -s "http://localhost:$port" > /dev/null 2>&1; then
            print_success "$service_name: 실행 중"
        else
            print_warning "$service_name: 확인 필요"
        fi
    done
}

# 로그 보기
show_logs() {
    print_header "📋 서비스 로그:"
    docker-compose -f docker-compose.dev.yml logs -f --tail=50
}

# 정리
cleanup() {
    print_header "🧹 정리 중..."
    
    # 컨테이너 중지
    docker-compose -f docker-compose.dev.yml down
    
    # 이미지 정리
    docker images | grep metalifeos | awk '{print $3}' | xargs -r docker rmi
    
    # 가상환경 정리
    find . -name "venv" -type d -exec rm -rf {} + 2>/dev/null || true
    
    print_success "정리 완료"
}

# 개발 모드 시작
start_dev_mode() {
    print_header "🔧 개발 모드 시작..."
    
    # 웹 애플리케이션 개발 서버
    cd apps/web
    npm run dev &
    WEB_PID=$!
    cd - > /dev/null
    
    # API 서버 개발 서버
    cd apps/api
    source venv/bin/activate
    uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
    API_PID=$!
    cd - > /dev/null
    
    print_success "개발 서버들 시작됨"
    echo "웹: $WEB_PID"
    echo "API: $API_PID"
    
    # 중지 시그널 대기
    trap 'kill $WEB_PID $API_PID 2>/dev/null; print_status "개발 서버들 중지됨"' EXIT
    wait
}

# 메인 함수
main() {
    echo -e "${PURPLE}"
    echo "███████╗ ██╗   ██╗ ██████╗ ██████╗ ██╗██╗  █████╗ ██████╗ "
    echo "██╔════╝ ██║   ██║██╔════╝██╔═══██╗██║██╗██╔═══██╗██╔══██╗"
    echo "█████╗  ██║   ██║██║     ██║   ██║███████║██║   ██║██████╔╝"
    echo "██╔══╝  ╚██╗ ██╔╝██║     ██║   ██║╚════██║██║   ██║██╔═══╝ "
    echo "███████╗ ╚████╔╝ ╚██████╗╚██████╔╝     ██║╚██████╔╝███████║ "
    echo "╚══════╝  ╚═══╝   ╚═════╝ ╚═════╝      ╚═╝╚═════╝ ╚══════╝ "
    echo ""
    echo -e "🌟 통합 AI 생산성 플랫폼${NC}"
    echo ""
    
    # 인자 처리
    case "${1:-install}" in
        "install")
            check_prerequisites
            setup_environment
            install_dependencies
            build_docker_images
            init_database
            start_services
            check_services
            ;;
        "dev")
            check_prerequisites
            setup_environment
            start_dev_mode
            ;;
        "start")
            start_services
            check_services
            ;;
        "stop")
            docker-compose -f docker-compose.dev.yml down
            print_success "모든 서비스 중지됨"
            ;;
        "restart")
            docker-compose -f docker-compose.dev.yml restart
            print_success "모든 서비스 재시작됨"
            ;;
        "logs")
            show_logs
            ;;
        "status")
            check_services
            ;;
        "cleanup")
            cleanup
            ;;
        "health")
            docker-compose -f docker-compose.dev.yml ps
            ;;
        *)
            echo "사용법: $0 {install|dev|start|stop|restart|logs|status|health|cleanup}"
            echo ""
            echo "옵션:"
            echo "  install  - 전체 설치 및 시작"
            echo "  dev      - 개발 모드 시작"
            echo "  start    - 서비스 시작"
            echo "  stop     - 서비스 중지"
            echo "  restart  - 서비스 재시작"
            echo "  logs     - 로그 보기"
            echo "  status   - 서비스 상태 확인"
            echo "  health   - Docker 컨테이너 상태"
            echo "  cleanup  - 정리"
            exit 1
            ;;
    esac
}

# 스크립트 실행
main "$@"