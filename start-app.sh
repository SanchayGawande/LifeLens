#!/bin/bash

echo "🚀 Starting LifeLens App with Nudge Engine..."

# Function to check if a port is in use
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
}

# Function to start backend
start_backend() {
    echo "📡 Starting Backend API..."
    cd backend
    if check_port 3000; then
        echo "✅ Backend already running on port 3000"
    else
        npm run dev &
        echo "✅ Backend started on port 3000"
    fi
    cd ..
}

# Function to start sentiment service
start_sentiment() {
    echo "🧠 Starting Sentiment Service..."
    cd services/sentiment
    if check_port 8000; then
        echo "✅ Sentiment service already running on port 8000"
    else
        source venv/bin/activate && python -m uvicorn app.main:app --reload --port 8000 &
        echo "✅ Sentiment service started on port 8000"
    fi
    cd ../..
}

# Function to start frontend
start_frontend() {
    echo "📱 Starting Frontend..."
    cd frontend
    
    # Set environment variables to prevent file watching issues
    export WATCHMAN_DISABLE=1
    export CHOKIDAR_USEPOLLING=false
    export CI=true
    
    # Increase file limits
    ulimit -n 65536
    
    echo "🌐 Starting Expo..."
    echo "📱 For mobile: Install Expo Go app and scan QR code"
    echo "💻 For web: Open http://localhost:19006"
    
    npx expo start --web
}

# Main execution
echo "🔧 Setting up LifeLens environment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the LifeLens root directory"
    exit 1
fi

# Start services
start_backend
sleep 2
start_sentiment
sleep 2
start_frontend

echo "🎉 All services started! Check the QR code above for mobile access."