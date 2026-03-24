# WAR ROOM Polish Execution

## Constraints
- Workspace snapshot is not inside a Git worktree, so atomic commits are blocked.
- Proceed with implementation and verification in audited priority order.

## Current Task
- [completed] Planning pass only: scope a non-implemented design for queue email notifications and a header online-user counter using the existing queue, wallet session, and header surfaces without changing runtime behavior
- [completed] Live killfeed reset: clear the production `battles` feed source so the public killfeed empties without modifying profiles, ownership, or chat state
- [completed] Live state reset: clear leaderboard standings by zeroing `players.score/wins/losses` and wipe the visible global Comms feed from `chat_messages` without disturbing profiles, ownership snapshots, or battle/runtime infrastructure
- [completed] VS/FIGHT font file correction: replace the broken reveal-font asset with the provided `MK4.woff2`, keep the `MATCHING` tracking trim intact, and redeploy after verifying the live bundle serves the new font file
- [completed] VS/FIGHT custom display font rollout: package the provided `VSF.woff2`, bind it specifically to the `VS` / `FIGHT` reveal headline, tighten `MATCHING` tracking slightly, clear live cooldown timers, and redeploy the combined fix to production
- [completed] Display font normalization: replace the remaining glitch-display font usage with `Plus Jakarta Sans` at `900` weight without changing runtime behavior or layout structure
- [completed] Cooldown re-enable and live rollout: explicitly enable wallet cooldowns in the runtime env contract, deploy the hardened backend/web build to Vercel production, and verify the public aliases are serving the updated release
- [completed] Security audit: review the current backend/web security posture, confirm which earlier issues remain fixed, and document only the live findings that still need attention
- [completed] Pre-launch reliability pass: run workspace regression checks plus production HTTP/browser smoke tests across the live site and document any remaining launch risks before go-live
- [completed] Global footer credit line: add `©2026 All rights reserved. Gary Cartlidge & fantom labs technology.` as a bottom-centered site-wide footer overlay without changing route behavior, map interactions, or battle flow
- [completed] Global footer link pass: make `Gary Cartlidge` and `fantom labs technology` clickable external links in the site-wide footer while keeping the bottom-center footer layout intact
- [completed] Production deploy: publish the current repo state to Vercel and verify the public domain serves the updated wallet-entry CSS bundle
- [completed] VS reveal centering correction: anchor the left and right fighter cards to the inside edges of the duel grid so the `FIGHT` stamp sits on the true midpoint between them
- [completed] Temporary cooldown shutdown: disable wallet cooldown enforcement and post-battle cooldown writes in the backend so repeated live matchmaking tests can run without battle locks
- [completed] RNG bonus rebalance: reduce the 3+ gun arsenal bonus from a 10-point to a 5-point win-chance edge and keep fallback/frontend copy aligned
- [completed] Enter Battle click audio: ship the provided `Enterbattle.mp3` with the web app and trigger it from the Enter Battle action
- [completed] Matching-phase audio: ship the provided `Loading.mp3` and loop it while the matchmaking overlay is active
- [completed] Matching-audio delay: start the `Loading.mp3` loop one second after the matchmaking overlay appears so the search state lands before the sound begins
- [completed] Matching-audio swap: replace the matchmaking loop source with the provided `Matching.mp3` while keeping the existing delayed start behavior
- [completed] Matching audio removal: remove the matchmaking sound completely while leaving the visual matching overlay behavior intact
- [completed] Battle-phase audio: ship the provided `Battle.mp3` and loop it only while the fight animation is active
- [completed] Fight-stamp audio: ship the provided `Fight.mp3` and trigger it only when the `FIGHT` stamp appears during the VS reveal
- [completed] Result audio: ship `Winner.mp3` and `Loser.mp3` so the correct outcome sound plays on the corresponding result overlay
- [completed] Audio one-shot enforcement: ensure `Matching`, `Fight`, `Winner`, and `Loser` cues are all explicit single-play sounds with no looping
- [completed] Mobile delayed-audio fix: route `Fight`, `Winner`, and `Loser` through an unlocked shared battle-audio pool so they can play on mobile after the initial tap gesture
- [completed] Mobile battle-loop audio fix: route `Battle.mp3` through the same unlocked shared audio pool so the looping fight-phase sound can play on mobile too
- [completed] Global ambient website audio: ship `Website.mp3` as a looped 5%-volume background track that persists across map, battle, and result screens without interrupting the phase-specific cues
- [completed] Map interaction audio: ship `maphover.mp3` and `mapselection.mp3` as 70%-volume one-shot cues for country hover and country selection
- [completed] Global header mute control: add a persistent `Audio` toggle beside the profile chip so ambient, map, and battle cues can be muted/unmuted site-wide from the header
- [completed] Leaderboard K/D ratio column: add a dedicated K/D column to the leaderboard API payload and table layout so combat efficiency is visible alongside score and record
- [completed] Website-wide polish pass: tighten the shared shell, branded loader, map frame chrome, selector surface, mastheads, leaderboard, killfeed, and chat panel styling without changing interaction logic or runtime behavior
- [completed] Battle chat removal: remove the embedded battle-only chat feed from the active fight screen without changing the standalone chat surfaces
- [completed] Chunk-load recovery hardening: stop lazy-splitting tiny result overlays and auto-recover once from stale deploy chunk fetch failures in already-open tabs
- [completed] Favicon refresh: replace the default SVG favicon with the provided `Favicon.png` for browser tabs and Apple touch icon usage
- [completed] Connect-wordmark tracking trim: remove all letter spacing from the main wallet-entry `WAR ROOM` lockup so `WAR` and `ROOM` read as a tight brand mark
- [completed] Live-only battle enforcement: remove frontend demo/dummy battle branches so queueing, gun loading, leaderboard polling, and battle playback only run through real wallet/API data
- [completed] Wallet-connect reliability correction: replace the rejected MetaMask in-app-browser deeplink on mobile Safari with the provided WalletConnect project flow, keep desktop extension-first, and redeploy after verification
- [completed] Battle phase chrome fix: remove the fixed header rail from active fight phases and move the `VS` / `FIGHT` stamp into the duel center lane between both fighters
- [completed] Gold-standard UI/UX hardening pass: rebuild the live web shell, map framing, selector hierarchy, battle-state composition, and leaderboard rhythm so the runtime feels production-ready across desktop, tablet, and phone
- [completed] Header grid stabilization: lock the brand, wallet chip, and navigation rails into a consistent responsive system with no wrap-driven drift
- [completed] Map shell refinement: remove CSS zoom hacks, improve responsive framing, integrate cleaner map controls, and restore context on touch layouts
- [completed] Selector hierarchy pass: strengthen the armory header/status strip, reduce card density, and normalize card rhythm across breakpoints
- [completed] Battle-state focus pass: compress matching, reserve a safer VS center lane, simplify battle hierarchy, and keep result overlays above the fold
- [completed] Leaderboard system pass: align the ladder width with the app shell and keep one row hierarchy that scales cleanly across breakpoints
- [completed] Connect-title irregular timing pass: replace the evenly repeating glitch cadence with longer uneven pause windows so the distortion feels more like intermittent signal failure
- [completed] Connect-title cadence shaping: keep the monochrome distortion but add clear pause windows between glitch clusters so the title alternates between stable and broken states
- [completed] Connect-title cadence tuning: keep the monochrome distortion treatment but slow the glitch cycle by roughly 25% so it breathes more between events
- [completed] Connect-title monochrome distortion pass: remove the colored glitch channels from `WAR ROOM` and push the side tearing harder so the connect-screen lockup feels more like structural distortion than RGB separation
- [completed] Connect-title glitch upgrade: replace the restrained `WAR ROOM` flicker with a stronger glitch/distortion treatment on the wallet entry screen while keeping the one-line lockup intact
- [completed] Leaderboard header clearance fix: make the desktop leaderboard content respect the fixed header rail instead of sitting underneath it
- [completed] Result CTA flow fix: make `FIGHT AGAIN` reopen a fresh deploy/armory flow instead of behaving like a passive dismiss
- [completed] Battle layout polish: reduce gun/card scale, add cleaner spacing through the battle arena and VS reveal, and eliminate crowding or overlap across desktop and mobile
- [completed] Connect-screen title polish: add a restrained glitch effect to the `WAR ROOM` lockup and normalize the subtitle copy to `GLOCKS + NODES`
- [completed] Connect-screen subtitle correction: replace `ALL OUT WAR` with `[Glocks & Nodes]` on the wallet entry screen
- [completed] Screenshot-driven UI upgrade: remove the map-frame rail feel, widen the globe composition, quiet the header/navigation divider, tighten gun selector chrome, and apply the requested stat colors (`damage #97ff3b`, `dodge #ff4fce`, `speed #0044ff`) across live surfaces
- [completed] Accent palette shift: replace the live `#CCFF00` / neon-green accent family with `#00BDFE` blue across runtime surfaces, glows, gradients, registry accents, and supporting docs so the app reads colder and more technical
- [completed] Motion and visual polish pass: audit the live connect, map, selector, matching, battle, and result surfaces; refine transitions, micro-interactions, and ambient motion; remove demo battle timeline telemetry; compact the embedded battle log; and flatten the map frame atmosphere without changing core functionality
- [completed] Map rail cleanup: remove the remaining side-rail gradient fill from the map container and keep the depth treatment centered inside the frame
- [completed] Battle screen layout refinement: remove map zoom controls from battle/result states and simplify the battle composition so cards, status, and chat fit cleanly without overlap on desktop or mobile
- [completed] Wallet cooldown refactor: replace per-weapon battle cooldowns with a wallet-level cooldown where 3+ gun holders wait 15 minutes and smaller holders wait 30 minutes
- [completed] Mobile map interaction pass: add bounded pan/zoom so the world map can be inspected cleanly on touch devices without breaking country selection
- [completed] Root chrome alignment: remove light browser rails by forcing the document, viewport chrome, and safe-area handling to match the app's dark theme
- [completed] Connect title lockup correction: force `WAR ROOM` to remain a single line on the main connect screen across desktop and mobile viewports
- [completed] Mobile-first UX hardening: refine the live app for phone, tablet, and desktop viewports so every runtime surface scales cleanly without overlap, wrapping failures, or cramped interaction zones
- [completed] Connect-screen copy polish: keep `WAR ROOM` on a single mobile line and update the subtitle copy from `GLOCKS & NODES` to `ALL OUT WAR`
- [completed] Dark game-tech battle pass: restore the runtime to a darker game-tech palette, switch map/UI accents to neon `#00BDFE`, move map halos to a beacon animation, add secure battle RNG seeding, and enforce a 30-minute same-weapon cooldown after each battle
- [completed] Connect screen cleanup: remove the `DETH b4 TAXES` kicker from the wallet entry screen
- [completed] Map palette cleanup: keep the map entirely black and relocate red/blue accents into the deploy and battle UI
- [completed] Gradient refinement pass: remove the ugly left/right fade behavior around the world map and keep all depth centered inside the map frame
- [completed] Battle side alignment pass: lengthen combat playback, keep victory/defeat as click-to-proceed states, split deployment countries into left/right hemispheres, and color battle sides blue/red consistently
- [completed] WAR ROOM rename: update brand references across the live app, metadata, signed auth copy, and local documentation while keeping internal package/deploy identifiers stable
- [completed] Map gradient cleanup: remove the shell-level side fades and replace them with tighter map-local gradients that add depth without washing out the frame
- [completed] Map fidelity pass: increase world-map geographic detail with richer coastline/border layering while preserving current interactivity and performance
- [completed] Map redesign: replace low-fidelity world map geometry and styling with a production-quality interactive global surface
- [completed] Demo mode: bypass wallet/NFT requirements with local demo guns and a mocked battle flow
- [completed] Vercel deployment: publish the demo web app from the monorepo with explicit build/output settings and a self-contained demo leaderboard
- [completed] War Room data refresh: add a frontend 101-gun registry, tier/type metadata, and a 20-country world-map dataset under `apps/web/src` without touching UI components
- [completed] Four-color frontend rewrite: rebuild the web app around the white/black/red/blue design system, pure CSS presentation, and the requested connect → map → gun select → matching → VS → battle → victory/defeat state machine
- [completed] Battle presentation rewrite: rebuild `apps/web/src/components/battle` and `apps/web/src/components/chat` with local CSS classes only, War Room gun-frame styling, battle HUD/playback, and victory/defeat overlays without touching routes, stores, map, data modules, or global CSS
- [completed] Typography alignment: apply `Plus Jakarta Sans` to body/UI text and `Rubik Glitch` to display headings across the live frontend runtime
- [completed] Device-responsive hardening: rebalance the live map, HUD, modal, and leaderboard surfaces for desktop, tablet, iPhone, and Android viewport ranges

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
- [completed] DATA-001: Add normalized War Room gun registry and tier/type metadata modules in `apps/web/src/data`
- [completed] DATA-002: Replace the world map country list with a 20-country dataset that preserves current map exports
- [completed] DATA-003: Point the `lib/countries.ts` frontend shim at the new shared map dataset without changing UI components
- [completed] DATA-004: Verify with typecheck/tests and document the resulting data schemas
- [completed] Inspect current store/hooks/demo flow and keep only the runtime pieces needed for the rewrite
- [completed] Replace Tailwind-driven global styling with a pure-CSS four-color design system and animation layer
- [completed] Introduce explicit gun and country data modules for the War Room art direction and battle spec
- [completed] Rebuild the connect screen, header, map, gun select modal, matching, VS, battle, victory, defeat, and leaderboard surfaces
- [completed] Wire the rebuilt surfaces into the existing battle/demo flow with 3+ arsenal bonus treatment
- [completed] Verify via typecheck, build, tests, browser smoke checks, then document review notes and lessons learned
- [completed] BATTLE-001: Audit existing battle/chat props, state flow, and owned files
- [completed] BATTLE-002: Add local battle/chat CSS files and replace Tailwind utility markup with semantic class names
- [completed] BATTLE-003: Rebuild matching, VS/FIGHT, battle playback, gun cards, and result overlays to the four-color War Room spec
- [completed] BATTLE-004: Verify with targeted typecheck/build coverage and record exact changed files

