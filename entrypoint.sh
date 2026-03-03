#!/bin/sh
set -e

echo "Running npm install..."
npm install

echo "Starting Vite server..."
exec "$@"
