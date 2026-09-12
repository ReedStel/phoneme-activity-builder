#!/bin/sh
# Runs every time the container starts (the same idea as the Workshop 7 lab):
# apply the database migrations, seed a brand-new database, then start Next.js.
set -e

echo "Applying database migrations..."
npx prisma migrate deploy

echo "Seeding the database if it is empty..."
node dist/seed.cjs --if-empty

echo "Starting the Phoneme Activity Builder..."
exec npm start
