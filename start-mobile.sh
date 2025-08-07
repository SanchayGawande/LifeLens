#!/bin/bash

echo "🚀 Starting LifeLens for Mobile Development"

# Get local IP address
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
echo "📡 Local IP: $LOCAL_IP"

# Update frontend .env with local IP for mobile access
cd "/Users/sanchay/AI project/LifeLens/frontend"
cp .env .env.backup
sed "s/localhost/$LOCAL_IP/g" .env.backup > .env
echo "✅ Updated API URL for mobile access"

# Start backend if not running
echo "🔧 Starting backend..."
cd "/Users/sanchay/AI project/LifeLens/backend"
if ! pgrep -f "nodemon" > /dev/null; then
    npm run dev &
    echo "✅ Backend started"
else
    echo "✅ Backend already running"
fi

# Start sentiment service if not running
echo "🧠 Starting sentiment service..."
cd "/Users/sanchay/AI project/LifeLens/services/sentiment"
if ! pgrep -f "uvicorn" > /dev/null; then
    source venv/bin/activate && python -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0 &
    echo "✅ Sentiment service started"
else
    echo "✅ Sentiment service already running"
fi

# Wait for services to start
sleep 3

# Start frontend
echo "📱 Starting Expo..."
cd "/Users/sanchay/AI project/LifeLens/frontend"
echo "🎯 Scan the QR code with Expo Go app on your phone"
echo "📡 Make sure your phone is on the same WiFi network"

npx expo start --host tunnel