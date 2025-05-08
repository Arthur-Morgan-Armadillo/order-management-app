#!/bin/sh

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Seeding database..."
npx prisma db seed

echo "Starting app..."
exec node dist/src/main.js