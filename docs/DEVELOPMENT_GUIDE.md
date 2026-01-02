# MetaLife OS - 개발 가이드

## 🚀 빠른 시작

### 1. 설치
```bash
# 레포지토리 클론
git clone https://github.com/your-org/metalifeos.git
cd metalifeos

# 초기 설정 스크립트 실행
node scripts/setup.js

# 환경 변수 설정
cp .env.example .env
# .env 파일에 API 키들 입력
```

### 2. 개발 환경 시작
```bash
# 전체 개발 환경 (Docker)
npm run docker:dev

# 또는 개별 서비스 시작
npm run dev              # 웹 애플리케이션
npm run api:dev          # API 서버
npm run agent:local      # 로컬 AI 에이전트
npm run content:worker   # 콘텐츠 자동화 워커
```

### 3. 접속 주소
- 🌐 웹 애플리케이션: http://localhost:3000
- 🚀 API 서버: http://localhost:8000
- 📊 모니터링 (Grafana): http://localhost:3001
- 🔍 검색 엔진: http://localhost:8080
- 🎨 미디어 생성: http://localhost:8188

## 🏗️ 아키텍처

### 서비스 구성도
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   웹 앱     │    │   API 서버   │    │  AI 에이전트  │
│  (Next.js)  │────│  (FastAPI)  │────│ (Python)    │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
          ┌────────────────┴────────────────┐
          │                                 │
    ┌─────────────┐                  ┌─────────────┐
    │ PostgreSQL  │                  │    Redis    │
    │  Database   │                  │   Cache     │
    └─────────────┘                  └─────────────┘
```

## 🔧 개발 워크플로우

### 1. 기능 개발
```bash
# 새 기능 브랜치 생성
git checkout -b feature/new-ai-capability

# 코드 작성 후 테스트
npm run test
npm run typecheck
npm run lint

# 커밋 및 푸시
git add .
git commit -m "feat: add new AI capability"
git push origin feature/new-ai-capability
```

### 2. 테스트
```bash
# 단위 테스트
npm run test

# 통합 테스트
npm run test:integration

# E2E 테스트
npm run test:e2e

# 커버리지 확인
npm run test:coverage
```

### 3. 빌드
```bash
# 개발 빌드
npm run build

# 프로덕션 빌드
npm run build:prod

# Docker 이미지 빌드
npm run docker:build
```

## 🤖 AI 에이전트 개발

### 새로운 에이전트 추가
1. `agents/` 디렉토리에 새 에이전트 폴더 생성
2. 기본 구조 구현:

```python
# agents/your-agent/main.py
from agents.shared.core import BaseAgent
from agents.shared.providers import LLMProvider

class YourAgent(BaseAgent):
    def __init__(self, config: dict):
        super().__init__(config)
        self.llm = LLMProvider(config['provider'])
    
    async def process_task(self, task: str) -> str:
        # 태스크 처리 로직 구현
        response = await self.llm.generate(task)
        return response
```

3. 환경 변수 설정:
```bash
# .env
YOUR_AGENT_PROVIDER=openai
YOUR_AGENT_MODEL=gpt-4
YOUR_AGENT_API_KEY=sk-...
```

## 📝 콘텐츠 자동화

### 새로운 플랫폼 추가
1. `apps/content-automation/app/publishers/`에 새 퍼블리셔 생성:
```python
# publishers/new_platform.py
from app.publishers.base import BasePublisher

class NewPlatformPublisher(BasePublisher):
    async def publish(self, content: dict) -> dict:
        # 플랫폼별 발행 로직
        result = await self.api_client.upload(content)
        return result
```

2. 템플릿 추가:
```jinja2
<!-- templates/new_platform/post.html -->
<h1>{{ title }}</h1>
<p>{{ content }}</p>
```

## 🌐 웹 스튜디오 개발

### 새로운 컴포넌트 추가
1. `apps/web/src/components/`에 컴포넌트 생성:
```tsx
// components/NewFeature.tsx
import React from 'react';
import { Card } from '@/components/ui/card';

