import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  RotateCcw,
  Bot,
  User,
  Shield,
  Info,
  ChevronDown,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import { ChatMessage, sendChatMessage } from '../utils/geminiApi';

interface GeminiHelpChatProps {
  onOpenTouchup?: () => void;
  onSelectAiBackdropTab?: () => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-1',
    role: 'model',
    text: "Hi! I'm your BackgroundOff assistant. Ask me anything about removing backgrounds, using the touch-up brush, generating AI backdrops, or exporting high-res images.",
    timestamp: Date.now(),
  },
];

const SUGGESTED_QUESTIONS = [
  'How do I export as transparent PNG?',
  'How do I use the manual touch-up brush?',
  'How do I generate an AI backdrop?',
  'Why is my export blurry?',
];

export const GeminiHelpChat: React.FC<GeminiHelpChatProps> = ({
  onOpenTouchup,
  onSelectAiBackdropTab,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputText('');
    setIsLoading(true);
    setHasInteracted(true);

    try {
      const reply = await sendChatMessage(text, newHistory);
      const assistantMessage: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: reply,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: err?.message || 'Sorry, I had trouble connecting. Please try asking again.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages(INITIAL_MESSAGES);
    setInputText('');
    setHasInteracted(false);
  };

  const renderMessageContent = (text: string) => {
    // Check if the answer mentions specific features to render handy action buttons
    const mentionsTouchup = text.toLowerCase().includes('touch-up') || text.toLowerCase().includes('brush');
    const mentionsAiBackdrop = text.toLowerCase().includes('ai backdrop') || text.toLowerCase().includes('generate with ai');

    return (
      <div className="space-y-2">
        <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap font-normal">
          {text}
        </p>

        {/* Quick action buttons embedded in responses */}
        {(mentionsTouchup || mentionsAiBackdrop) && (
          <div className="pt-1 flex flex-wrap gap-1.5 border-t border-slate-100/60 mt-2">
            {mentionsTouchup && onOpenTouchup && (
              <button
                onClick={() => {
                  onOpenTouchup();
                  setIsOpen(false);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-bold hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                <span>Open Touch-Up Brush</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
            {mentionsAiBackdrop && onSelectAiBackdropTab && (
              <button
                onClick={() => {
                  onSelectAiBackdropTab();
                  setIsOpen(false);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-[11px] font-bold hover:bg-purple-100 transition-colors cursor-pointer"
              >
                <span>Try AI Backdrop</span>
                <Sparkles className="w-3 h-3 text-purple-600" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Floating Toggle Button (Bottom-Right) */}
      <div className="fixed bottom-5 right-5 z-40 print:hidden flex flex-col items-end">
        {!isOpen && (
          <button
            id="open-gemini-chat-btn"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2 px-4 py-3 rounded-full bg-slate-900 text-white shadow-xl hover:bg-indigo-600 hover:shadow-indigo-500/25 active:scale-95 transition-all duration-200 cursor-pointer border border-slate-700/80"
            title="Ask AI Assistant for help"
          >
            <div className="relative flex items-center justify-center">
              <Bot className="w-5 h-5 text-indigo-400 group-hover:text-white transition-colors" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
            </div>
            <span className="text-xs font-bold tracking-wide">Ask Assistant</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </button>
        )}
      </div>

      {/* Expanded Chat Drawer / Card */}
      {isOpen && (
        <div
          id="gemini-help-chat-panel"
          className="fixed bottom-4 right-4 z-50 w-[92vw] sm:w-[380px] max-h-[580px] h-[82vh] bg-white rounded-3xl border border-slate-200/90 shadow-2xl flex flex-col overflow-hidden animate-fade-in"
        >
          {/* Header */}
          <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between gap-2 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs sm:text-sm font-bold text-white leading-none">
                    BackgroundOff AI
                  </h4>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  In-App Help Assistant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Reset session chat"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                id="close-gemini-chat-btn"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* AI Accuracy & Privacy Disclaimer Banner */}
          <div className="px-3.5 py-2 bg-amber-50/90 border-b border-amber-200/60 text-amber-900 text-[11px] font-medium flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="leading-tight">
              This is an AI assistant, responses may not always be accurate.
            </span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] p-3 rounded-2xl ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-xs shadow-xs'
                        : 'bg-white text-slate-800 rounded-bl-xs border border-slate-200/80 shadow-2xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="text-xs sm:text-[13px] leading-relaxed font-medium">
                        {msg.text}
                      </p>
                    ) : (
                      renderMessageContent(msg.text)
                    )}
                  </div>

                  {isUser && (
                    <div className="w-6 h-6 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing / Loading indicator */}
            {isLoading && (
              <div className="flex items-start gap-2 justify-start animate-fade-in">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-slate-200/80 p-3 rounded-2xl rounded-bl-xs shadow-2xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips (if early in session) */}
          {!hasInteracted && (
            <div className="px-3 pt-2 pb-1.5 bg-white border-t border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Suggested Questions
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSendMessage(q)}
                    className="text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 px-2.5 py-1 rounded-lg border border-slate-200/60 transition-colors text-left cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-200/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about exports, brush, backdrops..."
                disabled={isLoading}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-xs"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-1 font-medium">
              <span>Privacy-first • Session only</span>
              <span>Gemini 3.7 Flash</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
