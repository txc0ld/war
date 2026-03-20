# CLAUDE.md — WAR ROOM

> **Read this entire file before writing any code. Every section is load-bearing.**

---

## ROLE

You are the sole full-stack engineer on **War Room**, a web3 PvP NFT battle game. You report to Tay (Fantom Labs). Your code ships to production. There is no QA team, no design handoff, no second pass. Every file you create must be correct, typed, tested where critical, and styled to spec on the first attempt.

**Non-negotiable principles:**
- Zero `any` types in TypeScript. Ever.
- No placeholder components that render "Coming Soon" or empty divs. Build it or don't create the file.
- No mock data structures that differ from the real data shape. Match the contract/API from day one.
- Every component handles loading, error, and empty states. No happy-path-only code.
- Mobile-responsive is not optional. Dark theme only. No light mode.
- If you're unsure about a game mechanic, check the GAME SPECIFICATION section below. If it's not there, flag it — don't guess.

---

## PROJECT SUMMARY

**War Room** is a web3-authenticated PvP bracket tournament. Glocks & Nodes (G&N) NFT gun holders connect their wallet, verify ownership, choose a country on a world map, and enter Left vs Right bracket combat. Guns have three stats (Damage, Dodge, Speed) that determine outcomes. Winners = "Dead" (survived). Losers = "Undead" (eliminated). Results drive a 1,000-piece hybrid collection drop.

**Partner:** Gary Cartlidge — artist, G&N creator, creative lead.
**Builder:** Tay / Fantom Labs — architecture, engineering, deployment.

---

## TECH STACK — LOCKED

Do not deviate from this stack without explicit approval.

| Layer | Technology | Notes |
|---|---|---|
| Framework | **React 18+ with Vite** | TypeScript strict mode. `tsconfig` strict: true, noUncheckedIndexedAccess: true |
| Styling | **Tailwind CSS v3** | Custom theme config. No CSS modules, no styled-components, no inline styles except dynamic values |
| Wallet | **wagmi v2 + viem + RainbowKit** | EIP-6963 support. Ethereum mainnet + Base chain support |
| State | **Zustand** | Single store pattern with slices. No Redux, no Context for global state |
| Routing | **React Router v6** | Lazy-loaded routes with suspense boundaries |
| Animations | **Framer Motion** | All page transitions, battle sequences, UI micro-interactions |
| Map | **Custom SVG** | Hand-built dark wireframe world map. NOT a mapping library (no Mapbox, no Leaflet, no deck.gl) |
| Backend | **Bun + Hono** | REST API. TypeScript. Runs on Railway or Fly.io |
| Database | **PostgreSQL + Drizzle ORM** | Leaderboard, match history, session state |
| Chain reads | **viem** | Direct contract reads. No ethers.js |
| Randomness | **Chainlink VRF** (if probabilistic mode) | Or deterministic seed from block hash + token IDs |
| Hosting | **Vercel** (frontend) | Edge functions if needed for API proxy |
| Package manager | **pnpm** | Workspace monorepo: `apps/web`, `apps/api`, `packages/shared` |

---

## REPOSITORY STRUCTURE