export const NewFeature = () => {
  return (
    <Card>
      {/* 컴포넌트 내용 */}
    </Card>
  );
};
```

2. 스토리북에 추가:
```tsx
// .storybook/NewFeature.stories.tsx
import { NewFeature } from '@/components/NewFeature';

export default {
  title: 'Components/NewFeature',
  component: NewFeature,
} as Meta;

export const Default = () => <NewFeature />;
```

## 🎨 미디어 생성

### 새로운 생성 파이프라인 추가
1. `apps/media-generation/`에 새 파이프라인 생성:
```python
# pipelines/image_generation.py
from app.core.base import BasePipeline

class ImageGenerationPipeline(BasePipeline):
    async def process(self, prompt: str) -> dict:
        # 이미지 생성 로직
        result = await self.comfyui_client.generate(prompt)
        return result
```

## 📊 모니터링 및 로깅

### 로그 레벨 설정
```bash
# .env
LOG_LEVEL=debug  # debug, info, warn, error
```

### 커스텀 메트릭 추가
```python
# Python 서비스에서
from prometheus_client import Counter, Histogram

REQUEST_COUNT = Counter('requests_total', 'Total requests', ['method', 'endpoint'])
REQUEST_DURATION = Histogram('request_duration_seconds', 'Request duration')

@app.middleware
async def metrics_middleware(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    REQUEST_COUNT.labels(method=request.method, endpoint=request.url.path).inc()
    REQUEST_DURATION.observe(duration)
    
    return response
```

## 🔒 보안 가이드라인

### API 키 관리
- 모든 API 키는 환경 변수로 관리
- `.env` 파일은 `.gitignore`에 포함
- 프로덕션에서는 보안 매니저 사용 (AWS Secrets Manager 등)

### 데이터 암호화
```python
# 암호화 유틸리티
from cryptography.fernet import Fernet

class Encryption:
    def __init__(self, key: str):
        self.cipher = Fernet(key.encode())
    
    def encrypt(self, data: str) -> str:
        return self.cipher.encrypt(data.encode()).decode()
    
    def decrypt(self, encrypted_data: str) -> str:
        return self.cipher.decrypt(encrypted_data.encode()).decode()
```

## 🌍 국제화 (i18n)

### 다국어 지원 추가
1. 번역 파일 추가:
```json
// locales/ko.json
{
  "common.save": "저장",
  "common.cancel": "취소",
  "ai.processing": "처리 중..."
}

// locales/en.json
{
  "common.save": "Save",
  "common.cancel": "Cancel",
  "ai.processing": "Processing..."
}
```

2. 컴포넌트에서 사용:
```tsx
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <button>{t('common.save')}</button>
  );
};
```

## 🚀 배포

### 프로덕션 배포
```bash
# 프로덕션 빌드
npm run build:prod

# Docker 이미지 빌드 및 푸시
npm run docker:build:prod
npm run docker:push

# Kubernetes 배포
kubectl apply -f infrastructure/kubernetes/
```

### 모니터링
- **Health Checks**: `/health`, `/ready`
- **Metrics**: `/metrics` (Prometheus)
- **Logs**: ELK Stack 또는 CloudWatch

## 🐛 디버깅

### 공통 문제 해결
1. **포트 충돌**: `.env`에서 포트 변경
2. **API 키 오류**: 환경 변수 확인
3. **의존성 충돌**: `npm ci` 또는 `pip install --force-reinstall`

### 디버깅 도구
```bash
# Python 디버깅
pip install pdbpp
python -m pdb your_script.py

# Node.js 디버깅
node --inspect-brk your-script.js
```

## 📚 추가 자료

- [API 문서](./docs/api/)
- [아키텍처 가이드](./docs/architecture/)
- [커뮤니티 포럼](https://community.metalifeos.com)
- [유튜브 튜토리얼](https://youtube.com/metalifeos)

## 🤝 기여하기

기여는 언제나 환영입니다! [CONTRIBUTING.md](./CONTRIBUTING.md)를 확인해주세요.

1. Fork 레포지토리
2. 기능 브랜치 생성
3. 변경사항 커밋
4. Pull Request 생성

---

💡 **팁**: 개발 중 문제가 발생하면 GitHub Issues 또는 디스코드 커뮤니티에 문의해주세요.