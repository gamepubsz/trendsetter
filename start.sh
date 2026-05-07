#!/bin/bash
# Quick start script for local development
set -e

echo "=== YouTube Channel Manager ==="

# Check .env
if [ ! -f backend/.env ]; then
  echo "Creating backend/.env from example..."
  cp backend/.env.example backend/.env
  echo ">>> Edit backend/.env with your API keys before continuing <<<"
  exit 1
fi

# Backend
echo ""
echo "[1/2] Starting backend (FastAPI)..."
cd backend
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt -q
else
  source .venv/bin/activate
fi
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Frontend
echo "[2/2] Starting frontend (Vite)..."
cd frontend
if [ ! -d "node_modules" ]; then
  npm install -q
fi
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
