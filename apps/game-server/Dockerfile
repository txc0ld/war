# apps/game-server/Dockerfile
# Build context must be the repo root (the monorepo workspace).
# Deploy with:
#   flyctl deploy --config apps/game-server/fly.toml --dockerfile apps/game-server/Dockerfile
# (run from the repo root)

FROM oven/bun:1.1 AS base
WORKDIR /app

# pnpm runs on Node.js — install Node 20 (from NodeSource) + pnpm into the Bun image.
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl ca-certificates && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/* && \
    npm install -g pnpm@9

# Copy workspace manifests first for better Docker layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/game-server/package.json apps/game-server/package.json

# Install only the deps required for the game server and its workspace deps
RUN pnpm install --frozen-lockfile --filter @warpath/game-server...

# Copy source for shared and game-server
COPY packages/shared packages/shared
COPY apps/game-server apps/game-server

# Build the shared package (game-server imports from @warpath/shared/dist)
RUN pnpm --filter @warpath/shared build

# Default port (Fly will set PORT via env)
ENV PORT=3002
EXPOSE 3002

WORKDIR /app/apps/game-server
CMD ["bun", "src/index.ts"]