## Review
- VS/FIGHT font rollout: copied the provided `VSF.woff2` into `apps/web/public/fonts/VSF.woff2`, registered it with `@font-face` in `apps/web/src/styles/globals.css`, and scoped `.vs-screen__headline` to `font-family: 'VSF'` so the dedicated reveal wordmarks stop inheriting the global display font override. Also tightened `.warpath-match-title` tracking in `apps/web/src/components/battle/battlePresentation.css` by reducing both the flex gap and `letter-spacing` slightly. Verified locally with `pnpm --filter @warpath/web test` and `pnpm --filter @warpath/web build`, cleared live cooldown rows with `UPDATE players SET cooldown_until = NULL WHERE cooldown_until > NOW();`, and verified production serves `/fonts/VSF.woff2`, `assets/index-BKD76RTt.css`, the `@font-face{font-family:VSF;src:url(/fonts/VSF.woff2)...}` binding, and the tightened `MATCHING` spacing on `https://www.glocksandnode.xyz`.
- Display font normalization: removed the `Rubik Glitch` Google font import, pointed `--font-display` at `Plus Jakarta Sans`, raised the shared display-title weight to `900` in `apps/web/src/styles/globals.css`, and normalized the remaining `GlitchText` component to render with `Plus Jakarta Sans` `900` instead of mono/glitch styling in `apps/web/src/components/ui/GlitchText.tsx`. Verified with `pnpm --filter @warpath/web test` and `pnpm --filter @warpath/web build`.
- Cooldown re-enable rollout: set `WALLET_COOLDOWNS_ENABLED=true` in `.env.vercel.production`, `apps/api/.env`, and `.env.example`, then deployed the current tree to Vercel production as `https://warpathdemo-8p6jzvjp0-tx-build.vercel.app` and verified both `https://www.glocksandnode.xyz` and `https://the-warroom.vercel.app` alias to that ready deployment. Verified the public API with `curl https://www.glocksandnode.xyz/api/health`.
- Security hardening pass: re-enabled wallet cooldown enforcement by default in `apps/api/src/services/players.ts` with an explicit `WALLET_COOLDOWNS_ENABLED` env override, removed the untrusted `x-forwarded-for` fallback by default in `apps/api/src/lib/observability.ts` while preserving an opt-in override for known proxy setups, and added explicit rate limits for `/api/health` and `/api/ready` in `apps/api/src/index.ts`.
- Verification hardening follow-up: added `apps/api/src/__tests__/observability.test.ts`, updated `apps/api/src/__tests__/matchmaking.test.ts` to assert active cooldown rejection again, and fixed the shared package build surface so `@warpath/shared` root imports no longer reference an unbuilt `gunNames` module by updating `packages/shared/tsup.config.ts` and `packages/shared/package.json`.
- Verified with `pnpm --filter @warpath/api test`, `pnpm typecheck`, and `pnpm build`.
- Security audit review: confirmed the highest-severity remaining issue is still unauthenticated global chat posting. `POST /api/chat` accepts a caller-supplied wallet address and writes it directly without using the existing signed-message or chat-session verification path in `apps/api/src/routes/chat.ts`. Also confirmed several older findings are now fixed in the current tree: killfeed rows are filtered by `showBattleResults` in `apps/api/src/services/killfeed.ts`, battle/proof/replay reads are gated by `isBattlePublic()` in `apps/api/src/services/battle.ts`, and profile avatars are restricted to safe inline data URLs in `apps/api/src/services/profiles.ts`. Remaining hardening gaps are narrower operational risks: IP-based rate limiting still falls back to `x-forwarded-for` in `apps/api/src/lib/observability.ts`, and `/api/health` plus `/api/ready` remain unauthenticated, unrated probe surfaces in `apps/api/src/index.ts`.
- Pre-launch reliability review: `pnpm test`, `pnpm typecheck`, and `pnpm build` all passed. Live HTTP smoke against `https://www.glocksandnode.xyz` returned healthy results for `/`, `/killfeed`, `/chat`, `/api/health`, `/api/ready`, `/api/leaderboard?limit=5&offset=0`, `/api/killfeed?limit=5`, `/api/chat?limit=5`, `/api/guns/:address`, and both malformed/valid-missing battle IDs (`400` validation error and `404` not found respectively). Browser smoke on the live domain showed the connect screen, killfeed, and comms routes rendering without console errors, footer links present, and no failed non-static requests in the observed session. Launch-significant behavior to note: unauthenticated `/leaderboard` and `/battle/:id` resolve to the connect screen rather than exposing public standings/replays, so that is stable current behavior but should be treated as a product/access decision, not a surprise during launch.
- Production deploy: deployed the current repo state to Vercel production as `https://warpathdemo-4c0qy4mk4-tx-build.vercel.app/` and verified the public alias `https://www.glocksandnode.xyz/` serves the new `assets/index-C51H6yS4.css` bundle. Confirmed live CSS contains `.connect-screen__title{...letter-spacing:0...}` and `.connect-screen__inner{...animation:screenRise...}` with the old boxed border/background/overlay removed. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web build`, `pnpm typecheck`, `vercel deploy --prod --yes`, `curl -I https://www.glocksandnode.xyz/`, and direct bundle inspection of the served HTML/CSS.
- Connect-wordmark tracking trim: set `.connect-screen__title` letter-spacing to `0` at both the base and small-screen override in `apps/web/src/styles/globals.css` so the wallet-entry `WAR ROOM` mark no longer spreads the characters apart. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json` and `pnpm --filter @warpath/web build`.
- Live-only battle enforcement: removed the frontend `DEMO_MODE` runtime entirely by deleting `apps/web/src/lib/demo.ts`, forcing `WagmiProvider` onto the live connector config, removing demo guns/leaderboard/matchmaking branches from the web hooks and battle overlay, and cleaning the remaining demo-facing copy and env/docs references. Battles can now only progress through the signed queue flow backed by the API and real wallet-owned guns. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web test`, `pnpm --filter @warpath/web build`, and `pnpm typecheck`.
- Battle phase chrome fix: hid the global header during non-idle home-map phases so combat screens run clean fullscreen, and moved the `VS` / `FIGHT` headline into the duel grid itself so it now sits between the left/right fighters instead of floating as a separate fixed overlay. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web build`, and a local Playwright battle flow on `http://127.0.0.1:4177/`.
- Gold-standard UI/UX hardening pass: rebuilt the connect-stage hero shell, stabilized the fixed header into a cleaner grid rail, replaced CSS map zoom hacks with responsive viewBox framing, integrated the map controls into a dedicated control rail, added a mobile map context chip, strengthened the armory selector header/status hierarchy, reduced selector card density, unified the leaderboard into a single operator/score/combat model across breakpoints, and tightened matching/battle/result hierarchy plus tertiary battle log treatment for a more authored runtime on desktop/tablet/phone. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web build`, `pnpm -r test`, and local Playwright checks on `http://127.0.0.1:4176/` covering connect, map, selector, and leaderboard at desktop and mobile widths.
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
- Motion and visual polish pass: added shared easing/motion tokens plus reduced-motion handling, staggered the matching title, upgraded VS fighter entrances, added controlled HP-hit flashes and subtle gun idle motion, flattened the map container wash, removed demo battle timeline telemetry, compacted embedded battle chat into a real battle log, and simplified the result overlays by removing redundant continuation copy. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web build`, `pnpm -r test`, and browser checks on local preview at desktop and `390x844`, covering connect, country selection, selector, matching, result state, and live battle-phase cleanup.
- Accent palette shift: replaced the runtime neon-green accent family with `#00BDFE` and matching blue translucency values across the global theme, map glow/shadow values, battle overlays, dormant map primitives, and War Room data accent metadata, then updated the task log language to match the live palette. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web build`, `pnpm -r test`, and a local preview/browser pass on the connect screen after the rebuilt assets loaded.
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
- Vercel deployment: Added explicit root `vercel.json`/`.vercelignore` monorepo config, made the demo leaderboard self-contained in the frontend, switched API base fallback to same-origin, removed tracked `tsbuildinfo` artifacts, and published the live demo to `https://warpathdemo.vercel.app/`. Verified with `pnpm run typecheck`, a clean shared+web production build after deleting `packages/shared/dist`, Git push to `origin/main`, and a successful Vercel production deployment.
- Battle presentation rewrite: Rebuilt the owned battle/chat presentation layer around local CSS classes and a four-color War Room palette, restored missing battle primitives after concurrent file drift, and kept `StatBar` backward-compatible for `GunSelector` while leaving routes, stores, map, data modules, and global CSS untouched. Verified with `pnpm --filter @warpath/web build` and `pnpm --filter @warpath/web test` (the test command exits cleanly with no test files present in `apps/web`). Exact files changed: `apps/web/src/components/battle/BattleEngine.tsx`, `apps/web/src/components/battle/DeathOverlay.tsx`, `apps/web/src/components/battle/Dissolution.tsx`, `apps/web/src/components/battle/GameOverlay.tsx`, `apps/web/src/components/battle/GunCard.tsx`, `apps/web/src/components/battle/HealthBar.tsx`, `apps/web/src/components/battle/MatchingPulse.tsx`, `apps/web/src/components/battle/StatBar.tsx`, `apps/web/src/components/battle/StatBars.tsx`, `apps/web/src/components/battle/VSReveal.tsx`, `apps/web/src/components/battle/VictorOverlay.tsx`, `apps/web/src/components/battle/battlePresentation.css`, `apps/web/src/components/chat/ChatMessage.tsx`, `apps/web/src/components/chat/ChatPanel.tsx`, `apps/web/src/components/chat/chatPanel.css`, `tasks/todo.md`.
- War Room data refresh: Expanded `apps/web/src/data/guns.ts` into a normalized 101-entry registry with tier metadata, per-type metadata, serial/slug derivations, and tier/type lookup maps; replaced `apps/web/src/data/countries.ts` with a 20-country world-map dataset carrying atlas ids plus UI marker/location metadata; and pointed `apps/web/src/lib/countries.ts` at the new shared country dataset. Verified with `pnpm run typecheck`, `pnpm --filter @warpath/web test`, a direct registry count check (`101` entries), and a direct country count check (`20` entries). `pnpm --filter @warpath/web build` is currently blocked by an unrelated missing file in the workspace: `apps/web/src/main.tsx` imports `./styles/globals.css`, but `apps/web/src/styles/` is empty in this snapshot.
- Four-color frontend rewrite: Rebuilt the live web surface around a pure-CSS white/black/red/blue system with a minimal connect screen, white-background map shell, map-muted gun selector, pulsing `MATCHING` state, `VS` to red `FIGHT` transition, white battle arena with embedded chat sidebar, and `VICTOR` / `ELIMINATED` result screens. Verified with `pnpm run typecheck`, `pnpm -r build`, `pnpm -r test`, and a live Playwright smoke pass at `http://localhost:4175/` covering connect, country selection, gun modal open, demo matchmaking, and the victory result state. Follow-up fixes from that smoke pass: set world-map markers to `pointer-events: none` and changed country paths from stroke-only to transparent interactive fills so map clicks land on the intended country hit area.
- Motion refinement pass: shifted the world map to a black-line system, added restrained Apple-style motion across the connect screen, header, map field, markers, route travel, panels, chat, and battle surfaces, and verified the result with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web build`, and a fresh Playwright screenshot on `http://localhost:4175/`.
- Map depth pass: added a slight monochrome gradient wash behind the world map geometry so the surface has more depth without breaking the white/black palette. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json` and `pnpm --filter @warpath/web build`.
- Runtime polish pass: improved active navigation states, added a map briefing card for the idle home surface, switched the HUD to full country names, and upgraded the leaderboard with a proper masthead, intro copy, active-player badge, and more deliberate row treatment. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web build`, and a browser pass on `http://localhost:4175/` covering home and leaderboard.
- Typography alignment: imported `Plus Jakarta Sans` and `Rubik Glitch` in `apps/web/src/styles/globals.css`, switched the app body/UI stack to the former, switched connect/logo/panel/match/result display headings to the latter, and removed the final battle-layer `JetBrains Mono` override in `apps/web/src/components/battle/battlePresentation.css`. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web build`, and a source scan confirming no remaining `JetBrains Mono`/`Fira Code`/`SF Mono` references under `apps/web/src`.
- Map motion refinement: replaced the world-map dashed route travel effect with a static network lattice plus pulse-based highlighted paths, converted location markers to halo pulses instead of moving travel cues, and normalized the dormant `MapOverlay` helper to the same network-pulse language. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json` and `pnpm --filter @warpath/web build`.
- Layout and mobile hardening: centered the map within a deliberate viewport frame, added responsive header/shell/modal/leaderboard breakpoints, removed the residual map drift animation that destabilized touch targets, and verified the connected map, gun selector, and leaderboard at desktop and mobile viewport sizes via Playwright plus `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json` and `pnpm --filter @warpath/web build`.
- Battle state display cleanup: tightened the `MATCHING` title so it stays on one line, switched the `VS` reveal state to red, rebuilt the `VICTOR` / `ELIMINATED` overlays around a shared centered content stack, then added viewport-height guards, fixed gif framing, and a smaller defeat-title variant so both result states fit cleanly on desktop, mobile, and short-height screens. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web build`, `pnpm -r test`, and a local Playwright pass through the demo battle flow.
- Battle result gold-standard polish: differentiated `VICTOR` and `ELIMINATED` title scales, strengthened the gif frame into a deliberate stage, promoted the weapon caption, separated the CTA into its own action zone, and refined spacing cadence so the result overlays read as composed screens rather than stacked widgets. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web build`, `pnpm -r test`, and local browser inspection on the preview build.
- Device-responsive hardening: moved the map HUD into its own fixed surface overlay, replaced the fragile in-flow mobile layout workaround, tuned map stage heights and transforms per breakpoint, hid the SVG callout on narrow screens, and rebalanced mobile/tablet spacing so the live shell composes correctly across desktop, tablet, iPhone, and Android viewports. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm -r build`, `pnpm -r test`, and Playwright viewport checks at `1440x1100`, `768x1024`, `390x844`, and `412x915`, including country selection, gun selector, and leaderboard navigation.
- Map fidelity pass: added a full-country border mesh plus subtle landmass fill behind the interactive deployment countries, keeping the selected 20-country interaction layer intact while making the globe read as a complete political map. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web build`, and a live browser screenshot pass on the local preview.
- Map gradient cleanup: removed the broad shell-level side fade and moved the depth treatment into the map itself with tighter localized gradients, so the frame reads cleaner while the globe still has atmosphere. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json` and `pnpm --filter @warpath/web build`.
- Gradient refinement pass: removed the residual page-level side wash around the map, flattened the outer shell back toward clean white, and rebuilt the map depth as a centered internal gradient field so the frame edges stay crisp. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web build`, and a local preview inspection on `http://127.0.0.1:4175/`.
- Map palette cleanup: removed red/blue from country outlines, markers, route strokes, and map callouts so the cartography stays fully black, then moved the sector accent into the deploy HUD while keeping blue/red ownership in the battle UI. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web build`, and a local preview check on `http://127.0.0.1:4175/`.
- Connect screen cleanup: removed the `DETH b4 TAXES` kicker from the wallet entry screen so the opening view only carries the WAR ROOM title, collection subtitle, and connect CTA. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json` and `pnpm --filter @warpath/web build`.
- WAR ROOM rename: updated the visible brand copy across the live frontend, HTML metadata, queue-signature statement, CDN test fixtures, and local operator docs from `WAR PATH` / `War Path` to `WAR ROOM` / `War Room` while keeping internal workspace/package identifiers unchanged. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web build`, and `pnpm -r test`.
- Battle side alignment pass: slowed battle playback, made victory/defeat overlays explicit click-to-proceed states, split deployment countries into deterministic left/right sectors, constrained demo matchmaking to opposite-side opponents, and colored map/battle chrome so left reads blue while right reads red. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm -r build`, `pnpm -r test`, and a local Playwright preview flow covering right-sector selection, gun selection, matching, and click-to-continue battle results.
- Dark game-tech battle pass: restored the live frontend to black-depth surfaces with neon `#00BDFE` tech accents, updated the world map to green-line cartography plus beacon halos, switched demo battles to Web Crypto seeded deterministic replay, enforced a 30-minute same-weapon cooldown in the armory and matchmaking flow, and stopped result-panel clicks from leaking into the underlying map. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web build`, `pnpm -r test`, and a local Playwright flow covering connect, deploy, battle completion, and a locked gun card showing `COOLING DOWN 30M`.
- Mobile-first UX hardening: rebuilt the header into a cleaner brand-plus-wallet top line with a dedicated nav row, tightened the mobile connect lockup, improved selector and leaderboard density, added mobile leaderboard metadata rows, shrank embedded chat/battle chrome for narrow screens, and rebalanced map scaling for phone/tablet/desktop viewports. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web build`, `pnpm -r test`, and Playwright viewport checks on local preview at `390x844`, `768x1024`, and `1440x1100`, including connect, map, selector, leaderboard, and result-state screenshots.
- Connect title lockup correction: widened the connect composition and tightened the `WAR ROOM` heading sizing/letter spacing so the title stays on one line on both mobile and desktop without clipping. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web build`, and Playwright screenshots at `390x844` and `1440x1100`.
- Root chrome alignment: added `viewport-fit=cover`, dark Apple mobile web-app chrome metadata, and explicit dark backgrounds on `html`, `body`, and `#root` so browser rails and safe-area surfaces stay aligned with the dark game-tech theme. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json` and `pnpm --filter @warpath/web build`.
- Mobile map interaction pass: converted the world map to a bounded interactive viewBox with zoom controls, wheel zoom, drag/pan, and gesture-safe click suppression so mobile users can inspect the map without losing deployment taps. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web build`, `pnpm -r test`, and Playwright checks for zoom, drag, reset, and country selection on a `390x844` viewport.
- Wallet cooldown refactor: replaced weapon-scoped cooldown storage with wallet-scoped cooldown expiry records, set 15-minute timers for 3+ gun holders and 30-minute timers for smaller arsenals, synced loaded guns into store state so demo/live wallet counts stay accurate, and updated the armory/matchmaking copy to lock the whole wallet instead of a single token. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web build`, `pnpm -r test`, and a Playwright demo flow confirming a 4-gun wallet shows `WALLET COOLDOWN 15M` across the full selector after battle completion.
- Battle screen layout refinement: hid map zoom controls outside the idle map state, removed the idle deployment HUD from matching/fight/result phases, collapsed the battle stage into a single main arena plus compact battle log, and reduced duplicate battle readouts so the combat surface reads cleanly on desktop and mobile. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web build`, `pnpm -r test`, and a Playwright demo flow confirming `+ / - / Reset` no longer appear during matching or result states.
- Map rail cleanup: removed the remaining horizontal side-wash from `.world-map::before` and replaced it with centered atmospheric gradients only, so the map frame edges stay clean instead of reading as left/right rails. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json` and `pnpm --filter @warpath/web build`.
- Screenshot-driven UI upgrade: widened the map projection and container so the globe uses more of the desktop frame, flattened the outer shell/chrome so the side gutters read as pure black instead of gradient rails, moved the country callout to a white-outline box with an accent leader, replaced the selector close button with a cleaner editorial underlined control, and aligned both selector and battle stat systems to `damage #97ff3b`, `dodge #ff4fce`, and `speed #0044ff`. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm -r test`, and `pnpm -r build`.
- Connect-screen subtitle correction: changed the wallet-entry subtitle from `ALL OUT WAR` to `[Glocks & Nodes]` in the live connect screen without touching broader branding or metadata. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json` and `pnpm --filter @warpath/web build`.
- Connect-title irregular timing pass: stretched the connect-screen glitch to a `13s` loop and regrouped the distortion into uneven burst windows with long clean holds between them so `WAR ROOM` now feels like intermittent signal failure rather than a metronomic effect. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json` and `pnpm --filter @warpath/web build`.
- Connect-title cadence shaping: slowed the monochrome `WAR ROOM` distortion cycle to `2.6s` and regrouped the keyframes into short glitch clusters with full pause windows between them so the title now alternates between clean holds and breakage instead of chattering continuously. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web build`, and a local browser preview check on `http://127.0.0.1:4176/`.
- Connect-title monochrome distortion pass: removed the colored channel separation from the wallet entry `WAR ROOM` lockup, switched the glitch layers to monochrome tearing, and pushed the side displacement/blur harder so the distortion reads as structural breakup instead of RGB styling. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web build`, and a local browser preview check on `http://127.0.0.1:4175/`.
- Connect-title glitch upgrade: escalated the wallet entry `WAR ROOM` lockup from restrained flicker to a near-constant distortion field with faster cycles, denser slice jumps, sharper red/blue channel separation, stronger skew displacement, and heavier transient glow while preserving the one-line composition. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web build`, and a local browser preview check on `http://127.0.0.1:4175/`.
- Connect-screen title polish: added a restrained glitch effect to the `WAR ROOM` connect-screen title using layered pseudo-elements and timed channel offsets while keeping the one-line lockup intact, and normalized the subtitle copy to `GLOCKS + NODES`. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json` and `pnpm --filter @warpath/web build`.
- Battle layout polish: tightened the battle stage width and padding, reduced gun-card/frame scale, protected the arena center lane with explicit fighter max widths, shortened the divider stack, and added VS-screen shell constraints so the central stamp never collides with the entering guns. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web build`, `pnpm -r test`, and a local browser flow through connect, deploy, matching, and result on the preview build.
- Result CTA flow fix: split overlay dismiss from the `FIGHT AGAIN` action so clicking the CTA now resets battle state, preserves the chosen country, clears the previous gun, and reopens the armory for a fresh run instead of dumping the user out of the flow. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json` and `pnpm --filter @warpath/web build`.
- Leaderboard header clearance fix: replaced the hard-coded desktop top padding with a guarded header-aware offset so the leaderboard masthead always starts below the fixed site rail on large screens. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web build`, and a desktop browser measurement showing `.leaderboard-page__masthead` now begins below `header.site-header`.
- Vercel domain rename audit: verified the live project still deploys under `warpathdemo`, confirmed `.vercel/project.json` points at project `warpathdemo`, confirmed `warpathdemo.vercel.app` is the current production alias, and attempted to assign `warroom.vercel.app`. The rename is currently blocked because `warroom.vercel.app` already resolves with `HTTP/2 200` and Vercel reports the domain is outside the current `tx-build` scope, so it cannot be reassigned from this workspace without access to the owning project/scope.
- VS/FIGHT center-lane correction: wrapped the duel stamp in the dedicated center slot, aligned the left and right fighter shells to the duel grid edges, and restored the center slot on mobile so `VS` and `FIGHT` now sit between the participants instead of drifting toward the viewport center. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web build`, and `pnpm -r test`.
- Wallet + live API enablement: added WalletConnect to the live Wagmi provider with env-driven configuration, made the connect button prefer injected wallets when available and fall back to WalletConnect otherwise, exposed the Hono API through a Vercel `api/[[...route]].ts` function, set production Vercel env vars for WalletConnect/Alchemy/Neon/RPC, and applied the Drizzle schema to Neon with `pnpm db:migrate`. Verified with `pnpm typecheck`, `pnpm -r build`, and `pnpm -r test`; final live API verification is tied to the Vercel deployment for this patch.
- Production API runtime fix: replaced the API package's Bun-targeted build with a Node-compatible `tsup` bundle and switched the Vercel function entrypoint to Hono's Vercel adapter so the serverless boundary matches the Node runtime instead of forcing `.fetch()` onto the wrong handler shape. Verified locally with `pnpm --filter @warpath/api build`, `pnpm typecheck`, `pnpm -r build`, `pnpm -r test`, and a direct `/api/health` check through `app.request(...)`; live health/leaderboard verification follows the production redeploy.
- Vercel API wrapper compatibility fix: changed the root `api/[[...route]].js` shim from a static ESM import to a cached dynamic import so Vercel's CommonJS Node function can load the ESM `apps/api/dist/index.js` bundle without `ERR_REQUIRE_ESM`. Local verification passed with `node -e "import('./api/[[...route]].js')..."`; live `/api/health` and `/api/leaderboard` verification follows the redeploy of this wrapper patch.
- Shared/API serverless packaging hardening: converted `@warpath/shared` into an explicit dual-format package with `import` and `require` exports, added `tsup.config.ts` build definitions for both shared and API runtime bundles, and switched the Vercel route shim back to a manual Node `req/res` to `Request` bridge backed by the CommonJS API build so the production function no longer depends on `hono/vercel` module resolution. Verified locally with `node` requiring `packages/shared/dist/index.cjs`, `node` requiring `apps/api/dist/index.cjs`, `pnpm typecheck`, `pnpm -r build`, and `pnpm -r test`; final live `/api/health` and `/api/leaderboard` verification follows the production redeploy of this packaging patch.
- Header mute control review: added a localStorage-backed global audio preference module, mounted a compact `Audio On/Off` chip beside the profile trigger, and wired the ambient, map, and battle audio pools to apply the mute state immediately. Verification is `pnpm --filter @warpath/web test` and `pnpm --filter @warpath/web build`.
- Leaderboard K/D review: extended the leaderboard payload with a computed `kdRatio`, surfaced it as a dedicated table column, and widened the responsive leaderboard grid so the new metric stays aligned from desktop through narrow mobile widths. Verification is `pnpm --filter @warpath/api test`, `pnpm --filter @warpath/web test`, and `pnpm --filter @warpath/web build`.
- Website-wide polish review: kept the pass inside safe presentational seams in `globals.css` and the route loader, refining shell rhythm, panel chrome, data/feed readability, selector finish, and map frame/callout styling while explicitly avoiding map interaction rules, battle-phase mount behavior, and queue/chat/gameplay logic. Verification is `pnpm --filter @warpath/api test`, `pnpm --filter @warpath/web test`, and `pnpm --filter @warpath/web build`.
- Global footer credit review: mounted a single fixed footer at the app root with the requested copyright line and non-interactive bottom-center styling so it stays visible across connect, map, social, leaderboard, and battle screens without touching per-route layout logic. Verification is `pnpm --filter @warpath/web test` and `pnpm --filter @warpath/web build`.
- Global footer link review: upgraded the site-wide footer line so `Gary Cartlidge` links to `https://garycartlidge.art/` and `fantom labs technology` links to `https://www.fantomlabs.io/`, while keeping the same centered fixed-footer presentation and verifying the public web build remains green.
- VS/FIGHT font file correction review: replaced the bad reveal-font binary with `MK4.woff2`, rebound the `VS` / `FIGHT` headline at the global, battle-local, and inline-motion layers, and revalidated the emitted web build before redeploying so the live bundle points at the new font asset instead of the previous broken file.
- Live reset review: zeroed production `players.score`, `players.wins`, and `players.losses` for every non-zero record, deleted all production `chat_messages`, and verified the public `/api/leaderboard` and `/api/chat` endpoints both returned empty results immediately afterward.
- Live killfeed reset review: deleted all production `battles` rows, verified the `battles` table count dropped to zero, and confirmed the public `/api/killfeed` endpoint returned an empty `entries` array afterward.
- Queue notification + presence planning review: confirmed the current queue authority lives in `queue`/`matchmaking.ts`, the header wallet rail has a clean insertion point for a small counter, and there is no existing presence system, so email alerts and online counts should be designed as separate backend features instead of piggybacking on chat sessions or frontend-only state.

