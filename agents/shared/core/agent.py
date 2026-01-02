"""
MetaLife OS - 통합 AI 에이전트 코어 (수정된 버전)
Agent_Local과 Agent의 기능을 결합한 하이브리드 AI 에이전트 시스템
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, Union, Tuple
from enum import Enum
import asyncio
import json
import logging
import time
from dataclasses import dataclass, field
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AgentType(Enum):
    LOCAL = "local"  # Agent_Local: 100% 로컬 처리
    GLM = "glm"  # Agent: GLM-4.7 기반 코드 생성
    HYBRID = "hybrid"  # 하이브리드 모드
    CLOUD = "cloud"  # 클라우드 API 우선


class TaskType(Enum):
    CODE_GENERATION = "code_generation"
    WEB_BROWSING = "web_browsing"
    CONTENT_CREATION = "content_creation"
    FILE_MANAGEMENT = "file_management"
    RESEARCH = "research"
    AUTOMATION = "automation"


@dataclass
class AgentTask:
    """AI 에이전트 태스크 정의"""

    id: str
    type: TaskType
    description: str
    context: Dict[str, Any]
    priority: int = 1
    agent_type: Optional[AgentType] = None
    tools: List[str] = field(default_factory=list)


@dataclass
class AgentResponse:
    """AI 에이전트 응답 정의"""

    task_id: str
    success: bool
    content: str
    metadata: Dict[str, Any]
    error: Optional[str] = None
    execution_time: float = 0.0
    tokens_used: int = 0


class BaseProvider(ABC):
    """LLM 제공자 기본 클래스"""

    @abstractmethod
    async def generate(self, prompt: str, **kwargs) -> str:
        pass

    @abstractmethod
    async def generate_with_tools(
        self, prompt: str, tools: List[Dict]
    ) -> Tuple[str, List[Dict]]:
        pass

    @abstractmethod
    def get_model_info(self) -> Dict[str, Any]:
        pass


class OpenAIProvider(BaseProvider):
    """OpenAI API 제공자"""

    def __init__(self, api_key: str, model: str = "gpt-4"):
        self.api_key = api_key
        self.model = model
        # 실제 구현에서는 openai 라이브러리 임포트

    async def generate(self, prompt: str, **kwargs) -> str:
        # OpenAI API 호출 구현
        logger.info(f"OpenAI 생성 요청: {len(prompt)} 문자")
        # return await openai.ChatCompletion.create(...)
        return f"OpenAI 응답: {prompt[:50]}..."

    async def generate_with_tools(
        self, prompt: str, tools: List[Dict]
    ) -> Tuple[str, List[Dict]]:
        # 툴 콜과 함께 생성
        response = await self.generate(prompt)
        tool_calls = []  # 툴 콜 파싱
        return response, tool_calls

    def get_model_info(self) -> Dict[str, Any]:
        return {
            "provider": "openai",
            "model": self.model,
            "capabilities": ["text", "code", "tools", "vision"],
        }


class OllamaProvider(BaseProvider):
    """Ollama 로컬 LLM 제공자"""

    def __init__(
        self, base_url: str = "http://localhost:11434", model: str = "deepseek-r1:14b"
    ):
        self.base_url = base_url
        self.model = model

    async def generate(self, prompt: str, **kwargs) -> str:
        # Ollama API 호출 구현
        logger.info(f"Ollama 생성 요청: {self.model}")
        # return await requests.post(f"{self.base_url}/api/generate", ...)
        return f"Ollama({self.model}) 응답: {prompt[:50]}..."

    async def generate_with_tools(
        self, prompt: str, tools: List[Dict]
    ) -> Tuple[str, List[Dict]]:
        response = await self.generate(prompt)
        tool_calls = []
        return response, tool_calls

    def get_model_info(self) -> Dict[str, Any]:
        return {
            "provider": "ollama",
            "model": self.model,
            "capabilities": ["text", "code"],
            "local": True,
        }


class GLMProvider(BaseProvider):
    """GLM-4.7 제공자 (Z.ai)"""

    def __init__(self, api_key: str, base_url: str = "https://api.z.ai/api/paas/v4"):
        self.api_key = api_key
        self.base_url = base_url
        self.model = "glm-4.7"

    async def generate(self, prompt: str, **kwargs) -> str:
        logger.info(f"GLM-4.7 생성 요청")
        # GLM API 호출 구현
        return f"GLM-4.7 응답: {prompt[:50]}..."

    async def generate_with_tools(
        self, prompt: str, tools: List[Dict]
    ) -> Tuple[str, List[Dict]]:
        response = await self.generate(prompt)
        tool_calls = []
        return response, tool_calls

    def get_model_info(self) -> Dict[str, Any]:
        return {
            "provider": "glm",
            "model": self.model,
            "capabilities": ["text", "code", "tools"],
        }


class BaseTool(ABC):
    """에이전트 툴 기본 클래스"""

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        pass

    @abstractmethod
    async def execute(self, **kwargs) -> Dict[str, Any]:
        pass


class WebBrowserTool(BaseTool):
    """웹 브라우징 툴 (Agent_Local 기반)"""

    def __init__(self, headless: bool = True, stealth: bool = True):
        self.headless = headless
        self.stealth = stealth

    @property
    def name(self) -> str:
        return "web_browser"

    @property
    def description(self) -> str:
        return "웹사이트를 탐색하고 정보를 추출합니다"

    async def execute(self, **kwargs) -> Dict[str, Any]:
        url = kwargs.get("url")
        search_query = kwargs.get("search_query")

        if search_query:
            # SearXNG으로 검색
            return await self._search(search_query)
        elif url:
            # 특정 URL 방문
            return await self._visit_page(url)
        else:
            return {"error": "URL 또는 검색어가 필요합니다"}

    async def _search(self, query: str) -> Dict[str, Any]:
        # SearXNG 검색 구현
        logger.info(f"검색: {query}")
        return {
            "success": True,
            "results": [
                {
                    "title": "예제 결과",
                    "url": "https://example.com",
                    "snippet": "검색 결과 스니펫...",
                }
            ],
            "query": query,
        }

    async def _visit_page(self, url: str) -> Dict[str, Any]:
        # Selenium 브라우저 자동화 구현
        logger.info(f"페이지 방문: {url}")
        return {
            "success": True,
            "url": url,
            "content": "페이지 내용...",
            "title": "페이지 제목",
        }


class CodeGenerationTool(BaseTool):
    """코드 생성 툴 (Agent 기반)"""

    def __init__(self, provider: BaseProvider):
        self.provider = provider

    @property
    def name(self) -> str:
        return "code_generation"

    @property
    def description(self) -> str:
        return "다양한 언어의 코드를 생성하고 수정합니다"

    async def execute(self, **kwargs) -> Dict[str, Any]:
        language = kwargs.get("language", "python")
        description = kwargs.get("description", "")
        file_path = kwargs.get("file_path")

        prompt = f"""
        언어: {language}
        요구사항: {description}
        
        완전한 코드를 생성해주세요. 주석과 예제를 포함해주세요.
        """

        code = await self.provider.generate(prompt)

        if file_path:
            # 파일 저장 로직
            Path(file_path).parent.mkdir(parents=True, exist_ok=True)
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(code)

        return {
            "success": True,
            "language": language,
            "code": code,
            "file_path": file_path,
        }


class GitHubTool(BaseTool):
    """GitHub 자동화 툴"""

    def __init__(self, token: str):
        self.token = token

    @property
    def name(self) -> str:
        return "github"

    @property
    def description(self) -> str:
        return "GitHub 저장소를 관리하고 PR을 생성합니다"

    async def execute(self, **kwargs) -> Dict[str, Any]:
        action = kwargs.get("action")

        if action == "create_pr":
            return await self._create_pr(**kwargs)
        elif action == "create_issue":
            return await self._create_issue(**kwargs)
        else:
            return {"error": f"지원하지 않는 액션: {action}"}

    async def _create_pr(
        self,
        title: str = "",
        body: str = "",
        head: str = "",
        base: str = "main",
        **kwargs,
    ) -> Dict[str, Any]:
        # GitHub PR 생성 구현
        logger.info(f"PR 생성: {title}")
        return {
            "success": True,
            "pr_url": "https://github.com/example/repo/pull/1",
            "title": title,
            "number": 1,
        }

    async def _create_issue(
        self, title: str = "", body: str = "", **kwargs
    ) -> Dict[str, Any]:
        # GitHub Issue 생성 구현
        logger.info(f"Issue 생성: {title}")
        return {
            "success": True,
            "issue_url": "https://github.com/example/repo/issues/1",
            "title": title,
            "number": 1,
        }


class MetaLifeAgent:
    """통합 AI 에이전트 메인 클래스"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.providers: Dict[str, BaseProvider] = {}
        self.tools: Dict[str, BaseTool] = {}
        self.task_queue = asyncio.Queue()
        self.running = False

        # 제공자 초기화
        self._initialize_providers()

        # 툴 초기화
        self._initialize_tools()

    def _initialize_providers(self):
        """LLM 제공자 초기화"""

        # OpenAI (클라우드)
        if self.config.get("openai_api_key"):
            self.providers["openai"] = OpenAIProvider(
                api_key=self.config["openai_api_key"],
                model=self.config.get("openai_model", "gpt-4"),
            )

        # Ollama (로컬)
        if self.config.get("ollama_enabled", True):
            self.providers["ollama"] = OllamaProvider(
                base_url=self.config.get("ollama_url", "http://localhost:11434"),
                model=self.config.get("ollama_model", "deepseek-r1:14b"),
            )

        # GLM-4.7 (코드 생성 특화)
        if self.config.get("zai_api_key"):
            self.providers["glm"] = GLMProvider(api_key=self.config["zai_api_key"])

    def _initialize_tools(self):
        """툴 초기화"""

        # 웹 브라우징
        self.tools["web_browser"] = WebBrowserTool(
            headless=self.config.get("headless_browser", True),
            stealth=self.config.get("stealth_mode", True),
        )

        # 코드 생성 (GLM 제공자 사용)
        if "glm" in self.providers:
            self.tools["code_generation"] = CodeGenerationTool(self.providers["glm"])

        # GitHub 자동화
        if self.config.get("github_token"):
            self.tools["github"] = GitHubTool(self.config["github_token"])

    async def process_task(self, task: AgentTask) -> AgentResponse:
        """태스크 처리 메인 로직"""
        start_time = time.time()

        try:
            # 적절한 제공자 선택
            provider = self._select_provider(task)

            if provider is None:
                return AgentResponse(
                    task_id=task.id,
                    success=False,
                    content="",
                    metadata={},
                    error="사용 가능한 LLM 제공자가 없습니다",
                    execution_time=time.time() - start_time,
                )

            # 필요한 툴 선택
            available_tools = [
                self.tools[tool_name]
                for tool_name in task.tools
                if tool_name in self.tools
            ]

            # 프롬프트 구성
            prompt = self._build_prompt(task)

            if available_tools:
                # 툴과 함께 생성
                tool_schemas = [self._tool_to_schema(tool) for tool in available_tools]
                content, tool_calls = await provider.generate_with_tools(
                    prompt, tool_schemas
                )

                # 툴 실행
                tool_results = []
                for tool_call in tool_calls:
                    tool_name = tool_call.get("function", {}).get("name")
                    if tool_name in self.tools:
                        result = await self.tools[tool_name].execute(
                            **tool_call.get("function", {}).get("arguments", {})
                        )
                        tool_results.append(result)

                metadata = {
                    "tool_calls": len(tool_calls),
                    "tool_results": tool_results,
                    "provider": provider.get_model_info(),
                }
            else:
                # 일반 생성
                content = await provider.generate(prompt)
                metadata = {"provider": provider.get_model_info()}

            execution_time = time.time() - start_time

            return AgentResponse(
                task_id=task.id,
                success=True,
                content=content,
                metadata=metadata,
                execution_time=execution_time,
            )

        except Exception as e:
            logger.error(f"태스크 처리 실패: {e}")
            return AgentResponse(
                task_id=task.id,
                success=False,
                content="",
                metadata={},
                error=str(e),
                execution_time=time.time() - start_time,
            )

    def _select_provider(self, task: AgentTask) -> Optional[BaseProvider]:
        """태스크에 적합한 제공자 선택"""

        # 코드 생성은 GLM 우선
        if task.type == TaskType.CODE_GENERATION and "glm" in self.providers:
            return self.providers["glm"]

        # 에이전트 타입 명시적 지정
        if task.agent_type == AgentType.LOCAL and "ollama" in self.providers:
            return self.providers["ollama"]
        elif task.agent_type == AgentType.CLOUD and "openai" in self.providers:
            return self.providers["openai"]

        # 기본 전략: 로컬 우선
        return (
            self.providers.get("ollama")
            or self.providers.get("openai")
            or self.providers.get("glm")
        )

    def _build_prompt(self, task: AgentTask) -> str:
        """태스크 기반 프롬프트 구성"""

        base_prompt = f"""당신은 MetaLife OS의 통합 AI 에이전트입니다.

태스크 유형: {task.type.value}
설명: {task.description}

컨텍스트: {json.dumps(task.context, ensure_ascii=False, indent=2)}

요청사항을 완수하기 위한 구체적인 단계와 결과물을 제공해주세요.
"""
        return base_prompt

    def _tool_to_schema(self, tool: BaseTool) -> Dict[str, Any]:
        """툴을 스키마로 변환"""
        return {
            "type": "function",
            "function": {
                "name": tool.name,
                "description": tool.description,
                "parameters": {"type": "object", "properties": {}, "required": []},
            },
        }

    async def run_chat_mode(self):
        """인터랙티브 채팅 모드"""
        print("🤖 MetaLife OS AI 에이전트 대화 모드")
        print("종료하려면 'quit', 'exit', '종료'를 입력하세요")
        print("-" * 50)

        self.running = True

        while self.running:
            try:
                user_input = input("\n💬 입력: ").strip()

                if user_input.lower() in ["quit", "exit", "종료"]:
                    print("👋 안녕히 가세요!")
                    break

                # 태스크 생성
                task = AgentTask(
                    id=f"chat_{int(time.time())}",
                    type=TaskType.RESEARCH,  # 기본 리서치 타입
                    description=user_input,
                    context={"mode": "chat"},
                    tools=["web_browser"],  # 기본 웹 브라우징 활성화
                )

                print("🔄 처리 중...")
                response = await self.process_task(task)

                if response.success:
                    print(f"\n🤖 응답 ({response.execution_time:.2f}초):")
                    print(response.content)

                    if response.metadata.get("tool_results"):
                        print("\n🔧 툴 실행 결과:")
                        for result in response.metadata["tool_results"]:
                            print(f"  - {result}")
                else:
                    print(f"\n❌ 오류: {response.error}")

            except KeyboardInterrupt:
                print("\n👋 안녕히 가세요!")
                break
            except Exception as e:
                print(f"\n❌ 예상치 못한 오류: {e}")

    async def start_worker(self):
        """백그라운드 워커 모드"""
        print("🔄 MetaLife OS 백그라운드 워커 시작")
        self.running = True

        while self.running:
            try:
                # 큐에서 태스크 대기
                task = await asyncio.wait_for(self.task_queue.get(), timeout=1.0)

                print(f"📝 태스크 처리: {task.description}")
                response = await self.process_task(task)

                if response.success:
                    print(f"✅ 태스크 완료: {response.execution_time:.2f}초")
                else:
                    print(f"❌ 태스크 실패: {response.error}")

                self.task_queue.task_done()

            except asyncio.TimeoutError:
                continue
            except Exception as e:
                print(f"❌ 워커 오류: {e}")

    def add_task(self, task: AgentTask):
        """태스크 큐에 추가"""
        asyncio.create_task(self.task_queue.put(task))

    def stop(self):
        """에이전트 중지"""
        self.running = False


