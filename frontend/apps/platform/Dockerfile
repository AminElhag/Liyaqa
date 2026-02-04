# ========================================
# Stage 1: Dependencies
# ========================================
FROM node:20-alpine AS deps
WORKDIR /app

# Copy workspace configuration
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY apps/platform/package.json ./apps/platform/

# Install dependencies
RUN npm ci

# ========================================
# Stage 2: Builder
# ========================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./

# Copy shared package
COPY shared ./shared

# Copy platform app
COPY apps/platform ./apps/platform

# Set environment variables
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=1536"

# Build shared package first
WORKDIR /app/shared
RUN npm run build || true

# Build platform app
WORKDIR /app/apps/platform
RUN npm run build

# ========================================
# Stage 3: Runner
# ========================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/apps/platform/public ./public

# Create .next directory with correct permissions
RUN mkdir .next && chown nextjs:nodejs .next

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/apps/platform/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/platform/.next/static ./.next/static

USER nextjs

EXPOSE 3001
ENV PORT=3001

CMD ["node", "apps/platform/server.js"]