```
war-path/
├── apps/
│   ├── web/                          # React frontend
│   │   ├── public/
│   │   │   ├── assets/
│   │   │   │   ├── guns/             # Gun NFT images (scraped from contract)
│   │   │   │   ├── victor.gif        # Win overlay
│   │   │   │   ├── dead.gif          # Loss overlay
│   │   │   │   └── map.svg           # World map SVG
│   │   │   └── fonts/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── App.tsx
│   │   │   │   ├── Router.tsx
│   │   │   │   └── Providers.tsx      # Wagmi, RainbowKit, QueryClient wrappers
│   │   │   ├── components/
│   │   │   │   ├── battle/
│   │   │   │   │   ├── BattleArena.tsx       # Main battle view container
│   │   │   │   │   ├── GunCard.tsx           # Gun display with stats
│   │   │   │   │   ├── HealthBar.tsx         # Animated health depletion
│   │   │   │   │   ├── StatBar.tsx           # Individual stat bar (Damage/Dodge/Speed)
│   │   │   │   │   ├── StatBars.tsx          # Group of three stat bars
│   │   │   │   │   ├── VSReveal.tsx          # VS → FIGHT transition
│   │   │   │   │   ├── MatchingPulse.tsx     # "MATCHING" flash animation
│   │   │   │   │   ├── VictorOverlay.tsx     # Win screen + victor.gif + +100
│   │   │   │   │   ├── DeathOverlay.tsx      # Loss screen + dead.gif + -100
│   │   │   │   │   ├── Dissolution.tsx       # Pixel disintegration effect
│   │   │   │   │   └── BattleEngine.tsx      # Orchestrates full fight sequence
│   │   │   │   ├── map/
│   │   │   │   │   ├── WorldMap.tsx          # SVG map with interactive countries
│   │   │   │   │   ├── CountryPath.tsx       # Individual country with hover/select
│   │   │   │   │   ├── TargetingRing.tsx     # Concentric ring animation at location
│   │   │   │   │   ├── MapOverlay.tsx        # Bracket lines, fight connections
│   │   │   │   │   └── LocationMarker.tsx    # Player position indicator
│   │   │   │   ├── wallet/
│   │   │   │   │   ├── ConnectButton.tsx     # Styled RainbowKit connect
│   │   │   │   │   ├── GunSelector.tsx       # Modal: pick which gun to fight with
│   │   │   │   │   └── WalletGate.tsx        # Token-gate wrapper component
│   │   │   │   ├── leaderboard/
│   │   │   │   │   ├── Leaderboard.tsx       # Full leaderboard view
│   │   │   │   │   ├── LeaderboardRow.tsx    # Individual rank row
│   │   │   │   │   └── ScorePopup.tsx        # +100 / -100 animated popup
│   │   │   │   ├── chat/
│   │   │   │   │   ├── ChatPanel.tsx         # Right-side spectator chat
│   │   │   │   │   └── ChatMessage.tsx       # Individual message with colored name
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Shell.tsx             # App shell with map background
│   │   │   │   │   ├── Header.tsx            # Top bar: logo, wallet, leaderboard link
│   │   │   │   │   └── MobileNav.tsx         # Bottom nav for mobile
│   │   │   │   └── ui/
│   │   │   │       ├── Button.tsx
│   │   │   │       ├── Modal.tsx
│   │   │   │       ├── Spinner.tsx
│   │   │   │       ├── GlitchText.tsx        # Glitch/scanline text effect
│   │   │   │       └── NeonBorder.tsx        # Reusable neon glow border
│   │   │   ├── hooks/
│   │   │   │   ├── useGuns.ts                # Fetch user's G&N guns from contract
│   │   │   │   ├── useGunMetadata.ts         # Fetch metadata/image for a gun token
│   │   │   │   ├── useBattle.ts              # Battle state machine hook
│   │   │   │   ├── useLeaderboard.ts         # Fetch/subscribe leaderboard
│   │   │   │   ├── useMatchmaking.ts         # Polling/websocket for match status
│   │   │   │   └── useSound.ts              # Optional: battle sound effects
│   │   │   ├── lib/
│   │   │   │   ├── contract.ts               # G&N contract ABI + address constant
│   │   │   │   ├── chains.ts                 # Chain configs (mainnet, base)
│   │   │   │   ├── stats.ts                  # Stat calculation & battle resolution logic
│   │   │   │   ├── matchmaking.ts            # Matchmaking client logic
│   │   │   │   └── api.ts                    # API client (typed fetch wrapper)
│   │   │   ├── store/
│   │   │   │   ├── index.ts                  # Root store
│   │   │   │   ├── gameSlice.ts              # Game state: phase, selected gun, location
│   │   │   │   ├── battleSlice.ts            # Active battle state
│   │   │   │   └── userSlice.ts              # Connected wallet, owned guns, score
│   │   │   ├── types/
│   │   │   │   ├── gun.ts                    # Gun, GunMetadata, GunStats types
│   │   │   │   ├── battle.ts                 # Battle, BattleResult, BattlePhase types
│   │   │   │   ├── player.ts                 # Player, LeaderboardEntry types
│   │   │   │   └── map.ts                    # Country, Location types
│   │   │   └── styles/
│   │   │       └── globals.css               # Tailwind directives + custom properties
│   │   ├── tailwind.config.ts
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   └── api/                           # Bun + Hono backend
│       ├── src/
│       │   ├── index.ts               # Server entry
│       │   ├── routes/
│       │   │   ├── battles.ts         # POST /battles/match, GET /battles/:id
│       │   │   ├── leaderboard.ts     # GET /leaderboard, GET /leaderboard/:address
│       │   │   └── guns.ts            # GET /guns/:address (cached metadata proxy)
│       │   ├── services/
│       │   │   ├── matchmaking.ts     # Pairing logic
│       │   │   ├── battle.ts          # Resolution engine
│       │   │   └── leaderboard.ts     # Score calculation
│       │   ├── db/
│       │   │   ├── schema.ts          # Drizzle schema
│       │   │   ├── migrate.ts         # Migration runner
│       │   │   └── client.ts          # DB connection
│       │   └── lib/
│       │       ├── contract.ts        # Server-side contract reads via viem
│       │       └── stats.ts           # Shared stat logic (imported from packages/shared)
│       ├── drizzle.config.ts
│       └── tsconfig.json
│
├── packages/
│   └── shared/                        # Shared types & logic between web + api
│       ├── src/
│       │   ├── types.ts               # Canonical type definitions
│       │   ├── stats.ts               # Battle resolution algorithm
│       │   └── constants.ts           # Contract address, chain IDs, point values
│       ├── package.json
│       └── tsconfig.json
│
├── scripts/
│   ├── scrape-guns.ts                 # Pull gun metadata + images from contract
│   ├── seed-stats.ts                  # Generate/assign Damage/Dodge/Speed per token
│   └── generate-map.ts               # SVG map generation helper
│
├── pnpm-workspace.yaml
├── package.json
├── .env.example
├── .gitignore
└── CLAUDE.md                          # This file
```

