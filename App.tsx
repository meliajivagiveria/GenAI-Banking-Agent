import React, { useState, useRef, useEffect } from 'react';
import { streamBankingResponse } from './services/geminiService';
import { Message, AgentType } from './types';
import { QUICK_ACTIONS } from './constants';
import MarkdownRenderer from './components/MarkdownRenderer';
import AgentBadge from './components/AgentBadge';
import { GenerateContentResponse } from '@google/genai';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const detectAgent = (text: string): AgentType | undefined => {
    if (text.includes('CALL: AMA') || text.includes('**AMA**')) return AgentType.AMA;
    if (text.includes('CALL: TPA') || text.includes('**TPA**')) return AgentType.TPA;
    if (text.includes('CALL: CSA') || text.includes('**CSA**')) return AgentType.CSA;
    if (text.includes('CALL: FRA') || text.includes('**FRA**')) return AgentType.FRA;
    return undefined;
  };

  const handleSend = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue('');
    setIsLoading(true);

    const botMessageId = (Date.now() + 1).toString();
    // Initialize bot message placeholder
    setMessages((prev) => [
      ...prev,
      {
        id: botMessageId,
        role: 'model',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
        detectedAgent: AgentType.DISPATCHER
      },
    ]);

    try {
      // Format history for API
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const stream = await streamBankingResponse(content, history);
      
      let fullText = '';
      let currentAgent = AgentType.DISPATCHER;

      for await (const chunk of stream) {
        const c = chunk as GenerateContentResponse;
        const textChunk = c.text;
        
        if (textChunk) {
            fullText += textChunk;
            
            // Real-time agent detection from the stream
            const detected = detectAgent(fullText);
            if (detected) {
                currentAgent = detected;
            }

            setMessages((prev) =>
                prev.map((msg) =>
                msg.id === botMessageId
                    ? { ...msg, content: fullText, detectedAgent: currentAgent }
                    : msg
                )
            );
        }
      }
      
      // Finalize message
       setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId
            ? { ...msg, isStreaming: false }
            : msg
        )
      );

    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message?.includes('API_KEY') 
        ? `**Configuration Error**: ${error.message}`
        : '**System Error**: Unable to reach banking core. Please try again later.';

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId
            ? { ...msg, content: errorMessage, isStreaming: false, detectedAgent: AgentType.SYSTEM }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputValue);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative font-sans">
      {/* Header */}
      <header className="flex-none bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-bank-600 rounded-lg flex items-center justify-center shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Vertex Banking AI</h1>
            <p className="text-xs text-slate-500 font-medium">Secure Agentic Architecture</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4 text-xs font-semibold text-slate-400">
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> System Online</span>
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-bank-500"></span> Gemini 2.5 Flash</span>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-40 select-none">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
             </svg>
             <p className="text-lg font-medium text-slate-500">Awaiting Banking Instruction</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] md:max-w-[75%] lg:max-w-[65%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              
              {/* Message Metadata */}
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                    {msg.role === 'user' ? 'Customer' : 'Banking Agent'}
                </span>
                <span className="text-[10px] text-slate-300">•</span>
                <span className="text-[10px] text-slate-400">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Message Content */}
              <div
                className={`relative px-5 py-4 rounded-2xl shadow-sm text-sm ${
                  msg.role === 'user'
                    ? 'bg-bank-600 text-white rounded-tr-sm'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                }`}
              >
                 {msg.role === 'model' && msg.detectedAgent && (
                     <div className="mb-3 border-b border-slate-100 pb-2">
                         <AgentBadge type={msg.detectedAgent} />
                     </div>
                 )}
                 
                 {msg.role === 'user' ? (
                     <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                 ) : (
                     <div className="min-h-[20px]">
                         <MarkdownRenderer content={msg.content} />
                         {msg.isStreaming && <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-bank-400 animate-pulse"></span>}
                     </div>
                 )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="flex-none bg-white p-4 border-t border-slate-200">
        
        {/* Quick Actions (only show when not loading) */}
        {!isLoading && messages.length < 2 && (
            <div className="flex overflow-x-auto gap-2 pb-4 mb-2 scrollbar-hide">
                {QUICK_ACTIONS.map((action, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleSend(action.prompt)}
                        className="flex-none whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600 hover:bg-bank-50 hover:border-bank-200 hover:text-bank-700 transition-colors"
                    >
                        {action.label}
                    </button>
                ))}
            </div>
        )}

        <div className="max-w-4xl mx-auto flex gap-3 relative">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your banking request (e.g., Transfer, Check Balance)..."
              className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-bank-500 focus:bg-white resize-none text-sm shadow-inner transition-all"
              rows={1}
              style={{ minHeight: '50px' }}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={() => handleSend(inputValue)}
            disabled={!inputValue.trim() || isLoading}
            className={`flex-none w-12 h-12 flex items-center justify-center rounded-xl transition-all shadow-md ${
              !inputValue.trim() || isLoading
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-bank-600 text-white hover:bg-bank-700 active:scale-95'
            }`}
          >
            {isLoading ? (
               <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
            ) : (
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
               </svg>
            )}
          </button>
        </div>
        <div className="text-center mt-2">
            <p className="text-[10px] text-slate-400">Powered by Google Gemini • Banking Compliance Mode Active</p>
        </div>
      </footer>
    </div>
  );
};

export default App;