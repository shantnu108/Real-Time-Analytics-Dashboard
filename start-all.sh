#!/usr/bin/env bash

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Checking Docker status..."

# Check if Docker daemon is running
if ! docker ps >/dev/null 2>&1; then
  echo ""
  echo "❌ Docker is NOT running."
  echo "Start Docker Desktop (macOS) or Docker service (Linux) first."
  echo "Then run this script again."
  echo ""
  exit 1
fi

echo "✅ Docker is running."

# Start containers
echo "Starting services..."
(cd "$PROJECT_ROOT" && docker-compose up --build &)

sleep 10

# Start load generator if exists
LOADGEN="$PROJECT_ROOT/loadgen"

if [ -d "$LOADGEN" ]; then
  echo "Starting load generator..."
  (cd "$LOADGEN" && node load.js &)
fi

sleep 5

# Open URLs
if command -v xdg-open >/dev/null; then
  xdg-open http://localhost:4000/health
  xdg-open http://localhost:3000/
elif command -v open >/dev/null; then
  open http://localhost:4000/health
  open http://localhost:3000/
fi
