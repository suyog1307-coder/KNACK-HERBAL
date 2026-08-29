# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/constants/package.json    ./packages/constants/
COPY packages/config/package.json       ./packages/config/
COPY packages/permissions/package.json  ./packages/permissions/
COPY packages/utils/package.json        ./packages/utils/
COPY packages/validation/package.json   ./packages/validation/
COPY packages/logger/package.json       ./packages/logger/
COPY apps/backend/package.json          ./apps/backend/

# Install all deps (including devDependencies needed for build)
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared-types/src ./packages/shared-types/src
COPY packages/constants/src    ./packages/constants/src
COPY packages/config/src       ./packages/config/src
COPY packages/permissions/src  ./packages/permissions/src
COPY packages/utils/src        ./packages/utils/src
COPY packages/validation/src   ./packages/validation/src
COPY packages/logger/src       ./packages/logger/src
COPY apps/backend              ./apps/backend

# Generate Prisma client then build NestJS
RUN pnpm --filter backend exec prisma generate
RUN pnpm --filter backend run build

# ─── Stage 2: Production image ────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace manifests (production install)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/constants/package.json    ./packages/constants/
COPY packages/config/package.json       ./packages/config/
COPY packages/permissions/package.json  ./packages/permissions/
COPY packages/utils/package.json        ./packages/utils/
COPY packages/validation/package.json   ./packages/validation/
COPY packages/logger/package.json       ./packages/logger/
COPY apps/backend/package.json          ./apps/backend/

# Production-only deps
RUN pnpm install --frozen-lockfile --prod

# Copy built output and Prisma client from builder
COPY --from=builder /app/apps/backend/dist            ./apps/backend/dist
COPY --from=builder /app/apps/backend/node_modules/.prisma ./apps/backend/node_modules/.prisma
COPY --from=builder /app/apps/backend/prisma          ./apps/backend/prisma

# Expose and run
WORKDIR /app/apps/backend
EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "dist/main"]
