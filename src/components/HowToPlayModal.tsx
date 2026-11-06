import React from 'react';
import { X, Shield, Award, HelpCircle } from 'lucide-react';
import { sound } from '../utils/sound';
import { Language, TRANSLATIONS } from '../utils/i18n';
import { ROLE_DEFINITIONS } from '../game/types';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose, language }) => {
  if (!isOpen) return null;
  const t = TRANSLATIONS[language];
  const isHi = language === 'hi';

  const roles = Object.values(ROLE_DEFINITIONS);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg max-h-[90vh] bg-[#121524] border border-amber-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-amber-400" />
            </div>
            <h2 className="font-royal text-lg font-bold text-amber-200">
              {t.howToPlay}
            </h2>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 overflow-y-auto space-y-6 text-sm text-slate-300">
          {/* Quick intro */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20">
            <p className="leading-relaxed font-medium text-slate-200">
              {isHi
                ? 'राजा मंत्री चोर सिपाही भारत का एक ऐतिहासिक व लोकप्रिय खेल है जिसमें ४ खिलाड़ियों को गुप्त पर्चियों (कार्ड्स) के माध्यम से अलग-अलग पद मिलते हैं।'
                : 'Chor Sipahi (Raja Mantri Chor Sipahi) is the classic Indian four-player bluffing game of royalty, secrets, and deduction.'}
            </p>
          </div>

          {/* The 4 Roles */}
          <div>
            <h3 className="font-royal text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              {isHi ? '४ प्रमुख भूमिकाएं (Roles)' : 'The Four Royal Roles'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roles.map((r) => (
                <div
                  key={r.role}
                  className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{r.badgeEmoji}</span>
                      <span className="font-bold text-white">
                        {isHi ? r.nameHi : r.nameEn}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {r.points} pts
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-snug">
                    {isHi ? r.descriptionHi : r.descriptionEn}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Round Sequence */}
          <div>
            <h3 className="font-royal text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              {isHi ? 'राउंड का क्रम (Game Flow)' : 'Round Flow & Rules'}
            </h3>
            <ol className="space-y-2.5 text-xs">
              <li className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <span className="font-semibold text-slate-100">
                    {isHi ? 'गुप्त पर्ची देखें (Private Reveal): ' : 'Private Role Inspection: '}
                  </span>
                  {isHi
                    ? 'सभी ४ खिलाड़ी बारी-बारी अपनी पर्ची गुप्त रूप से देखते हैं और छिपा लेते हैं।'
                    : 'Each of the 4 players secretly views their assigned role card.'}
                </div>
              </li>
              <li className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <span className="font-semibold text-slate-100">
                    {isHi ? 'राजा की घोषणा (Raja Reveal): ' : 'Raja Announcement: '}
                  </span>
                  {isHi
                    ? 'राजा आगे आकर ऐलान करता है: "मेरा सिपाही कौन?" और सिपाही की पहचान होती है।'
                    : 'The Raja steps forward, announces themselves ("Mera Sipahi Kaun?"), and summons the Sipahi.'}
                </div>
              </li>
              <li className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <span className="font-semibold text-slate-100">
                    {isHi ? 'सिपाही का अनुमान (The Guess): ' : 'Sipahi Investigation: '}
                  </span>
                  {isHi
                    ? 'सिपाही बाकी बचे दो खिलाड़ियों में से चोर को पहचानता है।'
                    : 'The Sipahi investigates the two remaining mystery players and guesses which one is the Chor.'}
                </div>
              </li>
              <li className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">
                  4
                </span>
                <div>
                  <span className="font-semibold text-slate-100">
                    {isHi ? 'अंकों का फैसला (Scoring): ' : 'Point Resolution: '}
                  </span>
                  {isHi
                    ? 'यदि सिपाही ने सही चोर पकड़ा: सिपाही को ५०० अंक, चोर को ०। यदि सिपाही चूका: चोर को ५०० अंक और सिपाही को ०!'
                    : 'If correct: Sipahi gets 500, Chor gets 0. If wrong: Chor escapes with 500 pts, Sipahi gets 0! Raja always gets 1000, Mantri always gets 800.'}
                </div>
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-end">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition"
          >
            {isHi ? 'समझ गया, आगे बढ़ें' : 'Got it, let\'s play!'}
          </button>
        </div>
      </div>
    </div>
  );
};
