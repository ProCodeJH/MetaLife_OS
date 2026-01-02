import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BookOpen,
  Trophy,
  Target,
  Users,
  Play,
  Clock,
  CheckCircle,
  Award,
  Brain,
  Code,
  GamepadIcon,
  Star,
  Zap,
  TrendingUp
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  lessons: Lesson[];
  progress: number;
  isCompleted: boolean;
  tags: string[];
}

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'interactive' | 'game';
  duration?: number;
  content?: string;
  isCompleted: boolean;
  score?: number;
}

interface LearningPath {
  id: string;
  name: string;
  description: string;
  courses: string[];
  estimatedDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const EducationalPlatform = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userProgress, setUserProgress] = useState({
    totalLessons: 0,
    completedLessons: 0,
    totalPoints: 0,
    currentStreak: 0,
    level: 1,
    nextLevelPoints: 100
  });

  // 초기 데이터 로드
  useEffect(() => {
    loadCourses();
    loadLearningPaths();
    loadAchievements();
    loadUserProgress();
  }, []);

  const loadCourses = () => {
    // 시뮬레이션된 코스 데이터
    const mockCourses: Course[] = [
      {
        id: '1',
        title: 'AI 기초 개념 이해하기',
        description: '인공지능의 기본 개념과 원리를 학습합니다. 머신러닝, 딥러닝, 자연어 처리의 기초를 다룹니다.',
        category: 'AI',
        difficulty: 'beginner',
        duration: 180, // 3시간
        lessons: [
          { id: '1-1', title: 'AI란 무엇인가?', type: 'video', duration: 15, isCompleted: true },
          { id: '1-2', title: '머신러닝 기초', type: 'interactive', isCompleted: true, score: 85 },
          { id: '1-3', title: '딥러닝 입문', type: 'text', isCompleted: false },
          { id: '1-4', title: '실습: 간단한 분류 모델', type: 'game', isCompleted: false }
        ],
        progress: 50,
        isCompleted: false,
        tags: ['AI', '머신러닝', '딥러닝']
      },
      {
        id: '2',
        title: '웹 개발 완전 정복',
        description: 'HTML, CSS, JavaScript부터 React까지 현대적인 웹 개발 기술을 체계적으로 학습합니다.',
        category: 'Development',
        difficulty: 'intermediate',
        duration: 300, // 5시간
        lessons: [
          { id: '2-1', title: 'HTML5 기본', type: 'video', duration: 20, isCompleted: true },
          { id: '2-2', title: 'CSS3 완벽 가이드', type: 'interactive', isCompleted: true, score: 92 },
          { id: '2-3', title: 'JavaScript ES6+', type: 'video', duration: 25, isCompleted: false },
          { id: '2-4', title: 'React 기초', type: 'interactive', isCompleted: false },
          { id: '2-5', title: '프로젝트: 포트폴리오 사이트', type: 'game', isCompleted: false }
        ],
        progress: 40,
        isCompleted: false,
        tags: ['웹개발', 'HTML', 'CSS', 'JavaScript', 'React']
      },
      {
        id: '3',
        title: '게임 개발의 모든 것',
        description: 'Unity를 사용한 2D/3D 게임 개발의 모든 것을 배웁니다. C# 프로그래밍부터 게임 디자인까지.',
        category: 'Game',
        difficulty: 'advanced',
        duration: 420, // 7시간
        lessons: [
          { id: '3-1', title: 'Unity 인터페이스', type: 'video', duration: 30, isCompleted: false },
          { id: '3-2', title: 'C# 프로그래밍', type: 'interactive', isCompleted: false },
          { id: '3-3', title: '2D 게임 메커니즘', type: 'video', duration: 25, isCompleted: false },
          { id: '3-4', title: '3D 그래픽스', type: 'text', isCompleted: false },
          { id: '3-5', title: '프로젝트: 3D 액션 게임', type: 'game', isCompleted: false }
        ],
        progress: 0,
        isCompleted: false,
        tags: ['게임개발', 'Unity', 'C#', '3D']
      }
    ];
    
    setCourses(mockCourses);
  };

  const loadLearningPaths = () => {
    const mockPaths: LearningPath[] = [
      {
        id: 'ai-path',
        name: 'AI 전문가 양성 과정',
        description: 'AI 분야의 완전한 초보부터 전문가까지의 학습 경로',
        courses: ['1'],
        estimatedDuration: 480, // 8시간
        difficulty: 'beginner',
        category: 'AI'
      },
      {
        id: 'web-path',
        name: '풀스택 웹 개발자',
        description: '프론트엔드부터 백엔드까지 현대적인 웹 개발자 되기',
        courses: ['2'],
        estimatedDuration: 600, // 10시간
        difficulty: 'intermediate',
        category: 'Development'
      },
      {
        id: 'game-path',
        name: '게임 개발 마스터',
        description: '인디 게임 개발부터 상용 게임 개발까지',
        courses: ['3'],
        estimatedDuration: 720, // 12시간
        difficulty: 'advanced',
        category: 'Game'
      }
    ];
    
    setLearningPaths(mockPaths);
  };

  const loadAchievements = () => {
    const mockAchievements: Achievement[] = [
      {
        id: 'first-lesson',
        title: '첫 걸음',
        description: '첫 번째 레슨을 완료했습니다',
        icon: '👟',
        category: 'Learning',
        rarity: 'common',
        unlockedAt: new Date()
      },
      {
        id: 'week-streak',
        title: '일주일 꾸준',
        description: '7일 연속으로 학습했습니다',
        icon: '🔥',
        category: 'Consistency',
        rarity: 'rare',
        unlockedAt: new Date()
      },
      {
        id: 'ai-expert',
        title: 'AI 전문가',
        description: 'AI 코스를 모두 완료했습니다',
        icon: '🤖',
        category: 'Expertise',
        rarity: 'epic'
      }
    ];
    
    setAchievements(mockAchievements);
  };

  const loadUserProgress = () => {
    setUserProgress({
      totalLessons: 15,
      completedLessons: 4,
      totalPoints: 340,
      currentStreak: 3,
      level: 3,
      nextLevelPoints: 500
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="w-4 h-4" />;
      case 'text': return <BookOpen className="w-4 h-4" />;
      case 'interactive': return <Code className="w-4 h-4" />;
      case 'game': return <GamepadIcon className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800';
      case 'rare': return 'bg-blue-100 text-blue-800';
      case 'epic': return 'bg-purple-100 text-purple-800';
      case 'legendary': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleLessonComplete = (courseId: string, lessonId: string) => {
    setCourses(prev => prev.map(course => {
      if (course.id === courseId) {
        const updatedLessons = course.lessons.map(lesson => {
          if (lesson.id === lessonId) {
            return { ...lesson, isCompleted: true, score: Math.floor(Math.random() * 30) + 70 };
          }
          return lesson;
        });
        
        const completedCount = updatedLessons.filter(l => l.isCompleted).length;
        const progress = (completedCount / updatedLessons.length) * 100;
        
        return {
          ...course,
          lessons: updatedLessons,
          progress,
          isCompleted: progress === 100
        };
      }
      return course;
    }));

    // 진행률 업데이트
    setUserProgress(prev => ({
      ...prev,
      completedLessons: prev.completedLessons + 1,
      totalPoints: prev.totalPoints + 10
    }));
  };

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🎓 MetaLife 학습 플랫폼
          </h1>
          <p className="text-xl text-gray-600">
            AI와 함께하는 개인화된 학습 경험
          </p>
        </div>

        {/* 사용자 진행 상태 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{userProgress.level}</div>
              <div className="text-sm text-gray-600">레벨</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{userProgress.totalPoints}</div>
              <div className="text-sm text-gray-600">총 포인트</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-orange-600">{userProgress.currentStreak}</div>
              <div className="text-sm text-gray-600">연속 학습일</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 mb-2">다음 레벨까지</div>
              <Progress value={(userProgress.totalPoints / userProgress.nextLevelPoints) * 100} className="mb-2" />
              <div className="text-xs text-gray-500">
                {userProgress.totalPoints} / {userProgress.nextLevelPoints} XP
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 콘텐츠 영역 */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="courses" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="courses">코스</TabsTrigger>
                <TabsTrigger value="paths">학습 경로</TabsTrigger>
                <TabsTrigger value="achievements">성취</TabsTrigger>
              </TabsList>
              
              <TabsContent value="courses" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courses.map(course => (
                    <Card 
                      key={course.id} 
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => handleCourseSelect(course)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Badge className={getDifficultyColor(course.difficulty)}>
                            {course.difficulty === 'beginner' && '초급'}
                            {course.difficulty === 'intermediate' && '중급'}
                            {course.difficulty === 'advanced' && '고급'}
                          </Badge>
                          <div className="text-sm text-gray-500">
                            {Math.floor(course.duration / 60)}시간
                          </div>
                        </div>
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {course.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-1 mb-4">
                          {course.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="mb-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span>진행률</span>
                            <span>{Math.round(course.progress)}%</span>
                          </div>
                          <Progress value={course.progress} />
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span>{course.lessons.filter(l => l.isCompleted).length}/{course.lessons.length} 레슨</span>
                          {course.isCompleted && <CheckCircle className="w-4 h-4 text-green-600" />}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="paths" className="mt-4">
                <div className="space-y-4">
                  {learningPaths.map(path => (
                    <Card key={path.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="w-5 h-5" />
                          {path.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 mb-4">{path.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="text-sm text-gray-500">난이도</div>
                            <Badge className={getDifficultyColor(path.difficulty)}>
                              {path.difficulty === 'beginner' && '초급'}
                              {path.difficulty === 'intermediate' && '중급'}
                              {path.difficulty === 'advanced' && '고급'}
                            </Badge>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">예상 시간</div>
                            <div className="font-semibold">{Math.floor(path.estimatedDuration / 60)}시간</div>
                          </div>
                        </div>
                        
                        <Button className="w-full">
                          학습 경로 시작하기
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="achievements" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map(achievement => (
                    <Card 
                      key={achievement.id} 
                      className={`text-center ${!achievement.unlockedAt ? 'opacity-50' : ''}`}
                    >
                      <CardContent className="p-6">
                        <div className="text-4xl mb-3">{achievement.icon}</div>
                        <h3 className="font-semibold mb-2">{achievement.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                        <Badge className={getRarityColor(achievement.rarity)}>
                          {achievement.rarity === 'common' && '일반'}
                          {achievement.rarity === 'rare' && '희귀'}
                          {achievement.rarity === 'epic' && '에픽'}
                          {achievement.rarity === 'legendary' && '전설'}
                        </Badge>
                        {achievement.unlockedAt && (
                          <div className="text-xs text-gray-500 mt-2">
                            {achievement.unlockedAt.toLocaleDateString()}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* 사이드바 - 선택된 코스 상세 */}
          <div className="lg:col-span-1">
            {selectedCourse ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    {selectedCourse.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      <p className="text-gray-600">{selectedCourse.description}</p>
                      
                      <div className="space-y-3">
                        <h4 className="font-semibold">레슨 목록</h4>
                        {selectedCourse.lessons.map((lesson, index) => (
                          <div 
                            key={lesson.id} 
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-sm font-medium text-gray-500 w-6">
                                {index + 1}
                              </div>
                              <div className={getLessonIcon(lesson.type)} />
                              <div>
                                <div className="font-medium">{lesson.title}</div>
                                {lesson.duration && (
                                  <div className="text-xs text-gray-500">{lesson.duration}분</div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {lesson.isCompleted ? (
                                <>
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  {lesson.score && (
                                    <Badge variant="outline">{lesson.score}점</Badge>
                                  )}
                                </>
                              ) : (
                                <Button 
                                  size="sm"
                                  onClick={() => handleLessonComplete(selectedCourse.id, lesson.id)}
                                >
                                  시작
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="pt-4 border-t">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">전체 진행률</span>
                          <span className="text-sm">{Math.round(selectedCourse.progress)}%</span>
                        </div>
                        <Progress value={selectedCourse.progress} />
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>코스를 선택하면 상세 정보가 표시됩니다</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducationalPlatform;