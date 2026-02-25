import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { MessageCircle, X, Send, Sparkles, RotateCcw, History } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { sendChatMessage } from '@/lib/openaiService';
import { allModels } from '@/data/allModels';
import { chatHistoryService, ChatMessage } from '@/lib/chatHistoryService';
import { ChatHistorySidebar } from './ChatHistorySidebar';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  suggestions?: string[];
  isStreaming?: boolean;
}

interface AIChatAssistantProps {
  onFilterApply?: (filters: any) => void;
}

export const AIChatAssistant: React.FC<AIChatAssistantProps> = ({ onFilterApply }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your AI assistant powered by OpenAI GPT-4. I can help you find the perfect AI model for your needs. What are you looking to build?",
      sender: 'ai',
      timestamp: new Date(),
      suggestions: [
        'Best models for coding',
        'Show me free models',
        'Image generation options',
        'Compare OpenAI models'
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const streamingMessageId = useRef<string | null>(null);


  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Create or get conversation
    let convId = currentConversationId;
    if (!convId && user) {
      const firstUserMsg = messages.find(m => m.sender === 'user')?.text || input;
      const title = firstUserMsg.slice(0, 50) + (firstUserMsg.length > 50 ? '...' : '');
      const conv = await chatHistoryService.createConversation(title);
      if (conv) {
        convId = conv.id;
        setCurrentConversationId(conv.id);
      }
    }

    // Save user message to database
    if (convId && user) {
      await chatHistoryService.saveMessage(convId, {
        role: 'user',
        content: input
      });
    }

    // Create placeholder for streaming message
    const aiMessageId = (Date.now() + 1).toString();
    streamingMessageId.current = aiMessageId;
    
    const aiMessage: Message = {
      id: aiMessageId,
      text: '',
      sender: 'ai',
      timestamp: new Date(),
      isStreaming: true
    };
    
    setMessages(prev => [...prev, aiMessage]);

    try {
      const conversationHistory = [...messages, userMessage];
      let fullResponse = '';

      const response = await sendChatMessage(
        conversationHistory.map(m => ({ text: m.text, sender: m.sender })),
        allModels,
        (chunk: string) => {
          fullResponse += chunk;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, text: fullResponse, isStreaming: true }
                : msg
            )
          );
        }
      );

      const finalText = response.text || fullResponse;

      // Finalize message with suggestions
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessageId 
            ? { 
                ...msg, 
                text: finalText,
                isStreaming: false,
                suggestions: generateSuggestions(finalText)
              }
            : msg
        )
      );

      // Save AI response to database
      if (convId && user) {
        await chatHistoryService.saveMessage(convId, {
          role: 'assistant',
          content: finalText
        });
      }

      // Apply filters if AI suggests them
      if (response.filterAction && onFilterApply) {
        onFilterApply(response.filterAction.filters);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => prev.filter(msg => msg.id !== aiMessageId));
    } finally {
      setIsTyping(false);
      streamingMessageId.current = null;
    }
  };


  const generateSuggestions = (text: string): string[] => {
    if (text.includes('coding') || text.includes('Code')) {
      return ['Show pricing', 'Compare with GPT-4', 'Best for Python'];
    }
    if (text.includes('budget') || text.includes('free')) {
      return ['Show all free models', 'Compare performance', 'Open source options'];
    }
    if (text.includes('image') || text.includes('Vision')) {
      return ['Compare image models', 'Show examples', 'Pricing comparison'];
    }
    return ['Show more details', 'Compare models', 'Filter by price'];
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setTimeout(() => handleSend(), 100);
  };

  const handleNewChat = () => {
    setCurrentConversationId(null);
    setShowHistory(false);
    resetChat();
  };

  const handleSelectConversation = async (conversationId: string) => {
    setCurrentConversationId(conversationId);
    setShowHistory(false);
    
    const chatMessages = await chatHistoryService.getMessages(conversationId);
    const loadedMessages: Message[] = chatMessages.map((msg, idx) => ({
      id: `${conversationId}-${idx}`,
      text: msg.content,
      sender: msg.role as 'user' | 'ai',
      timestamp: new Date(msg.created_at || Date.now())
    }));
    
    setMessages(loadedMessages.length > 0 ? loadedMessages : [{
      id: '1',
      text: "Hi! I'm your AI assistant powered by OpenAI GPT-4. What are you looking to build?",
      sender: 'ai',
      timestamp: new Date(),
      suggestions: ['Best models for coding', 'Show me free models', 'Image generation', 'Compare providers']
    }]);
  };

  const resetChat = () => {
    setMessages([{
      id: '1',
      text: "Hi! I'm your AI assistant powered by OpenAI GPT-4. What are you looking to build?",
      sender: 'ai',
      timestamp: new Date(),
      suggestions: ['Best models for coding', 'Show me free models', 'Image generation', 'Compare providers']
    }]);
  };


  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg z-50"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {isOpen && !showHistory && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] bg-slate-800 border-slate-700 shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">AI Assistant</h3>
                <p className="text-xs text-slate-400">Powered by OpenAI GPT-4</p>
              </div>
            </div>
            <div className="flex gap-1">
              {user && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowHistory(true)} 
                  className="text-slate-400 hover:text-white"
                  title="Chat History"
                >
                  <History className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleNewChat} className="text-slate-400 hover:text-white">
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${message.sender === 'user' ? 'bg-blue-600' : 'bg-slate-700'} rounded-lg p-3`}>
                    <p className="text-sm text-white whitespace-pre-wrap">
                      {message.text}
                      {message.isStreaming && (
                        <span className="inline-block w-2 h-4 ml-1 bg-white typing-cursor" />
                      )}
                    </p>
                    {message.suggestions && !message.isStreaming && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {message.suggestions.map((suggestion, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="cursor-pointer hover:bg-slate-600 text-xs border-slate-500"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            {suggestion}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && !streamingMessageId.current && (
                <div className="flex justify-start">
                  <div className="bg-slate-700 rounded-lg p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-slate-700">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
              <Button onClick={handleSend} className="bg-blue-600 hover:bg-blue-700">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {isOpen && showHistory && (
        <Card className="fixed bottom-6 right-6 w-80 h-[600px] bg-slate-800 border-slate-700 shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <h3 className="font-semibold text-white">Chat History</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <ChatHistorySidebar
            currentConversationId={currentConversationId}
            onSelectConversation={handleSelectConversation}
            onNewChat={handleNewChat}
          />
        </Card>
      )}
    </>
  );
};
