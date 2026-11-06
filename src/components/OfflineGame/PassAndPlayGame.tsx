import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Eye,
  EyeOff,
  ShieldAlert,
  ArrowRight,
  Trophy,
  RotateCcw,
  Home,
  CheckCircle2,
  XCircle,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { sound } from '../../utils/sound';
import { Language, TRANSLATIONS } from '../../utils/i18n';
import { ChorSipahiEngine } from '../../game/engine';
import { GameRound, GameState, Player, ROLE_DEFINITIONS, Role } from '../../game/types';
import { recordCompletedMatch, UserProfile } from '../../utils/storage';
import { ExitGameModal } from '../ExitGameModal';

interface PassAndPlayGameProps {
  initialPlayers: Player[];
  maxRounds: number;
  language: Language;
  onExitHome: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
}

export const PassAndPlayGame: React.FC<PassAndPlayGameProps> = ({
  initialPlayers,
  maxRounds,
  language,
  onExitHome,
  userProfile,
  onUpdateProfile,
}) => {
  const t = TRANSLATIONS[language];
  const isHi = language === 'hi';

  const [gameState, setGameState] = useState<GameState>(() => {
    const game = ChorSipahiEngine.createGame(initialPlayers, false, { maxRounds });
    return ChorSipahiEngine.startNextRound(game);
  });

  // State for the private inspection step (0 to 3)
  const [inspectingPlayerIndex, setInspectingPlayerIndex] = useState<number>(0);
  const [isCardRevealed, setIsCardRevealed] = useState<boolean>(false);

  // State for Sipahi guessing
  const [selectedSuspectId, setSelectedSuspectId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  const currentRound: GameRound | null = gameState.currentRound;
  const currentInspector: Player | undefined = gameState.players[inspectingPlayerIndex];
  const inspectorRole: Role | undefined = currentRound && currentInspector
    ? currentRound.roles[currentInspector.id]
    : undefined;

  // Handover & Card Peek Flow
  const handleToggleCardReveal = () => {
    sound.playCardFlip();
    setIsCardRevealed((prev) => !prev);
  };

  const handleNextPlayerInspection = () => {
    sound.playClick();
    setIsCardRevealed(false);
    if (inspectingPlayerIndex < 3) {
      setInspectingPlayerIndex(inspectingPlayerIndex + 1);
    } else {
      // All 4 players have inspected their roles! Move to Raja Reveal
      sound.playRoyalFanfare();
      const rajaPlayerId = Object.keys(currentRound!.roles).find(
        (id) => currentRound!.roles[id] === 'RAJA'
      )!;
      const nextState = ChorSipahiEngine.revealRaja(gameState, rajaPlayerId);
      setGameState(nextState);
    }
  };

  // Raja Announce Flow
  const handleRajaAnnounce = () => {
    sound.playRoyalFanfare();
    // Already in SIPAHI_GUESS
  };

  // Sipahi Guess Submission
  const handleSelectSuspect = (suspectId: string) => {
    sound.playTick();
    setSelectedSuspectId(suspectId);
  };

  const handleConfirmGuess = () => {
    if (!selectedSuspectId || !currentRound) return;
    setShowConfirmModal(false);

    const sipahiId = Object.keys(currentRound.roles).find(
      (id) => currentRound.roles[id] === 'SIPAHI'
    )!;

    const afterGuess = ChorSipahiEngine.submitGuess(
      gameState,
      sipahiId,
      selectedSuspectId
    );
    setGameState(afterGuess);

    const isCorrect = afterGuess.currentRound?.guess?.isCorrect;
    if (isCorrect) {
      sound.playCorrect();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
        });
      } catch {
        // Ignore
      }
    } else {
      sound.playWrong();
    }
  };

  // Next Round or Match Completion
  const handleProceedNextRound = () => {
    sound.playClick();
    setSelectedSuspectId(null);
    setIsCardRevealed(false);
    setInspectingPlayerIndex(0);

    const completed = ChorSipahiEngine.completeRound(gameState);

    if (completed.status === 'FINISHED') {
      setGameState(completed);
      // Confetti for match champion
      try {
        confetti({
          particleCount: 120,
          spread: 100,
          origin: { y: 0.5 },
          colors: ['#f59e0b', '#fbbf24', '#ffffff'],
        });
      } catch {
        // Ignore
      }

      // Record to match history
      const sorted = [...completed.players].sort((a, b) => b.score - a.score);
      const winner = sorted[0];
      recordCompletedMatch({
        id: `match_${Date.now()}`,
        date: new Date().toLocaleDateString(),
        mode: 'OFFLINE',
        rounds: completed.currentRoundNumber,
        winnerName: winner.name,
        winnerScore: winner.score,
        players: sorted.map((p) => ({
          name: p.name,
          avatar: p.avatar,
          score: p.score,
        })),
      });

      // Update user stats
      const isUserWinner = winner.name === userProfile.nickname;
      const updatedProfile: UserProfile = {
        ...userProfile,
        gamesPlayed: userProfile.gamesPlayed + 1,
        gamesWon: userProfile.gamesWon + (isUserWinner ? 1 : 0),
        totalPoints: userProfile.totalPoints + (completed.players.find(p => p.name === userProfile.nickname)?.score || 0),
      };
      onUpdateProfile(updatedProfile);
      return;
    }

    const nextRoundState = ChorSipahiEngine.startNextRound(completed);
    setGameState(nextRoundState);
  };

  const handleRestartMatch = () => {
    sound.playRoyalFanfare();
    const newGame = ChorSipahiEngine.createGame(initialPlayers, false, { maxRounds });
    const started = ChorSipahiEngine.startNextRound(newGame);
    setGameState(started);
    setInspectingPlayerIndex(0);
    setIsCardRevealed(false);
    setSelectedSuspectId(null);
  };

  if (!currentRound) return null;

  // -------------------------------------------------------------
  // PHASE 1: PRIVATE REVEAL (Pass & Play Inspection)
  // -------------------------------------------------------------
  if (currentRound.phase === 'PRIVATE_REVEAL') {
    const roleMeta = inspectorRole ? ROLE_DEFINITIONS[inspectorRole] : null;

    return (
      <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full px-4 py-4 space-y-4">
        {/* Round Progress Bar & Exit Button */}
        <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-300">
              {t.round} {currentRound.roundNumber} {t.of} {gameState.rules.maxRounds}
            </span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-slate-400">
              Player {inspectingPlayerIndex + 1}/4
            </span>
          </div>
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

        {/* Handover Instruction Card */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{t.hideScreenWarning}</span>
          </div>
          <h2 className="font-royal text-xl sm:text-2xl font-black text-white">
            {t.passDevicePrompt}{' '}
            <span className="text-amber-400 underline decoration-amber-500/50">
              {currentInspector?.name}
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            {isHi
              ? 'फोन केवल ' + currentInspector?.name + ' के हाथ में दें। अन्य खिलाड़ी दूर रहें।'
              : 'Hand the device strictly to ' + currentInspector?.name + '. Other players must not peek.'}
          </p>
        </div>

        {/* Flip Card Area */}
        <div className="perspective-1000 my-auto py-2">
          <div
            onClick={handleToggleCardReveal}
            className="w-full max-w-[280px] sm:max-w-[300px] mx-auto min-h-[340px] cursor-pointer relative rounded-3xl transition-transform duration-500 transform-style-3d shadow-2xl active:scale-[0.98]"
            style={{
              transform: isCardRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* FRONT OF CARD (Hidden State) */}
            <div className="absolute inset-0 backface-hidden rounded-3xl bg-gradient-to-br from-[#1b1c31] via-[#131427] to-[#0a0b16] border-2 border-amber-500/40 p-6 flex flex-col items-center justify-between shadow-2xl text-center">
              <div className="w-full flex justify-between items-center text-amber-400 text-xs font-mono font-bold">
                <span>ROYAL SEAL</span>
                <span>⚔️ 👑 ⚔️</span>
              </div>

              <div className="space-y-4 my-auto">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-4xl shadow-inner">
                  {currentInspector?.avatar}
                </div>
                <div>
                  <h3 className="font-royal text-lg font-bold text-amber-200">
                    {currentInspector?.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {t.tapToReveal}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-amber-400/80 font-bold tracking-wide uppercase">
                <Eye className="w-4 h-4" />
                <span>Tap to Peek</span>
              </div>
            </div>

            {/* BACK OF CARD (Revealed Role) */}
            <div
              className={`absolute inset-0 backface-hidden rotate-y-180 rounded-3xl bg-gradient-to-br ${
                roleMeta?.accentBg || 'from-slate-900 to-black'
              } border-2 ${
                roleMeta?.borderClass || 'border-slate-700'
              } p-6 flex flex-col items-center justify-between shadow-2xl text-center`}
            >
              <div className="w-full flex justify-between items-center text-xs font-mono font-bold text-white/80">
                <span>SECRET ROLE</span>
                <span className="px-2 py-0.5 rounded bg-black/40 text-amber-300 border border-amber-400/30">
                  {roleMeta?.points} PTS
                </span>
              </div>

              <div className="space-y-3 my-auto">
                <div className="text-6xl animate-bounce">
                  {roleMeta?.badgeEmoji}
                </div>
                <div>
                  <h3 className="font-royal text-2xl font-black tracking-wide text-white">
                    {isHi ? roleMeta?.nameHi : roleMeta?.nameEn}
                  </h3>
                  <p className="text-xs text-slate-200/90 font-medium leading-relaxed mt-2 px-2">
                    {isHi ? roleMeta?.descriptionHi : roleMeta?.descriptionEn}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-white/70 font-bold uppercase">
                <EyeOff className="w-4 h-4" />
                <span>{t.releaseToHide}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-2 pt-2">
          {isCardRevealed ? (
            <button
              onClick={handleNextPlayerInspection}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-base shadow-xl shadow-amber-500/20 transition active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>
                {inspectingPlayerIndex < 3
                  ? t.nextPlayer
                  : t.allPlayersChecked}
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleToggleCardReveal}
              className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-sm border border-slate-700 transition flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              <span>{t.tapToReveal}</span>
            </button>
          )}
        </div>

        <ExitGameModal
          isOpen={showExitConfirm}
          onCancel={() => setShowExitConfirm(false)}
          onConfirmExit={onExitHome}
          language={language}
          isOnline={false}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // PHASE 2 & 3: RAJA REVEAL & SIPAHI GUESS
  // -------------------------------------------------------------
  if (currentRound.phase === 'SIPAHI_GUESS') {
    const roles = currentRound.roles;
    const rajaId = Object.keys(roles).find((id) => roles[id] === 'RAJA')!;
    const sipahiId = Object.keys(roles).find((id) => roles[id] === 'SIPAHI')!;
    const rajaPlayer = gameState.players.find((p) => p.id === rajaId)!;
    const sipahiPlayer = gameState.players.find((p) => p.id === sipahiId)!;

    // The two unidentified suspects are the remaining 2 players
    const suspectPlayers = gameState.players.filter(
      (p) => p.id !== rajaId && p.id !== sipahiId
    );

    return (
      <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full px-4 py-4 space-y-4">
        {/* Round Header */}
        <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 px-3.5 py-2 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-300">
              {t.round} {currentRound.roundNumber} {t.of} {gameState.rules.maxRounds}
            </span>
            <span className="text-slate-600">|</span>
            <span className="font-bold text-emerald-400 uppercase tracking-wider">
              {isHi ? 'सिपाही जांच' : 'Investigation'}
            </span>
          </div>

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

        {/* Raja Announcement Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-600/20 via-amber-500/10 to-yellow-600/20 border-2 border-amber-500/40 text-center space-y-1 shadow-lg">
          <div className="flex justify-center items-center gap-2">
            <span className="text-2xl">👑</span>
            <span className="font-royal text-xs font-black tracking-widest text-amber-400 uppercase">
              {rajaPlayer.name} {isHi ? 'राजा हैं (१००० अंक)' : 'is the Raja (1,000 pts)'}
            </span>
          </div>
          <h2 className="font-royal text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-400 tracking-wider">
            "{t.meraSipahiKaun}"
          </h2>
          <p className="text-xs text-amber-300/80 font-medium">
            {t.meraSipahiDesc}
          </p>
        </div>

        {/* Sipahi Callout */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-xl shrink-0">
            ⚔️
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-emerald-400">
                {isHi ? 'सिपाही पहचान:' : 'Sipahi Identified:'}
              </span>
              <span className="text-sm font-bold text-white truncate">
                {sipahiPlayer.name}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              {isHi
                ? `${sipahiPlayer.name}, नीचे दिए गए दो संदिग्धों में से असली चोर को चुनें!`
                : `${sipahiPlayer.name}, investigate the 2 suspects below and accuse the Chor!`}
            </p>
          </div>
        </div>

        {/* The 2 Mystery Suspects */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-wider text-center">
            {t.suspectPrompt}
          </p>

          <div className="grid grid-cols-2 gap-3">
            {suspectPlayers.map((suspect) => {
              const isSelected = selectedSuspectId === suspect.id;
              return (
                <div
                  key={suspect.id}
                  onClick={() => handleSelectSuspect(suspect.id)}
                  className={`cursor-pointer p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center text-center relative overflow-hidden ${
                    isSelected
                      ? 'bg-rose-950/40 border-rose-500 shadow-xl shadow-rose-950/50 scale-[1.02]'
                      : 'bg-slate-900/80 border-slate-700/80 hover:border-slate-500'
                  }`}
                >
                  {/* Mystery badge */}
                  <div className="w-16 h-16 rounded-2xl bg-slate-800/90 border border-slate-700 flex items-center justify-center text-3xl mb-2.5 relative">
                    {suspect.avatar}
                    <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-slate-950 border border-amber-500/50 text-amber-400 text-xs font-bold flex items-center justify-center">
                      ?
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-white truncate max-w-full">
                    {suspect.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {isHi ? 'संदिग्ध पर्ची' : 'Suspect Card'}
                  </p>

                  {/* Selection indicator */}
                  <div
                    className={`mt-3 px-3 py-1 rounded-full text-xs font-bold uppercase transition ${
                      isSelected
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isSelected
                      ? isHi
                        ? 'चोर चुना गया'
                        : 'Accused as Chor'
                      : isHi
                      ? 'चुनने के लिए टैप करें'
                      : 'Tap to Suspect'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lock In Guess Button */}
        <div>
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
                  {isHi ? (
                    <>
                      सिपाही <strong>{sipahiPlayer.name}</strong>, क्या आप{' '}
                      <strong className="text-rose-400">
                        {
                          gameState.players.find(
                            (p) => p.id === selectedSuspectId
                          )?.name
                        }
                      </strong>{' '}
                      पर चोर होने का आरोप लगाते हैं?
                    </>
                  ) : (
                    <>
                      Sipahi <strong>{sipahiPlayer.name}</strong>, are you sure{' '}
                      <strong className="text-rose-400">
                        {
                          gameState.players.find(
                            (p) => p.id === selectedSuspectId
                          )?.name
                        }
                      </strong>{' '}
                      is the CHOR?
                    </>
                  )}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                >
                  {isHi ? 'बदलें' : 'Change'}
                </button>
                <button
                  onClick={handleConfirmGuess}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition"
                >
                  {isHi ? 'हाँ, पक्का है' : 'Yes, Lock In!'}
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
          isOnline={false}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // PHASE 4: RESULTS REVEAL
  // -------------------------------------------------------------
  if (currentRound.phase === 'RESULTS_REVEAL') {
    const guess = currentRound.guess;
    const isCorrect = guess?.isCorrect ?? false;
    const pointsAwarded = currentRound.pointsAwarded || {};
    const roundRoles = currentRound.roles || {};

    return (
      <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full px-4 py-4 space-y-4">
        {/* Round Header & Exit */}
        <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 px-3.5 py-2 rounded-xl border border-slate-800">
          <span className="font-bold text-amber-300">
            {t.round} {currentRound.roundNumber} {t.of} {gameState.rules.maxRounds}
          </span>
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
                : 'The Sipahi caught the Chor red-handed! Sipahi secures 500 points.'
              : isHi
                ? 'चोर बच निकला और सारा खजाना ले गया! चोर को ५०० अंक, सिपाही को ० अंक।'
                : 'The Chor escaped unnoticed and stole the reward! Chor gets 500 points, Sipahi gets 0.'}
          </p>
        </div>

        {/* All 4 Roles Revealed Grid */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
            {isHi ? 'राउंड के परिणाम और अंक' : 'Round Roles & Points'}
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            {gameState.players.map((player) => {
              const role = roundRoles[player.id];
              const meta = role ? ROLE_DEFINITIONS[role] : null;
              const pts = pointsAwarded[player.id] || 0;

              return (
                <div
                  key={player.id}
                  className={`p-3 rounded-2xl border bg-slate-900/80 flex flex-col justify-between ${
                    role === 'CHOR'
                      ? 'border-rose-500/60 shadow-lg shadow-rose-950/20'
                      : role === 'SIPAHI'
                      ? 'border-emerald-500/60 shadow-lg shadow-emerald-950/20'
                      : role === 'RAJA'
                      ? 'border-amber-500/60 shadow-lg shadow-amber-950/20'
                      : 'border-blue-500/60 shadow-lg shadow-blue-950/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
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
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">{t.pointsEarned}</span>
                    <span
                      className={`font-black ${
                        pts > 0 ? 'text-amber-400' : 'text-slate-500'
                      }`}
                    >
                      +{pts}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
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

        {/* Next Action Button */}
        <div>
          <button
            onClick={handleProceedNextRound}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-base shadow-xl shadow-amber-500/20 transition active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>
              {currentRound.roundNumber >= gameState.rules.maxRounds
                ? t.viewPodium
                : t.nextRound}
            </span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <ExitGameModal
          isOpen={showExitConfirm}
          onCancel={() => setShowExitConfirm(false)}
          onConfirmExit={onExitHome}
          language={language}
          isOnline={false}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // PHASE 5: GAME COMPLETED (Grand Winner Ceremony)
  // -------------------------------------------------------------
  const rankedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
  const champion = rankedPlayers[0];

  return (
    <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full px-4 py-5 space-y-5 text-center">
      {/* Crown Banner */}
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

      {/* Podium Cards */}
      <div className="space-y-2 text-left">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
          {isHi ? 'अंतिम शाही परिणाम' : 'Final Realm Rankings'}
        </p>

        <div className="space-y-2">
          {rankedPlayers.map((p, idx) => (
            <div
              key={p.id}
              className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition ${
                idx === 0
                  ? 'bg-amber-500/15 border-amber-400/60 shadow-lg shadow-amber-500/10'
                  : idx === 1
                  ? 'bg-slate-800/60 border-slate-600'
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
                    {idx === 0 ? 'Grand Winner' : `Rank ${idx + 1}`}
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

      {/* Buttons */}
      <div className="space-y-2.5">
        <button
          onClick={handleRestartMatch}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-base shadow-xl shadow-amber-500/20 transition active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          <span>{t.playAgain}</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onExitHome();
          }}
          className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span>{t.backToHome}</span>
        </button>
      </div>
    </div>
  );
};
