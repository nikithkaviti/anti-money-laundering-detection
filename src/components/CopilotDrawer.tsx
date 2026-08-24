import React, { useState } from 'react';
import { X, Sparkles, Send, Bot, User, ShieldAlert, BookOpen, AlertCircle } from 'lucide-react';

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! I am your AI AML Compliance & Regulatory Copilot. I can assist with FinCEN advisory interpretations, 31 CFR Chapter X requirements, structuring investigations, graph layering analysis, and red flag checklists. How can I assist your case today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue;
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userText,
        }),
      });
      const data = await res.json();

      const aiMsg: Message = {
        id: `msg-ai-${Date.now()}`,
        sender: 'assistant',
        text: data.answer || 'I apologize, but I could not analyze the query at this moment.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          sender: 'assistant',
          text: 'Encountered an error communicating with the compliance intelligence service.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputValue(prompt);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full shadow-2xl flex flex-col z-50 text-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                AI Compliance & FinCEN Copilot
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Gemini 3.7
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Regulatory Advisory, SAR Standards & Typology Guidance</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-wrap'
                }`}
              >
                {msg.text}
                <div className={`text-[9px] mt-1.5 ${msg.sender === 'user' ? 'text-blue-200 text-right' : 'text-slate-500'}`}>
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none p-3 text-xs text-indigo-300 flex items-center gap-2">
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-indigo-400 border-t-transparent"></div>
                Analyzing regulatory corpus and network typologies...
              </div>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex flex-wrap gap-1.5">
          <button
            onClick={() => handleQuickPrompt('What are the statutory requirements for filing a SAR under 31 U.S.C. 5324 for structuring?')}
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-[10px] text-slate-300 hover:text-white transition-colors"
          >
            Structuring (31 USC 5324)
          </button>
          <button
            onClick={() => handleQuickPrompt('Explain the key red flags of circular fund routing and trade-based laundering.')}
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-[10px] text-slate-300 hover:text-white transition-colors"
          >
            Circular Fund Red Flags
          </button>
          <button
            onClick={() => handleQuickPrompt('How should shell companies with high offshore velocity be triaged?')}
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-[10px] text-slate-300 hover:text-white transition-colors"
          >
            Shell Corp Triage
          </button>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask compliance advisory or legal question..."
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition-colors flex items-center justify-center shadow"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
