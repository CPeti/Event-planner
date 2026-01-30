#!/bin/bash
set -e

echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Installing backend dependencies..."
cd backend
pip install -r requirements.txt
cd ..

echo "Starting backend..."
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
