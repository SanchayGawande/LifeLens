#!/bin/bash

echo "🌐 Starting LifeLens Web App (Stable Version)..."

# Kill any existing processes on ports
echo "🧹 Cleaning up existing processes..."
pkill -f "expo" || true
pkill -f "webpack" || true

# Set environment for stable web development
export NODE_ENV=development
export WATCHMAN_DISABLE=1
export CHOKIDAR_USEPOLLING=false
export CI=true
export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

# Increase limits
ulimit -n 65536

echo "📦 Building web version..."
npx expo export:web --dev

echo "🚀 Starting web server..."
echo "✅ Your app will be available at: http://localhost:8000"
echo "🎯 Test the Nudge Engine by going to 'Decide Now' tab"

cd web-build && python3 -m http.server 8000