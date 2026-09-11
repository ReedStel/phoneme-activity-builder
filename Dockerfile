# syntax=docker/dockerfile:1
#
# Multi-stage build for the Phoneme Activity Builder, following the official
# Next.js Docker example: install dependencies, build, then copy only what
# is needed into a small runtime image.
#
#   docker build -t phoneme-activity-builder .
#   docker run -p 3000:3000 -v phoneme-data:/app/data phoneme-activity-builder
#
# or simply: docker compose up --build

ARG NODE_VERSION=22-alpine

# ---------- 1. Dependencies ----------
FROM node:${NODE_VERSION} AS deps
# libc6-compat helps native modules on Alpine; Prisma needs OpenSSL.
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
# npm ci runs "prisma generate" (postinstall), which needs the schema.
COPY prisma ./prisma
RUN npm ci

# ---------- 2. Build ----------
FROM node:${NODE_VERSION} AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Build the standalone Next.js server and bundle the seed script.
RUN npx prisma generate \
 && npm run build \
 && npm run build:seed

# ---------- 3. Runtime ----------
FROM node:${NODE_VERSION} AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    CHECKPOINT_DISABLE=1 \
    PRISMA_HIDE_UPDATE_MESSAGE=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_URL=file:/app/data/app.db

# The Prisma CLI applies migrations when the container starts.
RUN npm install -g prisma@6.19.3 && npm cache clean --force

# Run as an unprivileged user rather than root.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
# Make sure the Prisma client and its Linux query engine are present.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/dist/seed.cjs ./dist/seed.cjs
COPY docker-entrypoint.sh ./

# The SQLite database lives in /app/data, which is kept in a volume.
RUN sed -i 's/\r$//' docker-entrypoint.sh \
 && chmod +x docker-entrypoint.sh \
 && mkdir -p /app/data \
 && chown -R nextjs:nodejs /app/data

USER nextjs
EXPOSE 3000
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health > /dev/null || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
