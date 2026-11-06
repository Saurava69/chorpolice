import React from 'react';
import { Volume2, VolumeX, HelpCircle, Trophy, Globe, Video } from 'lucide-react';
import { sound } from '../utils/sound';
import { Language, TRANSLATIONS } from '../utils/i18n';
import { UserProfile } from '../utils/storage';

interface HeaderProps {
  language: Language;
  onToggleLanguage: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenHowToPlay: () => void;
  onOpenStats: () => void;
  profile: UserProfile;
  activeMeetUrl?: string | null;
  onOpenMeet?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onToggleLanguage,
  soundEnabled,
  onToggleSound,
  onOpenHowToPlay,
  onOpenStats,
  profile,
  activeMeetUrl,
  onOpenMeet,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <header className="w-full bg-[#111422]/90 backdrop-blur-md border-b border-amber-500/20 px-4 py-3 sticky top-0 z-40">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-600 to-amber-800 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-300/40">
            <span className="text-lg">👑</span>
          </div>
          <div>
            <h1 className="font-royal text-lg font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 leading-tight">
              {t.appTitle}
            </h1>
            <p className="text-[10px] text-amber-300/60 font-medium tracking-wider uppercase">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {activeMeetUrl && (
            <button
              onClick={() => {
                sound.playClick();
                onOpenMeet?.();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/30 transition animate-pulse"
              title={t.joinMeet}
            >
              <Video className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Meet</span>
            </button>
          )}

          {/* Language switcher */}
          <button
            onClick={() => {
              sound.playClick();
              onToggleLanguage();
            }}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 text-xs font-semibold transition"
            title={t.language}
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'en' ? 'हिन्दी' : 'EN'}</span>
          </button>

          {/* Sound toggle */}
          <button
            onClick={() => {
              onToggleSound();
            }}
            className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition"
            title={t.sound}
            aria-label={t.sound}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* How to play */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenHowToPlay();
            }}
            className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition"
            title={t.howToPlay}
            aria-label={t.howToPlay}
          >
            <HelpCircle className="w-4 h-4 text-blue-400" />
          </button>

          {/* Stats / Profile */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenStats();
            }}
            className="flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/10 to-amber-700/20 border border-amber-500/30 text-amber-200 hover:border-amber-400 transition"
            title={t.statsHistory}
            aria-label={t.statsHistory}
          >
            <span className="text-base">{profile.avatar}</span>
            <Trophy className="w-3.5 h-3.5 text-amber-400 hidden sm:inline" />
          </button>
        </div>
      </div>
    </header>
  );
};
