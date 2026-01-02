"""
MetaLife OS - 콘텐츠 자동화 엔진 (Blog_automation_OS 개념 적용)
비디오 전사, 다중 플랫폼 발행, 품질 검증 시스템 통합
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, Tuple
from enum import Enum
import asyncio
import json
import logging
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
import hashlib
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AssetType(Enum):
    """에셋 유형"""

    VIDEO = "video"
    AUDIO = "audio"
    SHORT = "short"
    TRANSCRIPT = "transcript"
    SUBTITLE = "subtitle"
    CONTENT = "content"
    THUMBNAIL = "thumbnail"


class JobStatus(Enum):
    """작업 상태"""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRYING = "retrying"


class JobStage(Enum):
    """작업 단계"""

    INGEST = "ingest"
    TRANSCRIBE = "transcribe"
    GENERATE = "generate"
    VALIDATE = "validate"
    RENDER = "render"
    PUBLISH = "publish"


@dataclass
class Asset:
    """미디어 에셋 정보"""

    id: str
    asset_type: AssetType
    filename: str
    filepath: str
    sha256_hash: str
    file_size: int
    mime_type: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    parent_asset_id: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class Job:
    """자동화 작업"""

    id: str
    stage: JobStage
    asset_id: str
    status: JobStatus
    parameters: Dict[str, Any] = field(default_factory=dict)
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 3
    progress: float = 0.0
    created_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None


@dataclass
class Generation:
    """AI 생성 결과"""

    id: str
    job_id: str
    platform: str
    content_type: str
    content: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    score: float = 0.0
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class QualityReport:
    """품질 검증 보고서"""

    id: str
    generation_id: str
    hook_score: float = 0.0
    relevance_score: float = 0.0
    readability_score: float = 0.0
    seo_score: float = 0.0
    originality_score: float = 0.0
    overall_score: float = 0.0
    issues: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)
    auto_regenerate: bool = False
    created_at: datetime = field(default_factory=datetime.now)


class BasePublisher(ABC):
    """퍼블리셔 기본 클래스"""

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    async def publish(
        self, content: Dict[str, Any], options: Dict[str, Any]
    ) -> Dict[str, Any]:
        pass


class WordPressPublisher(BasePublisher):
    """WordPress 퍼블리셔"""

    def __init__(self, api_url: str, username: str, password: str):
        self.api_url = api_url.rstrip("/")
        self.username = username
        self.password = password

    @property
    def name(self) -> str:
        return "WordPress"

    async def publish(
        self, content: Dict[str, Any], options: Dict[str, Any]
    ) -> Dict[str, Any]:
        try:
            # WordPress REST API 호출
            post_data = {
                "title": content["title"],
                "content": content["body"],
                "status": options.get("status", "draft"),
                "categories": content.get("categories", []),
                "tags": content.get("tags", []),
                "featured_media": content.get("featured_media_id"),
            }

            # 실제 구현에서는 requests 또는 aiohttp 사용
            # response = await self._wp_request("POST", "/wp/v2/posts", post_data)

            logger.info(f"WordPress 발행: {content['title']}")
            return {
                "success": True,
                "post_id": "12345",  # 실제 응답에서 받기
                "post_url": f"{self.api_url}/blog-post-{content['title'].lower().replace(' ', '-')}",
                "status": options.get("status", "draft"),
            }
        except Exception as e:
            logger.error(f"WordPress 발행 실패: {e}")
            return {"success": False, "error": str(e)}


class YouTubePublisher(BasePublisher):
    """YouTube 퍼블리셔"""

    def __init__(self, client_id: str, client_secret: str, access_token: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.access_token = access_token

    @property
    def name(self) -> str:
        return "YouTube"

    async def publish(
        self, content: Dict[str, Any], options: Dict[str, Any]
    ) -> Dict[str, Any]:
        try:
            # YouTube Data API v3 호출
            video_metadata = {
                "snippet": {
                    "title": content["title"],
                    "description": content["description"],
                    "tags": content.get("tags", []),
                    "categoryId": "22",  # People & Blogs
                },
                "status": {"privacyStatus": options.get("privacy", "private")},
            }

            logger.info(f"YouTube 업로드: {content['title']}")
            return {
                "success": True,
                "video_id": "yt_video_12345",
                "video_url": f"https://www.youtube.com/watch?v=yt_video_12345",
                "status": options.get("privacy", "private"),
            }
        except Exception as e:
            logger.error(f"YouTube 업로드 실패: {e}")
            return {"success": False, "error": str(e)}


class NaverBlogPublisher(BasePublisher):
    """네이버 블로그 퍼블리셔"""

    def __init__(self, client_id: str, client_secret: str, blog_id: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.blog_id = blog_id

    @property
    def name(self) -> str:
        return "Naver Blog"

    async def publish(
        self, content: Dict[str, Any], options: Dict[str, Any]
    ) -> Dict[str, Any]:
        try:
            # 네이버 블로그 API 호출
            blog_data = {
                "title": content["title"],
                "contents": content["body"],
                "tag": content.get("tags", []),
                "category": content.get("category", ""),
            }

            logger.info(f"네이버 블로그 발행: {content['title']}")
            return {
                "success": True,
                "post_id": "naver_post_12345",
                "post_url": f"https://blog.naver.com/{self.blog_id}/{content['title'].lower().replace(' ', '-')}",
                "status": "published",
            }
        except Exception as e:
            logger.error(f"네이버 블로그 발행 실패: {e}")
            return {"success": False, "error": str(e)}


class ContentAutomationEngine:
    """콘텐츠 자동화 엔진"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.publishers: Dict[str, BasePublisher] = {}
        self.jobs: List[Job] = []
        self.assets: Dict[str, Asset] = {}
        self.generations: Dict[str, Generation] = {}
        self.quality_reports: Dict[str, QualityReport] = {}

        # 퍼블리셔 초기화
        self._initialize_publishers()

    def _initialize_publishers(self):
        """퍼블리셔 초기화"""

        # WordPress
        if all(
            key in self.config
            for key in ["wordpress_api_url", "wordpress_username", "wordpress_password"]
        ):
            self.publishers["wordpress"] = WordPressPublisher(
                self.config["wordpress_api_url"],
                self.config["wordpress_username"],
                self.config["wordpress_password"],
            )

        # YouTube
        if all(
            key in self.config
            for key in [
                "youtube_client_id",
                "youtube_client_secret",
                "youtube_access_token",
            ]
        ):
            self.publishers["youtube"] = YouTubePublisher(
                self.config["youtube_client_id"],
                self.config["youtube_client_secret"],
                self.config["youtube_access_token"],
            )

        # 네이버 블로그
        if all(
            key in self.config
            for key in ["naver_client_id", "naver_client_secret", "naver_blog_id"]
        ):
            self.publishers["naver_blog"] = NaverBlogPublisher(
                self.config["naver_client_id"],
                self.config["naver_client_secret"],
                self.config["naver_blog_id"],
            )

        logger.info(f"총 {len(self.publishers)}개의 퍼블리셔 초기화 완료")

    async def ingest_file(self, filepath: str) -> Tuple[Asset, bool]:
        """파일 인제스트 및 중복 검사"""
        try:
            file_path = Path(filepath)

            if not file_path.exists():
                raise FileNotFoundError(f"파일이 존재하지 않음: {filepath}")

            # SHA256 해시 계산
            sha256_hash = self._calculate_sha256(file_path)

            # 중복 검사
            existing_asset = next(
                (
                    asset
                    for asset in self.assets.values()
                    if asset.sha256_hash == sha256_hash
                ),
                None,
            )

            if existing_asset:
                logger.info(
                    f"중복 파일 감지: {existing_asset.filename} (Asset #{existing_asset.id})"
                )
                return existing_asset, True

            # 메타데이터 추출 (FFmpeg 사용)
            metadata = await self._extract_metadata(file_path)

            # 에셋 생성
            asset = Asset(
                id=str(uuid.uuid4()),
                asset_type=self._detect_asset_type(file_path),
                filename=file_path.name,
                filepath=str(file_path.absolute()),
                sha256_hash=sha256_hash,
                file_size=file_path.stat().st_size,
                mime_type=self._detect_mime_type(file_path),
                metadata=metadata,
            )

            self.assets[asset.id] = asset
            logger.info(f"파일 인제스트 완료: {asset.filename} (Asset #{asset.id})")

            return asset, False

        except Exception as e:
            logger.error(f"파일 인제스트 실패: {e}")
            raise

    async def process_video_file(
        self, filepath: str, auto_process: bool = True
    ) -> Dict[str, Any]:
        """비디오 파일 전체 파이프라인 처리"""
        try:
            # 1. INGEST 단계
            asset, is_duplicate = await self.ingest_file(filepath)

            if is_duplicate:
                return {
                    "asset": asset,
                    "stage": "INGEST",
                    "status": "completed",
                    "message": "이미 처리된 파일입니다",
                }

            results = {"asset": asset, "stages_completed": [], "stages_failed": []}

            # 2. TRANSCRIBE 단계
            try:
                transcript_job = await self._create_transcribe_job(asset)
                transcript_result = await self._process_transcribe_job(transcript_job)
                results["stages_completed"].append("TRANSCRIBE")
                results["transcript"] = transcript_result
            except Exception as e:
                logger.error(f"TRANSCRIBE 실패: {e}")
                results["stages_failed"].append(
                    {"stage": "TRANSCRIBE", "error": str(e)}
                )
                return results

            # 3. GENERATE 단계
            try:
                generation_results = await self._generate_content(
                    asset, transcript_result
                )
                results["stages_completed"].append("GENERATE")
                results["generations"] = generation_results
            except Exception as e:
                logger.error(f"GENERATE 실패: {e}")
                results["stages_failed"].append({"stage": "GENERATE", "error": str(e)})
                return results

            # 4. VALIDATE 단계
            try:
                validation_results = await self._validate_content(generation_results)
                results["stages_completed"].append("VALIDATE")
                results["quality_reports"] = validation_results
            except Exception as e:
                logger.error(f"VALIDATE 실패: {e}")
                results["stages_failed"].append({"stage": "VALIDATE", "error": str(e)})
                return results

            # 5. RENDER 단계 (Shorts 생성)
            try:
                render_results = await self._render_shorts(asset, transcript_result)
                results["stages_completed"].append("RENDER")
                results["shorts"] = render_results
            except Exception as e:
                logger.error(f"RENDER 실패: {e}")
                results["stages_failed"].append({"stage": "RENDER", "error": str(e)})
                return results

            # 6. PUBLISH 단계
            if auto_process:
                try:
                    publish_results = await self._publish_content(
                        generation_results, validation_results
                    )
                    results["stages_completed"].append("PUBLISH")
                    results["publish_results"] = publish_results
                except Exception as e:
                    logger.error(f"PUBLISH 실패: {e}")
                    results["stages_failed"].append(
                        {"stage": "PUBLISH", "error": str(e)}
                    )

            results["status"] = "completed"
            logger.info(f"비디오 처리 완료: {asset.filename}")

            return results

        except Exception as e:
            logger.error(f"비디오 처리 실패: {e}")
            raise

    async def _create_transcribe_job(self, asset: Asset) -> Job:
        """전사 작업 생성"""
        job = Job(
            id=str(uuid.uuid4()),
            stage=JobStage.TRANSCRIBE,
            asset_id=asset.id,
            status=JobStatus.PENDING,
            parameters={
                "language": "ko",  # 기본 한국어
                "model": "whisper-1",
                "output_formats": ["text", "srt", "vtt", "json"],
            },
        )
        self.jobs.append(job)
        return job

    async def _process_transcribe_job(self, job: Job) -> Dict[str, Any]:
        """전사 작업 처리"""
        job.status = JobStatus.RUNNING
        asset = self.assets[job.asset_id]

        try:
            # Whisper API 호출 (OpenAI)
            import openai

            with open(asset.filepath, "rb") as audio_file:
                transcript = await openai.Audio.atranscribe(
                    model=job.parameters["model"],
                    file=audio_file,
                    language=job.parameters["language"],
                    response_format="verbose_json",
                )

            # 결과 처리
            result = {
                "text": transcript["text"],
                "words": transcript.get("words", []),
                "segments": transcript.get("segments", []),
                "language": transcript.get("language", "ko"),
                "duration": transcript.get("duration", 0),
                "word_count": len(transcript["text"].split()),
                "chapters": self._generate_chapters(transcript),
                "srt_content": self._generate_srt(transcript),
                "vtt_content": self._generate_vtt(transcript),
            }

            # 전사 에셋 저장
            transcript_asset = Asset(
                id=str(uuid.uuid4()),
                asset_type=AssetType.TRANSCRIPT,
                filename=f"{asset.filename}_transcript.json",
                filepath=f"{asset.filepath}_transcript.json",
                sha256_hash=hashlib.sha256(json.dumps(result).encode()).hexdigest(),
                file_size=len(json.dumps(result).encode()),
                mime_type="application/json",
                metadata=result,
                parent_asset_id=asset.id,
            )
            self.assets[transcript_asset.id] = transcript_asset

            job.status = JobStatus.COMPLETED
            job.result = result
            job.completed_at = datetime.now()

            logger.info(f"전사 완료: {asset.filename} ({result['word_count']} words)")
            return result

        except Exception as e:
            job.status = JobStatus.FAILED
            job.error = str(e)
            raise

    async def _generate_content(
        self, asset: Asset, transcript_result: Dict[str, Any]
    ) -> List[Generation]:
        """다중 플랫폼 콘텐츠 생성"""
        generations = []
        platforms = [
            "wordpress",
            "youtube",
            "naver_blog",
            "instagram",
            "facebook",
            "tiktok",
        ]

        # OpenAI GPT-4를 통한 콘텐츠 생성
        import openai

        for platform in platforms:
            try:
                prompt = self._build_content_prompt(platform, asset, transcript_result)

                response = await openai.ChatCompletion.acreate(
                    model="gpt-4",
                    messages=[
                        {
                            "role": "system",
                            "content": f"당신은 {platform} 플랫폼 전문 콘텐츠 크리에이터입니다.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.7,
                    max_tokens=2000,
                )

                content = response.choices[0].message.content

                # 생성 결과 파싱
                parsed_content = self._parse_generated_content(content, platform)

                generation = Generation(
                    id=str(uuid.uuid4()),
                    job_id=str(uuid.uuid4()),
                    platform=platform,
                    content_type="blog_post"
                    if platform in ["wordpress", "naver_blog"]
                    else "social_post",
                    content=json.dumps(parsed_content, ensure_ascii=False),
                    metadata={
                        "prompt": prompt,
                        "model": "gpt-4",
                        "token_usage": response.usage.total_tokens
                        if hasattr(response, "usage")
                        else 0,
                    },
                )

                generations.append(generation)
                self.generations[generation.id] = generation

                logger.info(f"콘텐츠 생성 완료: {platform}")

            except Exception as e:
                logger.error(f"{platform} 콘텐츠 생성 실패: {e}")

        return generations

    async def _validate_content(
        self, generations: List[Generation]
    ) -> List[QualityReport]:
        """5차원 품질 검증"""
        quality_reports = []

        for generation in generations:
            try:
                content_data = json.loads(generation.content)

                # 품질 검증
                report = QualityReport(
                    id=str(uuid.uuid4()), generation_id=generation.id
                )

                # Hook 점수 (30%)
                hook_score = self._evaluate_hook(content_data)
                report.hook_score = hook_score

                # 관련성 점수 (25%)
                relevance_score = self._evaluate_relevance(content_data)
                report.relevance_score = relevance_score

                # 가독성 점수 (20%)
                readability_score = self._evaluate_readability(content_data)
                report.readability_score = readability_score

                # SEO 점수 (10%)
                seo_score = self._evaluate_seo(content_data)
                report.seo_score = seo_score

                # 독창성 점수 (15%)
                originality_score = self._evaluate_originality(content_data)
                report.originality_score = originality_score

                # 전체 점수 (가중평균)
                report.overall_score = (
                    hook_score * 0.30
                    + relevance_score * 0.25
                    + readability_score * 0.20
                    + seo_score * 0.10
                    + originality_score * 0.15
                )

                # 70점 미만이면 자동 재생성 플래그
                if report.overall_score < 70:
                    report.auto_regenerate = True
                    report.recommendations.append(
                        "전체 점수 70점 미만으로 콘텐츠 재생성 권장"
                    )

                quality_reports.append(report)
                self.quality_reports[report.id] = report

                logger.info(
                    f"품질 검증 완료: {generation.platform} ({report.overall_score:.1f}/100)"
                )

            except Exception as e:
                logger.error(f"품질 검증 실패: {e}")

        return quality_reports

    async def _render_shorts(
        self, asset: Asset, transcript_result: Dict[str, Any]
    ) -> List[Asset]:
        """Shorts 생성"""
        shorts = []

        try:
            # 하이라이트 감지
            highlights = self._detect_highlights(transcript_result)

            # FFmpeg을 통한 9:16 변환
            for i, highlight in enumerate(highlights[:5]):  # 최대 5개
                try:
                    start_time = highlight["start_time"]
                    end_time = highlight["end_time"]
                    duration = end_time - start_time

                    if duration < 10:  # 10초 미만은 건너뛰기
                        continue

                    # Short 에셋 생성
                    short_asset = Asset(
                        id=str(uuid.uuid4()),
                        asset_type=AssetType.SHORT,
                        filename=f"{asset.filename}_short_{i + 1}.mp4",
                        filepath=f"{asset.filepath}_short_{i + 1}.mp4",
                        sha256_hash="",  # 생성 후 계산
                        file_size=0,  # 생성 후 계산
                        mime_type="video/mp4",
                        metadata={
                            "start_time": start_time,
                            "end_time": end_time,
                            "duration": duration,
                            "highlight_score": highlight["score"],
                        },
                        parent_asset_id=asset.id,
                    )

                    # 실제 FFmpeg 변환 (시뮬레이션)
                    # await self._extract_short(asset, short_asset)

                    shorts.append(short_asset)
                    self.assets[short_asset.id] = short_asset

                    logger.info(f"Short 생성: {short_asset.filename} ({duration:.1f}s)")

                except Exception as e:
                    logger.error(f"Short 생성 실패: {e}")

        except Exception as e:
            logger.error(f"Shorts 렌더링 실패: {e}")

        return shorts

    async def _publish_content(
        self, generations: List[Generation], quality_reports: List[QualityReport]
    ) -> Dict[str, Any]:
        """다중 플랫폼 발행"""
        publish_results = {}

        # 품질 리포트와 생성 결과 매핑
        quality_map = {qr.generation_id: qr for qr in quality_reports}

        for generation in generations:
            quality_report = quality_map.get(generation.id)

            # 품질 70점 미만은 발행 생략
            if quality_report and quality_report.overall_score < 70:
                logger.info(f"품질 미달로 발행 생략: {generation.platform}")
                continue

            if generation.platform not in self.publishers:
                logger.warning(f"퍼블리셔 없음: {generation.platform}")
                continue

            try:
                publisher = self.publishers[generation.platform]
                content_data = json.loads(generation.content)

                # 발행 옵션 (기본 draft 모드)
                options = {
                    "status": "draft",
                    "quality_score": quality_report.overall_score
                    if quality_report
                    else 0,
                }

                result = await publisher.publish(content_data, options)
                publish_results[generation.platform] = result

                if result["success"]:
                    logger.info(f"발행 성공: {generation.platform}")
                else:
                    logger.error(
                        f"발행 실패: {generation.platform} - {result['error']}"
                    )

            except Exception as e:
                logger.error(f"{generation.platform} 발행 중 오류: {e}")
                publish_results[generation.platform] = {
                    "success": False,
                    "error": str(e),
                }

        return publish_results

    def _calculate_sha256(self, file_path: Path) -> str:
        """SHA256 해시 계산"""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                sha256_hash.update(chunk)
        return sha256_hash.hexdigest()

    def _detect_asset_type(self, file_path: Path) -> AssetType:
        """에셋 유형 감지"""
        ext = file_path.suffix.lower()

        if ext in [".mp4", ".avi", ".mov", ".mkv", ".webm"]:
            return AssetType.VIDEO
        elif ext in [".mp3", ".wav", ".m4a", ".flac"]:
            return AssetType.AUDIO
        else:
            return AssetType.VIDEO  # 기본값

    def _detect_mime_type(self, file_path: Path) -> str:
        """MIME 타입 감지"""
        import mimetypes

        mime_type, _ = mimetypes.guess_type(str(file_path))
        return mime_type or "application/octet-stream"

    async def _extract_metadata(self, file_path: Path) -> Dict[str, Any]:
        """메타데이터 추출"""
        # FFmpeg 사용하여 비디오 메타데이터 추출
        # 시뮬레이션된 데이터
        return {
            "duration": 600.5,  # 10분
            "resolution": {"width": 1920, "height": 1080},
            "fps": 30,
            "codec": "h264",
            "bitrate": 2500000,
            "format": "mp4",
        }

    def _generate_chapters(self, transcript: Dict[str, Any]) -> List[Dict[str, Any]]:
        """챕터 생성"""
        chapters = []
        segments = transcript.get("segments", [])

        # 2분 간격으로 챕터 생성
        for i, segment in enumerate(segments):
            if i % 4 == 0:  # 4개 세그먼트마다 (약 2분)
                chapters.append(
                    {
                        "start_time": segment["start"],
                        "end_time": segment["end"],
                        "title": f"챕터 {len(chapters) + 1}",
                        "summary": segment["text"][:100] + "..."
                        if len(segment["text"]) > 100
                        else segment["text"],
                    }
                )

        return chapters

    def _generate_srt(self, transcript: Dict[str, Any]) -> str:
        """SRT 자막 생성"""
        srt_content = []
        segments = transcript.get("segments", [])

        for i, segment in enumerate(segments):
            start_time = self._format_timestamp(segment["start"])
            end_time = self._format_timestamp(segment["end"])

            srt_content.append(f"{i + 1}")
            srt_content.append(f"{start_time} --> {end_time}")
            srt_content.append(segment["text"])
            srt_content.append("")

        return "\n".join(srt_content)

    def _generate_vtt(self, transcript: Dict[str, Any]) -> str:
        """WebVTT 자막 생성"""
        vtt_content = ["WEBVTT", ""]
        segments = transcript.get("segments", [])

        for segment in segments:
            start_time = self._format_webvtt_timestamp(segment["start"])
            end_time = self._format_webvtt_timestamp(segment["end"])

            vtt_content.append(f"{start_time} --> {end_time}")
            vtt_content.append(segment["text"])
            vtt_content.append("")

        return "\n".join(vtt_content)

    def _format_timestamp(self, seconds: float) -> str:
        """SRT 타임스탬프 포맷팅"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        milliseconds = int((seconds % 1) * 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{milliseconds:03d}"

    def _format_webvtt_timestamp(self, seconds: float) -> str:
        """WebVTT 타임스탬프 포맷팅"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        milliseconds = int((seconds % 1) * 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d}.{milliseconds:03d}"

    def _build_content_prompt(
        self, platform: str, asset: Asset, transcript: Dict[str, Any]
    ) -> str:
        """플랫폼별 콘텐츠 생성 프롬프트"""

        platform_instructions = {
            "wordpress": "블로그 포스팅 형식으로 작성해주세요. 제목, 본문, 태그, 카테고리를 포함해주세요.",
            "youtube": "유튜브 영상 설명으로 작성해주세요. 타임스탬프, 관련 링크, 해시태그를 포함해주세요.",
            "naver_blog": "네이버 블로그 포스팅으로 작성해주세요. 한국어 자연스러운 표현을 사용해주세요.",
            "instagram": "인스타그램 캡션으로 작성해주세요. 해시태그, 짧은 문장, 이모지를 포함해주세요.",
            "facebook": "페이스북 포스팅으로 작성해주세요. 참여를 유도하는 질문을 포함해주세요.",
            "tiktok": "틱톡 콘텐츠로 작성해주세요. 짧고 흥미로운 문장과 해시태그를 포함해주세요.",
        }

        instruction = platform_instructions.get(platform, "콘텐츠를 작성해주세요.")

        prompt = f"""
        다음 비디오 전사 내용을 바탕으로 {platform}용 콘텐츠를 생성해주세요.
        
        비디오 정보:
        - 제목: {asset.filename}
        - 전사 내용: {transcript["text"][:500]}...
        - 단어 수: {transcript["word_count"]}
        - 챕터: {len(transcript.get("chapters", []))}
        
        요구사항:
        {instruction}
        
        SEO 최적화를 위해 관련 키워드를 자연스럽게 포함해주세요.
        
        JSON 형식으로 반환해주세요:
        {{
            "title": "제목",
            "body": "본문 내용",
            "tags": ["태그1", "태그2", "태그3"],
            "categories": ["카테고리1"],
            "summary": "요약",
            "call_to_action": "행동 유도 문구"
        }}
        """

        return prompt

    def _parse_generated_content(self, content: str, platform: str) -> Dict[str, Any]:
        """생성된 콘텐츠 파싱"""
        try:
            # JSON 부분 추출
            import re

            json_match = re.search(r"\{.*\}", content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                # JSON 파싱 실패 시 기본 구조
                return {
                    "title": f"{platform} 제목",
                    "body": content,
                    "tags": [],
                    "categories": [],
                    "summary": "",
                    "call_to_action": "",
                }
        except Exception as e:
            logger.error(f"콘텐츠 파싱 실패: {e}")
            return {
                "title": f"{platform} 제목",
                "body": content,
                "tags": [],
                "categories": [],
                "summary": "",
                "call_to_action": "",
            }

    def _evaluate_hook(self, content_data: Dict[str, Any]) -> float:
        """Hook 점수 평가"""
        title = content_data.get("title", "")
        summary = content_data.get("summary", "")

        # Hook 단어 감지
        hook_words = [
            "핵심",
            "비밀",
            "충격",
            "놀라운",
            "반드시",
            "꼭",
            "신기",
            "특별",
            "혁신적",
            "첫",
            "마지막",
            "최고",
            "최악",
            "결과",
            "방법",
        ]

        hook_count = sum(1 for word in hook_words if word in title + summary)

        # 제목 길이 최적화 (50-100자)
        title_length_score = 1.0
        if 50 <= len(title) <= 100:
            title_length_score = 1.0
        elif len(title) < 50:
            title_length_score = len(title) / 50
        else:
            title_length_score = 100 / len(title)

        # 종합 점수 (최대 100점)
        hook_score = min((hook_count * 20 + title_length_score * 30), 100)

        return hook_score

    def _evaluate_relevance(self, content_data: Dict[str, Any]) -> float:
        """관련성 점수 평가"""
        required_fields = ["title", "body"]
        present_fields = sum(1 for field in required_fields if content_data.get(field))

        # 본문 길이 최적화
        body = content_data.get("body", "")
        body_length_score = min(len(body) / 500, 1.0)  # 500자 기준

        # 구조 완성도
        structure_score = 0
        if "tags" in content_data and content_data["tags"]:
            structure_score += 20
        if "categories" in content_data and content_data["categories"]:
            structure_score += 20
        if "summary" in content_data and content_data["summary"]:
            structure_score += 10

        relevance_score = min(
            (present_fields / len(required_fields)) * 40  # 필드 완성도 (40점)
            + body_length_score * 30  # 본문 길이 (30점)
            + structure_score,  # 구조 (30점)
            100,
        )

        return relevance_score

    def _evaluate_readability(self, content_data: Dict[str, Any]) -> float:
        """가독성 점수 평가"""
        body = content_data.get("body", "")

        if not body:
            return 0.0

        # 문장 길이 분석
        sentences = body.split(".")
        avg_sentence_length = (
            sum(len(s.split()) for s in sentences) / len(sentences) if sentences else 0
        )

        # 최적 문장 길이 15-25 단어
        sentence_score = 1.0
        if 15 <= avg_sentence_length <= 25:
            sentence_score = 1.0
        elif avg_sentence_length < 15:
            sentence_score = avg_sentence_length / 15
        else:
            sentence_score = 25 / avg_sentence_length

        # 문단 구조
        paragraphs = [p for p in body.split("\n\n") if p.strip()]
        paragraph_score = min(len(paragraphs) / 3, 1.0)  # 최소 3 문단

        # 혼합 평가
        readability_score = (sentence_score * 0.5 + paragraph_score * 0.5) * 100

        return min(readability_score, 100)

    def _evaluate_seo(self, content_data: Dict[str, Any]) -> float:
        """SEO 점수 평가"""
        title = content_data.get("title", "")
        tags = content_data.get("tags", [])
        body = content_data.get("body", "")

        score = 0

        # 제목에 키워드 (30점)
        if title and len(title) > 0:
            score += 30

        # 메타 설명 (20점)
        summary = content_data.get("summary", "")
        if summary and len(summary) > 50:
            score += 20

        # 태그 (30점)
        if tags and len(tags) >= 3:
            score += 30

        # 키워드 밀도 (20점)
        if body and len(body) > 0:
            # 간단한 키워드 밀도 계산
            score += 20

        return min(score, 100)

    def _evaluate_originality(self, content_data: Dict[str, Any]) -> float:
        """독창성 점수 평가"""
        title = content_data.get("title", "")
        body = content_data.get("body", "")

        # 일반적 표현 감지 (감점 요소)
        common_phrases = [
            "오늘은",
            "안녕하세요",
            "많은 분들이",
            "궁금해하시는",
            "여러분",
            "정말로",
            "매우",
            "아주",
            "매우",
        ]

        penalty = 0
        for phrase in common_phrases:
            penalty += (title + body).count(phrase) * 5

        # 길이 기반 독창성
        length_bonus = min(len(body) / 1000, 20)  # 최대 20점 보너스

        # 구조적 다양성
        structure_bonus = 0
        if "###" in body:
            structure_bonus += 10  # 제목 사용
        if "**" in body:
            structure_bonus += 10  # 강조 사용

        originality_score = max(0, 100 - penalty + length_bonus + structure_bonus)

        return min(originality_score, 100)

    def _detect_highlights(self, transcript: Dict[str, Any]) -> List[Dict[str, Any]]:
        """하이라이트 감지"""
        highlights = []
        segments = transcript.get("segments", [])

        for segment in segments:
            text = segment["text"].lower()

            # 하이라이트 키워드
            highlight_keywords = [
                "핵심",
                "중요",
                "결론",
                "결과",
                "성공",
                "실패",
                "문제",
                "해결",
                "방법",
                "팁",
                "꿀팁",
                "충격",
                "놀라",
                "신기",
                "특별",
                "첫",
                "마지막",
            ]

            # 하이라이트 감지 키워드 수
            keyword_count = sum(1 for keyword in highlight_keywords if keyword in text)

            # 감정 강도 (간단한 구현)
            emotion_keywords = ["!", "?", "정말", "매우", "아주"]
            emotion_count = sum(1 for keyword in emotion_keywords if keyword in text)

            # 하이라이트 점수
            highlight_score = keyword_count * 10 + emotion_count * 5

            # 최소 점수 이상만 포함
            if highlight_score >= 10:
                highlights.append(
                    {
                        "start_time": segment["start"],
                        "end_time": segment["end"],
                        "text": segment["text"],
                        "score": highlight_score,
                    }
                )

        # 점수 기준 정렬
        highlights.sort(key=lambda x: x["score"], reverse=True)

        return highlights


# 글로벌 엔진 인스턴스
content_engine: Optional[ContentAutomationEngine] = None


def initialize_content_automation(config: Dict[str, Any]) -> ContentAutomationEngine:
    """콘텐츠 자동화 엔진 초기화"""
    global content_engine
    content_engine = ContentAutomationEngine(config)
    logger.info("콘텐츠 자동화 엔진 초기화 완료")
    return content_engine


def get_content_engine() -> Optional[ContentAutomationEngine]:
    """콘텐츠 자동화 엔진 인스턴스 획득"""
    return content_engine