## 2026-03-21 Production Hardening Plan
- [completed] Add authoritative server-side wallet cooldown persistence and enforcement
- [completed] Replace in-memory rate limiting with durable database-backed throttling
- [completed] Add queue cancellation and automatic queue expiry/cleanup on the backend
- [completed] Add request IDs, structured request/error logs, and readiness monitoring hooks
- [completed] Add realistic end-to-end coverage for wallet/connect boundaries, signed queue submission, queue lifecycle, and leaderboard writes

## 2026-03-21 Production Hardening Review
- Backend authority pass: moved cooldown enforcement into the API/player record flow, synced gun-count state back into player records from live gun reads, returned server cooldown state through queue/guns responses, and removed the live frontend's local-only battle cooldown authority.
- Durable throttling + queue lifecycle: replaced the process-local rate limiter with Postgres-backed bucket upserts, added signed queue cancellation at `POST /api/battles/queue/:queueId/cancel`, and made queue expiry/cancellation return explicit terminal states with cooldown metadata.
- Observability + readiness: added request IDs on responses and error bodies, structured JSON request/error logs, and a deep `/api/ready` probe that verifies both Postgres and Ethereum RPC reachability instead of only process liveness.
- Test + deployment verification: added route-level signed auth/cancel coverage, service-level queue/leaderboard/cooldown coverage, generated and applied the `0001_moaning_maginty` migration to Neon, and redeployed production to `https://the-warroom.vercel.app/` with live `GET /api/health`, `GET /api/ready`, `GET /api/leaderboard?limit=3&offset=0`, and `GET /` checks passing.
- Wallet connect reliability fix: replaced the auto-pick wallet button with an explicit connector chooser so desktop injected wallets and mobile WalletConnect flows no longer depend on brittle `connectors[0]` / environment heuristics, and hardened the injected connector config with shim disconnect plus multi-provider discovery. Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web build`, `pnpm --filter @warpath/web test`, and a local browser check on `http://127.0.0.1:4180/` confirming the chooser opens on both desktop and mobile-sized viewports.

