export type Role = 'RAJA' | 'MANTRI' | 'SIPAHI' | 'CHOR';

export interface RoleInfo {
  role: Role;
  nameEn: string;
  nameHi: string;
  points: number;
  descriptionEn: string;
  descriptionHi: string;
  badgeEmoji: string;
  themeColor: string;
  accentBg: string;
  borderClass: string;
}

export const ROLE_DEFINITIONS: Record<Role, RoleInfo> = {
  RAJA: {
    role: 'RAJA',
    nameEn: 'Raja (King)',
    nameHi: 'राजा',
    points: 1000,
    descriptionEn: 'The supreme ruler. Earns 1,000 points. Steps forward first to command the Sipahi.',
    descriptionHi: 'सर्वोच्च शासक। १००० अंक प्राप्त करता है। सिपाही को चोर ढूंढने का आदेश देता है।',
    badgeEmoji: '👑',
    themeColor: '#f59e0b',
    accentBg: 'from-amber-600/30 via-amber-500/10 to-yellow-900/20',
    borderClass: 'border-amber-400 shadow-amber-500/30',
  },
  MANTRI: {
    role: 'MANTRI',
    nameEn: 'Mantri (Minister)',
    nameHi: 'मंत्री',
    points: 800,
    descriptionEn: 'The trusted advisor. Earns 800 points. Must keep calm and hope the Sipahi does not suspect them.',
    descriptionHi: 'विश्वसनीय सलाहकार। ८०० अंक प्राप्त करता है। शांति बनाए रखें ताकि सिपाhi शक न करे।',
    badgeEmoji: '📜',
    themeColor: '#3b82f6',
    accentBg: 'from-blue-600/30 via-indigo-500/10 to-slate-900/20',
    borderClass: 'border-blue-400 shadow-blue-500/30',
  },
  SIPAHI: {
    role: 'SIPAHI',
    nameEn: 'Sipahi (Soldier)',
    nameHi: 'सिपाही',
    points: 500,
    descriptionEn: 'The Royal Guard. Must catch the Chor! If correct, gets 500 points; if wrong, gets 0.',
    descriptionHi: 'शाही रक्षक। चोर को पहचानना होगा! सही अनुमान पर ५०० अंक, गलत पर शून्य।',
    badgeEmoji: '⚔️',
    themeColor: '#10b981',
    accentBg: 'from-emerald-600/30 via-teal-500/10 to-emerald-950/20',
    borderClass: 'border-emerald-400 shadow-emerald-500/30',
  },
  CHOR: {
    role: 'CHOR',
    nameEn: 'Chor (Thief)',
    nameHi: 'चोर',
    points: 0,
    descriptionEn: 'The cunning thief. 0 points if caught, but steals 500 points if the Sipahi blames the Mantri!',
    descriptionHi: 'चालाक चोर। पकड़े जाने पर ० अंक, लेकिन सिपाही चूका तो ५०० अंक चुरा लेता है!',
    badgeEmoji: '🎭',
    themeColor: '#ef4444',
    accentBg: 'from-red-600/30 via-rose-500/10 to-stone-900/20',
    borderClass: 'border-red-400 shadow-red-500/30',
  },
};

export type GamePhase =
  | 'LOBBY'
  | 'ROLE_ASSIGNMENT'
  | 'PRIVATE_REVEAL'
  | 'RAJA_REVEAL'
  | 'SIPAHI_GUESS'
  | 'RESULTS_REVEAL'
  | 'ROUND_COMPLETED'
  | 'GAME_COMPLETED';

export interface GameRules {
  rajaPoints: number;
  mantriPoints: number;
  sipahiCorrectPoints: number;
  chorCorrectGuessPoints: number;
  chorWrongGuessPoints: number;
  guessTimeoutSeconds: number;
  targetScore: number;
  maxRounds: number;
}

export const DEFAULT_RULES: GameRules = {
  rajaPoints: 1000,
  mantriPoints: 800,
  sipahiCorrectPoints: 500,
  chorCorrectGuessPoints: 0,
  chorWrongGuessPoints: 500,
  guessTimeoutSeconds: 45,
  targetScore: 5000,
  maxRounds: 5,
};

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost?: boolean;
  isReady?: boolean;
  isBot?: boolean;
  score: number;
  connected?: boolean;
}

export interface RoundGuess {
  sipahiPlayerId: string;
  guessedPlayerId: string;
  isCorrect: boolean;
  timestamp: number;
}

export interface GameRound {
  id: string;
  roundNumber: number;
  phase: GamePhase;
  roles: Record<string, Role>; // playerId -> Role
  revealedRajaPlayerId: string | null;
  guess: RoundGuess | null;
  pointsAwarded: Record<string, number>; // playerId -> points this round
  timerRemaining?: number;
  createdAt: number;
  completedAt?: number;
}

export interface GameState {
  id: string;
  roomCode?: string;
  isOnline: boolean;
  players: Player[];
  rules: GameRules;
  currentRoundNumber: number;
  currentRound: GameRound | null;
  history: GameRound[];
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  meetSession?: {
    meetingUrl: string;
    status: 'READY' | 'ACTIVE';
    createdAt: number;
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}
