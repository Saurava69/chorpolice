import React, { useState } from 'react';
import {
  ArrowLeft,
  Copy,
  Check,
  Video,
  ExternalLink,
  MessageCircle,
  Play,
  Bot,
  UserCheck,
  UserX,
  Edit3,
} from 'lucide-react';
import { sound } from '../../utils/sound';
import { Language, TRANSLATIONS } from '../../utils/i18n';
import { Player } from '../../game/types';
import { formatMeetUrl, generateMeetSpaceCode, openGoogleMeet } from '../../utils/meet';

interface OnlineLobbyProps {
  roomCode: string;
  players: Player[];
  currentUserId: string;
  hostPlayerId: string;
  meetSession?: {
    meetingUrl: string;
    status: 'READY' | 'ACTIVE';
    createdAt: number;
  };
  language: Language;
  onBack: () => void;
  onToggleReady: (ready: boolean) => void;
  onStartGame: () => void;
  onFillBots: () => void;
  onSetMeetUrl: (url: string) => void;
  onOpenChat: () => void;
  chatCount: number;
}

export const OnlineLobby: React.FC<OnlineLobbyProps> = ({
  roomCode,
  players,
  currentUserId,
  hostPlayerId,
  meetSession,
  language,
  onBack,
  onToggleReady,
  onStartGame,
  onFillBots,
  onSetMeetUrl,
  onOpenChat,
  chatCount,
}) => {
  const t = TRANSLATIONS[language];
  const isHi = language === 'hi';
  const isHost = currentUserId === hostPlayerId;

  const [copied, setCopied] = useState(false);
  const [showMeetInput, setShowMeetInput] = useState(false);
  const [customMeetUrl, setCustomMeetUrl] = useState('');

  const me = players.find((p) => p.id === currentUserId);
  const isMeReady = me?.isReady ?? false;
  const allReady = players.length === 4 && players.every((p) => p.isReady);

  const handleCopyCode = () => {
    sound.playClick();
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateMeet = () => {
    sound.playClick();
    const newCode = generateMeetSpaceCode();
    const url = formatMeetUrl(newCode);
    onSetMeetUrl(url);
    setShowMeetInput(false);
  };

  const handleSaveCustomMeet = (e: React.FormEvent) => {
    e.preventDefault();
    if (customMeetUrl.trim()) {
      sound.playClick();
      onSetMeetUrl(formatMeetUrl(customMeetUrl.trim()));
      setShowMeetInput(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full px-4 py-4 space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <button
          onClick={() => {
            sound.playClick();
            onBack();
          }}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isHi ? 'पीछे' : 'Leave'}</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Room Code Badge */}
          <div
            onClick={handleCopyCode}
            className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold hover:bg-amber-500/25 transition active:scale-95"
            title="Click to copy code"
          >
            <span>{roomCode}</span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-amber-400" />
            )}
          </div>

          {/* Chat Button (Mobile drawer trigger) */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenChat();
            }}
            className="lg:hidden relative p-2 rounded-xl bg-slate-800 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-white transition"
            title="Chat"
          >
            <MessageCircle className="w-4 h-4" />
            {chatCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] flex items-center justify-center">
                {chatCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Google Meet Banner Section */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/20 to-slate-900 border border-emerald-500/30 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
              <Video className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-200">
                {t.googleMeet}
              </span>
              <p className="text-[10px] text-emerald-400/80">
                {meetSession
                  ? t.meetActive
                  : isHi
                  ? 'वैकल्पिक वॉइस और वीडियो कॉल'
                  : 'Optional social voice & video layer'}
              </p>
            </div>
          </div>

          {meetSession ? (
            <button
              onClick={() => {
                sound.playClick();
                openGoogleMeet(meetSession.meetingUrl);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 shadow-md shadow-emerald-500/20 transition active:scale-95"
            >
              <span>{t.joinMeet}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          ) : isHost ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCreateMeet}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs hover:bg-emerald-500/30 transition"
              >
                + {t.createMeet}
              </button>
              <button
                onClick={() => setShowMeetInput((p) => !p)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                title="Custom URL"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-[10px] text-slate-500 italic">
              {isHi ? 'होस्ट लिंक बना सकते हैं' : 'Host can attach Meet link'}
            </span>
          )}
        </div>

        {/* Custom Meet URL input if opened */}
        {showMeetInput && (
          <form onSubmit={handleSaveCustomMeet} className="flex gap-2 pt-2 border-t border-slate-800">
            <input
              type="text"
              value={customMeetUrl}
              onChange={(e) => setCustomMeetUrl(e.target.value)}
              placeholder="meet.google.com/xxx-yyyy-zzz"
              className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-600 focus:outline-none"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
            >
              Save
            </button>
          </form>
        )}
      </div>

      {/* 4 Player Slots */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-bold uppercase tracking-wider">
            {t.players} ({players.length}/4)
          </span>
          {players.length < 4 && isHost && (
            <button
              onClick={() => {
                sound.playClick();
                onFillBots();
              }}
              className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>{t.fillWithBots}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2">
          {[0, 1, 2, 3].map((slotIdx) => {
            const player = players[slotIdx];
            if (player) {
              const isSlotHost = player.id === hostPlayerId;
              const isSlotMe = player.id === currentUserId;

              return (
                <div
                  key={player.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition ${
                    isSlotMe
                      ? 'bg-slate-900/90 border-amber-500/40'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shrink-0">
                      {player.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white">
                          {player.name}
                        </span>
                        {isSlotHost && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                            HOST
                          </span>
                        )}
                        {player.isBot && (
                          <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                            BOT
                          </span>
                        )}
                        {isSlotMe && (
                          <span className="text-[10px] text-slate-400">
                            ({isHi ? 'आप' : 'You'})
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {player.connected !== false
                          ? isHi
                            ? 'कनेक्टेड'
                            : 'Connected'
                          : isHi
                          ? 'ऑफलाइन'
                          : 'Disconnected'}
                      </span>
                    </div>
                  </div>

                  {/* Ready indicator */}
                  <div className="flex items-center gap-1">
                    {player.isReady ? (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                        <UserCheck className="w-3 h-3" />
                        <span>{t.ready}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-medium">
                        <UserX className="w-3 h-3" />
                        <span>{t.notReady}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            }

            // Empty Slot
            return (
              <div
                key={`empty_${slotIdx}`}
                className="p-3.5 rounded-2xl border border-dashed border-slate-800/80 bg-slate-900/30 flex items-center justify-between text-xs text-slate-600"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl border border-dashed border-slate-800 flex items-center justify-center text-lg">
                    👤
                  </div>
                  <span>
                    {isHi
                      ? `स्लॉट ${slotIdx + 1}: खिलाड़ी का इंतजार...`
                      : `Slot ${slotIdx + 1}: Waiting for player...`}
                  </span>
                </div>
                {isHost && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onFillBots();
                    }}
                    className="text-[11px] text-amber-500/80 hover:text-amber-400 font-bold"
                  >
                    + {isHi ? 'बॉट जोड़ें' : 'Add Bot'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="space-y-2 pt-2">
        {/* Toggle Ready button for non-host or host */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              sound.playClick();
              onToggleReady(!isMeReady);
            }}
            className={`flex-1 py-3 rounded-2xl font-bold text-xs border transition ${
              isMeReady
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            {isMeReady
              ? isHi
                ? '✓ आप तैयार हैं (क्लिक करके बदलें)'
                : '✓ You are Ready'
              : isHi
                ? 'तैयार मार्क करें'
                : 'Mark as Ready'}
          </button>
        </div>

        {/* Start Game button (Host only) */}
        {isHost ? (
          <button
            onClick={() => {
              sound.playRoyalFanfare();
              onStartGame();
            }}
            disabled={!allReady}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-base shadow-xl shadow-amber-500/20 transition active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>
              {players.length < 4
                ? t.waitingForPlayers
                : !allReady
                ? isHi
                  ? 'सभी खिलाड़ियों के तैयार होने की प्रतीक्षा...'
                  : 'Waiting for all players to be Ready...'
                : t.startGame}
            </span>
          </button>
        ) : (
          <div className="p-3 rounded-2xl bg-slate-900/40 text-center text-xs text-slate-400">
            {isHi
              ? 'होस्ट के गेम शुरू करने की प्रतीक्षा...'
              : 'Waiting for Host to start the royal game...'}
          </div>
        )}
      </div>
    </div>
  );
};