**Build order:** `packages/shared` → `apps/api` → `apps/web`. Always ensure shared types compile before touching the other packages.

---

## GAME SPECIFICATION

### Gun Contract

```
Address: 0x08189e5fd59ceaac75bfc3ce134066f204a6f609
Chain: Ethereum mainnet
Standard: ERC-721
```

Read ownership via `balanceOf(address)` and `tokenOfOwnerByIndex(address, index)` or equivalent. Pull metadata URI from `tokenURI(tokenId)` to get gun image and traits.

### Weapon Stats

Every gun has three stats, each an integer 1-100:

| Stat | Color | Hex | Purpose |
|---|---|---|---|
| Damage | Red | `#FF3333` | Offensive power — HP removed per tick |
| Dodge | Gold | `#FFD700` | Evasion — chance to negate incoming hit |
| Speed | Magenta | `#FF00FF` | Priority — who strikes first, visual advantage |

**Stat source:** TBD (pending Gary). Implement as a lookup table in `packages/shared/src/stats.ts` that maps `tokenId → { damage, dodge, speed }`. Build the system so this can be swapped between:
1. Hardcoded JSON lookup (Gary provides per-token stats)
2. Derived from on-chain metadata traits
3. Deterministic random from `keccak256(tokenId + salt)`

Default to option 3 for development. Salt: `0xWARPATH`.

### Battle Resolution

```typescript
// packages/shared/src/stats.ts

export interface GunStats {
  damage: number;  // 1-100
  dodge: number;   // 1-100
  speed: number;   // 1-100
}

export interface BattleResult {
  winner: 'left' | 'right';
  leftHpRemaining: number;   // 0-100
  rightHpRemaining: number;  // 0-100
  rounds: BattleRound[];     // Tick-by-tick for replay
}

export interface BattleRound {
  tick: number;
  leftHp: number;
  rightHp: number;
  leftStatsDisplay: GunStats;   // Fluctuated values for visual
  rightStatsDisplay: GunStats;  // Fluctuated values for visual
  event: 'hit_left' | 'hit_right' | 'dodge_left' | 'dodge_right' | 'both_hit';
}

export function resolveBattle(left: GunStats, right: GunStats, seed: string): BattleResult {
  // Deterministic resolution using seed for reproducibility
  // Speed determines strike order per round
  // Damage determines HP removal
  // Dodge determines miss chance
  // Run 20-40 ticks until one reaches 0 HP
  // Generate fluctuated stat display values per tick (±15% random for visual tension)
  // The stronger composite gun ALWAYS wins in deterministic mode
  // In probabilistic mode, add VRF-seeded variance
}
```

