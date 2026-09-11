#!/bin/sh
# Container start-up: apply any pending database migrations, seed a brand-new
# database with the course word lists, then start the Next.js server.
set -e

echo "Applying database migrations..."
prisma migrate deploy --schema ./prisma/schema.prisma

echo "Seeding the database if it is empty..."
node dist/seed.cjs --if-empty

echo "Starting the Phoneme Activity Builder on port ${PORT:-3000}"
exec "$@"