## 2026-03-21 Wallet Extension Routing Review
- Replaced the QR-first wallet stack with explicit MetaMask, Coinbase Wallet, and injected connectors in `apps/web/src/app/Providers.tsx`, then made `CONNECT WALLET` resolve platform-aware connector priority in `apps/web/src/components/wallet/ConnectButton.tsx` so desktop opens browser extensions first and mobile prefers app-native wallet connectors instead of dropping into a WalletConnect QR modal.
- Added tested connector-priority and mobile-client detection utilities in `apps/web/src/lib/walletConnectors.ts` with coverage in `apps/web/src/lib/walletConnectors.test.ts` to keep the extension/deeplink routing deterministic.
- Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web test`, `pnpm --filter @warpath/web build`, and a local Playwright smoke check on `http://127.0.0.1:4190/` confirming desktop connect opens the MetaMask extension/onboarding path instead of the WalletConnect QR screen.
- Follow-up correction: replaced the desktop SDK-first setup with targeted injected connectors for MetaMask, Coinbase Wallet, and Rabby, while keeping SDK connectors only as fallback transport. Verified on `http://127.0.0.1:4191/` that one click opens a single MetaMask extension tab rather than cascading into multiple wallet SDK tabs.

## 2026-03-21 Heading Font Scope Review
- Narrowed the shared display-font selector in `apps/web/src/styles/globals.css` so general product headings like the connect-screen `WAR ROOM`, the shell logo, panel titles, and leaderboard mastheads now use `Plus Jakarta Sans`, while battle-state words such as `VS`, `FIGHT`, `VICTOR`, and `ELIMINATED` remain on `Rubik Glitch`.
- Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web test`, `pnpm --filter @warpath/web build`, and browser computed-style checks on `http://127.0.0.1:4192/` confirming `.connect-screen__title` / `.panel-title` resolve to `Plus Jakarta Sans` and `.vs-screen__headline` resolves to `Rubik Glitch`.

## 2026-03-21 Map Selection Marker Review
- Corrected the selected map-area marker behavior so only the inner dot turns red while the existing animated halo remains blue; restored the selected pulse render in `apps/web/src/components/map/WorldMap.tsx` and kept the red core styling in `apps/web/src/styles/globals.css`.
- Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web build`, and a production redeploy to `https://the-warroom.vercel.app/`.

