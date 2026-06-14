#!/bin/bash

# Exit on absolute failures of crucial commands
set -e

# Clear screen for a neat output if TERM is set
if [ -n "$TERM" ] && [ "$TERM" != "dumb" ]; then
  clear
fi

echo "================================================================="
echo "  🚀 PATHLAB LOCAL DEVELOPMENT RUNNER"
echo "================================================================="
echo ""

# 1. Start or Connect to MySQL Database
echo "📦 Step 1: Connecting to MySQL database..."

USE_LOCAL_DB=false

# Check if port 3306 is open on localhost
if nc -z localhost 3306 >/dev/null 2>&1; then
  echo "✓ Found a running MySQL database server locally on port 3306."
  USE_LOCAL_DB=true
else
  echo "⚠️ Port 3306 is not open. Checking Docker..."
  if command -v docker &> /dev/null && docker info >/dev/null 2>&1; then
    # Stop running frontend and backend containers to avoid port collision
    echo "🛑 Freeing up ports (3000, 5001) by stopping any running dockerized app containers..."
    docker compose stop backend frontend 2>/dev/null || true
    
    echo "📦 Starting MySQL database container in Docker..."
    docker compose up -d db
    
    echo "⏳ Waiting for database container to become healthy..."
    docker compose exec -T db mysqladmin ping -h localhost -u root -prootpassword --silent || true
    echo "✅ Docker MySQL database is active and listening on port 3306."
  else
    echo "❌ Error: Docker is not running, and no local MySQL server was detected on port 3306."
    echo "To run this application fully locally without Docker, please install and set up MySQL."
    echo "👉 You can do this automatically by running: ./install-local-db.sh"
    exit 1
  fi
fi
echo ""

# 2. Check and install backend dependencies
echo "📂 Step 2: Checking backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
  echo "📦 Installing backend node_modules..."
  npm install
else
  echo "✓ Backend node_modules already installed."
fi
cd ..
echo ""

# 3. Check and install frontend dependencies
echo "📂 Step 3: Checking frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
  echo "📦 Installing frontend node_modules..."
  npm install
else
  echo "✓ Frontend node_modules already installed."
fi
cd ..
echo ""

# 4. Start backend and frontend servers in parallel
echo "🔥 Step 4: Starting Backend and Frontend dev servers..."
echo "-----------------------------------------------------------------"
echo "💡 Tip: Press Ctrl+C to stop both servers and exit."
echo "-----------------------------------------------------------------"
echo ""

# Function to clean up background processes on exit
cleanup() {
  echo -e "\n\n🛑 Stopping dev servers..."
  # Kill the child processes gracefully
  if [ -n "$BACKEND_PID" ]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [ -n "$FRONTEND_PID" ]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  echo "👋 Done! Local servers stopped."
  exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

# Start Backend in background
echo "📡 Starting Express API backend..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Start Frontend in background
echo "💻 Starting Next.js frontend dev server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Keep the shell script alive and wait for background jobs
wait $BACKEND_PID $FRONTEND_PID
