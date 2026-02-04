# ========================================
# Stage 1: Dependencies
# ========================================
FROM node:20-alpine AS deps
WORKDIR /app

# Copy workspace configuration
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY apps/club/package.json ./apps/club/

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

# Copy club app
COPY apps/club ./apps/club

# Set environment variables
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Build shared package first
WORKDIR /app/shared
RUN npm run build || true

# Build club app
WORKDIR /app/apps/club
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
COPY --from=builder /app/apps/club/public ./public

# Create .next directory with correct permissions
RUN mkdir .next && chown nextjs:nodejs .next

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/apps/club/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/club/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "apps/club/server.js"]