## 2026-03-21 Brand Font Review
- Packaged the local `Futura PT Bold.woff2` file into `apps/web/public/fonts/FuturaPTBold.woff2`, registered it with `@font-face`, and introduced a dedicated brand font variable in `apps/web/src/styles/globals.css`.
- Scoped `Futura PT Bold` to the `WAR ROOM` lockups and the leaderboard masthead title while leaving the broader UI on `Plus Jakarta Sans` and the battle-impact words on `Rubik Glitch`.
- Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web build`, `curl -I http://127.0.0.1:4194/fonts/FuturaPTBold.woff2`, and browser computed-style checks on `http://127.0.0.1:4194/` confirming both `.connect-screen__title` and `.leaderboard-page__masthead .panel-title` resolve to `Futura PT Bold`.
- Follow-up tuning: reduced `letter-spacing` on `.connect-screen__title` so the main connect-page `WAR ROOM` lockup sits tighter with the Futura face on both desktop and mobile.
- Header logo correction: removed the bad animated clone treatment from `.site-logo` and switched the fixed map-page `WAR ROOM` mark to a larger, static white distressed display treatment that better matches the screenshot reference; kept the added leaderboard top clearance so the header no longer overlaps that page.
- Header image swap: packaged `header.jpg` into `apps/web/public/branding/header.jpg`, replaced the map-page header wordmark with the actual image asset in `apps/web/src/components/layout/Header.tsx`, and sized it to sit at the top-left of the fixed header rail via `apps/web/src/styles/globals.css`.
- Verified the header image swap with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json` and `pnpm --filter @warpath/web build`.

## 2026-03-21 Gun Ownership Fetch Review
- Confirmed the live gun pull bug was not the contract address: `GN_CONTRACT_ADDRESS` already matched `0x08189e5fd59ceaac75bfc3ce134066f204a6f609`. The real failure was that `apps/api/src/services/guns.ts` depended on `tokenOfOwnerByIndex`, but the collection contract is not ERC-721 Enumerable and that call reverts.
- Replaced the ownership enumeration path with a non-enumerable-safe stack: on-chain `balanceOf` remains authoritative for count, Alchemy `getNFTsForOwner` is the fast ownership index for this contract when `supportsInterface(0x780e9d63)` is false or owner enumeration fails, and on-chain `Transfer` log reconstruction is now the last-resort fallback if Alchemy is unavailable.
- Updated the empty-state OpenSea link in `apps/web/src/components/wallet/WalletGate.tsx` to `https://opensea.io/collection/glock-node` and added API coverage in `apps/api/src/__tests__/guns.test.ts`.
- Deployment follow-up: verified the live `guns` bug had a second production cause beyond ownership enumeration. The Vercel root API shim was still using `api/[[...route]].js`, and nested API paths like `/api/guns/:address` and `/api/battles/...` were falling through at the platform edge. Renamed the entrypoint to `api/[...route].js` so nested API routes are caught by the serverless function.
- Routing hardening follow-up: made nested serverless API surfaces explicit with `api/guns/[address].js` and `api/leaderboard/[address].js`, backed by a shared `api/_handler.js`, so nested paths no longer depend on the root catch-all working perfectly under this Vercel setup.
- Battle-route follow-up: added explicit Vercel function files for the live battle surfaces the app actually calls (`api/battles/queue.js`, `api/battles/[battleId].js`, `api/battles/queue/[queueId].js`, and `api/battles/queue/[queueId]/cancel.js`) so queue polling, cancel, and battle fetches do not rely on the deeper catch-all behavior either.
- Verified end-to-end with `pnpm --filter @warpath/api test`, `pnpm --filter @warpath/api exec tsc --noEmit -p tsconfig.json`, `pnpm typecheck`, `pnpm --filter @warpath/api build`, and live deployment checks. Production now returns real collection data for `GET /api/guns/0x00057ecdc9882fa43dd2d732ddd43479806268a2` on `https://the-warroom.vercel.app/`, including token IDs `62` and `63`, and nested routes like `GET /api/leaderboard/:address` and `GET /api/battles/queue/:queueId?...` now resolve through the API surface instead of falling through to Vercel `NOT_FOUND`.

## 2026-03-21 Gold-Standard Hardening Review
- Queue-status hardening: replaced anonymous `GET /api/battles/queue/:queueId` polling with token-authenticated `POST /api/battles/queue/:queueId/status`, added per-entry `statusToken` persistence in the queue schema, pushed that contract through shared types, frontend store/hook polling, and route-level tests, and generated the safe `0002_supreme_skin` migration with a backfill before `NOT NULL`.
- Ownership hardening: removed full-chain transfer-log reconstruction from the live gun request path, added persistent `ownership_snapshots`, made Alchemy the indexed ownership source for non-enumerable wallets, and returned a deliberate `OWNERSHIP_INDEX_UNAVAILABLE` `503` when neither live index data nor a recent snapshot is available.
- Frontend/runtime cleanup: replaced the placeholder battle route with a real replay loader, made canonical/OG site metadata build-time configurable with a fallback-safe Vite HTML transform, removed `@rainbow-me/rainbowkit`, added wallet/map/react/manual chunking, and added a root `README.md` describing the actual architecture, env contract, and verification flow.
- Type/build boundary cleanup: moved app/API typechecks onto the shared source path inside the monorepo instead of relying on brittle package declaration resolution, and made the web build explicitly build `@warpath/shared` before its own typecheck/bundle pass.
- Verification: `pnpm test`, `pnpm typecheck`, `pnpm build`, `pnpm --filter @warpath/web build`, and `pnpm --filter @warpath/api test` all pass in the final sequential run. The web bundle still carries a large `wallet-vendor` chunk, so deeper connector lazy-loading remains the main unresolved performance follow-up rather than a correctness blocker.

## 2026-03-21 WalletConnect Mobile Handoff Review
- Replaced the rejected MetaMask in-app-browser deeplink path with a proper WalletConnect mobile handoff using the provided `VITE_WALLETCONNECT_PROJECT_ID` in `apps/web/src/app/Providers.tsx`.
- Desktop remains extension-first through targeted injected connectors, while mobile browsers without an injected wallet now prioritize the `walletConnect` connector through `apps/web/src/lib/walletConnectors.ts` and `apps/web/src/components/wallet/ConnectButton.tsx`.
- Prioritized official WalletConnect explorer listings for MetaMask, Coinbase Wallet, Trust Wallet, and Rabby in the WalletConnect modal so the mobile wallet sheet surfaces the common choices first.
- Updated `.env.example` and `.env.vercel.production` to document the WalletConnect project ID, then verified with `pnpm --filter @warpath/web test`, `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web build`, a local browser smoke check, and a production deploy to `https://www.glocksandnode.xyz`.

## 2026-03-23 Matching Audio Delay Review
- Updated `apps/web/src/components/battle/MatchingPulse.tsx` so the `Loading.mp3` loop starts after a 1 second timeout instead of immediately when the overlay mounts.
- Added timeout cleanup alongside the existing audio teardown so short-lived matching overlays do not leave a pending delayed playback behind after the screen exits.

## 2026-03-23 Matching Audio Source Swap Review
- Copied the provided `Matching.mp3` into `apps/web/public/assets/Matching.mp3`.
- Updated `apps/web/src/components/battle/MatchingPulse.tsx` so the matchmaking overlay now loops `Matching.mp3` instead of `Loading.mp3` while preserving the existing 1 second delayed start and teardown behavior.

## 2026-03-23 Matching Audio Removal Review
- Removed the matching-phase audio effect from `apps/web/src/components/battle/MatchingPulse.tsx` so the overlay no longer starts or stops any cue while the visual search state remains unchanged.

## 2026-03-23 Chunk Recovery Review
- Replaced the lazy-loaded result overlays in `apps/web/src/components/battle/GameOverlay.tsx` with direct imports so battle results no longer depend on separate hashed `VictorOverlay` and `DeathOverlay` chunks.
- Added one-shot chunk fetch recovery in `apps/web/src/main.tsx` for `vite:preloadError` and dynamic-import rejection errors so an already-open tab can refresh itself once after a production deploy swaps the asset hashes.

## 2026-03-23 Favicon Review
- Copied the provided `Favicon.png` into `apps/web/public/favicon.png` so the icon ships as a stable public asset.
- Updated `apps/web/index.html` to use the PNG favicon for both the standard browser tab icon and the Apple touch icon instead of the previous `favicon.svg`.

## 2026-03-23 Fight Reveal Audio Review
- Copied the provided `Fight.mp3` into `apps/web/public/assets/Fight.mp3`.
- Updated `apps/web/src/components/battle/VSReveal.tsx` to preload the sound on mount and play it once at the exact `showFight` transition so the cue lands only when the `FIGHT` wordmark appears.

## 2026-03-23 Result Audio Review
- Copied the provided `Winner.mp3` and `Loser.mp3` into `apps/web/public/assets/`.
- Updated `apps/web/src/components/battle/VictorOverlay.tsx` and `apps/web/src/components/battle/DeathOverlay.tsx` so each result overlay preloads and plays its own outcome sound on mount, then stops and resets it on teardown.

## 2026-03-23 Audio One-Shot Review
- Updated `apps/web/src/components/battle/MatchingPulse.tsx`, `apps/web/src/components/battle/VSReveal.tsx`, `apps/web/src/components/battle/VictorOverlay.tsx`, and `apps/web/src/components/battle/DeathOverlay.tsx` so `Matching`, `Fight`, `Winner`, and `Loser` all explicitly set `audio.loop = false`.

## 2026-03-23 Mobile Battle Audio Review
- Added `apps/web/src/lib/battleAudio.ts` as a shared audio pool for `Enter Battle`, `Matching`, `Fight`, `Winner`, and `Loser`.
- Updated the battle flow components to reuse those shared audio elements instead of constructing fresh `Audio` objects after the tap gesture, which improves delayed cue playback on mobile browsers.
- Primed the shared audio pool from the `Enter Battle` click path in `apps/web/src/components/battle/GameOverlay.tsx` so later `Fight`, `Winner`, and `Loser` cues can play from an already-unlocked media element set.

## 2026-03-23 Battle Chat Removal Review
- Removed the embedded `ChatPanel` mount from `apps/web/src/components/battle/BattleEngine.tsx`.
- Left the standalone chat page and shared chat components untouched so this change only affects the battle screen.

## 2026-03-21 Header Rail Clearance Review
- Reworked the fixed header geometry in `apps/web/src/styles/globals.css` so the rail height is explicit, the `header.jpg` wordmark is constrained by height instead of raw width, and the wallet chip/nav rhythm fits inside the reserved header footprint.
- Increased the leaderboard page top inset from the actual header height instead of a stale estimate, and tightened the map-shell/header spacing at the same time so the fixed rail stops drifting over both the leaderboard masthead and the world map.
- Verified with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web build`, and a production deploy to `https://www.glocksandnode.xyz`.

## 2026-03-21 Header Logo Live-Deploy Review
- Increased the fixed `header.jpg` wordmark footprint by 20% in `apps/web/src/styles/globals.css` by raising the explicit header rail reserve and the logo image height clamps across desktop and mobile breakpoints.
- Local verification stayed green with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json` and `pnpm --filter @warpath/web build`, but the first production alias check was stale and still served the previous CSS bundle.
- Forced a fresh no-cache production deploy with `vercel deploy --prod --yes --force`, then verified the public custom domain HTML/CSS directly. `https://www.glocksandnode.xyz/` now serves `/assets/index-CUl2KS7g.css`, and that live CSS contains the updated header values: `--header-height: 4.5rem`, `.site-logo__image { height: clamp(2.28rem, 2.64vw, 3.06rem) }`, plus the updated mobile/tablet header reserves.

## 2026-03-21 Visual Refinement Execution Plan
- [in_progress] Audit the full `apps/web` frontend for palette, font scope, surface tokens, motion patterns, interaction points, and animation performance risks.
- [pending] Normalize a shared design-token layer in `apps/web/src/styles/globals.css` using only existing colors/fonts: canonical surface fills, border alphas, shadow stacks, atmospheric gradients, easing curves, durations, and focus states.

## 2026-03-22 Drand Fairness Plan
- [completed] Finish the shared battle contract for drand commitments, proof payloads, and deterministic replay inputs.
- [completed] Complete the API battle lifecycle so matchmaking creates committed battles, queue polling exposes pending metadata, and battle fetches resolve lazily once the target drand round exists.
- [completed] Add public proof/replay surfaces and verifier-friendly payloads without introducing any smart contract dependency.
- [completed] Rewrite battle and matchmaking tests around the committed/resolved lifecycle, then rerun typecheck and API/shared tests until green.

