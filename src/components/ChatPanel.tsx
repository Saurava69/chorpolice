import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { sound } from '../utils/sound';
import { Language, TRANSLATIONS } from '../utils/i18n';
import { ChatMessage } from '../game/types';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  language: Language;
  currentUserId: string;
  isOpen?: boolean;
  onClose?: () => void;
  variant?: 'sideway' | 'drawer' | 'integrated';
}

const QUICK_EMOJIS = ['👑', '🕵️', '⚔️', '💰', '😂', '🤫', '🔥', '👏'];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  language,
  currentUserId,
  isOpen = true,
  onClose,
  variant = 'integrated',
}) => {
  const t = TRANSLATIONS[language];
  const isHi = language === 'hi';
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      sound.playClick();
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const handleSendEmoji = (emoji: string) => {
    sound.playClick();
    onSendMessage(emoji);
  };

  const chatContent = (
    <div className="w-full h-full bg-[#101322] border border-amber-500/25 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-royal text-xs font-bold text-amber-200 tracking-wide">
                {isHi ? 'शाही चैट' : 'Live Court Chat'}
              </h3>
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>LIVE</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {messages.length} {isHi ? 'संदेश' : 'messages'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Mobile minimize/expand toggle */}
          <button
            onClick={() => {
              sound.playClick();
              setIsMinimized((prev) => !prev);
            }}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition"
            title={isMinimized ? 'Expand Chat' : 'Minimize Chat'}
          >
            {isMinimized ? (
              <ChevronUp className="w-4 h-4 text-amber-400" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {onClose && (
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close Chat"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main chat body when not minimized */}
      {!isMinimized ? (
        <>
          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[110px] max-h-[160px] sm:max-h-[200px] lg:max-h-[460px]">
            {messages.length === 0 ? (
              <div className="h-full min-h-[100px] flex flex-col items-center justify-center text-slate-500 text-xs text-center space-y-1 p-2">
                <div className="w-8 h-8 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-amber-400/60 text-base">
                  💬
                </div>
                <p className="font-medium text-slate-300 text-[11px]">
                  {isHi ? 'कमरे में कोई संदेश नहीं है' : 'Quiet in the Court'}
                </p>
                <p className="text-[10px] text-slate-500 max-w-[220px]">
                  {isHi
                    ? 'साथी खिलाड़ियों से चैट करें, रणनीति बनाएं या ब्लफ करें!'
                    : 'Chat with players live! Share hints, bluff, or discuss suspects.'}
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.senderId === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group`}
                  >
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5 px-1">
                      <span>{msg.senderAvatar}</span>
                      <span className="font-semibold text-slate-300">
                        {isMine ? (isHi ? 'आप' : 'You') : msg.senderName}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div
                      className={`max-w-[85%] px-3 py-1.5 rounded-2xl text-xs break-words shadow-sm transition ${
                        isMine
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-medium rounded-tr-xs'
                          : 'bg-slate-800/90 text-slate-100 border border-slate-700/70 rounded-tl-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reaction Bar */}
          <div className="px-2.5 py-1 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between gap-1 overflow-x-auto">
            <div className="flex items-center gap-1">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSendEmoji(emoji)}
                  className="p-1 rounded-lg text-base hover:bg-slate-800 transition active:scale-125 shrink-0"
                  title={`Send ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Message Input Box */}
          <form
            onSubmit={handleSubmit}
            className="p-2.5 border-t border-slate-800 bg-slate-900/90 flex gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              maxLength={140}
              placeholder={isHi ? 'संदेश टाइप करें...' : 'Type message here...'}
              className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md shadow-amber-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
              title="Send"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </>
      ) : (
        /* Minimized bar: shows quick latest message teaser on mobile */
        <div
          onClick={() => setIsMinimized(false)}
          className="px-3 py-2 text-xs text-slate-400 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition"
        >
          <span className="truncate text-[11px]">
            {messages.length > 0
              ? `${messages[messages.length - 1].senderName}: "${messages[messages.length - 1].text}"`
              : (isHi ? 'चैट खोलने के लिए टैप करें' : 'Tap to expand live chat')}
          </span>
          <span className="text-[10px] text-amber-400 font-bold shrink-0 ml-2">
            {isHi ? 'विस्तार करें' : 'Expand'}
          </span>
        </div>
      )}
    </div>
  );

  // Integrated mode: always visible on both desktop (sideways) and mobile (inline below game board)
  if (variant === 'integrated') {
    if (!isOpen) return null;
    return (
      <aside
        id="royal-room-chat"
        className={`w-full lg:w-80 shrink-0 flex flex-col animate-fade-in transition-all duration-300 ${
          isMinimized
            ? 'h-auto'
            : 'h-[270px] sm:h-[300px] lg:h-[600px] max-h-[85vh]'
        }`}
      >
        {chatContent}
      </aside>
    );
  }

  // Pure sideway docked mode
  if (variant === 'sideway') {
    if (!isOpen) return null;
    return (
      <aside className="w-full lg:w-80 shrink-0 h-[540px] lg:h-[600px] max-h-[85vh] flex flex-col animate-fade-in">
        {chatContent}
      </aside>
    );
  }

  // Drawer modal mode (fallback if explicitly requested)
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in lg:hidden">
      <div className="w-full max-w-sm h-full p-2 flex flex-col">
        {chatContent}
      </div>
    </div>
  );
};
