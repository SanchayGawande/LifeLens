#!/bin/bash

echo "🚀 Starting LifeLens - Clean Startup"

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "✅ Port 3000 clear"
lsof -ti:8000 | xargs kill -9 2>/dev/null || echo "✅ Port 8000 clear"
lsof -ti:8081 | xargs kill -9 2>/dev/null || echo "✅ Port 8081 clear"
pkill -f expo 2>/dev/null || echo "✅ Expo processes cleared"

# Get local IP
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
echo "📡 Local IP: $LOCAL_IP"

# Update frontend .env
echo "🔧 Updating frontend configuration..."
cd "/Users/sanchay/AI project/LifeLens/frontend"
sed "s/localhost/$LOCAL_IP/g" .env > .env.tmp && mv .env.tmp .env
echo "✅ API URL updated for mobile access"

# Start backend
echo "🔧 Starting backend server..."
cd "/Users/sanchay/AI project/LifeLens/backend"
npm run dev &
BACKEND_PID=$!
sleep 3

# Start sentiment service
echo "🧠 Starting sentiment service..."
cd "/Users/sanchay/AI project/LifeLens/services/sentiment"
source venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0 &
SENTIMENT_PID=$!
sleep 3

# Start frontend
echo "📱 Starting Expo frontend..."
cd "/Users/sanchay/AI project/LifeLens/frontend"
echo ""
echo "🎯 SCAN THE QR CODE BELOW WITH EXPO GO APP"
echo "📱 Download 'Expo Go' from App Store/Google Play"
echo "📡 Make sure your phone is on the same WiFi network"
echo ""

npx expo start --lan --clear

# Cleanup on exit
trap 'echo "🛑 Stopping services..."; kill $BACKEND_PID $SENTIMENT_PID 2>/dev/null; exit' INT TERM