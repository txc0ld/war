# WAR PATH Polish Execution

## Constraints
- Workspace snapshot is not inside a Git worktree, so atomic commits are blocked.
- Proceed with implementation and verification in audited priority order.

## Current Task
- [completed] Map redesign: replace low-fidelity world map geometry and styling with a production-quality interactive global surface
- [completed] Demo mode: bypass wallet/NFT requirements with local demo guns and a mocked battle flow
- [in-progress] Vercel deployment: publish the demo web app from the monorepo with explicit build/output settings and a self-contained demo leaderboard

## Plan
- [completed] CRIT-001: Signed queue auth and onchain ownership verification
- [completed] CRIT-002: Transactional matchmaking, battle creation, and score mutation
- [completed] HIGH-002: Generate and commit Drizzle migrations
- [completed] HIGH-003: Test foundation and CI gate
- [completed] MED-006: API validation, rate limiting, security headers, safe errors
- [completed] MED-004: Fix leaderboard count query
- [completed] HIGH-001: Mount router and enforce wallet gating
- [completed] HIGH-004: Wire or remove placeholder surfaces
- [completed] MED-001: Fix Tailwind token drift
- [completed] MED-003: Fix result overlay side assumption
- [completed] MED-005: Accessibility and SEO baseline
- [completed] MED-002: Centralize and cache gun metadata loading
- [completed] HIGH-005: Return real gun assets in battle payloads
- [completed] LOW-001: Remove duplicate/generated asset drift
- [completed] LOW-002: Prune orphaned web modules
- [completed] LOW-003: Align typography/theme system