## 2026-03-22 Drand Fairness Review
- Shared fairness contract: replaced the old hourly-seed-only battle path with a commitment/proof model in `@warpath/shared`, including canonical commitment hashing, drand-seeded battle replay, and exported `verifyBattleProof(...)` / `recomputeBattleResultFromProof(...)` helpers so the same verifier logic can run in the backend or browser.
- Backend lifecycle: updated the `battles` schema/service flow so matchmaking now creates `committed` battles with future drand rounds, lazy resolution upgrades them to `resolved`, and failed fetch/verification attempts remain recoverable instead of corrupting score state. Also corrected cooldown application to use each wallet's real gun-count side after resolution rather than assuming left=winner.
- API surfaces: added verifier-ready `GET /api/battles/:battleId/proof` and `GET /api/battles/:battleId/replay` routes plus explicit Vercel shims for both nested paths, while preserving `GET /api/battles/:battleId` as the main battle envelope that can now return committed/resolving/failed states.
- Frontend flow: changed matchmaking polling so a matched queue no longer assumes an immediately replayable battle. The client now keeps polling through the drand wait window, removes the cancel action once the battle is committed, and shows pending replay messaging on the standalone battle page until the proof-backed resolution is available.
- Verification: `pnpm --filter @warpath/shared test`, `pnpm --filter @warpath/api test`, `pnpm typecheck`, `pnpm test`, and `pnpm build` all pass after the lifecycle rewrite.

## 2026-03-22 VS Reveal Centering Review
- Adjusted the desktop duel grid in `apps/web/src/components/battle/battlePresentation.css` from fixed fighter-column widths to `1fr auto 1fr`, then anchored the left fighter shell to the inside-right edge and the right fighter shell to the inside-left edge so the center stamp aligns to the midpoint between the rendered cards instead of the biased start edge of both shells.
- Kept the existing single-column mobile collapse unchanged so the correction only affects the desktop/tablet reveal where the drift was visible.
- Verification: `pnpm --filter @warpath/web test` and `pnpm --filter @warpath/web build` both pass after the CSS correction.

## 2026-03-22 Temporary Cooldown Shutdown Review
- Disabled wallet cooldown enforcement in `apps/api/src/services/players.ts` by forcing the cooldown read path to return `remainingMs: 0` / `expiresAt: null` and making `applyWalletCooldown(...)` clear `cooldown_until` instead of writing a future lock timestamp. This keeps the rest of the queue and battle code untouched while turning cooldowns off at the single backend boundary that both matchmaking and gun payloads depend on.
- Updated `apps/api/src/__tests__/matchmaking.test.ts` so a stored `cooldownUntil` row no longer blocks queue joins while the temporary override is active.
- Verification: `pnpm --filter @warpath/api test` and `pnpm typecheck` pass after the cooldown disable.
- [pending] Apply Motion Director refinements across connect, map, selector, matching, versus, battle, result, chat, and leaderboard states using transform/opacity-first choreography and reduced-motion-safe fallbacks.
- [pending] Apply Surface & Detail refinements across headers, panels, modal glass, depth, scrollbars, selection, focus, and atmospheric overlays without changing layout hierarchy or game logic.
- [pending] Run integration cleanup for conflicting transitions, stale animation rules, layout-triggering motion, z-index consistency, and palette compliance.
- [pending] Verify with targeted frontend typecheck/build/tests and record final results plus lessons learned.

## 2026-03-21 Visual Refinement Pass Plan
- [completed] Audit the frontend surface and inventory the existing token, typography, motion, interaction, and performance patterns without changing code.
- [completed] Establish a unified token/system layer in `apps/web/src/styles/globals.css` derived only from existing colors, fonts, and materials.
- [completed] Refine motion choreography across connect, map, gun selector, matching, VS, battle, result, replay, leaderboard, and chat using transform/opacity-first animation patterns.
- [completed] Refine surfaces and micro-details across header, overlays, map chrome, cards, panels, focus states, selection colors, and scrollbars without changing layout structure or game logic.
- [completed] Run final integration and verification with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web test`, and `pnpm --filter @warpath/web build`.

## 2026-03-21 Visual Refinement Pass Review
- Audit findings: the frontend already had a solid dark visual identity, established easing tokens, and a complete state flow, but motion was uneven across screens, surface depth was inconsistent between globals/battle/chat layers, and several animations still relied on raw `ease`, `width`, or heavier visual effects than necessary.
- Token/system layer: consolidated shared surface/shadow/focus primitives in `apps/web/src/styles/globals.css` using only the repo’s existing colors and fonts, then reused that language across the map shell, fixed header, modal, cards, leaderboard, battle overlay, and chat surfaces.
- Motion pass: tightened sequencing and timing in the battle/chat React components, converted progress and stat movement toward transform-led animation, improved battle hit cadence and VS/result timing, and kept the game flow and component hierarchy intact.
- Surface/detail pass: upgraded glass treatment, shadow layering, selection/focus states, scrollbar styling, and panel depth in `apps/web/src/styles/globals.css`, `apps/web/src/components/battle/battlePresentation.css`, and `apps/web/src/components/chat/chatPanel.css` without introducing any new colors or fonts.
- Verification: `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web test`, and `pnpm --filter @warpath/web build` all pass. The only remaining warning is the pre-existing large `wallet-vendor` chunk from Vite.

## 2026-03-22 Global Social Layer Plan
- [completed] Inspect the current API/web/task state after the partial backend implementation for killfeed, chat, and profile support.
- [completed] Finish the frontend integration: API helpers, routed Chat/Killfeed pages, profile modal, header tabs, and shared chat rendering updates.
- [completed] Generate the new Drizzle migration for `profiles` and `chat_messages`, then add route coverage for the new signed API surfaces.
- [completed] Run sequential verification across API typecheck/tests/build, web typecheck/tests/build, and root typecheck.
- [completed] Apply the production migration, deploy Vercel production, and verify the public custom domain routes and API endpoints.

## 2026-03-22 Global Social Layer Review
- Added real shared contracts for `Profile`, signed profile updates, signed global chat messages, killfeed entries, and chat responses in `packages/shared/src/types.ts` and `packages/shared/src/auth.ts`, then pushed those contracts through the web API client in `apps/web/src/lib/api.ts`.
- Added backend persistence and routes for the social layer: `profiles` and `chat_messages` in `apps/api/src/db/schema.ts`, services in `apps/api/src/services/{profiles,chat,killfeed}.ts`, and Hono routes in `apps/api/src/routes/{profiles,chat,killfeed}.ts`, all mounted in `apps/api/src/index.ts` with route-specific rate limiting.
- Added explicit Vercel function entrypoints for the new APIs (`api/chat.js`, `api/killfeed.js`, `api/profiles/[address].js`) so the live deployment surface stays reliable under the current monorepo/serverless setup.
- Added a routed global `CHAT` page and `KILLFEED` page, upgraded chat message rendering with optional profile identity/avatar treatment, and added a signed `ProfilePanel` next to the wallet chip in the fixed header so users can edit display name, avatar URL, status message, and privacy toggles.
- Generated `apps/api/drizzle/0003_fixed_stephen_strange.sql` plus the accompanying Drizzle metadata snapshot/journal update, then applied that migration live against Neon with `DATABASE_URL='…' pnpm db:migrate`.
- Added API route coverage in `apps/api/src/__tests__/social.test.ts` for `GET/POST /api/chat`, `GET/POST /api/profiles/:address`, and `GET /api/killfeed`, and updated `apps/api/package.json` so API tests always build `@warpath/shared` first instead of depending on stale workspace dist artifacts.
- Verification passed with `pnpm --filter @warpath/api exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/api test`, `pnpm --filter @warpath/api build`, `pnpm --filter @warpath/web test`, `pnpm --filter @warpath/web build`, and `pnpm typecheck`.
- Production deployment completed at `https://warpathdemo-2slif9904-tx-build.vercel.app`, aliased to `https://www.glocksandnode.xyz`. Live verification passed for `GET /killfeed` -> `200`, `GET /chat` -> `200`, `GET /api/killfeed?limit=2` -> `{"entries":[]}`, `GET /api/chat?limit=2` -> `{"messages":[]}`, and `GET /api/profiles/0x00057ecdc9882fa43dd2d732ddd43479806268a2` -> default JSON profile.

## 2026-03-22 Chat Session + Avatar Upload Review
- Replaced per-message chat signatures with a wallet-authenticated reusable chat session. Added shared session types/message builders in `packages/shared/src/{types,auth}.ts`, `chat_sessions` persistence plus token hashing in `apps/api/src/{db/schema.ts,services/chatSessions.ts}`, and switched `apps/api/src/routes/chat.ts` to mint a session at `POST /api/chat/session` and accept normal chat posts via `Authorization: Bearer ...`.
- Updated the web chat flow in `apps/web/src/{lib/api.ts,app/pages/ChatPage.tsx}` so chat now signs once per session, caches the issued token in `localStorage`, refreshes it automatically when expired/invalid, and posts plain chat bodies afterward without prompting the wallet every message.
- Added direct profile-image upload in `apps/web/src/components/profile/ProfilePanel.tsx` with client-side crop/compression to a square WebP data URL, preview/clear controls, and backend profile validation in `apps/api/src/routes/profiles.ts` that accepts safe `data:image/...;base64,...` avatars as well as remote URLs.
- Generated and applied `apps/api/drizzle/0004_smart_whiplash.sql` for the new `chat_sessions` table, added `api/chat/session.js` for Vercel’s explicit nested route surface, and extended `apps/api/src/__tests__/social.test.ts` to cover session issuance and bearer-backed chat posting.
- Verification passed again with `pnpm --filter @warpath/api exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/api test`, `pnpm --filter @warpath/api build`, `pnpm --filter @warpath/web test`, `pnpm --filter @warpath/web build`, `pnpm typecheck`, `DATABASE_URL='…' pnpm db:migrate`, and a production deploy to `https://warpathdemo-otljoch61-tx-build.vercel.app` aliased to `https://www.glocksandnode.xyz`.
- Live proof: `POST https://www.glocksandnode.xyz/api/chat/session` with a valid signed session payload now returns `201` JSON containing `{ address, token, expiresAt }`, confirming the public production stack no longer requires a signature on every chat message.

## 2026-03-22 Header Asset Swap Review
- Replaced the fixed header wordmark image source from `header.jpg` to `header.png` in `apps/web/src/components/layout/Header.tsx`, and aligned the WalletConnect metadata icon in `apps/web/src/app/Providers.tsx` so the public branding surface and wallet metadata no longer diverge.

## 2026-03-22 Mobile WalletConnect Reliability Review
- Corrected the WalletConnect metadata origin in `apps/web/src/app/Providers.tsx` to use `window.location.origin` at runtime instead of a stale env-bound domain, so the live mobile handoff is anchored to the actual public host the user opened in Safari.
- Simplified `apps/web/src/components/wallet/ConnectButton.tsx` to connect through a single preferred connector per click instead of iterating through multiple connectors, which was unsafe for WalletConnect app-switch flows because it could abandon the active session while MetaMask was opening.

## 2026-03-22 First-Connect Chat Authorization Review
- Extracted shared chat-session storage/bootstrap helpers into `apps/web/src/lib/chatSession.ts`, then updated `apps/web/src/components/wallet/ConnectButton.tsx` to mint the wallet-authenticated chat session immediately after the first successful wallet connect so global chat is enabled from the initial home-screen connect flow.
- Reduced `apps/web/src/app/pages/ChatPage.tsx` to reuse the shared session helpers, rely on the prewarmed chat session by default, and only reauthorize if the long-lived session has actually expired or been invalidated.

