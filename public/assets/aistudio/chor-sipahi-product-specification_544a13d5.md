# Chor Sipahi --- Mobile Game Product Specification & Technical Architecture

**Version:** 1.0\
**Date:** 7 November 2026\
**Platforms:** Android and iOS\
**Game format:** Four-player classic Raja--Mantri--Sipahi--Chor\
**Modes:** Offline pass-and-play and online private multiplayer\
**Video:** Google Meet integration\
**Design direction:** Modern, polished, portrait-first

------------------------------------------------------------------------

## 1. Product Overview

Chor Sipahi is a cross-platform mobile game that digitizes the
traditional four-player Raja--Mantri--Sipahi--Chor game. Players can
play offline on one device or remotely with friends in private online
rooms.

The app combines: - Offline pass-and-play gameplay. - Online private
rooms for exactly four players. - Private role assignment and reveal. -
Real-time game synchronization. - In-app text chat. - Google Meet links
for voice and video conversations. - Round scoring, match history, and
player profiles.

**Product principle:** The game remains the primary experience. Google
Meet is an optional social layer and must never be required to start or
complete a game.

### 1.1 MVP goals

  Area              MVP requirement
  ----------------- ----------------------------------------
  Platforms         Android and iOS
  Game modes        Offline and online
  Online capacity   Exactly 4 players
  Rooms             Private room with 6-character code
  Communication     In-app text chat
  Audio/video       Google Meet
  Authentication    Guest-first; optional Google sign-in
  Languages         English and Hindi initially
  Orientation       Portrait-first
  Monetization      Free MVP; evaluate cosmetics/ads later

### 1.2 Out of scope for MVP

-   Public matchmaking.
-   Spectator mode.
-   Tournaments.
-   More than four players.
-   Built-in WebRTC video infrastructure.
-   AI moderation or transcription.
-   Complex social networking features.

These can be considered after validating retention and repeat gameplay.

------------------------------------------------------------------------

## 2. User Journeys

### 2.1 Offline journey

Home → Offline Game → Enter four player names → Assign roles → Each
player privately views their role → Raja reveals → Sipahi guesses →
Reveal results → Scoreboard → Next round.

### 2.2 Online journey

Home → Create Room → Share room code → Three friends join → All players
ready → Host starts game → Private role assignment → Raja reveals →
Sipahi guesses → Results → Next round.

### 2.3 Google Meet journey

Online Room → Host creates Meet link → Link is shared with players →
Players join Google Meet → Players return to Chor Sipahi → Game
continues.

Meet availability or failure must not block gameplay.

------------------------------------------------------------------------

## 3. Screen-by-Screen UI Specification

The visual direction is modern, premium, dark and playful. Use a
consistent design system, clear typography, accessible contrast,
responsive layouts, and restrained animations.

### 3.1 Splash screen

Elements: - Chor Sipahi logo. - Animated playing cards or character
symbols. - Loading indicator. - App version.

### 3.2 Home screen

Elements: - User avatar and nickname. - Play Offline. - Play Online. -
How to Play. - Recent games. - Settings. - Leaderboard entry point (can
be disabled until a later release).

Primary actions: - `Play Offline` - `Create Room` - `Join Room`

### 3.3 Create / Join Room

Create room: - Generate unique room code. - Private room by default. -
Configure supported game rules. - Optional Google Meet creation. - Share
invitation.

Join room: - Enter six-character room code. - Validate room and
capacity. - Show room information. - Join as a player.

### 3.4 Multiplayer lobby

Show four player slots. Each slot displays: - Avatar. - Nickname. -
Connection status. - Ready status.

Controls: - Copy room code. - Share invitation. - Create Google Meet. -
Join Google Meet. - Start Game (host only).

Start Game is enabled only when all four distinct players are present
and ready.

### 3.5 Role assignment

Four unique roles are assigned: - Raja. - Mantri. - Sipahi. - Chor.

Each player sees only their own role.

Offline: - Use a private reveal screen. - Ask the player to hide the
screen before passing the device. - Require a deliberate continue
action.

Online: - Deliver the role only to the assigned player's authenticated
socket/session. - Never broadcast all roles to the shared room.

### 3.6 Game screen

Display: - Four player avatars. - Current round. - Current phase. -
Timer, if enabled. - Chat entry point. - Meet button. - Clear
instructions for the active phase.

Game phases: 1. Waiting for Raja reveal. 2. Raja revealed. 3. Sipahi
selection. 4. Guess submitted. 5. Results reveal.

