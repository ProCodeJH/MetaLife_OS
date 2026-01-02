"""
MetaLife OS - 웹 기반 AI 에이전트 인터페이스
React 기반의 현대적 웹 UI
"""

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Send, 
  Settings, 
  History, 
  Code, 
  Globe, 
  FileText,
  PlayCircle,
  Square,
  Trash2,
  Download,
  Upload
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    executionTime?: number;
    toolResults?: any[];
    provider?: any;
  };
}

interface AgentTask {
  id: string;
  type: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
}

const AgentInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [taskHistory, setTaskHistory] = useState<AgentTask[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('auto');
  const [enabledTools, setEnabledTools] = useState({
    web_browser: true,
    code_generation: true,
    github: false
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket 연결
  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws');
      
      ws.onopen = () => {
        setIsConnected(true);
        console.log('AI 에이전트에 연결됨');
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };
      
      ws.onclose = () => {
        setIsConnected(false);
        // 재연결 시도
        setTimeout(connectWebSocket, 3000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket 오류:', error);
        setIsConnected(false);
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

  const handleWebSocketMessage = (data: any) => {
    if (data.type === 'response') {
      const newMessage: Message = {
        id: data.taskId,
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
        metadata: data.metadata
      };
      setMessages(prev => [...prev, newMessage]);
      setTaskHistory(prev => 
        prev.map(task => 
          task.id === data.taskId 
            ? { ...task, status: 'completed', result: data }
            : task
        )
      );
      setIsLoading(false);
    } else if (data.type === 'error') {
      const errorMessage: Message = {
        id: data.taskId,
        role: 'assistant',
        content: `오류: ${data.error}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    } else if (data.type === 'tool_call') {
      console.log('툴 호출:', data);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !isConnected) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // 태스크 생성
    const task: AgentTask = {
      id: userMessage.id,
      type: 'research',
      description: input,
      status: 'running'
    };

    setTaskHistory(prev => [...prev, task]);

    // WebSocket으로 메시지 전송
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'task',
        task: {
          id: task.id,
          description: input,
          provider: selectedProvider === 'auto' ? null : selectedProvider,
          tools: Object.entries(enabledTools)
            .filter(([_, enabled]) => enabled)
            .map(([tool]) => tool)
        }
      }));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearHistory = () => {
    setMessages([]);
    setTaskHistory([]);
  };

  const exportHistory = () => {
    const history = {
      messages,
      taskHistory,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-history-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatMessage = (message: Message) => {
    const { content } = message;
    
    // 코드 블록 포맷팅
    const codeBlocks = content.match(/```[\s\S]*?```/g);
    if (codeBlocks) {
      return content.split(/```[\s\S]*?```/).map((part, index) => {
        if (index < codeBlocks.length) {
          const code = codeBlocks[index].replace(/```(\w+)?\n?/, '').replace(/```$/, '');
          const lang = codeBlocks[index].match(/```(\w+)/)?.[1] || 'text';
          
          return (
            <div key={index}>
              <div>{part}</div>
              <div className="bg-gray-900 text-gray-100 p-3 rounded-md my-2 overflow-x-auto">
                <pre className="text-sm">
                  <code>{code}</code>
                </pre>
              </div>
            </div>
          );
        }
        return <div key={index}>{part}</div>;
      });
    }
    
    return content.split('\n').map((line, index) => (
      <div key={index}>{line}</div>
    ));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 사이드바 */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-6 h-6 text-blue-600" />
            <h1 className="text-lg font-semibold">MetaLife AI</h1>
            <div className={`ml-auto w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
          
          <Button
            onClick={clearHistory}
            variant="outline"
            size="sm"
            className="w-full mb-2"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            대화 초기화
          </Button>
          
          <Button
            onClick={exportHistory}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            내보내기
          </Button>
        </div>

        <Tabs defaultValue="settings" className="flex-1">
          <TabsList className="grid w-full grid-cols-2 m-2">
            <TabsTrigger value="settings">설정</TabsTrigger>
            <TabsTrigger value="history">기록</TabsTrigger>
          </TabsList>
          
          <TabsContent value="settings" className="p-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">AI 제공자</label>
                <select 
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="auto">자동 선택</option>
                  <option value="ollama">Ollama (로컬)</option>
                  <option value="openai">OpenAI</option>
                  <option value="glm">GLM-4.7</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">활성화된 툴</label>
                <div className="space-y-2">
                  {Object.entries(enabledTools).map(([tool, enabled]) => (
                    <label key={tool} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setEnabledTools(prev => ({
                          ...prev,
                          [tool]: e.target.checked
                        }))}
                        className="rounded"
                      />
                      <span className="text-sm">
                        {tool === 'web_browser' && '웹 브라우징'}
                        {tool === 'code_generation' && '코드 생성'}
                        {tool === 'github' && 'GitHub'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="p-4">
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {taskHistory.map((task) => (
                  <div key={task.id} className="p-2 border rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={
                        task.status === 'completed' ? 'default' :
                        task.status === 'failed' ? 'destructive' :
                        task.status === 'running' ? 'secondary' : 'outline'
                      }>
                        {task.status === 'completed' && '완료'}
                        {task.status === 'failed' && '실패'}
                        {task.status === 'running' && '진행 중'}
                        {task.status === 'pending' && '대기 중'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {task.description}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* 메인 대화 영역 */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-green-600" />
              <span className="text-sm">웹 브라우징</span>
            </div>
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-blue-600" />
              <span className="text-sm">코드 생성</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <span className="text-sm">문서 처리</span>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-2xl ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className={`rounded-lg p-4 ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <div className="whitespace-pre-wrap">
                      {formatMessage(message)}
                    </div>
                    
                    {message.metadata?.executionTime && (
                      <div className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        실행 시간: {message.metadata.executionTime.toFixed(2)}초
                        {message.metadata?.provider && (
                          <span className="ml-2">
                            ({message.metadata.provider.provider} - {message.metadata.provider.model})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* 입력 영역 */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="AI 에이전트에게 질문하세요... (Shift+Enter: 줄바꿈)"
                className="flex-1 min-h-[60px] resize-none"
                disabled={!isConnected || isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!isConnected || isLoading || !input.trim()}
                className="px-6"
              >
                {isLoading ? (
                  <Square className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            {!isConnected && (
              <div className="mt-2 text-sm text-amber-600">
                ⚠️ AI 에이전트에 연결되지 않았습니다. 연결을 시도 중입니다...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentInterface;