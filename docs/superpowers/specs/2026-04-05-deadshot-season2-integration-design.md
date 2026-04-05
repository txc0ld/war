# Deadshot — Season 2 Integration Design

> War Room evolves from a web-based PvP battle sim into a browser-playable scope-view sniper duel arena, reusing the existing platform (wallet auth, profiles, chat, leaderboard, killfeed) and adding a PlayCanvas game layer + real-time WebSocket game server.

---

## 1. Game Concept

### Format

Scope-view sniper duel. Two players are placed in a 3D arena at fixed positions. Each sees a first-person view — their NFT sniper rifle in the foreground, looking out over the environment. No WASD movement.

### Core Interactions

| Input | Action |
|---|---|
| Mouse move | Pan view / aim |
| Right-click | Toggle scope (2.5x / 6x zoom via NFT reticle) |
| Left-click | Fire (bolt-action, 1.5s cycle time, 5-round magazine) |
| R | Reload (3.5s, vulnerability window) |
| C | Crouch (toggle) — smaller hitbox, reduced scope sway, restricted view angle |

### Match Structure

| Parameter | Value |
|---|---|
| Format | Best of 5 (first to 3 rounds) |
| Round timer | 60 seconds |
| Headshot | Instant kill |
| Body shot | 55 damage (2 shots to kill from 100 HP) |
| Crouching | Reduces hitbox, eliminates scope sway, limits view |
| Round timeout | Highest HP wins; if tied, draw (no point awarded) |
| Estimated match duration | 3-5 minutes |

### Skill Expression

- Spotting: finding the opponent in the environment before they find you
- Aim precision: headshot vs body vs miss
- Stance management: crouch for stability and smaller profile vs stand for wider view
- Ammo/reload timing: 5 rounds, punishing reload, bolt-action pacing
- Scope discipline: scoped for precision vs unscoped for awareness

---

## 2. Technical Architecture

### Monorepo Changes

```
apps/
  web/              # Existing — evolves to Season 2 hub + PlayCanvas host
  api/              # Existing — extends with Season 2 routes
  game-server/      # NEW — Bun WebSocket server for live duels
packages/
  shared/           # Existing — add Season 2 types + constants
```

### System Interaction

```
Browser (React + PlayCanvas)
    |
    |-- HTTPS --> API (Hono)
    |                |-- Postgres (auth, profiles, matchmaking,
    |                |             scoring, leaderboard, chat, killfeed)
    |                |
    |                |-- POST result --> (internal, shared secret)
    |
    |-- WebSocket --> Game Server (Bun)
                         |-- per-room duel state
                         |-- server-authoritative hit detection
```

### API (apps/api)

Extends the existing Hono API with new Season 2 routes:

- `POST /api/s2/battles/queue` — join Season 2 matchmaking queue (same wallet-sig auth pattern)
- `GET /api/s2/battles/queue/:queueId` — poll match status
- `GET /api/s2/battles/:battleId` — get match result/history
- `GET /api/s2/leaderboard` — Season 2 leaderboard
- `GET /api/s2/snipers/:address` — owned sniper NFTs (cached metadata proxy)
- `GET /api/s2/armory/:tokenId` — individual sniper detail + cosmetic data

Season 1 routes remain at `/api/battles/*`, `/api/leaderboard`, etc. but matchmaking queue is disabled (returns 410 Gone). Season 1 data is read-only.

### Game Server (apps/game-server)

New package. Bun + native WebSocket. Stateless per-match — each room is two connections.

**Room lifecycle:**

1. API matchmaking pairs two players, creates `s2_battles` row (status `pending`), generates room ID + short-lived auth tokens
2. API returns room connection info to both clients (game server URL, room ID, token)
3. Both clients open WebSocket to game server, authenticate with token
4. Game server runs the match: round loop, state sync, hit detection
5. Match ends — game server POSTs result to API (service-to-service, shared secret)
6. API scores the match, updates leaderboard, writes killfeed
7. Connections close, room garbage collected

**Tick rate:** 20-30 ticks/second. Each tick broadcasts: both players' aim direction, stance, health, ammo, round state, timer.

**Hit detection:** Server-authoritative. Client sends fire input + aim ray direction. Server validates ray against opponent's position/hitbox at that tick with basic lag compensation (rewind ~2-3 ticks based on client RTT). Returns hit/miss + damage zone.

**Hitboxes:** Two zones — head (small, 100+ damage = instant kill) and body (larger, 55 damage). Crouching shrinks both zones and shifts head position down.

**Anti-cheat:** Server-authoritative hits (clients can't fake). Fire rate limited to bolt-action timing server-side. NFT ownership re-verified at room join.

### Database

Same Postgres instance. New tables prefixed `s2_`:

```sql
CREATE TABLE s2_players (
  address        TEXT PRIMARY KEY,
  score          INTEGER NOT NULL DEFAULT 0,
  elo            INTEGER NOT NULL DEFAULT 1000,  -- unused at launch, ready for future
  wins           INTEGER NOT NULL DEFAULT 0,
  losses         INTEGER NOT NULL DEFAULT 0,
  headshot_kills INTEGER NOT NULL DEFAULT 0,
  total_kills    INTEGER NOT NULL DEFAULT 0,
  sniper_count   INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE s2_battles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  left_address    TEXT NOT NULL REFERENCES s2_players(address),
  left_token      INTEGER NOT NULL,
  right_address   TEXT NOT NULL REFERENCES s2_players(address),
  right_token     INTEGER NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',  -- pending, active, resolved, failed
  winner          TEXT,  -- 'left' | 'right' | null
  left_score      INTEGER,
  right_score     INTEGER,
  rounds_won_left  INTEGER,
  rounds_won_right INTEGER,
  rounds_json     JSONB,  -- per-round breakdown
  room_id         TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  resolved_at     TIMESTAMP
);

CREATE TABLE s2_queue (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address      TEXT NOT NULL,
  token_id     INTEGER NOT NULL,
  status_token TEXT NOT NULL UNIQUE,
  status       TEXT NOT NULL DEFAULT 'waiting',
  battle_id    UUID REFERENCES s2_battles(id),
  expires_at   TIMESTAMP NOT NULL,
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE s2_snipers (
  token_id     INTEGER PRIMARY KEY,
  name         TEXT,
  image        TEXT,
  skin         TEXT,
  scope_reticle TEXT,
  kill_effect  TEXT,
  tracer_color TEXT,
  inspect_anim TEXT,
  owner        TEXT,
  cached_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_s2_leaderboard ON s2_players(score DESC);
CREATE INDEX idx_s2_queue_waiting ON s2_queue(status) WHERE status = 'waiting';
```

Season 1 tables (`players`, `battles`, `queue`) remain untouched.

---

## 3. NFT Integration

### Collection

New ERC-721 contract on Ethereum mainnet. Separate from Glocks & Nodes. Contract address TBD (will be added to `packages/shared/src/constants.ts` as `DEADSHOT_CONTRACT_ADDRESS`).

### Ownership Verification

Same pattern as Season 1 (`apps/api/src/services/ownership.ts`). New service for the sniper contract. Uses Alchemy `getNftsForOwner` API (the same approach that solved the non-enumerable issue with Glocks & Nodes).

### Metadata Schema

NFT metadata attributes map to in-game cosmetics:

| Attribute | In-Game Effect |
|---|---|
| `skin` | Weapon texture/material in PlayCanvas |
| `scope_reticle` | Overlay image when scoped |
| `kill_effect` | Particle effect on confirmed kill |
| `tracer_color` | Bullet tracer trail color |
| `inspect_animation` | Weapon inspect animation (future) |

All cosmetic. Zero gameplay impact. Enforced server-side — the game server loads cosmetic data from the API, not from the client.

### Access

Only sniper NFT holders can queue for Season 2 matches. Season 1 Glocks & Nodes holdings do not grant Season 2 access (different collection).

---

## 4. Scoring & Leaderboard

### Per-Match Scoring

| Action | Points |
|---|---|
| Round win | +100 |
| Headshot kill | +25 bonus |
| Match win | +150 bonus |
| Round loss | +10 (participation floor) |
| Match loss | +0 |

No negative scores. The spread between winners and losers is the ranking signal.

### Leaderboard

Ranked by cumulative `score`. Displays: rank, display name / address, score, wins, losses, headshot %, current win streak.

Season 1 leaderboard moves to a "Season 1 Archive" tab. Read-only.

### Future ELO

`s2_players.elo` column exists at launch (default 1000) but is unused. When ready to activate: add K-factor calculation to the scoring service, switch leaderboard sort to `elo`, add rank tier display (Bronze/Silver/Gold/etc). No schema migration needed.

---

## 5. Frontend Integration

### Season Transition

- Season 1 matchmaking disabled (queue returns 410)
- Season 1 leaderboard becomes read-only archive tab
- Homepage rebrands to Deadshot — new hero, "Select Sniper" flow
- Wallet connect, profiles, chat, killfeed carry forward as-is

### PlayCanvas Embedding

PlayCanvas game canvas mounts as a React component in the battle flow area (where Season 1's battle overlay lives). Lifecycle:

1. Match found → React mounts PlayCanvas scene
2. React passes to PlayCanvas: WebSocket connection info, player's NFT cosmetic data, opponent info
3. PlayCanvas renders: 3D environment, sniper model, scope overlay, hit effects, round transitions, in-game HUD (health, ammo, round score)
4. Match ends → PlayCanvas emits result event to React
5. React shows result overlay (winner/loser screen, adapted from Season 1 patterns)
6. React unmounts PlayCanvas, returns to queue/armory

### UI Flow

```
Connect Wallet → Armory (select sniper) → Queue → Match Found →
PlayCanvas loads → Live Duel → Result Overlay → Back to Queue/Armory
```

### What Stays the Same

- Header (rebranded)
- Profile panel
- Chat / comms panel
- Killfeed (adapted for sniper events: "PlayerA sniped PlayerB (headshot)")
- Wallet auth flow (same signature-based pattern)
- All existing UI chrome

### New UI Pieces

- **Armory screen** — sniper card selector (replaces gun selector). Shows NFT image, skin preview, reticle preview, attributes.
- **Scope-view HUD** — rendered inside PlayCanvas (health bar, ammo count, round score, timer, scope overlay)
- **Season selector** — toggle on leaderboard page between Season 1 (archive) and Season 2 (active)

---

## 6. PlayCanvas Game Layer

### Scene Structure

Each match room renders:

- **Environment** — a 3D arena (static geometry, baked lighting). Purpose-built for sniper sightlines. MVP: one arena. Clean, high-contrast so player silhouettes read clearly.
- **Player positions** — fixed spawn points with cover geometry. Positions randomize per round (mirrored/symmetrical for fairness).
- **Sniper model** — first-person view. Player's NFT skin applied as material. Visible bolt-action cycling animation on fire. Scope-in animation on right-click.
- **Opponent** — visible as a small character model at their position. Standing/crouched stance visible. Head and body hitbox zones.
- **Scope overlay** — full-screen overlay when scoped. NFT's reticle image centered. View zoomed 2.5x or 6x.
- **Effects** — bullet tracer (NFT color), hit marker, kill effect (NFT particle), muzzle flash, scope glint on opponent when they're scoped.

### Client-Server Communication

Client sends per-tick:
```typescript
interface ClientInput {
  aimYaw: number;      // horizontal aim angle
  aimPitch: number;    // vertical aim angle
  fire: boolean;       // left-click this tick
  scope: boolean;      // currently scoped
  scopeZoom: 1 | 2;   // 2.5x or 6x
  crouch: boolean;     // crouched
  reload: boolean;     // reload initiated
  timestamp: number;   // client timestamp for lag comp
}
```

Server broadcasts per-tick:
```typescript
interface GameState {
  tick: number;
  roundNumber: number;
  roundTimer: number;
  players: [PlayerState, PlayerState];
  events: GameEvent[];  // hits, kills, round starts/ends
}

interface PlayerState {
  aimYaw: number;
  aimPitch: number;
  stance: 'standing' | 'crouched';
  scoped: boolean;
  hp: number;
  ammo: number;
  reloading: boolean;
  alive: boolean;
}

type GameEvent =
  | { type: 'hit'; target: 0 | 1; zone: 'head' | 'body'; damage: number }
  | { type: 'kill'; killer: 0 | 1; victim: 0 | 1; headshot: boolean }
  | { type: 'round_start'; round: number; positions: [{ yaw: number; pitch: number }, { yaw: number; pitch: number }] }
  | { type: 'round_end'; winner: 0 | 1 | null; score: [number, number] }
  | { type: 'match_end'; winner: 0 | 1; finalScore: [number, number] };
```

### MVP Arena

One arena at launch. Design principles from the PRD adapted for scope-view:
- Two fixed positions per round. No free movement. Players can crouch to change stance but not relocate.
- Multiple depth layers (foreground cover, midground obstacles, background terrain)
- High visual contrast — opponent silhouette must be readable
- Environmental details for range estimation (knowing distance helps aim)
- Clean, dark aesthetic consistent with War Room's visual language

---

## 7. Deployment

### Game Server Hosting

The game server (`apps/game-server`) needs persistent WebSocket connections, which rules out Vercel serverless. Options:

- **Railway** — simple deploy from monorepo, supports long-running processes + WebSockets. Recommended for MVP.
- **Fly.io** — global edge deployment, good for latency-sensitive games. Better for scale.

Start with Railway. Single instance handles many concurrent rooms (each room is 2 connections, lightweight state).

### API

Stays on Vercel serverless. Season 2 routes added alongside Season 1.

### Frontend

Stays on Vercel. PlayCanvas assets (3D models, textures, environment) served from `apps/web/public/assets/s2/` or a CDN.

---

## 8. Shared Package Additions

`packages/shared/src/` gains:

- **`s2Types.ts`** — Season 2 type definitions (sniper metadata, match structure, game state, client input, queue types)
- **`s2Constants.ts`** — Deadshot contract address, scoring values, match config (round count, timers, damage values, tick rate)

Exported via new paths: `@warpath/shared/s2Types`, `@warpath/shared/s2Constants`.

---

## 9. Migration Path

### Phase 1: Foundation
- Season 2 DB tables + Drizzle schema
- Sniper NFT ownership service
- Season 2 API routes (queue, leaderboard, snipers)
- Armory screen (sniper selector)
- Season 1 matchmaking disabled, leaderboard archived

### Phase 2: Game Server
- `apps/game-server` package scaffolded
- Room lifecycle (create, join, auth, cleanup)
- Game loop (tick rate, round management, timer)
- Hit detection (server-authoritative raycasting against hitboxes)
- Result reporting back to API

### Phase 3: PlayCanvas Integration
- PlayCanvas scene setup (environment, lighting, camera)
- Sniper first-person model with NFT skin materials
- Scope overlay system with NFT reticle
- Opponent rendering (character model, stance, hitbox visualization for debug)
- Client input capture + WebSocket send
- Server state receive + interpolation
- Effects (tracer, hit marker, kill effect, muzzle flash)

### Phase 4: Full Loop
- React-PlayCanvas integration (mount, pass data, receive events)
- Result overlay (winner/loser screens)
- Scoring service + leaderboard updates
- Killfeed integration
- Season selector on leaderboard page
- Chat adaptation (sniper-themed events)

### Phase 5: Polish
- Audio (gunshot, bolt cycle, bullet crack, scope click, ambient)
- Multiple spawn positions per arena
- Scope sway mechanics tuning
- Loading states, error handling
- Mobile considerations (if applicable — scope-view may work on tablet)
- Performance optimization

---

## 10. Out of Scope (MVP)

- Multiple arenas (ship one, add more post-launch)
- ELO-based matchmaking (launch with basic queue pairing)
- Spectator mode
- Replay system
- On-chain scoring
- 2v2 mode
- Weapon inspect animation
- Anti-cheat beyond server-authoritative validation
- Mobile browser support (evaluate post-launch)
- Voice chat
