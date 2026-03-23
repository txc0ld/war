# WAR ROOM

WAR ROOM is a pnpm monorepo with a Vite/React frontend, a Hono API, shared battle/auth types, and a PostgreSQL backing store for queue, cooldown, leaderboard, and rate-limit state.

## Architecture

- `apps/web`: Vite + React client, wallet connection, map/select/battle/replay UI
- `apps/api`: Hono API, matchmaking, leaderboard, gun ownership, readiness, and rate limiting
- `packages/shared`: shared auth messages, battle types, constants, and stat resolution
- `api/*`: Vercel serverless route shims delegating into the built API bundle

## Runtime

- Frontend hosting: Vercel static output from `apps/web/dist`
- API hosting: Vercel Node serverless functions via `api/*`
- Database: PostgreSQL / Neon
- Chain: Ethereum Mainnet, with Base selection scaffolded in the web app

## Local Setup

1. Install dependencies:

```bash
pnpm install
```

2. Configure envs from `.env.example`.

3. Build shared once, then start dev servers:

```bash
pnpm --filter @warpath/shared build
pnpm dev
```

4. Apply database migrations when schema changes land:

```bash
pnpm db:migrate
```

## Verification

```bash
pnpm typecheck
pnpm test
pnpm build
```

## Environment

### Web

- `VITE_API_URL`: optional absolute API origin; defaults to same-origin
- `VITE_ALCHEMY_ID`: Alchemy app ID for wallet/web RPC reads
- `VITE_SITE_URL`: canonical site URL used in metadata
- `VITE_TARGET_CHAIN`: `1` for Ethereum mainnet, `8453` for Base

### API

- `DATABASE_URL`: PostgreSQL connection string
- `RPC_URL`: Ethereum JSON-RPC URL
- `ALCHEMY_API_KEY`: explicit NFT API key for non-enumerable ownership indexing
- `PORT`: local API port
- `CORS_ORIGIN`: allowed browser origin for API requests

## Operational Notes

- Gun ownership is resolved through on-chain `balanceOf`, indexed token ownership, and recent ownership snapshots. The API intentionally does not scan full-chain transfer history in the live request path.
- Queue join and cancel require signed wallet messages. Queue status polling is token-authenticated per queue entry.
- `/api/health` checks process health. `/api/ready` checks database and chain dependencies.