## Review
- CRIT-001: Added signed queue auth message verification, onchain `ownerOf` checks, and frontend queue signing. Verified with `pnpm install`, package typechecks, and `pnpm -r build`. Commit blocked because the workspace snapshot is not a Git worktree.
- CRIT-002: Wrapped matchmaking, battle creation, queue resolution, and score mutation in a single transaction with row locking and queue-entry idempotency constraints. Verified with `pnpm install`, package typechecks, and `pnpm -r build`. Commit blocked because the workspace snapshot is not a Git worktree.
- HIGH-002: Generated and committed Drizzle migration artifacts in `apps/api/drizzle/`, added root and API `db:migrate` scripts, and verified schema/build/typechecks. Runtime migration against `postgresql://postgres:postgres@localhost:5432/warpath` is blocked in this environment because PostgreSQL is not running (`ECONNREFUSED`). Commit blocked because the workspace snapshot is not a Git worktree.
- HIGH-003: Added root `typecheck`/`test` wiring, Vitest configs, shared/API tests, and CI. Verified with `pnpm install`, `pnpm run typecheck`, `pnpm -r build`, and `pnpm -r test`. Commit blocked because the workspace snapshot is not a Git worktree.
- MED-006: Added API input validation, per-route/global in-memory rate limits, security headers, and structured safe error responses. Verified with `pnpm install`, `pnpm run typecheck`, `pnpm -r build`, and `pnpm -r test`. Commit blocked because the workspace snapshot is not a Git worktree.
- MED-004: Replaced the leaderboard full-table in-memory count with a `count(*)` aggregate query. Verified with `pnpm run typecheck`, `pnpm -r build`, and `pnpm -r test`. Commit blocked because the workspace snapshot is not a Git worktree.
- HIGH-001: Switched the live app entrypoint to `AppRouter`, moved `Shell` into the routed layout, and gated the map/battle routes with `WalletGate`. Verified with `pnpm run typecheck`, `pnpm -r build`, and `pnpm -r test`. Commit blocked because the workspace snapshot is not a Git worktree.
- HIGH-004: Removed the shipped spectating placeholder and left only functional routed navigation in the live surface. Verified with `pnpm run typecheck`, `pnpm -r build`, and `pnpm -r test`. Commit blocked because the workspace snapshot is not a Git worktree.
- MED-001: Normalized the shipped web components to use the configured Tailwind text tokens instead of invalid utility names. Verified with `pnpm run typecheck`, `pnpm -r build`, and `pnpm -r test`. Commit blocked because the workspace snapshot is not a Git worktree.
- MED-003: Updated the battle result overlay to derive win/loss from the connected wallet address versus the left/right fighter addresses, removing the hardcoded left-side assumption. Verified with `pnpm run typecheck`, `pnpm -r build`, and `pnpm -r test`. Commit blocked because the workspace snapshot is not a Git worktree.
- MED-005: Added keyboard access for country selection, dialog semantics and focus trapping for modals, labeled map controls, SEO/social metadata, and a real OG image asset. Verified with `pnpm run typecheck`, `pnpm -r build`, and `pnpm -r test`. Commit blocked because the workspace snapshot is not a Git worktree.
- MED-002: Centralized gun metadata loading in an API service with multicall-backed token discovery, bounded metadata fetch concurrency, in-memory caching, and a React Query-powered web hook. Verified with `pnpm run typecheck`, `pnpm -r build`, and `pnpm -r test`. Commit blocked because the workspace snapshot is not a Git worktree.
- HIGH-005: Replaced hardcoded fighter image paths in battle responses with actual metadata image URLs from the canonical gun service and updated battle tests accordingly. Verified with `pnpm run typecheck`, `pnpm -r build`, and `pnpm -r test`. Commit blocked because the workspace snapshot is not a Git worktree.
- LOW-001: Added explicit dist/public ignore rules and removed the duplicate root asset tree from the working snapshot; build/test/typecheck still succeed after regeneration. Verified with `pnpm run typecheck`, `pnpm -r build`, and `pnpm -r test`. Commit blocked because the workspace snapshot is not a Git worktree.
- LOW-002: Removed the unused `BattleArena`, `MobileNav`, `ScorePopup`, and `useSound` modules from the active web source tree. Verified with `pnpm run typecheck`, `pnpm -r build`, and `pnpm -r test`. Commit blocked because the workspace snapshot is not a Git worktree.
- LOW-003: Standardized the app font stack on JetBrains Mono, aligned Tailwind's sans stack, and overrode RainbowKit's body font variable instead of keeping an unused Inter reference. Verified with `pnpm run typecheck`, `pnpm -r build`, and `pnpm -r test`. Commit blocked because the workspace snapshot is not a Git worktree.
- Map redesign: Replaced the hand-drawn continent blobs with a Natural Earth projected world map sourced from `world-atlas`, layered real country borders, deployment markers, and route arcs, and refined the overlay layout for a cleaner presentation. Verified with `pnpm run typecheck`, `pnpm -r build`, `pnpm -r test`, and live browser inspection at `http://localhost:4173/`.
- Demo mode: Added local demo gun assets and synthetic battle flow, bypassed wallet/NFT gating, prevented RainbowKit initialization in demo mode, and added a favicon for a clean local console. Verified with `pnpm run typecheck`, `pnpm -r build`, `pnpm -r test`, and live browser inspection at `http://localhost:4173/` against the isolated demo API at `http://localhost:3002/`.
- Demo interaction path: Fixed routed content pointer interception in the shell so the world map remains clickable, verified country selection opens the demo gun selector, verified demo gun selection advances to VS/battle flow, and verified routed navigation still works for leaderboard/map on `http://localhost:4173/`.
- Typography: Set `Plus Jakarta Sans` as the global body/UI font and `Rubik Glitch` as the heading/display font, while preserving the demo flow and validating in-browser that the body, header title, and `FIGHT` transition text resolve to the correct font families on `http://localhost:4173/`.
- UI polish: Refined the map line system, route glow, frame treatment, header chrome, demo/connect controls, zoom cluster, and battle/HUD containers so the interface uses one coherent glass-panel language. Verified with `pnpm run typecheck`, `pnpm -r build`, `pnpm -r test`, and live browser inspection at `http://localhost:4173/`.
- Static layout cleanup: Removed map pan/zoom controls, locked the map framing, moved the sector-status card out of the HUD lane, and moved the idle deploy prompt to bottom-center so text and boxes do not collide. Verified with `pnpm run typecheck`, `pnpm -r build`, and `pnpm -r test`; browser re-screenshot was blocked by a stale local Chrome persistent session in Playwright.
- Static map fit: Removed pan/zoom controls and interaction transforms from the world map so the composition stays locked in the intended framing, and updated map panel copy to match the static presentation.
- Overlap cleanup: Rebalanced the top-left information panel for the Rubik Glitch heading, widened the panel, tightened title tracking/line-height, and revalidated the live surface to ensure there are no overlapping text blocks or panel collisions on the default desktop composition.
- Hover callout containment: Increased the map callout box width and made long country names split across two lines inside the SVG label container so hover text no longer spills outside the box.
- Hover callout vertical fit: Increased the callout box height and anchored the code/name/status baselines from the box itself so short names like Nigeria keep the status line fully inside the container as well.
- Victor overlay parity: Updated the victor result overlay to use the same centered-gif presentation model as the defeated overlay instead of a full-screen background gif, keeping both result states visually consistent.