The battle engine runs server-side. The client receives the full `BattleRound[]` array and plays it back as an animation. This means:
- No client-side battle resolution (anti-cheat)
- Client receives pre-computed result + animation data
- Frontend replays tick by tick with timing delays

### Battle Flow State Machine

```
IDLE → CONNECTING → MAP_SELECT → GUN_SELECT → MATCHING → VS_REVEAL → FIGHTING → RESULT → IDLE
```

Each state maps to a distinct UI screen/overlay. Use a Zustand slice with explicit state transitions. No ambiguous intermediate states.

```typescript
type BattlePhase =
  | 'idle'           // On map, not in queue
  | 'selecting'      // Choosing country + gun
  | 'matching'       // In queue, "MATCHING" pulse
  | 'vs_reveal'      // Both guns shown, VS → FIGHT
  | 'fighting'       // Health bars animating, stats fluctuating
  | 'result_win'     // Victor overlay + score
  | 'result_loss'    // Death overlay + score
  | 'spectating';    // Watching someone else's fight
```

### Scoring

| Event | Points |
|---|---|
| Win a fight | +100 |
| Lose a fight | -100 |
| 3-gun wallet bonus | ×1.10 multiplier on earned points |

Leaderboard is cumulative across all rounds. Stored server-side in PostgreSQL. Indexed by wallet address.

### Trait System

| Trait | Effect |
|---|---|
| Killable | Default. Can be targeted and eliminated. |
| Unkillable (Jammy) | Immune from elimination. Auto-survives. |
| Clown Gun | Valid kill weapon. |
| Jammy Pasty | Utility only. CANNOT be used as kill weapon. Block in GunSelector. |

Implement trait checks in `GunSelector.tsx` — if a gun has the "Jammy Pasty" trait, grey it out with tooltip "Cannot be used in battle".

### Dead / Undead Resolution

After a tournament bracket completes:
- All surviving guns → **Dead** list (ironic: they lived)
- All eliminated guns → **Undead** list (ironic: they died)
- Publish list on-chain or via signed message
- This list drives the 1,000-piece hybrid gun mint composition

---

## VISUAL SPECIFICATION

### Color System — Tailwind Config

```typescript
// tailwind.config.ts — extend theme.colors
{
  bg: {
    primary: '#000000',
    card: '#0A0A0A',
    elevated: '#1A1A1A',
    border: '#2A2A2A',
  },
  accent: {
    cyan: '#00F0FF',
    neon: '#CCFF00',
    red: '#FF3333',
    gold: '#FFD700',
    magenta: '#FF00FF',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#E0E0E0',
    muted: '#999999',
    dim: '#666666',
  },
  grid: '#131313',
}
```

### Typography

- **Headers:** `'JetBrains Mono', 'Fira Code', monospace` — ALL-CAPS, letter-spacing wide
- **Body:** `'Inter', system-ui, sans-serif` — for readable text
- **Labels/Stats:** Monospace, tabular-nums for alignment
- Load JetBrains Mono from Google Fonts. Inter is a fallback to system.

### Map Aesthetic

The world map is a **custom SVG**. Requirements:
- Black background (`#000000`)
- Country outlines in cyan (`#00F0FF`) at 0.5-1px stroke, no fill
- Countries are `<path>` elements with `data-country="XX"` ISO codes
- On hover: fill with `rgba(0, 240, 255, 0.08)`, stroke brightens
- On select: fill with `rgba(204, 255, 0, 0.12)`, neon border glow
- Active battle locations show `<TargetingRing />` — concentric circles pulsing outward
- The map must be pannable and zoomable on mobile (use CSS transforms, not a library)

### Animation Specs

**MatchingPulse:**
- "MATCHING" text at dead center of viewport
- Monospace, 48px, cyan color
- Opacity oscillates 0.3 → 1.0 → 0.3 on a 1.5s loop
- Subtle scan line passes behind text (horizontal line moving top to bottom)
- Runs until opponent paired

