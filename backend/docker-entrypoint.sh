#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "Waiting for the database to be ready..."
node wait-for-db.js

echo "Syncing Prisma database schema..."
npx prisma db push --accept-data-loss

echo "Running seed script..."
npx prisma db seed

echo "Starting the application..."
exec npm start
