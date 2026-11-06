import React from 'react';
import { LogOut, AlertTriangle, X } from 'lucide-react';
import { sound } from '../utils/sound';
import { Language } from '../utils/i18n';

interface ExitGameModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirmExit: () => void;
  language: Language;
  isOnline?: boolean;
}

export const ExitGameModal: React.FC<ExitGameModalProps> = ({
  isOpen,
  onCancel,
  onConfirmExit,
  language,
  isOnline = false,
}) => {
  if (!isOpen) return null;
  const isHi = language === 'hi';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-[#111422] border border-amber-500/30 rounded-2xl shadow-2xl p-5 text-center space-y-4">
        {/* Warning Icon with Amber Glow */}
        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-lg shadow-amber-500/10">
          <AlertTriangle className="w-6 h-6" />
        </div>

        {/* Text */}
        <div className="space-y-1.5">
          <h3 className="font-royal text-lg font-bold text-white tracking-wide">
            {isHi ? 'क्या आप खेल छोड़ना चाहते हैं?' : 'Exit Current Game?'}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed px-2">
            {isHi
              ? isOnline
                ? 'यदि आप अभी बाहर निकलते हैं तो आप इस ऑनलाइन कमरे से हट जाएंगे।'
                : 'वर्तमान राउंड और मैच के अंक समाप्त हो जाएंगे। क्या आप निश्चित हैं?'
              : isOnline
              ? 'Leaving now will disconnect you from the active online room.'
              : 'Current match progress and scores will be abandoned. Are you sure you want to return to Home?'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-1">
          <button
            onClick={() => {
              sound.playClick();
              onCancel();
            }}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
          >
            {isHi ? 'खेलते रहें' : 'Keep Playing'}
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onConfirmExit();
            }}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-950/40 flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isHi ? 'गेम छोड़ें' : 'Exit Game'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
