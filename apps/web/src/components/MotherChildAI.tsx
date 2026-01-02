import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Users, 
  Shield, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Heart,
  Vibrate,
  Eye,
  MessageCircle
} from 'lucide-react';

interface ChildAI {
  id: string;
  type: 'reasoning' | 'critique' | 'verification' | 'domain' | 'design' | 'benchmark';
  name: string;
  status: 'thinking' | 'proposing' | 'validating' | 'idle';
  confidence: number;
  contribution: number;
}

interface MotherDecision {
  taskId: string;
  task: string;
  status: 'pending' | 'thinking' | 'consensus' | 'decided' | 'executing' | 'completed';
  authority: 'denied' | 'pending' | 'approved' | 'executed';
  finalDecision: string;
  reasoning: string;
  consensusStrength: number;
  reproducibilityScore: number;
  childContributions: Record<string, number>;
  executionTime: number;
  auditTrail: any[];
}

interface MotherOrbState {
  breathing: boolean;
  vibration: boolean;
  pulsing: boolean;
  contraction: number;
  color: 'blue' | 'green' | 'yellow' | 'red';
  heartRate: number;
}

const MotherChildAI = () => {
  const [children, setChildren] = useState<ChildAI[]>([]);
  const [currentDecision, setCurrentDecision] = useState<MotherDecision | null>(null);
  const [orbState, setOrbState] = useState<MotherOrbState>({
    breathing: true,
    vibration: false,
    pulsing: false,
    contraction: 1,
    color: 'blue',
    heartRate: 60
  });
  const [taskInput, setTaskInput] = useState('');
  const [auditTrail, setAuditTrail] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);

  // 웹소켓 연결
  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket(process.env.NEXT_PUBLIC_MOTHER_WS_URL || 'ws://localhost:8000/mother-ws');
      
      ws.onopen = () => {
        setIsConnected(true);
        console.log('Mother AI 시스템에 연결됨');
        // 초기 Child AI 상태 요청
        ws.send(JSON.stringify({ type: 'get_children_status' }));
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleMotherMessage(data);
      };
      
      ws.onclose = () => {
        setIsConnected(false);
        setTimeout(connectWebSocket, 3000);
      };
      
      wsRef.current = ws;
    };

    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleMotherMessage = (data: any) => {
    switch (data.type) {
      case 'children_status':
        setChildren(data.children);
        break;
      case 'task_update':
        setCurrentDecision(prev => ({ ...prev, ...data.decision }));
        updateOrbState(data.decision);
        break;
      case 'audit_log':
        setAuditTrail(prev => [data.log, ...prev].slice(0, 50));
        break;
      case 'orb_state':
        setOrbState(prev => ({ ...prev, ...data.state }));
        break;
    }
  };

  const updateOrbState = (decision: Partial<MotherDecision>) => {
    setOrbState(prev => {
      let newState = { ...prev };
      
      // 결정 상태에 따른 Orb 상태 업데이트
      switch (decision.status) {
        case 'thinking':
          newState = {
            ...newState,
            pulsing: true,
            vibration: false,
            color: 'yellow',
            heartRate: 80
          };
          break;
        case 'consensus':
          newState = {
            ...newState,
            pulsing: true,
            vibration: true,
            color: 'orange',
            heartRate: 100
          };
          break;
        case 'decided':
          newState = {
            ...newState,
            pulsing: false,
            vibration: false,
            color: decision.authority === 'approved' ? 'green' : 'red',
            heartRate: decision.authority === 'approved' ? 70 : 90,
            contraction: decision.authority === 'approved' ? 1.2 : 0.8
          };
          break;
        case 'executing':
          newState = {
            ...newState,
            pulsing: true,
            vibration: true,
            color: 'blue',
            heartRate: 85
          };
          break;
        default:
          newState = {
            ...newState,
            breathing: true,
            pulsing: false,
            vibration: false,
            color: 'blue',
            heartRate: 60,
            contraction: 1
          };
      }
      
      return newState;
    });
  };

  const handleSubmitTask = () => {
    if (!taskInput.trim() || !isConnected) return;

    const task = {
      type: 'process_task',
      task: taskInput,
      context: {
        timestamp: new Date().toISOString(),
        source: 'web_interface'
      }
    };

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(task));
      setTaskInput('');
    }
  };

  const getChildTypeIcon = (type: string) => {
    switch (type) {
      case 'reasoning': return <Brain className="w-4 h-4" />;
      case 'critique': return <AlertTriangle className="w-4 h-4" />;
      case 'verification': return <Shield className="w-4 h-4" />;
      case 'domain': return <Users className="w-4 h-4" />;
      case 'design': return <Eye className="w-4 h-4" />;
      case 'benchmark': return <Activity className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getChildTypeColor = (type: string) => {
    switch (type) {
      case 'reasoning': return 'bg-blue-500';
      case 'critique': return 'bg-orange-500';
      case 'verification': return 'bg-green-500';
      case 'domain': return 'bg-purple-500';
      case 'design': return 'bg-pink-500';
      case 'benchmark': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'thinking': return <Clock className="w-3 h-3" />;
      case 'proposing': return <MessageCircle className="w-3 h-3" />;
      case 'validating': return <Shield className="w-3 h-3" />;
      case 'idle': return <CheckCircle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const getAuthorityColor = (authority: string) => {
    switch (authority) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'denied': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'executed': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mother AI Orb 메인 영역 */}
      <div className="w-96 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <h1 className="text-xl font-bold">Mother AI</h1>
          </div>
          <p className="text-sm text-gray-400">
            헌법이자 통제 시스템 • {children.length}개 Child AI 운영 중
          </p>
        </div>

        {/* 3D Orb 시각화 */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="relative">
            {/* 호흡 애니메이션 */}
            <div 
              className={`absolute inset-0 rounded-full transition-all duration-2000 ${
                orbState.breathing ? 'animate-pulse' : ''
              }`}
              style={{
                width: '200px',
                height: '200px',
                background: `radial-gradient(circle, ${
                  orbState.color === 'blue' ? '#3B82F6' :
                  orbState.color === 'green' ? '#10B981' :
                  orbState.color === 'yellow' ? '#F59E0B' :
                  orbState.color === 'red' ? '#EF4444' : '#6B7280'
                }, transparent)`,
                opacity: 0.3,
                transform: `scale(${orbState.contraction})`
              }}
            />
            
            {/* 진동 애니메이션 */}
            <div 
              className={`absolute inset-0 rounded-full ${
                orbState.vibration ? 'animate-ping' : ''
              }`}
              style={{
                width: '200px',
                height: '200px',
                border: `2px solid ${
                  orbState.color === 'blue' ? '#3B82F6' :
                  orbState.color === 'green' ? '#10B981' :
                  orbState.color === 'yellow' ? '#F59E0B' :
                  orbState.color === 'red' ? '#EF4444' : '#6B7280'
                }`,
                opacity: orbState.vibration ? 0.6 : 0.2
              }}
            />
            
            {/* 메인 Orb */}
            <div 
              className="relative rounded-full flex items-center justify-center transition-all duration-500"
              style={{
                width: '200px',
                height: '200px',
                background: `radial-gradient(circle at 30% 30%, ${
                  orbState.color === 'blue' ? '#60A5FA' :
                  orbState.color === 'green' ? '#34D399' :
                  orbState.color === 'yellow' ? '#FBBF24' :
                  orbState.color === 'red' ? '#F87171' : '#9CA3AF'
                }, ${
                  orbState.color === 'blue' ? '#1E40AF' :
                  orbState.color === 'green' ? '#064E3B' :
                  orbState.color === 'yellow' ? '#78350F' :
                  orbState.color === 'red' ? '#7F1D1D' : '#374151'
                })`,
                boxShadow: `0 0 ${orbState.pulsing ? '40px' : '20px'} ${
                  orbState.color === 'blue' ? '#3B82F6' :
                  orbState.color === 'green' ? '#10B981' :
                  orbState.color === 'yellow' ? '#F59E0B' :
                  orbState.color === 'red' ? '#EF4444' : '#6B7280'
                }`
              }}
            >
              {/* 심장 아이콘 */}
              <div className="text-center">
                <Heart 
                  className={`w-12 h-12 mx-auto mb-2 ${
                    orbState.pulsing ? 'animate-pulse' : ''
                  }`}
                  fill="white"
                />
                <div className="text-2xl font-bold">
                  {Math.round(orbState.heartRate)}
                </div>
                <div className="text-xs opacity-75">BPM</div>
              </div>
            </div>
            
            {/* 상태 지시기 */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {orbState.breathing && (
                <div className="bg-blue-500 bg-opacity-75 px-2 py-1 rounded text-xs">
                  호흡 중
                </div>
              )}
              {orbState.vibration && (
                <div className="bg-orange-500 bg-opacity-75 px-2 py-1 rounded text-xs">
                  진동 중
                </div>
              )}
              {orbState.pulsing && (
                <div className="bg-purple-500 bg-opacity-75 px-2 py-1 rounded text-xs">
                  맥동 중
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 현재 결정 상태 */}
        {currentDecision && (
          <div className="p-4 border-t border-gray-700">
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">태스크 진행률</span>
                <span className="text-xs text-gray-400">
                  {Math.round(currentDecision.executionTime)}초
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    currentDecision.status === 'completed' ? 'bg-green-500' :
                    currentDecision.status === 'executing' ? 'bg-blue-500' :
                    currentDecision.status === 'decided' ? 'bg-purple-500' :
                    currentDecision.status === 'consensus' ? 'bg-orange-500' :
                    currentDecision.status === 'thinking' ? 'bg-yellow-500' :
                    'bg-gray-500'
                  }`}
                  style={{
                    width: `${
                      currentDecision.status === 'pending' ? 0 :
                      currentDecision.status === 'thinking' ? 25 :
                      currentDecision.status === 'consensus' ? 50 :
                      currentDecision.status === 'decided' ? 75 :
                      currentDecision.status === 'executing' ? 90 :
                      100
                    }%`
                  }}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-400">결정 권한:</span>
              <Badge className={getAuthorityColor(currentDecision.authority)}>
                {currentDecision.authority === 'approved' && '승인됨'}
                {currentDecision.authority === 'denied' && '거부됨'}
                {currentDecision.authority === 'pending' && '보류 중'}
                {currentDecision.authority === 'executed' && '실행 완료'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400">합의 강도:</span>
                <div className="font-semibold">
                  {Math.round(currentDecision.consensusStrength * 100)}%
                </div>
              </div>
              <div>
                <span className="text-gray-400">재현성:</span>
                <div className="font-semibold">
                  {Math.round(currentDecision.reproducibilityScore * 100)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 태스크 입력 */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmitTask()}
              placeholder="Mother AI에게 태스크 요청..."
              className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!isConnected}
            />
            <Button
              onClick={handleSubmitTask}
              disabled={!isConnected || !taskInput.trim()}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Zap className="w-4 h-4" />
            </Button>
          </div>
          {!isConnected && (
            <div className="mt-2 text-xs text-amber-400">
              Mother AI 시스템에 연결되지 않았습니다...
            </div>
          )}
        </div>
      </div>

      {/* Child AI 상태 및 감사 추적 */}
      <div className="flex-1 flex flex-col">
        {/* Child AI 상태 */}
        <Card className="m-4 flex-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Child AI 상태 ({children.length}개)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="grid grid-cols-2 gap-3">
                {children.map((child) => (
                  <div 
                    key={child.id}
                    className="p-3 border rounded-lg transition-all duration-300 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full ${getChildTypeColor(child.type)} flex items-center justify-center text-white`}>
                          {getChildTypeIcon(child.type)}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{child.name}</div>
                          <div className="text-xs text-gray-500">{child.type}</div>
                        </div>
                      </div>
                      <div className={`w-4 h-4 ${child.status !== 'idle' ? 'text-blue-500' : 'text-gray-400'}`}>
                        {getStatusIcon(child.status)}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>신뢰도</span>
                          <span>{Math.round(child.confidence * 100)}%</span>
                        </div>
                        <Progress value={child.confidence * 100} className="h-1" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>기여도</span>
                          <span>{Math.round(child.contribution * 100)}%</span>
                        </div>
                        <Progress value={child.contribution * 100} className="h-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* 감사 추적 */}
        <Card className="m-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              감사 추적
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {auditTrail.map((log, index) => (
                  <div key={index} className="p-2 border rounded text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">태스크 {log.taskId?.slice(0, 8)}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getAuthorityColor(log.authority)}>
                        {log.authority}
                      </Badge>
                      <span className="text-xs text-gray-600">
                        재현성: {Math.round(log.reproducibility * 100)}%
                      </span>
                      <span className="text-xs text-gray-600">
                        {log.executionTime}s
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MotherChildAI;