import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRestaurant } from '../contexts/RestaurantContext';
import { processCopilotQuery, type CopilotResponse } from '../utils/aiCopilotEngine';
import { 
  X, 
  Send, 
  Sparkles, 
  ChevronRight, 
  Loader2, 
  Zap, 
  Maximize2,
  Brain,
  Terminal
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  table?: { [key: string]: string | number }[];
  recommendations?: string[];
  executedAction?: string;
  actionButtons?: { label: string; route: string }[];
  time: string;
}

export const GlobalAICopilot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      sender: 'assistant',
      text: '⚡ **ServeFlow AI Copilot (Fully Controlled)**\nI have complete visibility and command access to your live POS, floor tables, kitchen queue, and analytics models.\n\n**Try giving me a system command or asking anything:**\n- *"which table is free right now?"*\n- *"which food is most sold?"*\n- *"open kds"*, *"open payments"*, or *"open ai intelligence"*\n- *"clear kds"* or *"make table T01 free"*',
      actionButtons: [
        { label: 'Check Free Tables (`/tables`)', route: '/tables' },
        { label: 'View Kitchen KDS (`/kds`)', route: '/kds' },
        { label: 'Open AI Center (`/ai-intelligence`)', route: '/ai-intelligence' }
      ],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const { tables, orders, menuItems, setTableStatus, updateOrderStatus, showGlobalNotification } = useRestaurant();
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  if (location.pathname.startsWith('/order-now') || location.pathname.startsWith('/mobile-order')) {
    return null;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (queryText?: string) => {
    const q = (queryText || input).trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: q,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInput('');
    setIsTyping(true);

    setTimeout(async () => {
      const response: CopilotResponse = await processCopilotQuery(
        q,
        tables,
        orders,
        menuItems,
        (path) => {
          navigate(path);
          setIsOpen(false);
        },
        { setTableStatus, updateOrderStatus, showGlobalNotification }
      );

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: response.text,
        table: response.table,
        recommendations: response.recommendations,
        executedAction: response.executedAction,
        actionButtons: response.actionButtons,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 400);
  };

  const quickCommands = [
    'Which table is free?',
    'Which food is most sold?',
    'Open Kitchen KDS',
    'Open Dashboard',
    'Pending bills?'
  ];

  return (
    <>
      {/* Floating Action Button (Always Accessible Bottom-Right) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open AI Copilot Assistant"
        className="fixed bottom-6 right-6 z-[99999] flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-primary to-emerald-600 text-on-primary font-bold text-sm shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 group border border-white/20"
      >
        <div className="relative flex items-center justify-center">
          <Brain className="w-5 h-5 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-primary animate-ping"></span>
        </div>
        <span className="font-headline-sm tracking-wide">AI Copilot</span>
        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono uppercase font-black tracking-wider">Control</span>
      </button>

      {/* Expandable Copilot Drawer / Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[99999] w-[90vw] sm:w-[460px] h-[620px] max-h-[80vh] bg-white rounded-3xl shadow-2xl border border-outline-variant flex flex-col overflow-hidden animate-slide-up">
          
          {/* Header */}
          <div className="px-lg py-4 bg-gradient-to-r from-surface-bright via-primary/5 to-surface-bright border-b border-outline-variant flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-inner">
                <Brain className="w-6 h-6 animate-pulse text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-headline-sm font-extrabold text-on-surface text-base">ServeFlow AI Copilot</h3>
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1">
                    <Terminal className="w-3 h-3" /> System Controlled
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant font-medium">Full POS & Navigation Commander</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/ai-intelligence?tab=copilot');
                }}
                title="Open in full screen AI Center"
                className="p-2 rounded-xl hover:bg-surface-container-low text-on-surface-variant transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl hover:bg-surface-container-low text-on-surface-variant transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Suggestions Strip */}
          <div className="px-md py-2 bg-surface-container-low/60 border-b border-outline-variant/30 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] font-bold text-outline uppercase flex items-center gap-1 shrink-0">
              <Zap className="w-3 h-3 text-amber-500" /> Quick:
            </span>
            {quickCommands.map((cmd, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(cmd)}
                className="px-2.5 py-1 rounded-lg bg-white border border-outline-variant text-[11px] font-semibold text-on-surface hover:border-primary hover:text-primary shrink-0 transition-all shadow-2xs"
              >
                {cmd}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-lg space-y-4 bg-surface-bright/40 custom-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                {msg.executedAction && (
                  <div className="mb-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 text-[11px] font-bold animate-fadeIn">
                    <Zap className="w-3.5 h-3.5" />
                    <span>{msg.executedAction}</span>
                  </div>
                )}
                
                <div
                  className={`max-w-[88%] rounded-2xl p-4 text-xs relative leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-primary text-on-primary rounded-tr-none font-medium'
                      : 'bg-white text-on-surface border border-outline-variant/60 rounded-tl-none font-normal'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {/* Render Table if available */}
                  {msg.table && msg.table.length > 0 && (
                    <div className="mt-3 overflow-x-auto border border-outline-variant/40 rounded-xl bg-surface-bright p-2 shadow-inner">
                      <table className="min-w-full text-[10px] text-on-surface">
                        <thead>
                          <tr className="border-b border-outline-variant/30 bg-surface-container-low/50">
                            {Object.keys(msg.table[0]).map((key) => (
                              <th key={key} className="px-2 py-1.5 text-left font-extrabold uppercase tracking-wider text-[9px] text-outline">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {msg.table.map((row, rIdx) => (
                            <tr key={rIdx} className="border-b border-outline-variant/20 last:border-b-0 hover:bg-primary/5 transition-colors">
                              {Object.values(row).map((val: any, cIdx) => (
                                <td key={cIdx} className="px-2 py-1.5 font-bold text-on-surface">
                                  {val}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Render Recommendations if available */}
                  {msg.recommendations && msg.recommendations.length > 0 && (
                    <div className="mt-3 space-y-1.5 border-t border-outline-variant/20 pt-2.5 bg-amber-500/5 -mx-4 -mb-4 p-3 rounded-b-2xl border-x-0 border-b-0">
                      <p className="text-[10px] uppercase font-extrabold text-amber-700 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-600" /> Recommended Actions:
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                        {msg.recommendations.map((rec, idx) => (
                          <li key={idx} className="font-semibold text-[11px] text-on-surface-variant leading-snug">
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Buttons inside chat */}
                  {msg.actionButtons && msg.actionButtons.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-outline-variant/30 flex flex-wrap gap-2">
                      {msg.actionButtons.map((btn, bIdx) => (
                        <button
                          key={bIdx}
                          onClick={() => {
                            navigate(btn.route);
                            setIsOpen(false);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-primary-container/15 text-primary border border-primary/30 hover:bg-primary hover:text-on-primary font-bold text-[11px] flex items-center gap-1 transition-all shadow-2xs"
                        >
                          <span>{btn.label}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  )}

                  <span className={`text-[9px] mt-2 block text-right font-mono ${
                    msg.sender === 'user' ? 'text-on-primary/70' : 'text-outline'
                  }`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-on-surface border border-outline-variant/60 rounded-2xl rounded-tl-none p-3.5 text-xs flex items-center gap-2.5 shadow-sm">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  <span className="text-[11px] text-on-surface-variant font-semibold">Copilot executing system diagnosis & command check...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-surface border-t border-outline-variant flex gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask copilot: 'Which table is free?' or 'Open KDS'..."
              className="flex-1 bg-surface-container-low border border-outline-variant/60 rounded-2xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-on-surface font-medium placeholder:text-outline transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="px-4 bg-primary text-on-primary rounded-2xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 font-bold text-xs disabled:opacity-50 shadow-md shadow-primary/20"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      )}
    </>
  );
};

export default GlobalAICopilot;
