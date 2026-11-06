import {
  DEFAULT_RULES,
  GamePhase,
  GameRound,
  GameRules,
  GameState,
  Player,
  Role,
  RoundGuess,
} from './types';

/**
 * Pure, deterministic Chor Sipahi Game Engine
 */
export class ChorSipahiEngine {
  /**
   * Initialize a new game session with 4 players
   */
  static createGame(
    players: Player[],
    isOnline = false,
    customRules?: Partial<GameRules>,
    roomCode?: string
  ): GameState {
    if (players.length !== 4) {
      throw new Error(`Chor Sipahi requires exactly 4 players. Received ${players.length}.`);
    }

    const rules: GameRules = { ...DEFAULT_RULES, ...customRules };
    const initialPlayers = players.map((p) => ({
      ...p,
      score: 0,
    }));

    return {
      id: `game_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      roomCode,
      isOnline,
      players: initialPlayers,
      rules,
      currentRoundNumber: 0,
      currentRound: null,
      history: [],
      status: 'WAITING',
    };
  }

  /**
   * Distribute the 4 unique roles randomly to the 4 players
   */
  static startNextRound(
    state: GameState,
    rng: () => number = Math.random
  ): GameState {
    if (state.players.length !== 4) {
      throw new Error('Game must have exactly 4 players to start a round.');
    }

    const nextRoundNumber = state.currentRoundNumber + 1;
    const rolesPool: Role[] = ['RAJA', 'MANTRI', 'SIPAHI', 'CHOR'];

    // Fisher-Yates shuffle
    for (let i = rolesPool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [rolesPool[i], rolesPool[j]] = [rolesPool[j], rolesPool[i]];
    }

    const assignedRoles: Record<string, Role> = {};
    state.players.forEach((player, idx) => {
      assignedRoles[player.id] = rolesPool[idx];
    });

    const newRound: GameRound = {
      id: `round_${nextRoundNumber}_${Date.now()}`,
      roundNumber: nextRoundNumber,
      phase: 'PRIVATE_REVEAL',
      roles: assignedRoles,
      revealedRajaPlayerId: null,
      guess: null,
      pointsAwarded: {},
      timerRemaining: state.rules.guessTimeoutSeconds,
      createdAt: Date.now(),
    };

    return {
      ...state,
      status: 'PLAYING',
      currentRoundNumber: nextRoundNumber,
      currentRound: newRound,
    };
  }

  /**
   * Raja publicly steps forward and reveals identity
   */
  static revealRaja(state: GameState, triggeringPlayerId?: string): GameState {
    const round = state.currentRound;
    if (!round) {
      throw new Error('No active round to reveal Raja.');
    }
    if (round.phase !== 'PRIVATE_REVEAL' && round.phase !== 'RAJA_REVEAL') {
      throw new Error(`Cannot reveal Raja in phase: ${round.phase}`);
    }

    // Find the player who holds the Raja role
    const rajaPlayerId = Object.keys(round.roles).find(
      (pId) => round.roles[pId] === 'RAJA'
    );

    if (!rajaPlayerId) {
      throw new Error('Raja role missing from round.');
    }

    // If a triggering player is supplied, ensure they are indeed the Raja
    if (triggeringPlayerId && triggeringPlayerId !== rajaPlayerId) {
      throw new Error('Only the player assigned the Raja role can reveal Raja.');
    }

    const updatedRound: GameRound = {
      ...round,
      revealedRajaPlayerId: rajaPlayerId,
      phase: 'SIPAHI_GUESS',
    };

    return {
      ...state,
      currentRound: updatedRound,
    };
  }

  /**
   * Sipahi submits their guess on who the Chor is
   */
  static submitGuess(
    state: GameState,
    sipahiPlayerId: string,
    guessedPlayerId: string
  ): GameState {
    const round = state.currentRound;
    if (!round) {
      throw new Error('No active round to submit guess.');
    }
    if (round.phase !== 'SIPAHI_GUESS') {
      throw new Error(`Cannot submit guess during phase: ${round.phase}`);
    }

    // Validate that sipahiPlayerId is the Sipahi
    if (round.roles[sipahiPlayerId] !== 'SIPAHI') {
      throw new Error('Only the assigned Sipahi can submit a guess.');
    }

    // Validate that guessed player is not Sipahi themselves
    if (guessedPlayerId === sipahiPlayerId) {
      throw new Error('Sipahi cannot guess themselves.');
    }

    // Validate that guessed player is not the already revealed Raja
    if (guessedPlayerId === round.revealedRajaPlayerId) {
      throw new Error('Sipahi cannot guess the already revealed Raja.');
    }

    // Check if target is the Chor
    const targetRole = round.roles[guessedPlayerId];
    const isCorrect = targetRole === 'CHOR';

    const guessRecord: RoundGuess = {
      sipahiPlayerId,
      guessedPlayerId,
      isCorrect,
      timestamp: Date.now(),
    };

    // Calculate score points for this round
    const pointsAwarded: Record<string, number> = {};

    Object.entries(round.roles).forEach(([pId, role]) => {
      switch (role) {
        case 'RAJA':
          pointsAwarded[pId] = state.rules.rajaPoints;
          break;
        case 'MANTRI':
          pointsAwarded[pId] = state.rules.mantriPoints;
          break;
        case 'SIPAHI':
          pointsAwarded[pId] = isCorrect
            ? state.rules.sipahiCorrectPoints
            : 0;
          break;
        case 'CHOR':
          pointsAwarded[pId] = isCorrect
            ? state.rules.chorCorrectGuessPoints
            : state.rules.chorWrongGuessPoints;
          break;
      }
    });

    // Update cumulative player scores
    const updatedPlayers = state.players.map((player) => ({
      ...player,
      score: player.score + (pointsAwarded[player.id] || 0),
    }));

    const updatedRound: GameRound = {
      ...round,
      guess: guessRecord,
      pointsAwarded,
      phase: 'RESULTS_REVEAL',
      completedAt: Date.now(),
    };

    return {
      ...state,
      players: updatedPlayers,
      currentRound: updatedRound,
    };
  }

  /**
   * Complete round and check win conditions
   */
  static completeRound(state: GameState): GameState {
    const round = state.currentRound;
    if (!round) return state;

    const history = [...state.history, round];
    const isLastRound = round.roundNumber >= state.rules.maxRounds;
    const hasPlayerReachedTarget = state.players.some(
      (p) => p.score >= state.rules.targetScore
    );

    const isGameOver = isLastRound || hasPlayerReachedTarget;

    return {
      ...state,
      history,
      status: isGameOver ? 'FINISHED' : 'PLAYING',
      currentRound: {
        ...round,
        phase: isGameOver ? 'GAME_COMPLETED' : 'ROUND_COMPLETED',
      },
    };
  }

  /**
   * Mask hidden information for a specific viewer (anti-cheating)
   */
  static getMaskedRoundForViewer(
    round: GameRound,
    viewerPlayerId: string
  ): {
    id: string;
    roundNumber: number;
    phase: GamePhase;
    myRole: Role | null;
    roles: Record<string, Role>;
    visibleRoles: Record<string, Role>;
    revealedRajaPlayerId: string | null;
    guess: RoundGuess | null;
    pointsAwarded: Record<string, number>;
  } {
    const visibleRoles: Record<string, Role> = {};

    if (round.phase === 'RESULTS_REVEAL' || round.phase === 'ROUND_COMPLETED' || round.phase === 'GAME_COMPLETED') {
      // In reveal/completed phases, all roles are public
      Object.assign(visibleRoles, round.roles);
    } else {
      // In private/guessing phases:
      // 1. Viewer knows their own role
      if (round.roles[viewerPlayerId]) {
        visibleRoles[viewerPlayerId] = round.roles[viewerPlayerId];
      }
      // 2. Raja is public once revealed
      if (round.revealedRajaPlayerId) {
        visibleRoles[round.revealedRajaPlayerId] = 'RAJA';
      }
    }

    return {
      id: round.id,
      roundNumber: round.roundNumber,
      phase: round.phase,
      myRole: round.roles[viewerPlayerId] || null,
      roles: visibleRoles,
      visibleRoles,
      revealedRajaPlayerId: round.revealedRajaPlayerId,
      guess: round.guess,
      pointsAwarded: round.pointsAwarded || {},
    };
  }
}
