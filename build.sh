#\!/usr/bin/env bash
set -e

# Install Python dependencies
cd backend
pip install -r requirements.txt

# Build React frontend
cd ../frontend
npm install
npm run build

echo "Build complete\!"