## 2026-03-22 Chat Unlock Review
- Removed the separate chat-session requirement from the live chat posting path. `apps/api/src/routes/chat.ts` now accepts the posted wallet address directly, `packages/shared/src/types.ts` defines `ChatCreateRequest` with `{ address, body }`, and `apps/web/src/app/pages/ChatPage.tsx` posts immediately for any connected wallet without a second signature or chat-specific auth prompt.
- Simplified the frontend by removing the temporary chat-session bootstrap helper and the connect-button chat bootstrap path, so the connect experience is the same on desktop and mobile: connect wallet once, then chat is unlocked.
- Verification passed with `pnpm --filter @warpath/api test`, `pnpm --filter @warpath/api exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web test`, `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/api build`, and `pnpm --filter @warpath/web build`.
- Production deployment completed at `https://warpathdemo-get7lctl3-tx-build.vercel.app`, aliased to `https://www.glocksandnode.xyz`.
- Live proof: `https://www.glocksandnode.xyz/chat` now serves `assets/ChatPage-BpS3zNn3.js`, and that live chunk shows `postGlobalChat({ address, body })`, the copy `Connected wallets can post here immediately without a second prompt.`, and no `/api/chat/session` or `Authorization: Bearer` path in the chat route bundle.

## 2026-03-22 ENS Identity Fallback Plan
- [completed] Inspect the current connected-wallet identity surfaces across header, profile, chat, and killfeed.
- [completed] Add ENS fallback resolution to the backend profile layer so public identity payloads can return `.eth` names when no custom display name is set.
- [completed] Update the connected-wallet web surfaces to prefer custom display name, then ENS, then shortened address.
- [completed] Run API/web verification and deploy the ENS fallback to production.

## 2026-03-22 ENS Identity Fallback Review
- Added `ensName` to the shared profile/chat/killfeed contract in `packages/shared/src/types.ts` so ENS is treated as a resolved fallback identity, not a user-authored replacement for `displayName`.
- Added cached ENS resolution in `apps/api/src/services/ens.ts` using the existing mainnet `publicClient`, then wired `apps/api/src/services/profiles.ts` to return ENS names whenever a wallet does not have a saved custom display name.
- Updated `apps/api/src/services/chat.ts` and `apps/api/src/services/killfeed.ts` so live social payloads now expose ENS fallback names without requiring users to save profile edits first.
- Updated the connected-wallet web identity surfaces in `apps/web/src/components/wallet/ConnectButton.tsx`, `apps/web/src/components/profile/ProfilePanel.tsx`, `apps/web/src/components/chat/ChatMessage.tsx`, `apps/web/src/app/pages/ChatPage.tsx`, and `apps/web/src/app/pages/KillfeedPage.tsx` to resolve identity as custom display name -> ENS -> shortened address.
- Verification passed with `pnpm --filter @warpath/api exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/api test`, `pnpm --filter @warpath/web test`, `pnpm --filter @warpath/api build`, and `pnpm --filter @warpath/web build`.
- Production deployment completed at `https://warpathdemo-batzarq1c-tx-build.vercel.app`, aliased to `https://www.glocksandnode.xyz`.
- Live proof: `GET https://www.glocksandnode.xyz/api/profiles/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045` now returns `"ensName":"vitalik.eth"`, `https://www.glocksandnode.xyz/` serves `assets/index-tSK8frvI.js`, and the live chunks `Header-DVdnL8kx.js`, `ChatPage-CTukjL55.js`, and `KillfeedPage-wi9L43GF.js` all consume `ensName` as the fallback identity path.

## 2026-03-22 Leaderboard Combat Filter Review
- Updated `apps/api/src/services/leaderboard.ts` so the leaderboard only selects and counts players whose `wins > 0` or `losses > 0`, which excludes wallets that have connected or synced guns but never fought.
- Added `apps/api/src/__tests__/leaderboard.test.ts` to lock the behavior: `0/0` wallets are excluded while real battle participants remain ranked.
- Verification passed with `pnpm --filter @warpath/api test`, `pnpm --filter @warpath/api exec tsc --noEmit -p tsconfig.json`, and `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`.
- Production deployment completed at `https://warpathdemo-43r8bx7yt-tx-build.vercel.app`.
- Live proof: `GET https://www.glocksandnode.xyz/api/leaderboard?limit=10&offset=0` now returns `{"entries":[],"total":0}`, which confirms the public leaderboard is no longer including wallets that have never completed a battle.

## 2026-03-22 Chat Relative Timestamp Review
- Updated `apps/web/src/components/chat/ChatMessage.tsx` to render message timestamps as viewer-local relative time (`just now`, `2 minutes ago`, `3 hours ago`, etc.) with the absolute local timestamp preserved in the element tooltip/title.
- Tightened the timestamp treatment in `apps/web/src/components/chat/chatPanel.css` so message times read as smaller secondary metadata instead of competing with the sender identity.
- Verification passed with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json`, `pnpm --filter @warpath/web test`, and `pnpm --filter @warpath/web build`.

## 2026-03-22 Comms Label Review
- Renamed the user-facing `Chat` label to `Comms` across the primary header nav, the global comms page masthead/meta/placeholder copy, and the embedded battle comms panel while intentionally keeping the `/chat` route and backend API surface unchanged.
- Verification passed with `pnpm --filter @warpath/web exec tsc --noEmit -p tsconfig.json` and `pnpm --filter @warpath/web build`.

## 2026-03-22 Provably Fair RNG Plan

### Current-State Audit
- [completed] Inspect the live battle path in `apps/api/src/services/matchmaking.ts`, `apps/api/src/services/battle.ts`, `packages/shared/src/stats.ts`, `apps/api/src/routes/battles.ts`, and the replay consumers in `apps/web/src/hooks/useMatchmaking.ts` and `apps/web/src/app/pages/BattlePage.tsx`.
- [completed] Confirm the current fairness gap: battle resolution is server-local and only pseudo-random. The current engine in `packages/shared/src/stats.ts` deterministically picks the higher composite-score side and then forces that side to win after generating cosmetic round data, while `apps/api/src/services/battle.ts` seeds from token IDs plus an hourly time bucket.
- [completed] Confirm integration constraint: battles are created immediately inside `tryMatch()` during queue matching, stored once in `battles`, then replayed from stored `roundsJson`. There is no pending-resolution phase, no proof packet, and no verifier surface today.

### Target Architecture
- [pending] Replace the current hourly-seed battle path with a drand-backed commit-reveal lifecycle using Quicknet (`chainHash 52db9b...e971`) as the entropy source.
- [pending] Split battle lifecycle into explicit states: `committed -> resolving -> resolved -> failed`, instead of treating match and battle resolution as a single synchronous insert.
- [pending] Store a full immutable fairness packet per battle:
  - committed battle preimage
  - `commitHash`
  - `drandRound`
  - `drandRandomness`
  - `drandSignature`
  - derived `battleSeed`
  - engine version
  - resolved round log/result
- [pending] Keep the battle engine deterministic and pure in `packages/shared`, but make the seed source externally verifiable instead of server-chosen.

### Schema / Contract Changes
- [pending] Extend `apps/api/src/db/schema.ts` `battles` table with:
  - `status`
  - `commit_hash`
  - `commit_preimage_json`
  - `drand_round`
  - `drand_randomness`
  - `drand_signature`
  - `battle_seed`
  - `engine_version`
  - `resolution_error`
  - `committed_at`
  - `resolved_at`
- [pending] Add shared proof/result types in `packages/shared/src/types.ts`:
  - `BattleStatus`
  - `BattleCommitPreimage`
  - `BattleProof`
  - richer `Battle` shape with `status`, `proofAvailable`, and `verification` metadata
- [pending] Generate a migration for the new battle columns and indexes (`status`, `drand_round`, `commit_hash` uniqueness if appropriate).

### Engine Redesign
- [pending] Replace the current “higher score always wins” behavior in `packages/shared/src/stats.ts` with a true weighted deterministic engine:
  - stats influence probabilities, not predetermined outcomes
  - arsenal bonus is committed as an input and influences effective power only
  - every per-round random branch comes from chained hashes of `battleSeed`
  - no post-hoc forced winner correction
- [pending] Version the engine explicitly (`engineVersion = 'v2-drand-commit'`) so old battle replays remain interpretable after rollout.
- [pending] Add shared tests proving:
  - same inputs + same seed => identical output
  - different drand randomness => different battle path
  - weighted advantage increases win rate but does not guarantee wins

### Backend Flow Redesign
- [pending] Refactor `apps/api/src/services/battle.ts` into three distinct responsibilities:
  - `createBattleCommitmentForMatch()`
  - `resolveCommittedBattle()`
  - `getBattleProof()`
- [pending] Change `apps/api/src/services/matchmaking.ts` `tryMatch()` so matching does not immediately finalize a battle result. Instead:
  - create `battles` row in `committed` state
  - write queue rows as `matched` with `battleId`
  - return the battle as pending until drand resolution completes
- [pending] Add a battle-resolution worker/service path that:
  - targets a future drand round about 5 seconds ahead
  - polls drand relays with retry/backoff
  - resolves the battle once the round exists
  - persists proof/result atomically
  - marks failures explicitly for retry/inspection
- [pending] Do not rely on in-memory `setTimeout` alone for correctness. Use a recoverable polling path:
  - opportunistic background scheduling in-process
  - plus resolution-on-read / periodic recovery so server restarts cannot strand committed battles forever

### API Surface
- [pending] Expand `apps/api/src/routes/battles.ts` with explicit fairness endpoints:
  - `GET /api/battles/:battleId` -> pending or resolved battle envelope
  - `GET /api/battles/:battleId/proof` -> full proof packet
  - `GET /api/battles/:battleId/replay` -> round log / replay payload
- [pending] Update queue status responses so `matched` can point to a battle that is not yet resolved:
  - `status: matched`
  - `battleId`
  - `battleStatus: committed | resolving | resolved`
  - optional `targetRound`
  - optional `estimatedResolveTime`
- [pending] Preserve current queue auth and ownership guarantees; RNG redesign should not weaken the battle admission path.

### Frontend Flow Changes
- [pending] Update `apps/web/src/hooks/useMatchmaking.ts` so after a match it handles two phases:
  - opponent found / commitment visible
  - battle resolved / replay ready
- [pending] Use the existing `matching -> vs_reveal -> fighting -> result` state machine, but insert a pending-resolution wait between match and replay when drand output is not ready yet.
- [pending] Update `apps/web/src/app/pages/BattlePage.tsx` and `apps/web/src/hooks/useBattle.ts` so replay routes can render:
  - pending fairness state
  - resolved replay
  - verification/proof affordance
- [pending] Add a verification surface:
  - lightweight “Verify Battle” link in replay/result views
  - optional dedicated `/verify/:battleId` page later

### drand Integration
- [pending] Implement a dedicated service module, e.g. `apps/api/src/services/drand.ts`, with:
  - Quicknet constants
  - `roundAtTime()`
  - `timeOfRound()`
  - `futureRound()`
  - multi-relay fetch with timeout and retry
  - response normalization
- [pending] Prefer at least two relays (`api.drand.sh`, `drand.cloudflare.com`) and store the returned relay metadata for ops visibility.
- [pending] Treat signature verification as part of the roadmap, not optional hand-waving:
  - either verify via a maintained drand client/library in the backend
  - or, at minimum for first pass, cross-check the same round across independent relays and mark cryptographic signature verification as a required follow-up before calling the system fully institutional-grade

### Rollout Order
- [pending] Phase 1: Add schema/types/drand service without changing live resolution.
- [pending] Phase 2: Land new deterministic engine and proof packet generation behind a feature flag or engine version gate.
- [pending] Phase 3: Switch matchmaking to committed battles with asynchronous drand resolution.
- [pending] Phase 4: Update web polling/replay/proof UI.
- [pending] Phase 5: Backfill tests, recovery tooling, and verifier page.

### Verification Requirements
- [pending] Unit tests:
  - engine determinism
  - commit hash derivation
  - seed derivation
  - queue status transitions for pending/resolved battles
- [pending] Integration tests:
  - match two queue entries
  - battle created in committed state
  - drand round fetched
  - battle resolved and persisted
  - replay/proof endpoints return consistent data
- [pending] Browser/runtime verification:
  - wallet queues
  - matched battle shows pending fairness state
  - replay loads once resolved
  - proof packet can be recomputed client-side

## Security Audit Follow-Through (2026-03-22)
- [completed] Enforce battle-result privacy server-side across killfeed and public battle/proof/replay endpoints instead of relying on frontend hiding.
- [completed] Harden request IP extraction so rate limiting and logs prefer trusted edge headers before `x-forwarded-for`.
- [completed] Redact raw readiness dependency errors by default and only expose internals when `EXPOSE_READINESS_DETAILS=true`.
- [completed] Restrict profile avatars to safe inline image data, sanitize stored avatar reads, and reject arbitrary remote tracking URLs.
- [completed] Narrow public leaderboard wallet lookups to a minimal standing payload instead of returning internal player row fields.
- [completed] Remove unauthenticated player-row writes from the public guns read path and return cooldown state without creating player records.
- [completed] Remove ownership-snapshot persistence from public gun lookups so the public `GET /api/guns/:address` path is read-only from the database perspective.
- [pending] Chat message authentication fix remains intentionally excluded per user instruction.

## Review
- Verified the non-chat security hardening pass with `pnpm --filter @warpath/api test`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- Accepted residual risk: chat posting remains spoofable until the excluded chat-auth fix is implemented.

## 2026-03-22 Battle Overlay Follow-Through
- [completed] Re-center the `FIGHT` stamp in the duel reveal so it sits on the true lane between the left and right gun cards.
- [completed] Remove the animated GIF blocks from the victory and defeat overlays.
- [completed] Clear active backend wallet cooldown timers so battle entry is unblocked again.

## 2026-03-22 Battle Overlay Review
- Tightened the VS duel grid in `apps/web/src/components/battle/battlePresentation.css` so the center slot uses symmetric fighter columns and the `FIGHT` headline stays centered between both weapons.
- Removed the `/assets/victor.gif` and `/assets/dead.gif` usage from the result overlays in `apps/web/src/components/battle/VictorOverlay.tsx` and `apps/web/src/components/battle/DeathOverlay.tsx`.
- Cleared the active `players.cooldown_until` rows in the configured database; verification after the update returned `0` active cooldowns.
- Verified the UI patch with `pnpm --filter @warpath/web test` and `pnpm --filter @warpath/web build`.

## 2026-03-22 Gun Metadata Name Review
- [completed] Replace battle-surface fallback names from the static gun registry with NFT metadata-backed names from the API battle payload.

## 2026-03-22 Gun Metadata Name Summary
- Extended the shared `BattleFighter` contract with a canonical `name` field and populated it from `getGunMetadataByTokenId()` in `apps/api/src/services/battle.ts`.
- Updated `apps/web/src/components/battle/GameOverlay.tsx` and `apps/web/src/components/battle/BattleEngine.tsx` to render `battle.left.name` / `battle.right.name` instead of `GUNS_BY_ID` registry names.
- Added API coverage in `apps/api/src/__tests__/battle.test.ts` to assert metadata-backed fighter names are present on the battle payload.
- Verified with `pnpm --filter @warpath/api test`, `pnpm --filter @warpath/web test`, and `pnpm --filter @warpath/web build`.

## 2026-03-22 France Marker Regression Fix
- [completed] Restore projection-centroid marker placement for the world map and keep the manual marker override scoped to France only.
- [completed] Rebuild and redeploy the web app so the live map no longer uses manual marker coordinates for every country.

## 2026-03-22 France Marker Regression Review
- Narrowed the `apps/web/src/components/map/WorldMap.tsx` marker-coordinate override so only `FR` uses the curated `markerX` / `markerY` position; every other country now renders from the original topo centroid again.
- Verified locally with `pnpm --filter @warpath/web test` and `pnpm --filter @warpath/web build`, then redeployed production with `vercel deploy --prod --yes --force`.

## 2026-03-22 France Dot Anchor Correction
- [completed] Move the France dot to a mainland-France projected coordinate instead of the country-geometry centroid.

## 2026-03-22 France Dot Anchor Review
- Replaced the France marker override in `apps/web/src/components/map/WorldMap.tsx` with `projection([country.longitude, country.latitude])`, so France now anchors from mainland coordinates while the rest of the map still uses centroid-derived dots.
- Verified locally with `pnpm --filter @warpath/web test` and `pnpm --filter @warpath/web build`, then forced another production deploy from the corrected workspace.

## 2026-03-22 Killfeed Outcome Color Fix
- [completed] Change the killfeed `DEFEATED` outcome label from muted text to the red combat token.

## 2026-03-22 Killfeed Outcome Color Review
- Updated `.killfeed-row__outcome` in `apps/web/src/styles/globals.css` from `var(--text-muted)` to `var(--red)` so the feed’s `DEFEATED` label renders in the hostile/combat color.
- Verified locally with `pnpm --filter @warpath/web test` and `pnpm --filter @warpath/web build`, then forced a fresh production deploy from the current workspace.

## 2026-03-22 Canonical Gun Name Correction
- [completed] Replace placeholder NFT metadata names like `#62` with the collection's canonical curated gun names across API payloads and battle/result overlays.
- [completed] Remove the remaining battle overlay fallback path that could prefer stale selected-gun names over the resolved battle payload name.

