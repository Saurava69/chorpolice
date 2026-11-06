export interface UserProfile {
  id: string;
  nickname: string;
  avatar: string;
  gamesPlayed: number;
  gamesWon: number;
  playedAsChor: number;
  escapedAsChor: number;
  playedAsSipahi: number;
  successfulGuesses: number;
  totalPoints: number;
  createdAt: number;
}

export interface MatchHistoryRecord {
  id: string;
  date: string;
  mode: 'OFFLINE' | 'ONLINE';
  rounds: number;
  winnerName: string;
  winnerScore: number;
  players: {
    name: string;
    avatar: string;
    score: number;
  }[];
}

const PROFILE_KEY = 'chor_sipahi_user_profile';
const HISTORY_KEY = 'chor_sipahi_match_history';
const SETTINGS_KEY = 'chor_sipahi_settings';

export const AVATAR_OPTIONS = [
  { emoji: '👑', label: 'Maharaja' },
  { emoji: '🦚', label: 'Mayura' },
  { emoji: '⚔️', label: 'Senapati' },
  { emoji: '📜', label: 'Mantri' },
  { emoji: '🛡️', label: 'Sipahi' },
  { emoji: '🎭', label: 'Chor' },
  { emoji: '💎', label: 'Seth' },
  { emoji: '🏹', label: 'Dhanurdhar' },
  { emoji: '🐘', label: 'Gajaraj' },
  { emoji: '🐅', label: 'Sher' },
  { emoji: '🪙', label: 'Khazana' },
  { emoji: '🌸', label: 'Kamal' },
];

export function getStoredProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }

  const defaultProfile: UserProfile = {
    id: `usr_${Date.now().toString(36)}`,
    nickname: 'Maharaja Player',
    avatar: '👑',
    gamesPlayed: 0,
    gamesWon: 0,
    playedAsChor: 0,
    escapedAsChor: 0,
    playedAsSipahi: 0,
    successfulGuesses: 0,
    totalPoints: 0,
    createdAt: Date.now(),
  };

  saveProfile(defaultProfile);
  return defaultProfile;
}

export function saveProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore
  }
}

export function getMatchHistory(): MatchHistoryRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return [];
}

export function recordCompletedMatch(record: MatchHistoryRecord): void {
  try {
    const history = getMatchHistory();
    const updated = [record, ...history].slice(0, 30); // keep last 30
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }
}

export interface AppSettings {
  soundEnabled: boolean;
  language: 'en' | 'hi';
}

export function getAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return {
    soundEnabled: true,
    language: 'en',
  };
}

export function saveAppSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore
  }
}
