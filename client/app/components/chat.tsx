'use client'

import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle } from 'lucide-react';



type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  retrievedInfo?: any[];
};

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const params = new URLSearchParams({
        message: userMessage.content,
      });
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/chat?${params}`, {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          retrievedInfo: data.retrievedInfo,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Error connecting to server. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MessageCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">PDF Assistant</h2>
            <p className="text-sm text-slate-500">Ask questions about your document</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-4 bg-blue-100 rounded-full mb-4">
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Welcome to PDF Assistant</h3>
            <p className="text-slate-500 max-w-xs">
              Upload a PDF file and start asking questions about its content. I'll help you find the information you need.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              <div
                className={`max-w-xs lg:max-w-md xl:max-w-2xl px-4 py-3 rounded-2xl shadow-sm transition-all ${message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-white text-slate-900 border border-slate-200 rounded-bl-md'
                  }`}
              >
                <p className={`text-sm leading-relaxed ${message.role === 'user' ? 'text-white' : 'text-slate-700'}`}>
                  {message.content}
                </p>

                {/* Retrieved Info Section */}
                {message.role === 'assistant' && message.retrievedInfo && message.retrievedInfo.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
                      <p className="text-[11px] uppercase tracking-[0.1em] font-bold text-slate-400">Context & Sources</p>
                    </div>

                    <div className="grid gap-3">
                      {message.retrievedInfo.map((info: any, idx: number) => {
                        const source = info.metadata?.source || '';
                        const fileName = source.split(/[\\/]/).pop() || 'Unknown Document';
                        const page = info.metadata?.loc?.pageNumber || info.metadata?.page;

                        return (
                          <div key={idx} className="group relative bg-slate-50/50 hover:bg-white rounded-xl p-4 border border-slate-100 transition-all duration-200 hover:shadow-md hover:border-blue-100">
                            {/* Metadata Header */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md border border-blue-100">
                                  SOURCE {idx + 1}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium truncate max-w-[150px]">
                                  {fileName}
                                </span>
                              </div>
                              {page !== undefined && (
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-sm">
                                  <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                                  PAGE {page}
                                </span>
                              )}
                            </div>

                            {/* Content Snippet */}
                            <div className="relative">
                              <p className="text-xs text-slate-600 leading-relaxed italic pr-2 border-l-2 border-slate-200 pl-3">
                                "{typeof info === 'string' ? info : (info.pageContent || 'No text content available')}"
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start animate-fadeIn">
            <div className="bg-white border border-slate-200 text-slate-900 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
              <div className="flex gap-2 items-center">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm text-slate-500 ml-2">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="border-t border-slate-200 bg-white p-4 shadow-lg">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={loading}
            className="flex-1 px-4 py-3 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-500 transition-all placeholder-slate-400"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 font-medium shadow-sm hover:shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-xs text-slate-400 mt-3 ml-4">
          💡 Tip: Be specific with your questions for better answers
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        :global(.animate-fadeIn) {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
