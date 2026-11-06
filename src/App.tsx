import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { HowToPlayModal } from './components/HowToPlayModal';
import { ProfileModal } from './components/ProfileModal';
import { ChatPanel } from './components/ChatPanel';
import { PlayerSetup } from './components/OfflineGame/PlayerSetup';
import { PassAndPlayGame } from './components/OfflineGame/PassAndPlayGame';
import { OnlineLobby } from './components/OnlineGame/OnlineLobby';
import { OnlineGameView } from './components/OnlineGame/OnlineGameView';
import { sound } from './utils/sound';
import { Language } from './utils/i18n';
import {
  getAppSettings,
  getStoredProfile,
  saveAppSettings,
  UserProfile,
} from './utils/storage';
import { ChatMessage, GameState, Player, Role } from './game/types';
import { openGoogleMeet } from './utils/meet';

type AppView =
  | 'HOME'
  | 'OFFLINE_SETUP'
  | 'OFFLINE_GAME'
  | 'ONLINE_LOBBY'
  | 'ONLINE_GAME';

export default function App() {
  const [view, setView] = useState<AppView>('HOME');
  const [profile, setProfile] = useState<UserProfile>(getStoredProfile);
  const [language, setLanguage] = useState<Language>('en');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Modals
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Offline Game State
  const [offlinePlayers, setOfflinePlayers] = useState<Player[]>([]);
  const [offlineMaxRounds, setOfflineMaxRounds] = useState<number>(5);

  // Online Multiplayer State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineRoomCode, setOnlineRoomCode] = useState<string>('');
  const [onlineRoomId, setOnlineRoomId] = useState<string>('');
  const [onlinePlayers, setOnlinePlayers] = useState<Player[]>([]);
  const [onlineHostId, setOnlineHostId] = useState<string>('');
  const [onlineMeetSession, setOnlineMeetSession] = useState<{
    meetingUrl: string;
    status: 'READY' | 'ACTIVE';
    createdAt: number;
  } | undefined>(undefined);
  const [onlineGameState, setOnlineGameState] = useState<GameState | null>(null);
  const [myOnlineRole, setMyOnlineRole] = useState<Role | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Load preferences
  useEffect(() => {
    const settings = getAppSettings();
    setSoundEnabled(settings.soundEnabled);
    sound.enabled = settings.soundEnabled;
    setLanguage(settings.language);

    // Ultra mode check: ?autostart=1 skips directly to offline setup or game
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autostart') === '1') {
      const defaultPlayers: Player[] = [
        { id: 'p1', name: 'Aarav', avatar: '👑', score: 0 },
        { id: 'p2', name: 'Diya', avatar: '🦚', score: 0 },
        { id: 'p3', name: 'Kabir', avatar: '⚔️', score: 0 },
        { id: 'p4', name: 'Meera', avatar: '🎭', score: 0 },
      ];
      setOfflinePlayers(defaultPlayers);
      setOfflineMaxRounds(5);
      setView('OFFLINE_GAME');
    }
  }, []);

  const handleToggleSound = () => {
    const updated = !soundEnabled;
    setSoundEnabled(updated);
    sound.enabled = updated;
    saveAppSettings({ soundEnabled: updated, language });
    if (updated) sound.playClick();
  };

  const handleToggleLanguage = () => {
    const updated: Language = language === 'en' ? 'hi' : 'en';
    setLanguage(updated);
    saveAppSettings({ soundEnabled, language: updated });
  };

  // Offline Flow
  const handleStartOfflineSetup = () => {
    setView('OFFLINE_SETUP');
  };

  const handleStartOfflineGame = (players: Player[], maxRounds: number) => {
    setOfflinePlayers(players);
    setOfflineMaxRounds(maxRounds);
    setView('OFFLINE_GAME');
  };

  // Online Flow: Setup Socket.io
  const initSocket = () => {
    if (socket) return socket;
    const newSocket = io('/game', {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('room:updated', (data) => {
      setOnlineRoomCode(data.roomCode);
      setOnlineHostId(data.hostPlayerId);
      setOnlinePlayers(data.players || []);
      setOnlineMeetSession(data.meetSession);
    });

    newSocket.on('game:round_state', ({ gameState, myRole }) => {
      setOnlineGameState(gameState);
      setMyOnlineRole(myRole);
      setView('ONLINE_GAME');
    });

    newSocket.on('game:roles_revealed', (data) => {
      setOnlineGameState((prev) => {
        if (!prev || !prev.currentRound) return prev;
        return {
          ...prev,
          currentRound: {
            ...prev.currentRound,
            roles: data.allRoles || {},
            visibleRoles: data.allRoles || {},
            guess: data.guess,
            pointsAwarded: data.pointsAwarded || {},
            phase: 'RESULTS_REVEAL',
          },
        };
      });
    });

    newSocket.on('game:finished', ({ players }) => {
      setOnlineGameState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'FINISHED',
          players: players || prev.players,
          currentRound: prev.currentRound
            ? { ...prev.currentRound, phase: 'GAME_COMPLETED' }
            : null,
        };
      });
    });

    newSocket.on('game:raja_revealed', ({ rajaPlayerId }) => {
      setOnlineGameState((prev) => {
        if (!prev || !prev.currentRound) return prev;
        return {
          ...prev,
          currentRound: {
            ...prev.currentRound,
            revealedRajaPlayerId: rajaPlayerId,
            phase: 'SIPAHI_GUESS',
          },
        };
      });
    });

    newSocket.on('chat:message', (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    setSocket(newSocket);
    return newSocket;
  };

  const handleCreateOnlineRoom = async () => {
    try {
      const sock = initSocket();
      const me: Player = {
        id: profile.id,
        name: profile.nickname,
        avatar: profile.avatar,
        score: 0,
      };

      const res = await fetch('/api/v1/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostPlayer: me }),
      });
      const data = await res.json();

      if (data.success && data.room) {
        setOnlineRoomId(data.room.id);
        setOnlineRoomCode(data.room.roomCode);
        setOnlineHostId(data.room.hostPlayerId);
        setOnlinePlayers(data.room.players);
        setChatMessages([]);
        sock.emit('room:join', { roomId: data.room.id, player: me });
        setView('ONLINE_LOBBY');
      }
    } catch {
      // Fallback
    }
  };

  const handleJoinOnlineRoom = async (code: string) => {
    try {
      const sock = initSocket();
      const me: Player = {
        id: profile.id,
        name: profile.nickname,
        avatar: profile.avatar,
        score: 0,
      };

      const res = await fetch('/api/v1/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: code, player: me }),
      });
      const data = await res.json();

      if (data.success && data.room) {
        setOnlineRoomId(data.room.id);
        setOnlineRoomCode(data.room.roomCode);
        setOnlineHostId(data.room.hostPlayerId);
        setOnlinePlayers(data.room.players);
        setChatMessages([]);
        sock.emit('room:join', { roomId: data.room.id, player: me });
        setView('ONLINE_LOBBY');
      } else {
        alert(data.error || 'Failed to join room');
      }
    } catch {
      alert('Could not connect to server.');
    }
  };

  const handleOnlineToggleReady = (isReady: boolean) => {
    socket?.emit('player:ready', { isReady });
  };

  const handleOnlineFillBots = () => {
    socket?.emit('room:fill_bots');
  };

  const handleOnlineStartGame = () => {
    socket?.emit('game:start');
  };

  const handleOnlineRajaReveal = () => {
    socket?.emit('game:raja_reveal');
  };

  const handleOnlineSubmitGuess = (targetPlayerId: string) => {
    socket?.emit('game:submit_guess', { targetPlayerId });
  };

  const handleOnlineNextRound = () => {
    socket?.emit('game:next_round');
  };

  const handleOnlineSetMeetUrl = (meetingUrl: string) => {
    socket?.emit('room:set_meet', { meetingUrl });
  };

  const handleSendChatMessage = (text: string) => {
    socket?.emit('chat:send', { text });
  };

  const handleScrollToChat = () => {
    sound.playClick();
    const el = document.getElementById('royal-room-chat');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = el.querySelector('input');
      if (input) input.focus();
    }
  };

  const handleExitHome = () => {
    setView('HOME');
  };

  return (
    <div className="min-h-screen w-full bg-[#0b0d14] text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      {/* Top Header */}
      <Header
        language={language}
        onToggleLanguage={handleToggleLanguage}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
        onOpenStats={() => setIsProfileOpen(true)}
        profile={profile}
        activeMeetUrl={onlineMeetSession?.meetingUrl}
        onOpenMeet={() => {
          if (onlineMeetSession?.meetingUrl) {
            openGoogleMeet(onlineMeetSession.meetingUrl);
          }
        }}
      />

      {/* Main View Area (Portrait-Optimized Mobile Viewport) */}
      <main className="flex-1 flex flex-col justify-center items-center w-full">
        {view === 'HOME' && (
          <HomeScreen
            language={language}
            profile={profile}
            onStartOffline={handleStartOfflineSetup}
            onCreateOnlineRoom={handleCreateOnlineRoom}
            onJoinOnlineRoom={handleJoinOnlineRoom}
            onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
            onOpenStats={() => setIsProfileOpen(true)}
          />
        )}

        {view === 'OFFLINE_SETUP' && (
          <PlayerSetup
            language={language}
            onBack={handleExitHome}
            onStartGame={handleStartOfflineGame}
          />
        )}

        {view === 'OFFLINE_GAME' && (
          <PassAndPlayGame
            initialPlayers={offlinePlayers}
            maxRounds={offlineMaxRounds}
            language={language}
            onExitHome={handleExitHome}
            userProfile={profile}
            onUpdateProfile={setProfile}
          />
        )}

        {(view === 'ONLINE_LOBBY' || view === 'ONLINE_GAME') && (
          <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-center lg:items-start justify-center gap-5 px-3 py-2">
            <div className="w-full max-w-md flex flex-col flex-1">
              {view === 'ONLINE_LOBBY' && (
                <OnlineLobby
                  roomCode={onlineRoomCode}
                  players={onlinePlayers}
                  currentUserId={profile.id}
                  hostPlayerId={onlineHostId}
                  meetSession={onlineMeetSession}
                  language={language}
                  onBack={handleExitHome}
                  onToggleReady={handleOnlineToggleReady}
                  onStartGame={handleOnlineStartGame}
                  onFillBots={handleOnlineFillBots}
                  onSetMeetUrl={handleOnlineSetMeetUrl}
                  onOpenChat={handleScrollToChat}
                  chatCount={chatMessages.length}
                />
              )}

              {view === 'ONLINE_GAME' && onlineGameState && (
                <OnlineGameView
                  gameState={onlineGameState}
                  myRole={myOnlineRole}
                  currentUserId={profile.id}
                  hostPlayerId={onlineHostId}
                  language={language}
                  onRajaReveal={handleOnlineRajaReveal}
                  onSubmitGuess={handleOnlineSubmitGuess}
                  onNextRound={handleOnlineNextRound}
                  onExitHome={handleExitHome}
                  onOpenChat={handleScrollToChat}
                  chatCount={chatMessages.length}
                />
              )}
            </div>

            {/* Chat Panel - Sideways on desktop (lg:) & directly visible inline below game board on mobile */}
            <div
              id="royal-room-chat"
              className="w-full max-w-md lg:max-w-none lg:w-80 shrink-0 lg:sticky lg:top-24 mt-2 lg:mt-0"
            >
              <ChatPanel
                isOpen={true}
                variant="integrated"
                messages={chatMessages}
                onSendMessage={handleSendChatMessage}
                language={language}
                currentUserId={profile.id}
              />
            </div>
          </div>
        )}
      </main>

      {/* Global Modals */}
      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
        language={language}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        language={language}
        profile={profile}
        onUpdateProfile={setProfile}
      />
    </div>
  );
}
