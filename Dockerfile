# Dockerfile for the Phoneme Activity Builder.
#
# It follows the Workshop 6 lab pattern: a build stage and a production stage,
# both on node:lts-alpine, with tini as the entrypoint and npm start to run
# Next.js. The database steps follow the Workshop 7 lab: prisma generate at
# build time, and entrypoint.sh applies the migrations when the container
# starts.
#
#   docker compose up --build
#
# or without Compose:
#   docker build -t phoneme-activity-builder .
#   docker run -p 3000:3000 -v phoneme-data:/app/data phoneme-activity-builder

# -------- Stage 1: Build --------
FROM node:lts-alpine AS builder
# Prisma needs OpenSSL to choose the right database engine on Alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
# Installing runs "prisma generate" afterwards, which needs the schema
COPY prisma ./prisma
# npm ci installs the exact versions in package-lock.json, so every build
# gets the same packages
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
# Bundle the seed script into one file so the container can seed the database
RUN npm run build:seed

# -------- Stage 2: Production --------
FROM node:lts-alpine
# Install tini for proper signal handling, and OpenSSL for Prisma
RUN apk add --no-cache tini openssl
ENV NODE_ENV=production
# The SQLite database file lives in /app/data, which is kept in a volume
ENV DATABASE_URL=file:/app/data/app.db
WORKDIR /app

# Copy only the output we need
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
# Prisma schema and migrations, and the bundled seed script
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# Start-up script (Workshop 7 pattern). sed strips Windows line endings so it
# still runs when the project was checked out on Windows.
COPY entrypoint.sh ./
RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

VOLUME /app/data

# Docker marks the container healthy while /health returns 200 OK
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health > /dev/null || exit 1

# Use tini as entrypoint
ENTRYPOINT ["/sbin/tini", "--"]

# Expose Next.js port
EXPOSE 3000

# Apply migrations, seed an empty database, then npm start
CMD ["/bin/sh", "/app/entrypoint.sh"]