**VSReveal:**
- Duration: ~3 seconds total
- Left gun slides in from left edge, right gun from right edge (Framer Motion, spring physics)
- "VS" appears center in large monospace text, white, with screen-shake effect
- 1-second hold
- "VS" morphs into "FIGHT" in neon green (#CCFF00) with flash/bloom effect
- Battle begins immediately after

**Battle Sequence (fighting phase):**
- Duration: 5-10 seconds (mapped to BattleRound[] tick count)
- Both guns displayed at ~30% from their respective edges
- Health bars above each gun deplete per tick data
- Stat bars below each gun fluctuate per tick data (±15% visual noise around actual value)
- On hit events: subtle screen shake, hit flash on the damaged gun
- On dodge events: brief "MISS" text near the dodging gun
- Speed stat affects visual rhythm (faster gun's hits land with snappier timing)

**VictorOverlay (result_win):**
- Loser's gun plays `<Dissolution />` — pixel disintegration into particles that float away
- Winner's gun slides to center (Framer Motion, spring)
- "VICTOR" text appears large, monospace, neon green, with glitch effect
- `victor.gif` fades in as background/overlay
- "+100" score pops up with scale + fade animation
- Auto-dismisses after 4 seconds or on click

**DeathOverlay (result_loss):**
- Same dissolution for the losing gun
- Skull overlay: `dead.gif` fades in center
- "-100" score pops up in red
- Green cross variant overlay if asset available
- Auto-dismisses after 4 seconds or on click

**Dissolution Effect:**
- The gun image breaks into small pixel-like particles (canvas or WebGL)
- Particles drift upward and fade to transparent over 2 seconds
- Use a `<canvas>` overlay positioned exactly over the gun image
- Sample pixels from the gun image to create colored particles

---

## API ENDPOINTS

### `POST /api/battles/queue`
Join the matchmaking queue.
```typescript
Request:  { address: string; tokenId: number; country: string }
Response: { queueId: string; status: 'queued' }
```

### `GET /api/battles/queue/:queueId`
Poll match status.
```typescript
Response: 
  | { status: 'waiting' }
  | { status: 'matched'; battleId: string; opponent: { address: string; tokenId: number; country: string } }
```

### `GET /api/battles/:battleId`
Get battle data (after matched).
```typescript
Response: {
  id: string;
  left: { address: string; tokenId: number; stats: GunStats; imageUrl: string };
  right: { address: string; tokenId: number; stats: GunStats; imageUrl: string };
  result: BattleResult;  // Full tick-by-tick data
  resolvedAt: string;
}
```

### `GET /api/leaderboard`
```typescript
Response: {
  entries: Array<{
    rank: number;
    address: string;
    score: number;
    wins: number;
    losses: number;
    gunCount: number;
  }>;
  total: number;
}
```

### `GET /api/guns/:address`
Cached metadata proxy — pulls from contract, caches in DB.
```typescript
Response: {
  guns: Array<{
    tokenId: number;
    name: string;
    image: string;
    stats: GunStats;
    traits: string[];
    canBattle: boolean;  // false if Jammy Pasty
  }>;
}
```

---

## DATABASE SCHEMA

```sql
-- Drizzle ORM schema in apps/api/src/db/schema.ts

CREATE TABLE players (
  address     TEXT PRIMARY KEY,
  score       INTEGER NOT NULL DEFAULT 0,
  wins        INTEGER NOT NULL DEFAULT 0,
  losses      INTEGER NOT NULL DEFAULT 0,
  gun_count   INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE battles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  left_address TEXT NOT NULL REFERENCES players(address),
  left_token   INTEGER NOT NULL,
  right_address TEXT NOT NULL REFERENCES players(address),
  right_token  INTEGER NOT NULL,
  winner       TEXT NOT NULL CHECK (winner IN ('left', 'right')),
  left_hp      INTEGER NOT NULL,
  right_hp     INTEGER NOT NULL,
  rounds_json  JSONB NOT NULL,  -- BattleRound[] serialized
  resolved_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE queue (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address     TEXT NOT NULL,
  token_id    INTEGER NOT NULL,
  country     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'matched', 'expired')),
  battle_id   UUID REFERENCES battles(id),
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_leaderboard ON players(score DESC);
CREATE INDEX idx_queue_waiting ON queue(status) WHERE status = 'waiting';
CREATE INDEX idx_battles_player ON battles(left_address, resolved_at DESC);
```

---

## CODING STANDARDS

### TypeScript
- Strict mode. No `any`. No `as` casts except for verified external data boundaries.
- Prefer `interface` over `type` for object shapes. Use `type` for unions/intersections.
- All async functions must have explicit return types.
- No barrel exports (`index.ts` re-exports). Import directly from the source file.
- Use `satisfies` operator for type-safe config objects.

### React
- Functional components only. No class components.
- Props interfaces named `{ComponentName}Props`.
- Destructure props in function signature.
- No prop drilling beyond 2 levels — use Zustand or composition.
- `useCallback` for functions passed to children. `useMemo` for expensive computations only.
- Every component that fetches data handles: loading skeleton, error message, empty state.
- No `useEffect` for derived state. Compute inline or use `useMemo`.

### Styling
- Tailwind utility classes only. No `@apply` except in `globals.css` for base resets.
- Use `cn()` utility (clsx + tailwind-merge) for conditional classes.
- Responsive: mobile-first. Breakpoints: `sm:640` `md:768` `lg:1024` `xl:1280`.
- Animation classes defined in Tailwind config `extend.animation` and `extend.keyframes`.
- No hardcoded pixel values in components. Use Tailwind spacing scale or theme tokens.

### File Conventions
- Components: PascalCase (`BattleArena.tsx`)
- Hooks: camelCase with `use` prefix (`useBattle.ts`)
- Utils/lib: camelCase (`stats.ts`)
- Types: PascalCase for interfaces, SCREAMING_SNAKE for constants
- One component per file. Co-locate hook + component only if the hook is single-use.

### Git
- Conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`, `style:`
- No commits with failing TypeScript compilation
- No commits with `console.log` (use a proper logger or remove)

---

## ENVIRONMENT VARIABLES

```env
# apps/web/.env
VITE_API_URL=http://localhost:3001
VITE_WALLETCONNECT_PROJECT_ID=<from cloud.walletconnect.com>
VITE_ALCHEMY_ID=<alchemy key for RPC>
VITE_TARGET_CHAIN=1  # 1 = mainnet, 8453 = base

# apps/api/.env
DATABASE_URL=postgresql://user:pass@localhost:5432/warpath
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/<key>
GN_CONTRACT=0x08189e5fd59ceaac75bfc3ce134066f204a6f609
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

---

## BUILD ORDER

Execute in this exact sequence. Each phase must compile and render before moving to the next.

### Phase 0: Scaffold
1. Init pnpm workspace with `apps/web`, `apps/api`, `packages/shared`
2. Configure TypeScript strict in all packages
3. Set up Tailwind with the color system above
4. Load fonts (JetBrains Mono, Inter)
5. Create `packages/shared` with types and constants
6. Verify `pnpm build` succeeds across all packages

### Phase 1: Wallet + Gate
1. `Providers.tsx` — wagmi config, RainbowKit, QueryClient
2. `ConnectButton.tsx` — styled dark theme connect button
3. `useGuns.ts` — hook to read G&N NFTs from connected wallet
4. `WalletGate.tsx` — if no guns, show "No G&N guns found" with link to collection
5. Verify: connect wallet → see gun count → gate blocks non-holders

### Phase 2: Map + Selection
1. `WorldMap.tsx` — render the SVG map, all countries clickable
2. `CountryPath.tsx` — hover/select states with cyan/neon styling
3. `GunSelector.tsx` — modal showing owned guns with stats, select one
4. `gameSlice.ts` — store selected country + selected gun
5. Verify: click country → modal opens → select gun → state stored

### Phase 3: API + Matchmaking
1. `apps/api` — Hono server, DB connection, schema migration
2. Queue endpoints: join queue, poll status
3. `useMatchmaking.ts` — join queue, poll every 2s, handle matched state
4. `MatchingPulse.tsx` — pulsing "MATCHING" overlay
5. Verify: two browser tabs → both queue → both get matched → battleId returned

### Phase 4: Battle Engine
1. `packages/shared/src/stats.ts` — implement `resolveBattle()` with full tick generation
2. `apps/api/src/services/battle.ts` — on match, resolve battle, store result
3. Battle endpoint: return full BattleResult with rounds
4. Verify: match two guns → API returns deterministic result with rounds array

### Phase 5: Battle UI
1. `GunCard.tsx` — gun image + health bar + stat bars
2. `HealthBar.tsx` — animated green bar depletion
3. `StatBar.tsx` / `StatBars.tsx` — color-coded, fluctuating per tick
4. `VSReveal.tsx` — slide-in, VS, FIGHT sequence
5. `BattleEngine.tsx` — orchestrates: VS reveal → tick playback → result
6. Verify: receive battle data → full animated battle plays out correctly

### Phase 6: Win / Loss
1. `Dissolution.tsx` — canvas-based pixel disintegration
2. `VictorOverlay.tsx` — winner centers, "VICTOR", victor.gif, +100
3. `DeathOverlay.tsx` — skull, dead.gif, -100
4. `ScorePopup.tsx` — animated point change
5. Verify: battle completes → correct overlay shows → score displays → auto-dismiss

### Phase 7: Leaderboard
1. `Leaderboard.tsx` — ranked list with address, score, W/L
2. Leaderboard API endpoint with pagination
3. `useLeaderboard.ts` — fetch + auto-refresh
4. Integrate into header/nav
5. Verify: fight → leaderboard updates → rankings correct

### Phase 8: Polish
1. `ChatPanel.tsx` — spectator chat (nice-to-have, stub with mock data if no WebSocket yet)
2. `TargetingRing.tsx` — animated rings at active battle locations on map
3. `MapOverlay.tsx` — bracket lines connecting fighting locations
4. Mobile responsive pass on all screens
5. Loading skeletons for all async components
6. Error boundaries at route level
7. SEO meta tags, OG image

---

## CRITICAL CONSTRAINTS

1. **No ethers.js.** Use viem for all chain interactions. wagmi hooks wrap viem.
2. **No Next.js.** This is Vite + React. No SSR needed. SPA only.
3. **No Firebase/Supabase.** PostgreSQL + Drizzle. Own the data layer.
4. **No Mapbox/Leaflet/Google Maps.** Custom SVG map. The aesthetic requires full control.
5. **No Tailwind UI / Headless UI / Radix.** Build UI primitives from scratch to match the war-room aesthetic. These libraries add bloat and fight the custom design.
6. **Battle resolution is server-side only.** The client never computes who wins. It receives the result and replays the animation.
7. **All gun images served from own CDN / public folder.** Do not hotlink OpenSea or IPFS gateways in production. Scrape and self-host.
8. **No placeholder "lorem ipsum" content.** Every string in the UI should be the real copy.

---

## ASSET MANIFEST

| Asset | Source | Status |
|---|---|---|
| `victor.gif` | Gary (provided) | ✅ Have |
| `dead.gif` | Gary (provided) | ✅ Have |
| Gun images | Scrape from contract `0x0818...f609` | 🔧 Script needed |
| World map SVG | Generate / source dark wireframe | 🔧 Build needed |
| Gun stat data | Gary to provide OR derive from tokenId | ⏳ Pending |
| Green cross skull variant | Gary to provide | ⏳ Pending |
| Sound effects | Optional — battle hits, win/loss stings | ⏳ Optional |

---

## OPEN DECISIONS (DO NOT BLOCK ON THESE)

Build the system to support both options. Use feature flags or config constants.

| Decision | Options | Default for Dev |
|---|---|---|
| Stat source | Hardcoded JSON / On-chain traits / Deterministic random | Deterministic random |
| Battle resolution | Deterministic (stats only) / Probabilistic (VRF) | Deterministic |
| Target chain | Ethereum mainnet / Base | Mainnet reads, testnet for battle tx |
| Chat panel | Build for v1 / Defer to v2 | Stub component, defer real-time |
| 3-gun bonus | Exact multiplier (currently ~10%) | 1.10x |

---

## WHEN IN DOUBT

1. Check this file first.
2. If the answer isn't here, build it the way that's easiest to change later.
3. If it's a game mechanic question, flag it with a `// TODO(gary): <question>` comment and implement the most reasonable default.
4. If it's an architecture question, prefer the simpler option that doesn't create coupling.
5. Ship working code over perfect code. But never ship broken code.
