import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { createChatSession, executeToolCall } from '../services/gemini';
import { ChatMessage } from '../types';
import { Chat as GenAIChat, GenerateContentResponse, Part } from '@google/genai';

interface ChatProps {
  userId: string;
}

export const Chat: React.FC<ChatProps> = ({ userId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'model', text: 'Hello! I can help you analyze your payslips. Try asking "Show my income for 2023" or "What was my net pay last month?".' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatSessionRef = useRef<GenAIChat | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatSessionRef.current) {
      chatSessionRef.current = createChatSession();
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Lazy init: if session wasn't created on mount (e.g. missing key), try again now
      if (!chatSessionRef.current) {
        chatSessionRef.current = createChatSession();
      }

      if (!chatSessionRef.current) {
        throw new Error("API Key is missing or invalid. Please check process.env.API_KEY.");
      }

      // Start the conversation turn
      let result: GenerateContentResponse = await chatSessionRef.current.sendMessage({ message: userMsg.text });

      // Handle Function Calls (Loop until model is done calling tools)
      // Gemini 2.5 can return multiple function calls in one turn (parallel calling)
      while (result.functionCalls && result.functionCalls.length > 0) {
        // Provide UI feedback that we are checking data
        const thinkingId = `thinking-${Date.now()}`;
        setMessages(prev => [...prev, { id: thinkingId, role: 'model', text: 'Checking your records...', isThinking: true }]);
        
        try {
          // Execute all tool calls in parallel
          const functionResponses = await Promise.all(result.functionCalls.map(async (call) => {
             const output = await executeToolCall(call.name, call.args, userId);
             return {
               id: call.id,
               name: call.name,
               response: { result: output }
             };
          }));

          // Remove thinking message
          setMessages(prev => prev.filter(m => m.id !== thinkingId));

          // Send results back to model
          const responseParts: Part[] = functionResponses.map(fr => ({
             functionResponse: fr
          }));

          result = await chatSessionRef.current.sendMessage({
              message: responseParts
          });
        } catch (err) {
          // Remove thinking message in case of error
          setMessages(prev => prev.filter(m => m.id !== thinkingId));
          throw err;
        }
      }

      const modelText = result.text || "I'm sorry, I couldn't process that.";
      
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: modelText 
      }]);

    } catch (e: any) {
      console.error(e);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: `Error: ${e.message || 'Something went wrong. Please check your network and API key.'}` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)]">
      <div className="flex-1 overflow-y-auto space-y-4 p-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-ios-blue text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
                    msg.role === 'user' 
                    ? 'bg-ios-blue text-white rounded-br-none' 
                    : msg.isThinking ? 'bg-gray-100 text-gray-500 italic' : 'bg-white text-slate-800 rounded-bl-none border border-gray-100'
                }`}>
                    {msg.text}
                    {msg.isThinking && <Loader2 className="inline ml-2 animate-spin" size={12} />}
                </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="bg-ios-bg pt-2">
        <div className="bg-white rounded-full border border-ios-separator shadow-sm flex items-center px-4 py-2">
            <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask about your payslips..."
                className="flex-1 bg-transparent outline-none text-slate-900 placeholder-gray-400"
            />
            <button 
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className={`p-2 rounded-full transition-colors ${loading || !input.trim() ? 'text-gray-300' : 'text-ios-blue bg-blue-50'}`}
            >
                <Send size={20} />
            </button>
        </div>
      </div>
    </div>
  );
};