# 편의 함수
def create_agent(config_file: str = "config.json") -> MetaLifeAgent:
    """설정 파일로 에이전트 생성"""
    try:
        with open(config_file, "r", encoding="utf-8") as f:
            config = json.load(f)
    except FileNotFoundError:
        # 기본 설정
        config = {
            "ollama_enabled": True,
            "headless_browser": True,
            "stealth_mode": True,
        }

    return MetaLifeAgent(config)


async def main():
    """메인 함수"""
    import argparse
    import os

    parser = argparse.ArgumentParser(description="MetaLife OS AI 에이전트")
    parser.add_argument("--mode", choices=["chat", "worker"], default="chat")
    parser.add_argument("--config", default="agent_config.json")
    args = parser.parse_args()

    # 환경 변수 로드
    config = {
        "openai_api_key": os.getenv("OPENAI_API_KEY"),
        "zai_api_key": os.getenv("ZAI_API_KEY"),
        "github_token": os.getenv("GITHUB_TOKEN"),
        "ollama_enabled": os.getenv("OLLAMA_ENABLED", "true").lower() == "true",
        "headless_browser": os.getenv("HEADLESS_BROWSER", "true").lower() == "true",
        "stealth_mode": os.getenv("STEALTH_MODE", "true").lower() == "true",
        "ollama_url": os.getenv("OLLAMA_URL", "http://localhost:11434"),
        "ollama_model": os.getenv("OLLAMA_MODEL", "deepseek-r1:14b"),
    }

    agent = MetaLifeAgent(config)

    if args.mode == "chat":
        await agent.run_chat_mode()
    else:
        await agent.start_worker()


if __name__ == "__main__":
    asyncio.run(main())
