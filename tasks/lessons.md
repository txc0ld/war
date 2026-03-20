# Lessons

- 2026-03-19: This workspace snapshot has no `.git` directory, so commit-based execution steps must be marked blocked and work tracked in `tasks/todo.md` instead.
- 2026-03-19: When adding Vitest to a Vite 5 workspace, pin a Vite-5-compatible Vitest major instead of taking the latest release line by default.
- 2026-03-19: If demo mode is supposed to bypass a provider stack, do not leave live provider/config initialization at module scope; guard the side effect itself, not just the rendered branch.
- 2026-03-19: A full-screen routed content wrapper above an interactive background will silently steal all map clicks; keep the shell overlay `pointer-events-none` and opt interactive panels back in with `pointer-events-auto`.
- 2026-03-19: TypeScript composite builds can treat a project as up to date if `tsconfig.tsbuildinfo` exists even when `dist/` has been deleted; for publishable workspace packages, force clean-emitting build scripts or validate by deleting build output before deployment.
- 2026-03-20: Battle presentation primitives under `apps/web/src/components/battle` are consumed outside the battle overlay; before tightening prop unions or replacing APIs, inspect every consumer and keep compatibility shims where needed.
- 2026-03-20: For frontend data-only work in this repo, check `apps/web/src/data` before assuming `apps/web/src/lib` is the source of truth; `lib` can contain stale compatibility shims while live registry/config data has moved into `data`.
- 2026-03-20: For interactive SVG maps, stroke-only paths and overlay markers can silently make countries unclickable; give regions a transparent fill hit area and disable pointer events on decorative markers before calling the interaction done.
- 2026-03-20: After deleting and recreating asset-side CSS files during a large frontend rewrite, always rerun workspace build immediately and confirm the file still exists on disk before moving on; import paths can silently drift during concurrent edits.