### 3.7 Sipahi guessing screen

The Sipahi selects one of the two unidentified players.

Rules: - Sipahi cannot select themselves. - Raja is already
identified. - The guess is private until submitted. - The guess cannot
be changed after acceptance.

### 3.8 Results screen

Display: - All four roles. - Correct/incorrect guess. - Points earned
per player. - Cumulative scores. - Next round action. - End-game action
when appropriate.

### 3.9 Chat screen

MVP features: - Room-wide text messages. - Emojis and quick reactions. -
System messages. - Player join/leave notifications. - Timestamps.

Do not add private role-based messaging in the MVP. It increases
opportunities for confusion and collusion.

### 3.10 Profile and game history

Display: - Total games played. - Wins. - Games played as Chor. -
Successful Sipahi guesses. - Total points. - Recent matches. - Avatar
and nickname.

Avoid public rankings until there is enough active usage to make them
meaningful.

------------------------------------------------------------------------

## 4. Game Rules and State Machine

Regional versions of Chor Sipahi can differ. The following is the
proposed default ruleset and should be configurable in the game engine.

### 4.1 Role assignment

Each round randomly assigns exactly one of each role to four distinct
players.

  Role       Base points
  -------- -------------
  Raja             1,000
  Mantri             800
  Sipahi             500
  Chor                 0

### 4.2 Round flow

1.  **Assign roles:** Randomly distribute the four unique roles.
2.  **Private role reveal:** Each player privately sees their role.
3.  **Raja reveal:** Raja publicly identifies themselves.
4.  **Sipahi guessing:** Sipahi selects one of the two remaining
    unidentified players.
5.  **Submit guess:** The guess is locked.
6.  **Reveal all roles:** Reveal Raja, Mantri, Sipahi and Chor.
7.  **Calculate scores:** Apply the configured scoring policy.
8.  **Next round:** Shuffle roles and repeat.

### 4.3 Default scoring policy

  Outcome                            Raja   Mantri   Sipahi   Chor
  ------------------------------- ------- -------- -------- ------
  Sipahi guesses Chor correctly     1,000      800      500      0
  Sipahi guesses incorrectly        1,000      800        0    500

The values are proposed defaults, not immutable rules.

Example: - Raja: Player A. - Mantri: Player B. - Sipahi: Player C. -
Chor: Player D. - If Player C guesses Player D, the guess is correct and
Sipahi receives 500 points. - If Player C guesses Player B, the guess is
incorrect; Sipahi receives 0 and Chor receives 500.

Keep scoring in a versioned rules configuration so that future
house-rule variants do not require rewriting the engine.

### 4.4 State machine

``` mermaid
stateDiagram-v2
    [*] --> WAITING_FOR_PLAYERS
    WAITING_FOR_PLAYERS --> READY_CHECK
    READY_CHECK --> ROLE_ASSIGNMENT: all four ready
    ROLE_ASSIGNMENT --> RAJA_REVEAL
    RAJA_REVEAL --> SIPAHI_GUESS
    SIPAHI_GUESS --> ROLE_REVEAL: guess accepted or timeout
    ROLE_REVEAL --> ROUND_RESULTS
    ROUND_RESULTS --> ROLE_ASSIGNMENT: next round
    ROUND_RESULTS --> GAME_COMPLETED: match finished
    GAME_COMPLETED --> [*]
```

All transitions must be validated by the server for online games.
Clients must not be able to skip phases.

### 4.5 Edge cases

  -----------------------------------------------------------------------
  Scenario                            Expected behavior
  ----------------------------------- -----------------------------------
  Player disconnects                  Allow reconnection for 60 seconds

  Sipahi does not guess               Resolve as incorrect after
                                      configured timeout

  Host disconnects                    Transfer host to another connected
                                      player

  Player leaves permanently           Pause and offer restart or abandon

  Duplicate submission                Reject idempotently

  Simultaneous requests               Accept only the first valid
                                      transition

  App goes to background              Preserve current round state

  Host closes app                     Room remains alive until expiry
  -----------------------------------------------------------------------

Never reveal a disconnected player's role automatically. That would
create an exploitable way to learn hidden information.

------------------------------------------------------------------------

## 5. Technical Architecture

### 5.1 Recommended stack

  Layer             Technology                       Purpose
  ----------------- -------------------------------- -------------------------------------
  Mobile            React Native + Expo              One Android/iOS codebase
  Language          TypeScript                       Type safety
  UI                NativeWind + custom components   Shared design system
  Navigation        Expo Router                      Screen navigation
  Local state       Zustand                          UI and game state
  Server state      TanStack Query                   API caching and synchronization
  Offline storage   SQLite                           Local game persistence
  Backend           Node.js + NestJS                 Business logic
  Real-time         Socket.IO                        Multiplayer and chat
  Database          PostgreSQL                       Persistent data
  Cache             Redis                            Presence, locks and ephemeral state
  Authentication    Firebase Auth                    Guest and Google sign-in
  Video             Google Meet API                  Meeting creation
  Push              FCM / APNs                       Notifications
  Hosting           AWS ECS Fargate                  Backend deployment
  Monitoring        Sentry + OpenTelemetry           Errors and performance

NestJS is recommended over a minimal Express application because it
provides modular structure, dependency injection, validation, guards and
WebSocket support.

Use a modular monolith for the MVP. Microservices are unnecessary at
this stage.

### 5.2 High-level architecture

``` mermaid
flowchart TD
    A[React Native App: Android and iOS] --> B[REST API]
    A --> C[Socket.IO]
    A --> D[Local SQLite]
    B --> E[NestJS Application]
    C --> E
    E --> F[Game Engine]
    E --> G[PostgreSQL]
    E --> H[Redis]
    E --> I[Google Meet API]
    E --> J[Firebase / Push Notifications]
```

### 5.3 Project structure

``` text
chor-sipahi/
├── apps/
│   ├── mobile/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   ├── (tabs)/
│   │   │   ├── offline/
│   │   │   ├── online/
│   │   │   ├── game/
│   │   │   ├── profile/
│   │   │   └── settings/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── lobby/
│   │   │   ├── game/
│   │   │   ├── chat/
│   │   │   └── meet/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   └── database/
│   └── server/
│       └── src/
│           ├── auth/
│           ├── users/
│           ├── rooms/
│           ├── matchmaking/
│           ├── game/
│           ├── scoring/
│           ├── chat/
│           ├── meet/
│           ├── notifications/
│           ├── websocket/
│           └── common/
├── packages/
│   ├── game-engine/
│   ├── shared-types/
│   └── validation/
├── infrastructure/
│   ├── docker/
│   ├── terraform/
│   └── monitoring/
└── README.md
```

### 5.4 Shared game engine

Implement game rules in a shared, deterministic TypeScript package.

The same rules should be used by: - Offline mode. - Online server
execution. - Automated tests.

The online server remains authoritative and independently validates
actions.

Suggested interface:

``` typescript
interface GameEngine {
  createGame(players: Player[]): Game;
  assignRoles(gameId: string): Round;
  revealRaja(roundId: string): GameState;
  submitGuess(
    roundId: string,
    sipahiId: string,
    targetId: string
  ): GameState;
  calculateScores(roundId: string): Score[];
  nextRound(gameId: string): Round;
}
```

Use an injectable seeded random generator in tests so that scenarios can
be reproduced. Use secure server-side randomness for production role
assignment.

------------------------------------------------------------------------

## 6. Backend API Specification

Base URL:

``` text
/api/v1
```

Authenticated endpoints use:

``` http
Authorization: Bearer <access_token>
```

### 6.1 Authentication

  Method   Endpoint          Purpose
  -------- ----------------- ----------------------
  POST     `/auth/guest`     Create guest session
  POST     `/auth/google`    Google sign-in
  POST     `/auth/refresh`   Refresh access token
  POST     `/auth/logout`    End session
  GET      `/users/me`       Get profile
  PATCH    `/users/me`       Update profile

Guest authentication should be the default. Do not force registration
before a user can play.

### 6.2 Room APIs

  Method   Endpoint                  Purpose
  -------- ------------------------- ----------------------
  POST     `/rooms`                  Create private room
  POST     `/rooms/join`             Join using room code
  GET      `/rooms/:roomId`          Get room information
  POST     `/rooms/:roomId/leave`    Leave room
  POST     `/rooms/:roomId/ready`    Update ready state
  POST     `/rooms/:roomId/start`    Start game
  POST     `/rooms/:roomId/invite`   Generate invite link
  DELETE   `/rooms/:roomId`          Close room

Example room request:

``` json
{
  "gameMode": "CLASSIC",
  "maxPlayers": 4,
  "isPrivate": true,
  "rules": {
    "rajaPoints": 1000,
    "mantriPoints": 800,
    "sipahiCorrectPoints": 500,
    "chorCorrectGuessPoints": 0,
    "chorWrongGuessPoints": 500,
    "guessTimeoutSeconds": 45,
    "reconnectGraceSeconds": 60
  }
}
```

### 6.3 Game APIs

  Method   Endpoint                           Purpose
  -------- ---------------------------------- ---------------------
  GET      `/games/:gameId`                   Get game state
  GET      `/games/:gameId/rounds/:roundId`   Get round state
  POST     `/games/:gameId/raja-reveal`       Reveal Raja
  POST     `/games/:gameId/guess`             Submit Sipahi guess
  POST     `/games/:gameId/next-round`        Begin next round
  POST     `/games/:gameId/finish`            Finish game
  GET      `/games/:gameId/results`           Get final results
  GET      `/games/history`                   Get user history

For live online gameplay, use Socket.IO for actions and REST for state
recovery and historical queries. Avoid maintaining two independent
implementations of the same action.

### 6.4 Chat APIs

  --------------------------------------------------------------------------------------
  Method                  Endpoint                               Purpose
  ----------------------- -------------------------------------- -----------------------
  GET                     `/rooms/:roomId/messages`              Retrieve chat history

  POST                    `/rooms/:roomId/messages`              Send message

  DELETE                  `/rooms/:roomId/messages/:messageId`   Delete own message, if
                                                                 enabled
  --------------------------------------------------------------------------------------

Use Socket.IO for live delivery.

### 6.5 Google Meet APIs

  Method   Endpoint                      Purpose
  -------- ----------------------------- ---------------------------
  POST     `/rooms/:roomId/meet`         Create meeting
  GET      `/rooms/:roomId/meet`         Get meeting details
  POST     `/rooms/:roomId/meet/share`   Share invitation
  DELETE   `/rooms/:roomId/meet`         Clear meeting association

Example response (illustrative only):

``` json
{
  "provider": "GOOGLE_MEET",
  "meetingUrl": "https://meet.google.com/xxx-yyyy-zzz",
  "status": "READY",
  "createdBy": "user_123"
}
```

### 6.6 Error response

Use a consistent error contract:

``` json
{
  "success": false,
  "error": {
    "code": "INVALID_GAME_STATE",
    "message": "Guessing phase has not started.",
    "details": {}
  }
}
```

Suggested error codes: - `ROOM_NOT_FOUND` - `ROOM_FULL` -
`INVALID_ROOM_CODE` - `PLAYER_NOT_AUTHORIZED` - `GAME_NOT_STARTED` -
`INVALID_GAME_STATE` - `INVALID_ROLE_ACTION` - `DUPLICATE_ACTION` -
`GUESS_TIMEOUT` - `PLAYER_NOT_CONNECTED`

------------------------------------------------------------------------

## 7. Real-Time Socket.IO Event Specification

Namespace:

``` text
/game
```

All sockets must authenticate before joining a room.

### 7.1 Client-to-server events

  -----------------------------------------------------------------------
  Event                   Payload                 Purpose
  ----------------------- ----------------------- -----------------------
  `room:join`             `roomId`                Join room

  `room:leave`            `roomId`                Leave room

  `player:ready`          `isReady`               Update readiness

  `game:start`            `roomId`                Host starts

  `game:raja_reveal`      `roundId`               Reveal Raja

  `game:submit_guess`     `roundId`,              Submit guess
                          `targetPlayerId`,       
                          `actionId`              

  `game:next_round`       `gameId`                Next round

  `chat:send`             `message`,              Send chat
                          `clientMessageId`       

  `game:sync`             `lastSequence`          Recover missed events
  -----------------------------------------------------------------------

### 7.2 Server-to-client events

  Event                    Purpose
  ------------------------ -------------------------
  `room:updated`           Lobby state changed
  `player:joined`          Player joined
  `player:left`            Player left
  `player:disconnected`    Connection lost
  `player:reconnected`     Connection restored
  `game:started`           Game started
  `game:role_assigned`     Private role assignment
  `game:raja_revealed`     Raja revealed
  `game:guess_started`     Guessing phase
  `game:guess_submitted`   Guess accepted
  `game:roles_revealed`    All roles revealed
  `game:score_updated`     Scores updated
  `game:round_completed`   Round finished
  `game:completed`         Game finished
  `chat:message`           New chat message
  `error`                  Error notification

### 7.3 Event envelope

Important events should include:

``` json
{
  "eventId": "evt_001",
  "sequence": 25,
  "gameId": "game_123",
  "roundId": "round_001",
  "timestamp": "2026-11-06T18:00:00Z",
  "data": {}
}
```

Private role assignment example:

``` json
{
  "event": "game:role_assigned",
  "data": {
    "gameId": "game_123",
    "roundId": "round_001",
    "role": "SIPAHI"
  }
}
```

Security rule: emit role assignments to an individual socket or
authenticated user's private room, never to the shared game room.

Use: - Sequence numbers. - Idempotency keys. - Server-side validation. -
Acknowledgements. - State recovery after reconnect. - Durable event
persistence for important game transitions.

Socket delivery alone is not a durable source of game state.

------------------------------------------------------------------------

## 8. Database Schema

PostgreSQL is the persistent source of truth. Redis is for ephemeral
state, distributed locks, presence and caching. Do not make Redis the
only place where game results exist.

### 8.1 Entity relationships

``` mermaid
erDiagram
    USERS ||--o{ ROOM_PLAYERS : joins
    ROOMS ||--o{ ROOM_PLAYERS : contains
    ROOMS ||--o{ GAMES : hosts
    GAMES ||--o{ GAME_ROUNDS : contains
    GAME_ROUNDS ||--o{ ROUND_ROLES : assigns
    USERS ||--o{ ROUND_ROLES : receives
    GAME_ROUNDS ||--o| ROUND_GUESSES : records
    USERS ||--o{ CHAT_MESSAGES : sends
    ROOMS ||--o{ CHAT_MESSAGES : contains
    GAMES ||--o{ GAME_RESULTS : produces
    ROOMS ||--o| MEET_SESSIONS : links

    USERS {
        uuid id PK
        varchar nickname
        varchar avatar_url
        varchar auth_provider
        timestamp created_at
    }
    ROOMS {
        uuid id PK
        varchar room_code UK
        uuid host_user_id FK
        varchar status
        jsonb rules
        timestamp expires_at
    }
    ROOM_PLAYERS {
        uuid id PK
        uuid room_id FK
        uuid user_id FK
        boolean is_ready
        varchar status
    }
    GAMES {
        uuid id PK
        uuid room_id FK
        varchar status
        int current_round
        timestamp started_at
    }
    GAME_ROUNDS {
        uuid id PK
        uuid game_id FK
        int round_number
        varchar phase
        timestamp completed_at
    }
    ROUND_ROLES {
        uuid id PK
        uuid round_id FK
        uuid user_id FK
        varchar role
        int points
    }
    ROUND_GUESSES {
        uuid id PK
        uuid round_id FK
        uuid sipahi_user_id FK
        uuid guessed_user_id FK
        boolean is_correct
    }
    CHAT_MESSAGES {
        uuid id PK
        uuid room_id FK
        uuid user_id FK
        text message
        timestamp created_at
    }
    GAME_RESULTS {
        uuid id PK
        uuid game_id FK
        uuid user_id FK
        int total_points
    }
    MEET_SESSIONS {
        uuid id PK
        uuid room_id FK
        varchar meeting_url
        varchar provider
        varchar status
    }
```

### 8.2 Core SQL tables

``` sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    nickname VARCHAR(30) NOT NULL,
    avatar_url TEXT,
    auth_provider VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rooms (
    id UUID PRIMARY KEY,
    room_code VARCHAR(6) UNIQUE NOT NULL,
    host_user_id UUID REFERENCES users(id),
    status VARCHAR(30) NOT NULL,
    rules JSONB NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE room_players (
    id UUID PRIMARY KEY,
    room_id UUID REFERENCES rooms(id),
    user_id UUID REFERENCES users(id),
    is_ready BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'CONNECTED',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

CREATE TABLE games (
    id UUID PRIMARY KEY,
    room_id UUID REFERENCES rooms(id),
    status VARCHAR(30) NOT NULL,
    current_round INT DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE TABLE game_rounds (
    id UUID PRIMARY KEY,
    game_id UUID REFERENCES games(id),
    round_number INT NOT NULL,
    phase VARCHAR(30) NOT NULL,
    event_sequence BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(game_id, round_number)
);

CREATE TABLE round_roles (
    id UUID PRIMARY KEY,
    round_id UUID REFERENCES game_rounds(id),
    user_id UUID REFERENCES users(id),
    role VARCHAR(20) NOT NULL,
    points INT DEFAULT 0,
    UNIQUE(round_id, user_id),
    UNIQUE(round_id, role)
);

CREATE TABLE round_guesses (
    id UUID PRIMARY KEY,
    round_id UUID UNIQUE REFERENCES game_rounds(id),
    sipahi_user_id UUID REFERENCES users(id),
    guessed_user_id UUID REFERENCES users(id),
    is_correct BOOLEAN NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY,
    room_id UUID REFERENCES rooms(id),
    user_id UUID REFERENCES users(id),
    message TEXT NOT NULL,
    client_message_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, client_message_id)
);

CREATE TABLE meet_sessions (
    id UUID PRIMARY KEY,
    room_id UUID REFERENCES rooms(id),
    provider VARCHAR(30) NOT NULL,
    meeting_url TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'READY',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 8.3 Additional production tables and constraints

Add: - `game_results`: one row per player per completed game. -
`user_sessions`: authentication and refresh token management. -
`game_events`: durable event history and state recovery. -
`meet_oauth_connections`: encrypted Google OAuth credentials. -
`room_invitations`: invitation management.

Important constraints: - One player can have only one role per round. -
Each role must be unique within a round. - One guess per round. - One
active game per room. - Exactly four distinct players must be present
when starting a game. - A completed game result must be generated only
once.

Store OAuth refresh tokens encrypted, never in plaintext.

------------------------------------------------------------------------

## 9. Offline Architecture

Offline mode must not depend on the backend, Redis, Firebase or Google
Meet.

Use SQLite for local persistence.

Suggested local tables: - `local_players` - `local_games` -
`local_game_rounds` - `local_round_roles` - `local_round_guesses` -
`local_scores` - `local_settings`

For a single-device game: - Hide the role before handing the phone
over. - Display a screen privacy instruction. - Clear role information
from the visible screen. - Require a deliberate reveal button. - Avoid
notifications that expose role information.

Offline data can later be synchronized with the user's account, but
never merge an unfinished local round into a live online round.

------------------------------------------------------------------------

## 10. Google Meet Integration

### 10.1 Recommended approach

Use the Google Meet REST API to create a meeting space. The
`spaces.create` method creates a Meet space and returns a `meetingUri`.
It requires Google OAuth authorization with the `meetings.space.created`
scope.

Official documentation: - [Google Meet API --- Meeting
spaces](https://developers.google.com/workspace/meet/api/guides/meeting-spaces) -
[Google Meet API
overview](https://developers.google.com/workspace/meet/api/guides/overview)

An alternative is the Google Calendar API, which can create an event
with a Google Meet conference. Conference creation is asynchronous, so
the backend must check whether creation succeeded before displaying the
meeting link.

Prefer the Meet REST API for this use case because a calendar event is
not required just to play a game.

### 10.2 Integration flow

1.  Host taps **Create Google Meet**.
2.  Backend checks Google OAuth authorization.
3.  Backend calls Google Meet `spaces.create`.
4.  Backend saves the meeting URI against the room.
5.  Backend broadcasts meeting availability.
6.  All four players can tap **Join Meet**.

### 10.3 Illustrative backend implementation

``` typescript
async function createMeetSpace(accessToken: string) {
  const response = await fetch(
    "https://meet.googleapis.com/v2/spaces",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({})
    }
  );

  if (!response.ok) {
    throw new Error("Unable to create Google Meet");
  }

  const data = await response.json();

  return {
    meetingUrl: data.meetingUri,
    spaceName: data.name
  };
}
```

The token must be obtained through a valid Google OAuth flow. Do not
hardcode tokens or expose them to the mobile client.

### 10.4 Product behavior and limitations

-   Host connects their Google account when required.
-   Host creates one meeting for the game room.
-   Meeting URL is shared with all four players.
-   Players open Meet in the installed app or browser.
-   Players can return to Chor Sipahi.
-   Game remains synchronized if a player temporarily leaves the game
    app.

Google Meet is a separate application/browser experience, not an
embedded video component inside the React Native game. Creating a
meeting space does not guarantee every participant can enter without
admission or access restrictions. Test access behavior with the selected
Google account and meeting configuration.

If Meet creation fails: - Keep the game playable. - Show a retry
option. - Allow the host to share an externally created Meet link. -
Never block game creation on Meet availability.

------------------------------------------------------------------------

## 11. Security and Anti-Cheating

  -----------------------------------------------------------------------
  Risk                                Mitigation
  ----------------------------------- -----------------------------------
  Player reads another player's role  Private role delivery

  Player changes role locally         Server-authoritative role
                                      assignment

  Player submits multiple guesses     Database uniqueness and idempotency

  Player manipulates score            Server-side score calculation

  Player joins twice                  Unique room membership

  Unauthorized player joins           Room membership validation

  Room code guessing                  Random codes and rate limiting

  Replayed events                     Sequence numbers and action IDs

  Chat spam                           Rate limiting and message limits

  Token theft                         Short-lived access tokens and
                                      secure storage
  -----------------------------------------------------------------------

Critical rules: 1. Never broadcast complete role assignments. 2. Never
send the correct answer before the reveal phase. 3. Never accept
client-calculated scores. 4. Validate every action against the current
game phase. 5. Use transactions when committing guesses and scores. 6.
Use TLS for all communication. 7. Keep Google OAuth credentials
server-side. 8. Use Keychain/SecureStore-backed storage for mobile
credentials.

The online server is the single source of truth.

------------------------------------------------------------------------

## 12. Deployment and Infrastructure

Recommended initial infrastructure:

``` text
Android / iOS apps
       |
       | HTTPS / WebSocket
       v
AWS Application Load Balancer
       |
       v
ECS Fargate — NestJS
       |
       +------ RDS PostgreSQL
       |
       +------ ElastiCache Redis
       |
       +------ Google Meet API
       |
       +------ Firebase / Push Notifications

Monitoring:
Sentry + CloudWatch + OpenTelemetry
```

Considerations: - Use a Redis Socket.IO adapter when running multiple
backend instances. - Use sticky sessions where required by the selected
Socket.IO transport configuration. - Persist important game transitions
before broadcasting them. - Use health checks and graceful shutdown. -
Set room expiry and cleanup jobs. - Enable PostgreSQL automated
backups. - Use managed secrets storage. - Start with one backend
deployment and scale horizontally when usage requires it.

------------------------------------------------------------------------

## 13. Testing Strategy

### 13.1 Unit tests

Test: - Role distribution. - Duplicate role prevention. - Raja reveal. -
Sipahi guess validation. - Correct and incorrect scoring. - Round
transitions. - Timeout behavior. - Game completion.

### 13.2 Integration tests

Test: - Create room. - Join four players. - Start game. - Role
assignment. - Guess submission. - Result persistence. - Chat delivery. -
Meet creation and failure handling.

### 13.3 Multiplayer tests

Simulate four independent clients and test: - Two clients submitting
actions simultaneously. - Network loss during guessing. - Host
disconnection. - Reconnection from another device. - Duplicate event
delivery. - Expired room. - Backend restart during an active match.

### 13.4 Mobile tests

Test on: - Android phones with different screen sizes. - iPhones with
different screen sizes. - Low-end Android devices. -
Background/foreground transitions. - Poor network connections. -
Deep-link handling for Meet.

### 13.5 Initial quality targets

  Metric                                        Target
  ------------------------------- --------------------
  Successful game completion                      99%+
  Online action acknowledgement       p95 under 300 ms
  Room creation                     p95 under 1 second
  Role assignment leakage                         Zero
  Duplicate scoring                               Zero
  Crash-free sessions                           99.5%+

These are engineering targets, not guaranteed performance figures.

------------------------------------------------------------------------

## 14. Implementation Roadmap

  -----------------------------------------------------------------------
  Phase                   Timeline                Deliverables
  ----------------------- ----------------------- -----------------------
  1\. Foundation          Week 1                  Expo/NestJS setup,
                                                  PostgreSQL, shared game
                                                  engine, design system

  2\. Offline gameplay    Week 2                  Home, player setup,
                                                  role reveal, guessing,
                                                  results, SQLite

  3\. Online multiplayer  Weeks 3--4              Guest auth, rooms,
                                                  Socket.IO, lobby,
                                                  server game engine,
                                                  reconnect

  4\. Social features     Week 5                  Chat, reactions,
                                                  invitations, Google
                                                  OAuth, Meet integration

  5\. Polish and          Week 6                  Animations, sounds,
  reliability                                     notifications, security
                                                  and load testing

  6\. Release             Week 7                  Android beta, iOS
                                                  TestFlight, bug fixes,
                                                  store listings,
                                                  production deployment
  -----------------------------------------------------------------------

Estimated timeline: seven weeks for a focused MVP with one experienced
full-stack developer and limited design scope. Store review and Google
OAuth approval can add time.

### 14.1 Definition of done

-   [ ] Four people can play offline on one device.
-   [ ] Four people can play online from separate devices.
-   [ ] Each player sees only their own role.
-   [ ] Raja reveal works correctly.
-   [ ] Sipahi can submit exactly one guess.
-   [ ] Scoring is calculated correctly.
-   [ ] Results synchronize across all clients.
-   [ ] Chat works in private rooms.
-   [ ] Host can create and share a Google Meet link.
-   [ ] Players can leave the app and return without losing game state.
-   [ ] Android and iOS builds pass device testing.

------------------------------------------------------------------------

## 15. Cost Estimation

Illustrative early-stage monthly budget for modest usage:

  Component                          Estimated monthly cost
  -------------------------- ------------------------------
  AWS backend                                 ₹1,000--3,000
  PostgreSQL                                  ₹1,000--2,500
  Redis                                           ₹0--1,500
  Monitoring                                      ₹0--1,000
  Firebase                                     ₹0 initially
  Google Meet                  Depends on account and usage
  Domain and miscellaneous                        ₹200--500

**Indicative total: ₹2,200--8,500 per month.**

This excludes development, taxes, app-store fees and any paid Google
Workspace subscription. Actual costs depend on deployment size and
usage. Validate with current cloud pricing before committing to a
budget.

The main cost advantage of Google Meet is avoiding your own audio/video
media infrastructure. Players still need access to Google Meet and
applicable account/service limits.

------------------------------------------------------------------------

## 16. Final MVP Scope

### Included in MVP

  Feature        Scope
  -------------- ----------------------------------------------------
  Offline game   Pass-and-play, role assignment, scores and history
  Online game    Private rooms, four players, synchronization
  Social         Chat, emojis and invitations
  Google Meet    Create and join meeting links
  Profiles       Guest identity, nickname, avatar, basic history
  Platforms      Android and iOS from one codebase

### Later releases

-   Public matchmaking.
-   Player rankings.
-   Tournaments.
-   Custom avatars.
-   More Indian party games.
-   Integrated voice/video if there is a strong reason to replace Meet.

### Recommended development order

1.  Implement the pure game engine.
2.  Write tests for every game scenario.
3.  Build the offline game using that engine.
4.  Build the online server around the same rules.
5.  Implement Socket.IO synchronization.
6.  Integrate chat and Google Meet.
7.  Polish the visual experience.

Do not start by implementing screens independently. The most damaging
bugs would be multiplayer synchronization errors that reveal roles or
award incorrect scores.

------------------------------------------------------------------------

## 17. Android and iOS: One Codebase

**The app will run on both Android and iOS from one React Native +
Expo + TypeScript project.** There is no need to develop two separate
applications or maintain two repositories.

  -----------------------------------------------------------------------
  Component               Android                 iOS
  ----------------------- ----------------------- -----------------------
  UI and screens          Shared code             Shared code

  Offline game engine     Shared code             Shared code

  Online multiplayer      Shared code             Shared code

  Socket.IO               Shared code             Shared code

  Chat                    Shared code             Shared code

  Meet integration        Platform-aware app      Platform-aware app
                          launching               launching

  Business logic          Shared code             Shared code
  -----------------------------------------------------------------------

Some platform-specific configuration and testing are still required,
including permissions, signing, push notifications, deep links and
app-store distribution.

### 17.1 Build commands

``` bash
# Start development server
npx expo start

# Android production build
eas build --platform android --profile production

# iOS production build
eas build --platform ios --profile production

# Build both platforms
eas build --platform all --profile production
```

Use Expo EAS Build for cloud builds. iOS distribution requires Apple
Developer account access and appropriate signing/provisioning. Android
distribution requires a signed Android App Bundle for Google Play.

### 17.2 Final platform recommendation

-   One Expo project.
-   One shared TypeScript codebase.
-   One shared backend.
-   One shared game engine.
-   Separate Android and iOS build artifacts generated from the same
    project.
-   Platform-specific behavior only where the operating system requires
    it.

------------------------------------------------------------------------

## 18. Reference Documentation

-   [Expo documentation](https://docs.expo.dev/)
-   [React Native
    documentation](https://reactnative.dev/docs/getting-started)
-   [NestJS documentation](https://docs.nestjs.com/)
-   [Socket.IO documentation](https://socket.io/docs/v4/)
-   [PostgreSQL documentation](https://www.postgresql.org/docs/)
-   [Google Meet API
    overview](https://developers.google.com/workspace/meet/api/guides/overview)
-   [Google Meet meeting
    spaces](https://developers.google.com/workspace/meet/api/guides/meeting-spaces)
-   [Expo EAS Build](https://docs.expo.dev/build/introduction/)

------------------------------------------------------------------------

**Document status:** Product and architecture proposal.\
**Next step:** Validate the rules with intended players, finalize the
scoring configuration, then implement and test the shared game engine
before building the complete UI.
