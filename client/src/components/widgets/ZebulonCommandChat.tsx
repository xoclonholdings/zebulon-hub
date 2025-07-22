import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bolt, Brain, Shield, Flame } from "lucide-react";
import { ChatMessage, UserProfile } from "@/lib/types";
import { useWebSocket } from "@/hooks/use-websocket";
import { useQuery } from "@tanstack/react-query";

interface ZebulonCommandChatProps {
  user: UserProfile;
}

export default function ZebulonCommandChat({ user }: ZebulonCommandChatProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { sendMessage: sendWebSocketMessage, addMessageHandler } = useWebSocket();

  // Load chat history
  const { data: chatHistory } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat', user.id],
  });

  useEffect(() => {
    if (chatHistory) {
      const formattedMessages: ChatMessage[] = chatHistory.map(msg => [
        {
          id: msg.id * 2,
          message: msg.message,
          sender: 'user' as const,
          aiCore: msg.aiCore,
          timestamp: msg.timestamp
        },
        ...(msg.response ? [{
          id: msg.id * 2 + 1,
          message: msg.response,
          sender: 'ai' as const,
          aiCore: msg.aiCore,
          timestamp: msg.timestamp
        }] : [])
      ]).flat();
      
      setMessages(formattedMessages);
    }
  }, [chatHistory]);

  useEffect(() => {
    // Handle WebSocket responses
    addMessageHandler('chat_response', (response) => {
      const aiMessage: ChatMessage = {
        id: Date.now(),
        message: response.message.response,
        sender: 'ai',
        aiCore: response.aiCore,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    });

    return () => {
      // Cleanup handled by useWebSocket
    };
  }, [addMessageHandler]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      message: message.trim(),
      sender: 'user',
      aiCore: 'zed',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Send via WebSocket
    sendWebSocketMessage({
      type: 'chat',
      userId: user.id,
      message: message.trim(),
      aiCore: 'zed'
    });

    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getAiIcon = (aiCore: string) => {
    switch (aiCore) {
      case 'zed': return <Brain className="w-3 h-3" />;
      case 'zeta': return <Shield className="w-3 h-3" />;
      case 'fantasma': return <Flame className="w-3 h-3" />;
      default: return <Bolt className="w-3 h-3" />;
    }
  };

  const getAiName = (aiCore: string) => {
    switch (aiCore) {
      case 'zed': return 'Zed Core';
      case 'zeta': return 'Zeta Core';
      case 'fantasia': return 'Fantasia';
      default: return 'Zebulon';
    }
  };

  return (
    <Card className="widget-card bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg border border-blue-300 md:col-span-2 lg:col-span-1 lg:row-span-2 oracle-glow">
      <CardContent className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <Bolt className="text-white w-8 h-8" />
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-white text-center mb-6">Zebulon Command</h2>
        
        {/* Chat Messages */}
        <ScrollArea className="flex-1 mb-6 max-h-60" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="bg-white bg-opacity-10 rounded-lg p-3 text-center">
                <div className="text-xs text-blue-100 mb-1">Zed Core</div>
                <div className="text-white text-sm">
                  Good morning! Oracle database is running optimally. Ready for your queries.
                </div>
              </div>
            )}
            
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-lg p-3 ${
                  msg.sender === 'user'
                    ? 'bg-white bg-opacity-20 ml-8'
                    : 'bg-white bg-opacity-10'
                }`}
              >
                <div className="flex items-center space-x-1 text-xs text-blue-100 mb-1">
                  {msg.sender === 'ai' && getAiIcon(msg.aiCore)}
                  <span>
                    {msg.sender === 'user' ? 'You' : getAiName(msg.aiCore)}
                  </span>
                </div>
                <div className="text-white text-sm">{msg.message}</div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        {/* Chat Input */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Ask Zed..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg px-4 py-3 text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 pr-12"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-transparent hover:bg-white hover:bg-opacity-10 text-white hover:text-blue-200 transition-colors border-none"
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {/* AI Status Indicators */}
        <div className="flex justify-between items-center mt-4 text-xs text-blue-100">
          <span className="flex items-center space-x-1">
            <Brain className="w-3 h-3" />
            <span>Zed: Active</span>
          </span>
          <span className="flex items-center space-x-1">
            <Shield className="w-3 h-3" />
            <span>Zeta: Monitoring</span>
          </span>
          <span className="flex items-center space-x-1">
            <Flame className="w-3 h-3" />
            <span>Fantasma: Secure</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
