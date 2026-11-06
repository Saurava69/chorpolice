import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';
import { sound } from '../utils/sound';
import { Language, TRANSLATIONS } from '../utils/i18n';
import { ChatMessage } from '../game/types';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  language: Language;
  currentUserId: string;
}

const QUICK_EMOJIS = ['👑', '🕵️', '⚔️', '💰', '😂', '🤫', '🔥', '👏'];

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  language,
  currentUserId,
}) => {
  const t = TRANSLATIONS[language];
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-sm h-full bg-[#111422] border-l border-amber-500/20 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-amber-400" />
            <h3 className="font-royal text-sm font-bold text-amber-200">
              {language === 'hi' ? 'शाही चैट' : 'Room Chat'}
            </h3>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
              {messages.length}
            </span>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
            aria-label="Close Chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center space-y-1">
              <MessageCircle className="w-8 h-8 opacity-40 text-amber-400" />
              <p>{language === 'hi' ? 'कमरे में कोई संदेश नहीं है।' : 'No messages yet.'}</p>
              <p className="text-[10px] text-slate-600">
                {language === 'hi' ? 'पहला संदेश या इमोजी भेजें!' : 'Send a greeting or bluff reaction!'}
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5 px-1">
                    <span>{msg.senderAvatar}</span>
                    <span className="font-bold text-slate-300">
                      {isMine ? (language === 'hi' ? 'आप' : 'You') : msg.senderName}
                    </span>
                    <span className="text-[9px] text-slate-500">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs ${
                      isMine
                        ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-xs'
                        : 'bg-slate-800/90 text-white border border-slate-700/80 rounded-tl-xs'
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

        {/* Quick Reactions */}
        <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between gap-1 overflow-x-auto">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSendEmoji(emoji)}
              className="p-1.5 rounded-lg text-lg hover:bg-slate-800 transition active:scale-125 shrink-0"
              title={`Send ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSubmit}
          className="p-3 border-t border-slate-800 bg-slate-900/80 flex gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            maxLength={160}
            placeholder={t.chatPlaceholder}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition disabled:opacity-40"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
