# GuinéaManager ERP - Production Dockerfile
# Multi-stage build for optimized production deployment

# ==================== STAGE 1: Dependencies ====================
FROM node:20-alpine AS deps

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat openssl curl sqlite python3 make g++

# Copy package files
COPY package.json bun.lock* ./
COPY backend/package.json ./backend/

# Install frontend dependencies
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Install backend dependencies
WORKDIR /app/backend
RUN npm install --legacy-peer-deps --no-audit --no-fund

# ==================== STAGE 2: Builder ====================
FROM node:20-alpine AS builder

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat openssl sqlite

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules

# Copy source files
COPY package.json bun.lock* ./
COPY next.config.ts tsconfig.json tailwind.config.ts postcss.config.mjs components.json ./
COPY src ./src
COPY public ./public
COPY backend ./backend

# Build backend
WORKDIR /app/backend
ENV DATABASE_URL="file:/app/data/build.db"
RUN npx prisma generate && \
    npx tsc --skipLibCheck && \
    rm -f /app/data/build.db 2>/dev/null || true

# Verify backend build
RUN ls -la dist/ && test -f dist/index.js

# Build frontend
WORKDIR /app
ENV NEXT_PUBLIC_API_URL=/api
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ==================== STAGE 3: Runner ====================
FROM node:20-alpine AS runner

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache libc6-compat openssl curl sqlite

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh && \
    chown nextjs:nodejs /docker-entrypoint.sh

# Copy built files from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/backend/package.json ./backend/

# Create data and uploads directories
RUN mkdir -p /app/data /app/uploads && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Environment variables
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=/api
ENV BACKEND_URL=http://localhost:3001
ENV DATABASE_URL=file:/app/data/prod.db
ENV JWT_SECRET=guineamanager-production-jwt-secret-change-me
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
ENTRYPOINT ["/docker-entrypoint.sh"]
