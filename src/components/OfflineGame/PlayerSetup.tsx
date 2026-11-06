import React, { useState } from 'react';
import { ArrowLeft, Users, Play, Shuffle } from 'lucide-react';
import { sound } from '../../utils/sound';
import { Language, TRANSLATIONS } from '../../utils/i18n';
import { AVATAR_OPTIONS } from '../../utils/storage';
import { Player } from '../../game/types';

interface PlayerSetupProps {
  language: Language;
  onBack: () => void;
  onStartGame: (players: Player[], maxRounds: number) => void;
}

const PRESET_PLAYER_NAMES = [
  ['Aarav', 'Diya', 'Kabir', 'Meera'],
  ['Rohan', 'Anaya', 'Veer', 'Tara'],
  ['Vikram', 'Pooja', 'Arjun', 'Sita'],
  ['Karan', 'Isha', 'Dev', 'Riya'],
];

const PRESET_AVATARS = ['👑', '🦚', '⚔️', '🎭'];

export const PlayerSetup: React.FC<PlayerSetupProps> = ({
  language,
  onBack,
  onStartGame,
}) => {
  const t = TRANSLATIONS[language];
  const isHi = language === 'hi';

  const [players, setPlayers] = useState<Player[]>([
    { id: 'p1', name: 'Aarav', avatar: '👑', score: 0 },
    { id: 'p2', name: 'Diya', avatar: '🦚', score: 0 },
    { id: 'p3', name: 'Kabir', avatar: '⚔️', score: 0 },
    { id: 'p4', name: 'Meera', avatar: '🎭', score: 0 },
  ]);

  const [maxRounds, setMaxRounds] = useState<number>(5);
  const [activeAvatarPicker, setActiveAvatarPicker] = useState<number | null>(null);

  const handleNameChange = (index: number, newName: string) => {
    const updated = [...players];
    updated[index].name = newName;
    setPlayers(updated);
  };

  const handleAvatarChange = (index: number, emoji: string) => {
    const updated = [...players];
    updated[index].avatar = emoji;
    setPlayers(updated);
    setActiveAvatarPicker(null);
  };

  const handleRandomizeNames = () => {
    sound.playClick();
    const randomSet =
      PRESET_PLAYER_NAMES[Math.floor(Math.random() * PRESET_PLAYER_NAMES.length)];
    const updated = players.map((p, idx) => ({
      ...p,
      name: randomSet[idx] || `Player ${idx + 1}`,
      avatar: PRESET_AVATARS[idx] || '👑',
    }));
    setPlayers(updated);
  };

  const handleStart = () => {
    sound.playRoyalFanfare();
    // Ensure all players have a non-empty name
    const finalPlayers = players.map((p, idx) => ({
      ...p,
      name: p.name.trim() || `Player ${idx + 1}`,
    }));
    onStartGame(finalPlayers, maxRounds);
  };

  return (
    <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full px-4 py-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <button
          onClick={() => {
            sound.playClick();
            onBack();
          }}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isHi ? 'पीछे' : 'Back'}</span>
        </button>

        <h2 className="font-royal text-base font-bold text-amber-200 flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-400" />
          {isHi ? '४ खिलाड़ी सेटअप' : '4 Players Setup'}
        </h2>

        <button
          onClick={handleRandomizeNames}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs flex items-center gap-1 transition"
          title="Randomize Names"
        >
          <Shuffle className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Players list */}
      <div className="space-y-3">
        <p className="text-xs text-slate-400 font-medium">
          {isHi
            ? 'चारों खिलाड़ियों के नाम व शाही अवतार दर्ज करें:'
            : 'Enter names & choose royal avatars for all 4 players:'}
        </p>

        {players.map((player, idx) => (
          <div
            key={player.id}
            className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 focus-within:border-amber-500/50 transition flex items-center gap-3 relative"
          >
            {/* Avatar button */}
            <button
              onClick={() => {
                sound.playClick();
                setActiveAvatarPicker(activeAvatarPicker === idx ? null : idx);
              }}
              className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 hover:border-amber-400 flex items-center justify-center text-2xl transition shrink-0"
              title="Change Avatar"
            >
              {player.avatar}
            </button>

            {/* Name Input */}
            <div className="flex-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {isHi ? `खिलाड़ी ${idx + 1}` : `Player ${idx + 1}`}
              </label>
              <input
                type="text"
                value={player.name}
                onChange={(e) => handleNameChange(idx, e.target.value)}
                maxLength={18}
                placeholder={`Player ${idx + 1}`}
                className="w-full bg-transparent text-white font-semibold text-sm focus:outline-none placeholder:text-slate-600"
              />
            </div>

            {/* Avatar Picker dropdown */}
            {activeAvatarPicker === idx && (
              <div className="absolute top-full left-0 right-0 mt-2 z-30 p-3 bg-slate-950 border border-amber-500/40 rounded-2xl shadow-2xl grid grid-cols-6 gap-2 animate-fade-in">
                {AVATAR_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => {
                      sound.playClick();
                      handleAvatarChange(idx, opt.emoji);
                    }}
                    className="p-2 rounded-xl text-xl hover:bg-slate-800 transition"
                  >
                    {opt.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Rounds selector */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
        <label className="block text-xs font-bold text-slate-300">
          {isHi ? 'मैच की लंबाई (राउंड्स):' : 'Match Length (Rounds):'}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[3, 5, 10].map((r) => (
            <button
              key={r}
              onClick={() => {
                sound.playClick();
                setMaxRounds(r);
              }}
              className={`py-2 rounded-xl text-xs font-bold transition border ${
                maxRounds === r
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-md shadow-amber-500/10'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {r} {isHi ? 'राउंड' : 'Rounds'}
            </button>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-base shadow-xl shadow-amber-500/20 transition active:scale-[0.98] flex items-center justify-center gap-2"
      >
        <Play className="w-5 h-5 fill-current" />
        <span>{isHi ? 'शाही खेल शुरू करें' : 'Start Royal Game'}</span>
      </button>
    </div>
  );
};
