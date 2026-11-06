import React, { useState } from 'react';
import { Smartphone, Users, PlusCircle, LogIn, ArrowRight } from 'lucide-react';
import { sound } from '../utils/sound';
import { Language, TRANSLATIONS } from '../utils/i18n';
import { UserProfile } from '../utils/storage';

interface HomeScreenProps {
  language: Language;
  profile: UserProfile;
  onStartOffline: () => void;
  onCreateOnlineRoom: () => void;
  onJoinOnlineRoom: (code: string) => void;
  onOpenHowToPlay: () => void;
  onOpenStats: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  language,
  profile,
  onStartOffline,
  onCreateOnlineRoom,
  onJoinOnlineRoom,
  onOpenHowToPlay,
  onOpenStats,
}) => {
  const t = TRANSLATIONS[language];
  const isHi = language === 'hi';

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim().length >= 4) {
      sound.playClick();
      onJoinOnlineRoom(joinCode.trim().toUpperCase());
      setShowJoinModal(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full px-4 py-5 space-y-6">
      {/* Royal Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#1c1d32] via-[#141528] to-[#0c0d1c] border border-amber-500/30 p-6 text-center shadow-2xl shadow-amber-950/30">
        {/* Background decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Floating Royal Badges */}
        <div className="flex justify-center items-center gap-2 mb-3">
          <span className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-xl shadow-lg shadow-amber-500/20 animate-bounce">
            👑
          </span>
          <span className="text-amber-400 text-sm">⚔️</span>
          <span className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">
            📜
          </span>
          <span className="text-amber-400 text-sm">⚔️</span>
          <span className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20">
            🛡️
          </span>
          <span className="text-amber-400 text-sm">⚔️</span>
          <span className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-xl shadow-lg shadow-rose-500/20">
            🎭
          </span>
        </div>

        <h2 className="font-royal text-2xl sm:text-3xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-yellow-500 uppercase drop-shadow-sm">
          {t.appTitle}
        </h2>
        <p className="text-xs text-amber-200/70 font-semibold tracking-widest uppercase mt-1">
          {isHi ? 'राजा • मंत्री • चोर • सिपाही' : 'Raja • Mantri • Chor • Sipahi'}
        </p>

        {/* User Mini Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-base">{profile.avatar}</span>
            <span className="font-semibold text-white">{profile.nickname}</span>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onOpenStats();
            }}
            className="text-amber-400 hover:text-amber-300 font-mono font-bold flex items-center gap-1"
          >
            {profile.totalPoints.toLocaleString()} pts
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="space-y-3.5">
        {/* Play Offline (Pass & Play) */}
        <button
          onClick={() => {
            sound.playRoyalFanfare();
            onStartOffline();
          }}
          className="group relative w-full p-4 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-bold shadow-xl shadow-amber-600/30 border border-amber-300/60 transition-all duration-200 active:scale-[0.98] text-left flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-950/20 border border-slate-950/30 flex items-center justify-center text-2xl shadow-inner">
              <Smartphone className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-royal text-lg font-extrabold tracking-wide text-slate-950">
                  {t.playOffline}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-950/20 text-[10px] font-bold uppercase tracking-wider text-slate-950">
                  1 Device
                </span>
              </div>
              <p className="text-xs text-slate-900/80 font-medium">
                {t.playOfflineDesc}
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-950/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </div>
        </button>

        {/* Play Online - 2 Cards: Create Room & Join Room */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="font-royal text-sm font-bold text-white tracking-wide">
                {t.playOnline}
              </span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Google Meet Ready
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Create Room */}
            <button
              onClick={() => {
                sound.playClick();
                onCreateOnlineRoom();
              }}
              className="p-3.5 rounded-xl bg-gradient-to-br from-blue-600/30 to-indigo-900/40 border border-blue-500/40 hover:border-blue-400 text-left transition active:scale-[0.98] group"
            >
              <PlusCircle className="w-5 h-5 text-blue-400 mb-1.5 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-sm text-white">{t.createRoom}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isHi ? 'नया रूम बनाएं' : 'Host 4-player room'}
              </p>
            </button>

            {/* Join Room */}
            <button
              onClick={() => {
                sound.playClick();
                setShowJoinModal(true);
              }}
              className="p-3.5 rounded-xl bg-gradient-to-br from-purple-600/30 to-violet-900/40 border border-purple-500/40 hover:border-purple-400 text-left transition active:scale-[0.98] group"
            >
              <LogIn className="w-5 h-5 text-purple-400 mb-1.5 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-sm text-white">{t.joinRoom}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isHi ? 'कोड से जुड़ें' : 'Enter 6-char code'}
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Info & Rules Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>👑 1,000</span>
          <span>•</span>
          <span>📜 800</span>
          <span>•</span>
          <span>⚔️ 500</span>
          <span>•</span>
          <span>🎭 0/500</span>
        </div>
        <button
          onClick={() => {
            sound.playClick();
            onOpenHowToPlay();
          }}
          className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2"
        >
          {t.howToPlay}
        </button>
      </div>

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-[#121524] border border-amber-500/40 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-royal text-base font-bold text-amber-200">
                {t.joinRoom}
              </h3>
              <button
                onClick={() => setShowJoinModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleJoinSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t.enterCodePrompt}
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  placeholder="e.g. A9B2X7"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-amber-500/40 text-center font-mono text-xl font-bold tracking-widest text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                >
                  {t.cancelAction}
                </button>
                <button
                  type="submit"
                  disabled={joinCode.trim().length < 4}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
                >
                  {t.joinAction}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
