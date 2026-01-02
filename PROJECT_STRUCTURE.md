# MetaLife OS Project Structure

## 📁 Directory Structure

```
metalifeos/
├── 📱 apps/                          # Applications
│   ├── web/                          # Next.js Web Application
│   │   ├── src/
│   │   │   ├── app/                  # App Router
│   │   │   ├── components/           # Reusable Components
│   │   │   ├── hooks/               # Custom Hooks
│   │   │   ├── lib/                 # Utilities
│   │   │   └── types/               # TypeScript Types
│   │   ├── public/
│   │   ├── styles/
│   │   └── package.json
│   ├── api/                          # FastAPI Backend
│   │   ├── app/
│   │   │   ├── api/                 # API Routes
│   │   │   ├── core/                # Core Configuration
│   │   │   ├── database/             # Database Models
│   │   │   ├── services/             # Business Logic
│   │   │   └── utils/                # Utilities
│   │   ├── tests/
│   │   ├── requirements.txt
│   │   └── main.py
│   ├── content-automation/           # Blog Automation Engine
│   │   ├── app/
│   │   │   ├── collectors/           # File Watchers
│   │   │   ├── database/             # Database Models
│   │   │   ├── generation/           # Content Generation
│   │   │   ├── ingestion/            # File Ingestion
│   │   │   ├── publishers/           # Platform Publishers
│   │   │   ├── validation/           # Quality Validation
│   │   │   ├── workers/              # Stage Workers
│   │   │   └── workflows/            # Workflow Orchestration
│   │   ├── templates/                # Jinja2 Templates
│   │   ├── config/                   # Configuration
│   │   └── cli.py
│   ├── web-studio/                   # Portfolio Web Studio
│   │   ├── src/
│   │   │   ├── components/           # Studio Components
│   │   │   ├── hooks/               # Studio Hooks
│   │   │   ├── services/            # Studio Services
│   │   │   └── templates/           # Website Templates
│   │   └── package.json
│   └── media-generation/             # Media Generation (ComfyUI)
│       ├── comfyui/                  # ComfyUI Integration
│       ├── pptx-generator/           # PowerPoint Generation
│       ├── scripts/                  # Generation Scripts
│       └── requirements.txt
├── 🤖 agents/                        # AI Agents
│   ├── agent-local/                  # Local AI Agent (AgenticSeek)
│   │   ├── frontend/                 # Web Frontend
│   │   ├── llm_router/               # LLM Router
│   │   ├── llm_server/               # LLM Server
│   │   ├── searxng/                  # Search Engine
│   │   └── cli.py
│   ├── agent-glm/                    # GLM Code Agent
│   │   ├── glm_code/                 # GLM Integration
│   │   ├── gui-winforms/             # Windows GUI
│   │   └── cli.py
│   └── shared/                       # Shared Agent Libraries
│       ├── core/                     # Core Agent Logic
│       ├── providers/                # LLM Providers
│       └── tools/                    # Agent Tools
├── 🔧 services/                      # Microservices
│   ├── auth/                         # Authentication Service
│   ├── storage/                      # File Storage Service
│   ├── notification/                 # Notification Service
│   ├── analytics/                    # Analytics Service
│   └── queue/                        # Queue Service (Redis)
├── 📦 packages/                      # Shared Packages
│   ├── ui/                          # UI Component Library
│   ├── config/                      # Configuration Management
│   ├── database/                    # Database Utilities
│   ├── types/                       # Shared TypeScript Types
│   └── utils/                       # General Utilities
├── 🎨 templates/                     # Content Templates
│   ├── websites/                     # Website Templates
│   ├── blogs/                        # Blog Templates
│   ├── social-media/                 # Social Media Templates
│   └── presentations/                # Presentation Templates
├── 📚 docs/                          # Documentation
│   ├── architecture/                 # Architecture Docs
│   ├── api/                         # API Documentation
│   ├── guides/                      # User Guides
│   └── examples/                    # Code Examples
├── 🧪 tests/                         # Integration Tests
│   ├── e2e/                          # End-to-End Tests
│   ├── integration/                  # Integration Tests
│   └── performance/                  # Performance Tests
├── 🛠️ infrastructure/                 # Infrastructure
│   ├── docker/                       # Docker Configurations
│   ├── kubernetes/                  # K8s Configurations
│   ├── terraform/                    # Infrastructure as Code
│   └── monitoring/                   # Monitoring Setup
├── 🔒 scripts/                       # Build & Deploy Scripts
│   ├── setup/                       # Setup Scripts
│   ├── build/                       # Build Scripts
│   ├── deploy/                      # Deploy Scripts
│   └── maintenance/                 # Maintenance Scripts
├── .github/                          # GitHub Configuration
│   ├── workflows/                    # GitHub Actions
│   ├── ISSUE_TEMPLATE/               # Issue Templates
│   └── PULL_REQUEST_TEMPLATE.md      # PR Template
├── docker-compose.yml                # Development Environment
├── docker-compose.prod.yml           # Production Environment
├── package.json                      # Root Package Configuration
├── turbo.json                        # Turbo Monorepo Config
├── .gitignore
├── .env.example
└── README.md
```

