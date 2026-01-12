"""
MetaLife OS - Google AI Studio (Gemini) Provider
Google Gemini API를 사용한 LLM 제공자 구현
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional, Tuple
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


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


class GeminiProvider(BaseProvider):
    """
    Google AI Studio (Gemini) 제공자
    
    사용법:
        provider = GeminiProvider(api_key="your-api-key")
        response = await provider.generate("안녕하세요")
    """

    def __init__(
        self,
        api_key: str,
        model: str = "gemini-2.0-flash-exp",
        temperature: float = 0.7,
        max_tokens: int = 8192,
    ):
        self.api_key = api_key
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self._client = None
        self._initialized = False

    def _init_client(self):
        """Gemini 클라이언트 초기화 (지연 로딩)"""
        if self._initialized:
            return

        try:
            import google.generativeai as genai

            genai.configure(api_key=self.api_key)
            self._client = genai.GenerativeModel(
                model_name=self.model,
                generation_config={
                    "temperature": self.temperature,
                    "max_output_tokens": self.max_tokens,
                    "top_p": 0.95,
                    "top_k": 40,
                },
            )
            self._initialized = True
            logger.info(f"Gemini 클라이언트 초기화 완료: {self.model}")
        except ImportError:
            raise ImportError(
                "google-generativeai 패키지가 필요합니다. "
                "'pip install google-generativeai' 명령으로 설치하세요."
            )
        except Exception as e:
            logger.error(f"Gemini 클라이언트 초기화 실패: {e}")
            raise

    async def generate(self, prompt: str, **kwargs) -> str:
        """
        Gemini API로 텍스트 생성
        
        Args:
            prompt: 생성할 프롬프트
            **kwargs: 추가 옵션 (system_instruction 등)
        
        Returns:
            생성된 텍스트
        """
        self._init_client()

        try:
            # 시스템 지시사항 처리
            system_instruction = kwargs.get("system_instruction", "")
            if system_instruction:
                full_prompt = f"{system_instruction}\n\n{prompt}"
            else:
                full_prompt = prompt

            logger.info(f"Gemini 생성 요청: {len(full_prompt)} 문자")

            # 동기 호출을 비동기로 래핑
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, lambda: self._client.generate_content(full_prompt)
            )

            result = response.text
            logger.info(f"Gemini 응답 수신: {len(result)} 문자")
            return result

        except Exception as e:
            logger.error(f"Gemini 생성 실패: {e}")
            raise

    async def generate_with_tools(
        self, prompt: str, tools: List[Dict]
    ) -> Tuple[str, List[Dict]]:
        """
        도구 호출과 함께 텍스트 생성
        
        Args:
            prompt: 프롬프트
            tools: 사용 가능한 도구 목록
        
        Returns:
            (생성된 텍스트, 도구 호출 목록) 튜플
        """
        self._init_client()

        try:
            # 도구 스키마를 Gemini 형식으로 변환
            gemini_tools = self._convert_tools_to_gemini_format(tools)

            # 도구와 함께 생성 (현재는 기본 생성으로 대체)
            # Gemini의 function calling은 별도 구현 필요
            response = await self.generate(prompt)
            
            # TODO: 실제 도구 호출 파싱 구현
            tool_calls = []

            return response, tool_calls

        except Exception as e:
            logger.error(f"Gemini 도구 호출 생성 실패: {e}")
            raise

    def _convert_tools_to_gemini_format(self, tools: List[Dict]) -> List[Dict]:
        """OpenAI 형식 도구를 Gemini 형식으로 변환"""
        gemini_tools = []
        for tool in tools:
            if tool.get("type") == "function":
                func = tool.get("function", {})
                gemini_tools.append({
                    "name": func.get("name"),
                    "description": func.get("description"),
                    "parameters": func.get("parameters", {}),
                })
        return gemini_tools

    def get_model_info(self) -> Dict[str, Any]:
        """모델 정보 반환"""
        return {
            "provider": "google",
            "model": self.model,
            "capabilities": ["text", "code", "vision", "tools"],
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
        }

    async def generate_chat(
        self, messages: List[Dict[str, str]], **kwargs
    ) -> str:
        """
        채팅 형식으로 생성
        
        Args:
            messages: [{"role": "user/assistant", "content": "..."}] 형식
        
        Returns:
            생성된 응답
        """
        self._init_client()

        try:
            # 메시지를 Gemini 채팅 형식으로 변환
            chat = self._client.start_chat(history=[])
            
            # 이전 메시지 처리
            for msg in messages[:-1]:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if role == "user":
                    chat.send_message(content)
            
            # 마지막 메시지로 응답 생성
            last_message = messages[-1].get("content", "")
            
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, lambda: chat.send_message(last_message)
            )

            return response.text

        except Exception as e:
            logger.error(f"Gemini 채팅 생성 실패: {e}")
            raise

    async def count_tokens(self, text: str) -> int:
        """토큰 수 계산"""
        self._init_client()

        try:
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None, lambda: self._client.count_tokens(text)
            )
            return result.total_tokens
        except Exception as e:
            logger.error(f"토큰 계산 실패: {e}")
            # 대략적인 추정 (한글 기준)
            return len(text) // 2


# 편의 함수
def create_gemini_provider(
    api_key: Optional[str] = None,
    model: str = "gemini-2.0-flash-exp",
) -> GeminiProvider:
    """
    Gemini Provider 생성 헬퍼 함수
    
    Args:
        api_key: Google API 키 (없으면 환경변수에서 로드)
        model: 사용할 모델명
    
    Returns:
        GeminiProvider 인스턴스
    """
    import os

    if api_key is None:
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError(
                "GOOGLE_API_KEY 환경 변수가 설정되지 않았습니다. "
                "Google AI Studio에서 API 키를 발급받으세요."
            )

    return GeminiProvider(api_key=api_key, model=model)


# 테스트 코드
if __name__ == "__main__":
    import os

    async def test():
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("❌ GOOGLE_API_KEY 환경 변수를 설정해주세요")
            return

        provider = GeminiProvider(api_key=api_key)
        
        print("🧪 Gemini Provider 테스트")
        print("-" * 40)
        
        response = await provider.generate("안녕하세요! 간단히 자기소개 해주세요.")
        print(f"✅ 응답: {response[:200]}...")
        
        info = provider.get_model_info()
        print(f"📊 모델 정보: {info}")

    asyncio.run(test())
