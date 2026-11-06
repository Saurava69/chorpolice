import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Video,
  ExternalLink,
  MessageCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Home,
  Shield,
  LogOut,
} from 'lucide-react';
import { sound } from '../../utils/sound';
import { Language, TRANSLATIONS } from '../../utils/i18n';
import { GameRound, GameState, Player, ROLE_DEFINITIONS, Role } from '../../game/types';
import { openGoogleMeet } from '../../utils/meet';
import { ExitGameModal } from '../ExitGameModal';

interface OnlineGameViewProps {
  gameState: GameState;
  myRole: Role | null;
  currentUserId: string;
  hostPlayerId: string;
  language: Language;
  onRajaReveal: () => void;
  onSubmitGuess: (targetPlayerId: string) => void;
  onNextRound: () => void;
  onExitHome: () => void;
  onOpenChat: () => void;
  chatCount: number;
}

export const OnlineGameView: React.FC<OnlineGameViewProps> = ({
  gameState,
  myRole,
  currentUserId,
  hostPlayerId,
  language,
  onRajaReveal,
  onSubmitGuess,
  onNextRound,
  onExitHome,
  onOpenChat,
  chatCount,
}) => {
  const t = TRANSLATIONS[language];
  const isHi = language === 'hi';
  const isHost = currentUserId === hostPlayerId;

  const [selectedSuspectId, setSelectedSuspectId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [hideMyCard, setHideMyCard] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  const currentRound: GameRound | null = gameState.currentRound;
  if (!currentRound) return null;

  const roleMeta = myRole ? ROLE_DEFINITIONS[myRole] : null;

  const handleSelectSuspect = (pId: string) => {
    sound.playTick();
    setSelectedSuspectId(pId);
  };

  const handleConfirmGuess = () => {
    if (!selectedSuspectId) return;
    setShowConfirmModal(false);
    onSubmitGuess(selectedSuspectId);
  };

  // -------------------------------------------------------------
  // PHASE 1: PRIVATE REVEAL & RAJA ANNOUNCEMENT
  // -------------------------------------------------------------
  if (currentRound.phase === 'PRIVATE_REVEAL' || currentRound.phase === 'RAJA_REVEAL') {
    const isMeRaja = myRole === 'RAJA';

    return (
      <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full px-4 py-4 space-y-4">
        {/* Header Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 px-3.5 py-2 rounded-xl border border-slate-800">
          <span className="font-bold text-amber-300">
            {t.round} {currentRound.roundNumber} {t.of} {gameState.rules.maxRounds}
          </span>
          <div className="flex items-center gap-2">
            {gameState.meetSession && (
              <button
                onClick={() => {
                  sound.playClick();
                  openGoogleMeet(gameState.meetSession!.meetingUrl);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-[11px] text-emerald-400 font-bold border border-emerald-500/30 transition"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Meet</span>
              </button>
            )}
            <button
              onClick={() => {
                sound.playClick();
                onOpenChat();
              }}
              className="lg:hidden relative p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              title="Open Chat"
            >
              <MessageCircle className="w-4 h-4" />
              {chatCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[8px] flex items-center justify-center">
                  {chatCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setShowExitConfirm(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40 border border-slate-700/60 text-slate-300 text-xs font-semibold transition"
              title={isHi ? 'खेल छोड़ें' : 'Exit Game'}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isHi ? 'छोड़ें' : 'Exit'}</span>
            </button>
          </div>
        </div>

        {/* Private Role Card */}
        <div className="my-auto py-2">
          <div
            onClick={() => {
              sound.playCardFlip();
              setHideMyCard((p) => !p);
            }}
            className={`w-full max-w-[280px] sm:max-w-[300px] mx-auto min-h-[240px] sm:min-h-[290px] cursor-pointer rounded-3xl p-4 sm:p-5 flex flex-col items-center justify-between shadow-2xl transition-all duration-300 border-2 ${
              hideMyCard
                ? 'bg-gradient-to-br from-[#1b1c31] to-[#0a0b16] border-amber-500/30'
                : `bg-gradient-to-br ${roleMeta?.accentBg || 'from-slate-900 to-black'} ${roleMeta?.borderClass || 'border-amber-400'}`
            }`}
          >
            <div className="w-full flex justify-between items-center text-xs font-mono font-bold text-white/80">
              <span>{hideMyCard ? 'CARD HIDDEN' : 'YOUR SECRET ROLE'}</span>
              {!hideMyCard && roleMeta && (
                <span className="px-2 py-0.5 rounded bg-black/40 text-amber-300 border border-amber-400/30">
                  {roleMeta.points} PTS
                </span>
              )}
            </div>

            {hideMyCard ? (
              <div className="space-y-2 my-auto text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-2xl mx-auto">
                  🛡️
                </div>
                <p className="text-xs text-slate-400">
                  {isHi ? 'पर्ची छिपी है। देखने के लिए टैप करें।' : 'Card hidden for privacy. Tap to view.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 my-auto text-center">
                <div className="text-5xl sm:text-6xl animate-bounce">{roleMeta?.badgeEmoji}</div>
                <div>
                  <h3 className="font-royal text-xl sm:text-2xl font-black text-white">
                    {isHi ? roleMeta?.nameHi : roleMeta?.nameEn}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-200/90 font-medium leading-relaxed mt-1 px-1">
                    {isHi ? roleMeta?.descriptionHi : roleMeta?.descriptionEn}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs text-white/70 font-bold uppercase">
              {hideMyCard ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>{hideMyCard ? t.tapToReveal : t.releaseToHide}</span>
            </div>
          </div>
        </div>

        {/* Raja Reveal Action */}
        <div className="space-y-2 pt-2">
          {isMeRaja ? (
            <button
              onClick={() => {
                sound.playRoyalFanfare();
                onRajaReveal();
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-base shadow-xl shadow-amber-500/20 transition active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>👑 {t.revealAsRaja}</span>
            </button>
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
              <span className="text-xs font-bold text-amber-300">
                {t.waitingForRaja}
              </span>
              <p className="text-[11px] text-slate-400">
                {isHi
                  ? 'राजा जैसे ही आगे आकर सिपाही को पुकारेंगे, खोज शुरू होगी।'
                  : 'The game will progress once the Raja steps forward.'}
              </p>
            </div>
          )}
        </div>

        <ExitGameModal
          isOpen={showExitConfirm}
          onCancel={() => setShowExitConfirm(false)}
          onConfirmExit={onExitHome}
          language={language}
          isOnline={true}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // PHASE 2: SIPAHI GUESS
  // -------------------------------------------------------------
  if (currentRound.phase === 'SIPAHI_GUESS') {
    const isMeSipahi = myRole === 'SIPAHI';
    const revealedRajaId = currentRound.revealedRajaPlayerId;
    const rajaPlayer = gameState.players.find((p) => p.id === revealedRajaId);

    // Mystery suspects: all players except Raja and Sipahi
    const suspectPlayers = gameState.players.filter(
      (p) => p.id !== revealedRajaId && p.id !== currentUserId
    );

    return (
      <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full px-4 py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 px-3.5 py-2 rounded-xl border border-slate-800">
          <span className="font-bold text-amber-300">
            {t.round} {currentRound.roundNumber} {t.of} {gameState.rules.maxRounds}
          </span>
          <div className="flex items-center gap-2">
            {gameState.meetSession && (
              <button
                onClick={() => {
                  sound.playClick();
                  openGoogleMeet(gameState.meetSession!.meetingUrl);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-[11px] text-emerald-400 font-bold border border-emerald-500/30 transition"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Meet</span>
              </button>
            )}
            <button
              onClick={() => {
                sound.playClick();
                onOpenChat();
              }}
              className="lg:hidden relative p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              title="Open Chat"
            >
              <MessageCircle className="w-4 h-4" />
              {chatCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[8px] flex items-center justify-center">
                  {chatCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setShowExitConfirm(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40 border border-slate-700/60 text-slate-300 text-xs font-semibold transition"
              title={isHi ? 'खेल छोड़ें' : 'Exit Game'}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isHi ? 'छोड़ें' : 'Exit'}</span>
            </button>
          </div>
        </div>

        {/* Raja Banner */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-1">
          <div className="flex justify-center items-center gap-1.5 text-xs font-bold text-amber-400">
            <span>👑</span>
            <span>{rajaPlayer?.name || 'Raja'}</span>
          </div>
          <h3 className="font-royal text-lg font-bold text-amber-200">
            "{t.meraSipahiKaun}"
          </h3>
        </div>

        {/* Investigation UI */}
        {isMeSipahi ? (
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                ⚔️ {isHi ? 'आप सिपाही हैं!' : 'You are the Sipahi!'}
              </span>
              <p className="text-xs text-slate-300">
                {t.suspectPrompt}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {suspectPlayers.map((suspect) => {
                const isSelected = selectedSuspectId === suspect.id;
                return (
                  <div
                    key={suspect.id}
                    onClick={() => handleSelectSuspect(suspect.id)}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center text-center ${
                      isSelected
                        ? 'bg-rose-950/40 border-rose-500 shadow-xl shadow-rose-950/40 scale-[1.02]'
                        : 'bg-slate-900/80 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl mb-2 relative">
                      {suspect.avatar}
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-950 border border-amber-400 text-amber-400 text-[10px] font-bold flex items-center justify-center">
                        ?
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-white truncate max-w-full">
                      {suspect.name}
                    </h4>

                    <div
                      className={`mt-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        isSelected
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isSelected ? 'Accused' : 'Suspect'}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setShowConfirmModal(true);
              }}
              disabled={!selectedSuspectId}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-base shadow-xl shadow-emerald-500/20 transition active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <span>{t.confirmGuess}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl mx-auto animate-pulse">
              🕵️
            </div>
            <div className="space-y-1">
              <h3 className="font-royal text-base font-bold text-white">
                {isHi ? 'सिपाही चोर की तलाश कर रहा है...' : 'The Sipahi is Investigating...'}
              </h3>
              <p className="text-xs text-slate-400">
                {myRole === 'CHOR'
                  ? isHi
                    ? 'शांत रहें! यदि सिपाही मंत्री पर शक करता है तो आप ५०० अंक जीतेंगे!'
                    : 'Keep a straight face! If the Sipahi blames the Mantri, you steal 500 pts!'
                  : myRole === 'MANTRI'
                  ? isHi
                    ? 'उम्मीद करें कि सिपाही आपको न चुने! निर्दोष बने रहें।'
                    : 'Hope the Sipahi does not suspect you! Maintain your dignity.'
                  : isHi
                  ? 'राजा न्याय की प्रतीक्षा कर रहे हैं।'
                  : 'Waiting for the Sipahi to deliver the verdict.'}
              </p>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-[#121524] border border-amber-500/40 rounded-2xl p-5 shadow-2xl space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-2xl mx-auto">
                🎭
              </div>
              <div className="space-y-1">
                <h3 className="font-royal text-lg font-bold text-white">
                  {isHi ? 'क्या आपका फैसला पक्का है?' : 'Confirm Accusation?'}
                </h3>
                <p className="text-xs text-slate-300">
                  {isHi
                    ? `क्या आप ${gameState.players.find((p) => p.id === selectedSuspectId)?.name} को चोर घोषित करते हैं?`
                    : `Lock in guess for ${gameState.players.find((p) => p.id === selectedSuspectId)?.name}?`}
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  {isHi ? 'बदलें' : 'Change'}
                </button>
                <button
                  onClick={handleConfirmGuess}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                >
                  {isHi ? 'पक्का है' : 'Lock In'}
                </button>
              </div>
            </div>
          </div>
        )}

        <ExitGameModal
          isOpen={showExitConfirm}
          onCancel={() => setShowExitConfirm(false)}
          onConfirmExit={onExitHome}
          language={language}
          isOnline={true}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // PHASE 3: RESULTS REVEAL
  // -------------------------------------------------------------
  if (currentRound.phase === 'RESULTS_REVEAL') {
    const guess = currentRound.guess;
    const isCorrect = guess?.isCorrect ?? false;
    const pointsAwarded = currentRound.pointsAwarded || {};
    const roundRoles =
      currentRound.roles ||
      (currentRound as unknown as { visibleRoles?: Record<string, Role> }).visibleRoles ||
      {};

    return (
      <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full px-4 py-4 space-y-4">
        {/* Header Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 px-3.5 py-2 rounded-xl border border-slate-800">
          <span className="font-bold text-amber-300">
            {t.round} {currentRound.roundNumber} {t.of} {gameState.rules.maxRounds}
          </span>
          <div className="flex items-center gap-2">
            {gameState.meetSession && (
              <button
                onClick={() => {
                  sound.playClick();
                  openGoogleMeet(gameState.meetSession!.meetingUrl);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-[11px] text-emerald-400 font-bold border border-emerald-500/30 transition"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Meet</span>
              </button>
            )}
            <button
              onClick={() => {
                sound.playClick();
                onOpenChat();
              }}
              className="lg:hidden relative p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              title="Open Chat"
            >
              <MessageCircle className="w-4 h-4" />
              {chatCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[8px] flex items-center justify-center">
                  {chatCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setShowExitConfirm(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40 border border-slate-700/60 text-slate-300 text-xs font-semibold transition"
              title={isHi ? 'खेल छोड़ें' : 'Exit Game'}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isHi ? 'छोड़ें' : 'Exit'}</span>
            </button>
          </div>
        </div>

        {/* Banner with Outcome */}
        <div
          className={`p-4 rounded-2xl border-2 text-center space-y-1 shadow-xl animate-fade-in ${
            isCorrect
              ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500 text-rose-200'
          }`}
        >
          <div className="flex justify-center items-center gap-2">
            {isCorrect ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            ) : (
              <XCircle className="w-6 h-6 text-rose-400" />
            )}
            <h2 className="font-royal text-xl sm:text-2xl font-black">
              {isCorrect ? t.correctGuess : t.wrongGuess}
            </h2>
          </div>
          <p className="text-xs font-medium text-slate-300">
            {isCorrect
              ? isHi
                ? 'सिपाही ने चोर को रंगे हाथों पकड़ लिया! सिपाही को ५०० अंक प्राप्त हुए।'
                : 'The Sipahi caught the Chor red-handed! Sipahi gets 500 points.'
              : isHi
                ? 'चोर बच निकला! चोर को ५०० अंक, सिपाही को ० अंक।'
                : 'The Chor escaped! Chor gets 500 points, Sipahi gets 0.'}
          </p>
        </div>

        {/* Revealed Roles */}
        <div className="grid grid-cols-2 gap-2.5">
          {gameState.players.map((player) => {
            const role = roundRoles[player.id];
            const meta = role ? ROLE_DEFINITIONS[role] : null;
            const pts = pointsAwarded[player.id] || 0;

            return (
              <div
                key={player.id}
                className="p-3 rounded-2xl border border-slate-800 bg-slate-900/80 flex flex-col justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{meta?.badgeEmoji || '👤'}</span>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-white truncate">
                      {player.name}
                    </h4>
                    <span className="text-[10px] font-royal font-bold text-amber-300">
                      {meta ? (isHi ? meta.nameHi : meta.nameEn) : 'Hidden'}
                    </span>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">{t.pointsEarned}</span>
                  <span className="font-black text-amber-400">+{pts}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cumulative Leaderboard */}
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>{isHi ? 'कुल लीडरबोर्ड' : 'Overall Leaderboard'}</span>
            <span>{t.totalScore}</span>
          </div>

          <div className="space-y-1.5">
            {[...gameState.players]
              .sort((a, b) => b.score - a.score)
              .map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-400 w-4">
                      #{idx + 1}
                    </span>
                    <span className="text-base">{p.avatar}</span>
                    <span className="font-semibold text-white">{p.name}</span>
                  </div>
                  <span className="font-mono font-bold text-amber-300">
                    {p.score.toLocaleString()} pts
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Host Next Round or waiting */}
        <div>
          {isHost ? (
            <button
              onClick={() => {
                sound.playClick();
                onNextRound();
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-base shadow-xl shadow-amber-500/20 transition active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>{t.nextRound}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-900/40 text-center text-xs text-slate-400">
              {isHi
                ? 'होस्ट के अगले राउंड शुरू करने की प्रतीक्षा...'
                : 'Waiting for Host to start next round...'}
            </div>
          )}
        </div>

        <ExitGameModal
          isOpen={showExitConfirm}
          onCancel={() => setShowExitConfirm(false)}
          onConfirmExit={onExitHome}
          language={language}
          isOnline={true}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // PHASE 4: GAME COMPLETED
  // -------------------------------------------------------------
  const rankedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
  const champion = rankedPlayers[0];

  return (
    <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full px-4 py-5 space-y-5 text-center">
      <div className="space-y-2">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-4xl mx-auto shadow-2xl shadow-amber-500/30 animate-bounce">
          👑
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-amber-400">
          {t.winnerTitle}
        </p>
        <h2 className="font-royal text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">
          {champion.name}
        </h2>
        <p className="text-xs text-slate-300 font-mono font-bold">
          {champion.score.toLocaleString()} {t.totalScore}
        </p>
      </div>

      <div className="space-y-2 text-left">
        <div className="space-y-2">
          {rankedPlayers.map((p, idx) => (
            <div
              key={p.id}
              className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition ${
                idx === 0
                  ? 'bg-amber-500/15 border-amber-400/60 shadow-lg'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🎖️'}
                </span>
                <span className="text-xl">{p.avatar}</span>
                <div>
                  <h4 className="font-bold text-white text-sm">{p.name}</h4>
                  <span className="text-[10px] text-slate-400">
                    {idx === 0 ? 'Winner' : `Rank ${idx + 1}`}
                  </span>
                </div>
              </div>
              <span className="font-mono font-bold text-amber-300 text-sm">
                {p.score.toLocaleString()} pts
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <button
          onClick={() => {
            sound.playClick();
            onExitHome();
          }}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-bold text-base shadow-xl transition active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Home className="w-5 h-5" />
          <span>{t.backToHome}</span>
        </button>
      </div>
    </div>
  );
};