## 2026-03-22 Canonical Gun Name Review
- Added `packages/shared/src/gunNames.ts` with the canonical 101-gun name registry and made token IDs `1..101` resolve to that exact user-provided list regardless of NFT metadata `name`.
- Updated `apps/api/src/services/guns.ts` to return the strict canonical collection name for each Glock Node token instead of trusting the metadata `name` field.
- Updated `apps/web/src/components/battle/GameOverlay.tsx` so result overlays prefer the resolved battle payload name and only fall back to the selected gun when no battle payload exists.
- Verified with `pnpm --filter @warpath/api test`, `pnpm --filter @warpath/web test`, `pnpm typecheck`, and `pnpm build`.

## 2026-03-22 Live Matchmaking 500 Recovery
- [completed] Diagnose the production `/api/battles/queue` `500` caused by battle-schema drift between deployed code and the live Postgres database.
- [completed] Apply the missing `0005_lively_mandroid.sql` battle lifecycle migration directly to the production database.

## 2026-03-22 Live Matchmaking 500 Review
- Verified that production `queue` already had `status_token`, but `battles` was still missing the drand lifecycle columns (`status`, `commit_hash`, `drand_round`, `engine_version`, `committed_at`, `updated_at`, etc.), which made the live `joinQueue()` insert fail at runtime.
- Applied `apps/api/drizzle/0005_lively_mandroid.sql` against the production Neon database and confirmed `battles` now exposes all 23 expected columns.
- Verified post-fix schema state directly with `psql` against the production database after the migration completed.

## 2026-03-22 RNG-Only Battle Engine
- [completed] Remove all stat-based win weighting from battle resolution.
- [completed] Make battle outcome a pure RNG roll with only a 5-point win-chance edge for wallets holding 3+ guns.
- [completed] Remove stat-driven replay-speed bias so stats are presentation-only on the frontend too.

## 2026-03-22 RNG-Only Battle Engine Review
- Replaced the shared resolver in `packages/shared/src/stats.ts` with a pure RNG battle outcome model: base win chance is `50/50`, one-sided arsenal bonus now shifts that to `55/45`, and battle-round attacks/dodges/crits are fixed-probability rolls that ignore gun stats entirely.
- Versioned the new engine as `v3-drand-rng-only` in `packages/shared/src/constants.ts` so new committed battles are clearly separated from the prior stat-weighted engine semantics.
- Updated the dormant web-side battle helper in `apps/web/src/lib/stats.ts` and removed replay tick-duration scaling from `apps/web/src/components/battle/BattleEngine.tsx` so stats no longer change battle pacing or future fallback simulation behavior.
- Added shared coverage proving deterministic replay for the same seed, stats-independence for outcomes, and the arsenal bonus distribution shift; verified with `pnpm --filter @warpath/shared test`, `pnpm --filter @warpath/api test`, `pnpm typecheck`, and `pnpm build`.

## 2026-03-23 RNG Bonus Rebalance Review
- Reduced `BATTLE_CONFIG.ARSENAL_WIN_CHANCE_BONUS` in `packages/shared/src/constants.ts` from `0.1` to `0.05`, which changes the one-sided arsenal edge from `60/40` to `55/45` while keeping the same RNG-only battle engine and proof model.
- Updated the shared statistical assertions in `packages/shared/src/__tests__/stats.test.ts`, the dormant web-side compatibility shim in `apps/web/src/lib/stats.ts`, and the selector copy in `apps/web/src/components/wallet/GunSelector.tsx` so both fallback logic and user-facing bonus language match the new 5% edge.

## 2026-03-23 Enter Battle Audio Review
- Copied the provided local file `Sounds/Enterbattle.mp3` into `apps/web/public/assets/Enterbattle.mp3` so the sound is bundled as a first-party static asset in production.
- Updated `apps/web/src/components/battle/GameOverlay.tsx` to preload that asset into an `Audio` instance on mount and replay it whenever the `Enter Battle` button is clicked, while swallowing autoplay promise failures so queueing still proceeds if the browser blocks audio for any reason.

## 2026-03-23 Matching Audio Review
- Copied the provided local file `Sounds/Loading.mp3` into `apps/web/public/assets/Loading.mp3` so the matchmaking sound ships as a first-party production asset.
- Updated `apps/web/src/components/battle/MatchingPulse.tsx` to create an `Audio('/assets/Loading.mp3')` instance on mount, loop it for the lifetime of the matching overlay, and stop/reset it on unmount so the sound is scoped strictly to the active matchmaking phase.

## 2026-03-23 Battle Audio Review
- Copied the provided local file `Sounds/Battle.mp3` into `apps/web/public/assets/Battle.mp3` so the combat sound ships as a first-party production asset.
- Updated `apps/web/src/components/battle/BattleEngine.tsx` to create an `Audio('/assets/Battle.mp3')` instance on mount, loop it for the lifetime of the fighting phase, and stop/reset it on unmount so the sound only plays during active combat playback.

## 2026-03-23 Mobile Battle Loop Audio Review
- Extended `apps/web/src/lib/battleAudio.ts` so the shared unlocked audio pool also owns the `battle` cue and supports loop-aware playback options.
- Updated `apps/web/src/components/battle/BattleEngine.tsx` to stop creating a fresh `Audio('/assets/Battle.mp3')` instance on mount and instead reuse the gesture-primed shared pool with looped playback for the active fight phase, then stop/reset that cue on teardown.

## 2026-03-23 Global Ambient Website Audio Review
- Copied the provided local file `Sounds/website.mp3` into `apps/web/public/assets/Website.mp3` so the ambient website track ships as a first-party production asset on a stable public path.
- Added a singleton website-audio controller in `apps/web/src/lib/siteAudio.ts` and mounted `apps/web/src/components/app/AmbientAudio.tsx` from `apps/web/src/app/App.tsx` so the track loops at `0.05` volume across the whole SPA, attempts immediate desktop playback, and falls back to the first user gesture on mobile-style autoplay-restricted browsers.

## 2026-03-23 Map Interaction Audio Review
- Copied the provided local files `Sounds/maphover.mp3` and `Sounds/mapselection.mp3` into `apps/web/public/assets/` so both map cues ship as first-party production assets.
- Added `apps/web/src/lib/mapAudio.ts` as a small shared map-audio pool with explicit `0.15` volume and one-shot playback.
- Updated `apps/web/src/components/map/WorldMap.tsx` so entering a new country hover target plays `maphover.mp3`, while selecting a country by click or keyboard activation plays `mapselection.mp3`.
