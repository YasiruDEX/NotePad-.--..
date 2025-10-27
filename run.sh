#!/bin/bash

# NotePad .- .. - Startup Script
# This script installs dependencies and starts the application

echo "🚀 Starting NotePad..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo ""
fi

echo "▶️  Starting the application..."
npm start
