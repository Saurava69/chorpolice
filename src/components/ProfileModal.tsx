import React, { useState } from 'react';
import { X, Trophy, Check, History, Edit2 } from 'lucide-react';
import { sound } from '../utils/sound';
import { Language, TRANSLATIONS } from '../utils/i18n';
import {
  AVATAR_OPTIONS,
  getMatchHistory,
  MatchHistoryRecord,
  saveProfile,
  UserProfile,
} from '../utils/storage';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  language,
  profile,
  onUpdateProfile,
}) => {
  if (!isOpen) return null;
  const t = TRANSLATIONS[language];
  const isHi = language === 'hi';

  const [nickname, setNickname] = useState(profile.nickname);
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatar);
  const [isEditing, setIsEditing] = useState(false);
  const history: MatchHistoryRecord[] = getMatchHistory();

  const handleSave = () => {
    sound.playClick();
    const updated: UserProfile = {
      ...profile,
      nickname: nickname.trim() || 'Maharaja Player',
      avatar: selectedAvatar,
    };
    saveProfile(updated);
    onUpdateProfile(updated);
    setIsEditing(false);
  };

  const winRate =
    profile.gamesPlayed > 0
      ? Math.round((profile.gamesWon / profile.gamesPlayed) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg max-h-[90vh] bg-[#121524] border border-amber-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <h2 className="font-royal text-lg font-bold text-amber-200">
              {t.statsHistory}
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

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* Profile Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-slate-900/70 to-slate-950 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-3xl shadow-inner">
                {selectedAvatar}
              </div>
              <div>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      maxLength={20}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 border border-amber-500/50 text-white text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                    <button
                      onClick={handleSave}
                      className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition"
                      title="Save"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white font-royal tracking-wide">
                      {profile.nickname}
                    </h3>
                    <button
                      onClick={() => {
                        sound.playClick();
                        setIsEditing(true);
                      }}
                      className="p-1 text-slate-400 hover:text-amber-400 transition"
                      title="Edit Profile"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <p className="text-xs text-amber-300/80 font-mono mt-0.5">
                  {profile.totalPoints.toLocaleString()} {isHi ? 'कुल अंक' : 'Total Points'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-amber-400 font-mono">
                {winRate}%
              </span>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                {isHi ? 'जीत दर' : 'Win Rate'}
              </p>
            </div>
          </div>

          {/* Avatar Picker if editing */}
          {isEditing && (
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <p className="text-xs font-semibold text-amber-300 mb-2">
                {isHi ? 'शाही अवतार चुनें:' : 'Choose Royal Avatar:'}
              </p>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_OPTIONS.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      sound.playClick();
                      setSelectedAvatar(item.emoji);
                    }}
                    className={`p-2 rounded-xl text-xl flex items-center justify-center transition border ${
                      selectedAvatar === item.emoji
                        ? 'bg-amber-500/30 border-amber-400 scale-105 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                    }`}
                    title={item.label}
                  >
                    {item.emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              {isHi ? 'आंकड़े' : 'Career Statistics'}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-center">
                <span className="text-xl font-bold text-white font-mono">
                  {profile.gamesPlayed}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isHi ? 'कुल खेल' : 'Played'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-center">
                <span className="text-xl font-bold text-amber-400 font-mono">
                  {profile.gamesWon}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isHi ? 'जीते' : 'Won'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-center">
                <span className="text-xl font-bold text-emerald-400 font-mono">
                  {profile.successfulGuesses}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isHi ? 'सिपाही पकड़' : 'Catches'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-center">
                <span className="text-xl font-bold text-rose-400 font-mono">
                  {profile.escapedAsChor}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isHi ? 'चोर बच निकला' : 'Escaped'}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Match History */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              {isHi ? 'हाल के मैच' : 'Recent Matches'}
            </h4>

            {history.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                {isHi
                  ? 'अभी तक कोई मैच नहीं खेला गया। नया गेम शुरू करें!'
                  : 'No matches recorded yet. Start a new game!'}
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {history.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-300">
                          👑 {m.winnerName}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">
                          {m.mode}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {m.rounds} rounds • {m.date}
                      </p>
                    </div>
                    <div className="font-mono font-bold text-amber-400 text-sm">
                      {m.winnerScore} pts
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-end">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
          >
            {isHi ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