## 🏗️ Architecture Principles

### 1. **Microservices Architecture**
- 각 기능은 독립적인 서비스로 분리
- API 게이트웨이를 통한 통합
- 이벤트 기반 통신

### 2. **AI-First Design**
- 모든 기능에 AI 통합 고려
- 로컬/클라우드 하이브리드 지원
- 실시간 처리 능력

### 3. **Type Safety**
- 전체 프로젝트 TypeScript 사용
- Python 타입 힌트 적극 활용
- API 스키마 자동 생성

### 4. **Developer Experience**
- 핫 리로드 지원
- 자동 테스트 실행
- 문서 자동 생성

### 5. **Scalability**
- 컨테이너화된 서비스
- 수평적 확장 지원
- 클라우드 네이티브 설계

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Docker & Docker Compose
- Git

### Development Setup
```bash
# Clone repository
git clone https://github.com/your-org/metalifeos.git
cd metalifeos

# Install dependencies
npm run setup

# Start development environment
npm run docker:dev

# Start individual services
npm run dev                    # Web app
npm run api:dev                 # API server
npm run agent:local             # Local agent
npm run content:worker          # Content automation
```

## 📊 Technology Stack

### Frontend
- **Next.js 14**: React Full-Stack Framework
- **TypeScript**: Type Safety
- **Tailwind CSS**: Styling
- **Framer Motion**: Animations
- **Zustand**: State Management
- **React Query**: Server State

### Backend
- **FastAPI**: High-Performance API
- **SQLAlchemy**: ORM
- **PostgreSQL**: Primary Database
- **Redis**: Caching & Queue
- **Celery**: Task Queue

### AI/ML
- **OpenAI**: GPT-4, Whisper
- **Anthropic**: Claude
- **Ollama**: Local LLMs
- **ComfyUI**: Image Generation
- **FFmpeg**: Media Processing

### Infrastructure
- **Docker**: Containerization
- **Kubernetes**: Orchestration
- **Terraform**: Infrastructure as Code
- **GitHub Actions**: CI/CD

## 🎯 Key Features Integration

### Agent_Local Integration
- 100% 로컬 AI 처리
- 음성 인터페이스
- 웹 브라우징 자동화

### Blog_Automation_OS Integration
- 비디오 전사 및 콘텐츠 생성
- 다중 플랫폼 발행
- 품질 검증 시스템

### jahyeon-portfolio Integration
- 포트폴리오 자동 생성
- 실시간 편집
- SEO 최적화

### Agent Integration
- 코드 생성 및 GitHub 자동화
- 모바일 원격 제어
- GLM-4.7 통합

### Manus_Claude Integration
- ComfyUI 이미지 생성
- PPTX 자동화
- WSL 통합

## 🔮 Future Roadmap

### Phase 1: Foundation (Current)
- [x] Core architecture setup
- [x] Basic AI agent integration
- [x] Web application foundation
- [ ] Content automation pipeline

### Phase 2: Advanced Features
- [ ] Mobile applications
- [ ] Advanced analytics
- [ ] Team collaboration
- [ ] Enterprise features

### Phase 3: Ecosystem
- [ ] API marketplace
- [ ] Third-party integrations
- [ ] Plugin system
- [ ] Global expansion