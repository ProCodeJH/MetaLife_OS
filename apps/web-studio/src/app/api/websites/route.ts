import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 웹사이트 생성 요청 스키마
const WebsiteRequestSchema = z.object({
  name: z.string().min(1, "웹사이트 이름은 필수입니다"),
  type: z.enum(['portfolio', 'blog', 'business', 'personal']),
  template: z.string().optional(),
  customization: z.object({
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    font: z.string().optional(),
    layout: z.enum(['modern', 'classic', 'minimal', 'bold']).optional(),
  }).optional(),
  content: z.object({
    title: z.string(),
    description: z.string(),
    sections: z.array(z.object({
      type: z.enum(['hero', 'about', 'projects', 'skills', 'contact', 'blog']),
      content: z.any(),
    })),
  }),
  seo: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = WebsiteRequestSchema.parse(body);

    // AI를 사용하여 웹사이트 콘텐츠 생성
    const generatedContent = await generateWebsiteContent(validatedData);

    // 정적 웹사이트 빌드
    const buildResult = await buildStaticWebsite(generatedContent);

    return NextResponse.json({
      success: true,
      website: {
        id: generateWebsiteId(),
        url: `https://${generatedContent.domain}.metalifeos.com`,
        previewUrl: `https://preview.metalifeos.com/${generatedContent.id}`,
        buildStatus: 'completed',
        ...buildResult,
      }
    });
  } catch (error) {
    console.error('Website generation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof z.ZodError ? error.errors : '웹사이트 생성 실패' 
      },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  try {
    // 사용자의 웹사이트 목록 조회
    const websites = await getUserWebsites(userId);

    return NextResponse.json({
      success: true,
      websites
    });
  } catch (error) {
    console.error('Failed to fetch websites:', error);
    return NextResponse.json(
      { success: false, error: '웹사이트 목록 조회 실패' },
      { status: 500 }
    );
  }
}

// AI 콘텐츠 생성 함수
async function generateWebsiteContent(requestData: any) {
  // AI API를 호출하여 웹사이트 콘텐츠 생성
  const prompt = `
다음 정보를 바탕으로 웹사이트 콘텐츠를 생성해주세요:

타입: ${requestData.type}
이름: ${requestData.name}
설명: ${requestData.content.description}

요구사항:
1. SEO 최적화된 제목과 설명
2. 반응형 디자인
3. 현대적인 UI/UX
4. 빠른 로딩 속도

템플릿: ${requestData.template || 'auto'}
커스터마이징: ${JSON.stringify(requestData.customization || {})}

JSON 형식으로 반환해주세요.
`;

  // 실제 구현에서는 AI API 호출
  const aiResponse = await callAI(prompt);
  
  return {
    id: generateWebsiteId(),
    domain: `${requestData.name.toLowerCase().replace(/\s+/g, '-')}`,
    content: JSON.parse(aiResponse),
    template: requestData.template || 'modern',
    customization: requestData.customization || {},
    createdAt: new Date().toISOString(),
  };
}

// 정적 웹사이트 빌드 함수
async function buildStaticWebsite(content: any) {
  // Next.js 정적 빌드 또는 사용자 정의 빌더 사용
  const buildResult = {
    html: generateHTML(content),
    css: generateCSS(content.customization),
    js: generateJavaScript(content),
    assets: await processAssets(content),
  };

  // 파일 저장 (실제 구현에서는 S3 또는 다른 스토리지 사용)
  await saveWebsiteFiles(content.id, buildResult);

  return buildResult;
}

function generateHTML(content: any): string {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.content.title}</title>
    <meta name="description" content="${content.content.description}">
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="/styles.css" rel="stylesheet">
</head>
<body class="bg-gray-50">
    <div id="app">
        <!-- 헤더 -->
        <header class="bg-white shadow-sm">
            <nav class="container mx-auto px-6 py-4">
                <div class="flex items-center justify-between">
                    <h1 class="text-2xl font-bold text-gray-800">${content.content.title}</h1>
                    <div class="hidden md:flex space-x-6">
                        <a href="#about" class="text-gray-600 hover:text-gray-900">소개</a>
                        <a href="#projects" class="text-gray-600 hover:text-gray-900">프로젝트</a>
                        <a href="#contact" class="text-gray-600 hover:text-gray-900">연락처</a>
                    </div>
                </div>
            </nav>
        </header>

        <!-- 메인 콘텐츠 -->
        <main>
            ${content.content.sections.map((section: any) => generateSection(section)).join('')}
        </main>

        <!-- 푸터 -->
        <footer class="bg-gray-800 text-white py-8">
            <div class="container mx-auto px-6 text-center">
                <p>&copy; 2024 ${content.content.title}. All rights reserved.</p>
            </div>
        </footer>
    </div>
    <script src="/script.js"></script>
</body>
</html>`;
}

function generateSection(section: any): string {
  switch (section.type) {
    case 'hero':
      return `
        <section class="py-20 px-6 text-center">
            <div class="container mx-auto">
                <h1 class="text-5xl font-bold mb-6">${section.content.headline || ''}</h1>
                <p class="text-xl mb-8">${section.content.subheading || ''}</p>
                <button class="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700">
                    ${section.content.cta || '더 알아보기'}
                </button>
            </div>
        </section>`;
    
    case 'about':
      return `
        <section id="about" class="py-16 px-6">
            <div class="container mx-auto">
                <h2 class="text-3xl font-bold text-center mb-12">소개</h2>
                <div class="max-w-3xl mx-auto text-center">
                    <p class="text-lg leading-relaxed">${section.content.text || ''}</p>
                </div>
            </div>
        </section>`;
    
    case 'projects':
      return `
        <section id="projects" class="py-16 px-6 bg-white">
            <div class="container mx-auto">
                <h2 class="text-3xl font-bold text-center mb-12">프로젝트</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    ${(section.content.items || []).map((project: any) => `
                        <div class="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
                            <img src="${project.image || '/placeholder.jpg'}" alt="${project.title}" class="w-full h-48 object-cover rounded-lg mb-4">
                            <h3 class="text-xl font-semibold mb-2">${project.title}</h3>
                            <p class="text-gray-600 mb-4">${project.description}</p>
                            <div class="flex flex-wrap gap-2">
                                ${(project.tags || []).map((tag: string) => `
                                    <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">${tag}</span>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>`;
    
    default:
      return `<section class="py-16 px-6"><div class="container mx-auto"><p>섹션 콘텐츠를 추가해주세요.</p></div></section>`;
  }
}

function generateCSS(customization: any): string {
  const primaryColor = customization?.primaryColor || '#3B82F6';
  const secondaryColor = customization?.secondaryColor || '#10B981';
  const font = customization?.font || 'system-ui';

  return `
:root {
  --primary-color: ${primaryColor};
  --secondary-color: ${secondaryColor};
  --font-family: ${font};
}

body {
  font-family: var(--font-family);
}

.bg-primary { background-color: var(--primary-color); }
.text-primary { color: var(--primary-color); }
.border-primary { border-color: var(--primary-color); }

.bg-secondary { background-color: var(--secondary-color); }
.text-secondary { color: var(--secondary-color); }
.border-secondary { border-color: var(--secondary-color); }

.btn-primary {
  background-color: var(--primary-color);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-primary:hover {
  background-color: color(var(--primary-color) brightness(90%));
}

@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }
}
`;
}

function generateJavaScript(content: any): string {
  return `
// MetaLife OS 웹사이트 인터랙티브 기능
document.addEventListener('DOMContentLoaded', function() {
  // 스무스 스크롤
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // 동적 콘텐츠 로딩
  loadDynamicContent();

  // 폼 제출 처리
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', handleFormSubmit);
  });

  // 이미지 지연 로딩
  const images = document.querySelectorAll('img[data-src]');
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        img.src = img.dataset.src || '';
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  });

  images.forEach(img => imageObserver.observe(img));
});

function loadDynamicContent() {
  // API를 통해 동적 콘텐츠 로드
  fetch('/api/content/dynamic')
    .then(response => response.json())
    .then(data => {
      updateContent(data);
    })
    .catch(error => console.error('Failed to load dynamic content:', error));
}

function updateContent(data: any) {
  // 동적 콘텐츠 업데이트 로직
  Object.keys(data).forEach(key => {
    const elements = document.querySelectorAll(\`[data-content="\${key}"]\`);
    elements.forEach(element => {
      element.textContent = data[key];
    });
  });
}

function handleFormSubmit(event: Event) {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const formData = new FormData(form);
  
  // 폼 데이터 처리
  submitForm(formData).then(response => {
    if (response.success) {
      showNotification('성공적으로 제출되었습니다!', 'success');
      form.reset();
    } else {
      showNotification('제출 실패: ' + response.error, 'error');
    }
  });
}

async function submitForm(formData: FormData): Promise<any> {
  const response = await fetch('/api/contact', {
    method: 'POST',
    body: formData,
  });
  return response.json();
}

function showNotification(message: string, type: 'success' | 'error') {
  const notification = document.createElement('div');
  notification.className = \`fixed top-4 right-4 p-4 rounded-lg text-white \${
    type === 'success' ? 'bg-green-500' : 'bg-red-500'
  } z-50\`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}
`;
}

async function processAssets(content: any): Promise<any[]> {
  // 이미지 최적화, 압축 등
  return [];
}

async function saveWebsiteFiles(websiteId: string, files: any) {
  // 파일 시스템 또는 클라우드 스토리지에 저장
  console.log(`Saving website ${websiteId} files...`);
}

async function getUserWebsites(userId?: string | null): Promise<any[]> {
  // 데이터베이스에서 사용자 웹사이트 목록 조회
  return [];
}

function generateWebsiteId(): string {
  return Math.random().toString(36).substr(2, 9);
}

async function callAI(prompt: string): Promise<string> {
  // AI API 호출 (실제 구현 필요)
  return JSON.stringify({
    title: "샘플 웹사이트",
    sections: [
      {
        type: "hero",
        content: {
          headline: "환영합니다",
          subheading: "저의 포트폴리오를 둘러보세요",
          cta: "더 알아보기"
        }
      }
    ]
  });
}