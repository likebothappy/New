#!/bin/bash

# Telegram Referral Bot Deployment Script
# This script helps deploy the bot to various platforms

echo "🚀 Telegram Referral Bot Deployment Script"
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating template..."
    cat > .env << EOL
# Telegram Bot Configuration
BOT_TOKEN=your_bot_token_here
BOT_USERNAME=your_bot_username

# YouTube Channel Configuration
YOUTUBE_CHANNEL_URL=https://youtube.com/@error_amn?si=BJ8yvX6cedErf8QZ
YOUTUBE_CHANNEL_ID=@error_amn

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/telegram-referral-bot

# Admin Panel Configuration
ADMIN_USERNAME=youbtech
ADMIN_PASSWORD=youbtech
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-super-secret-session-key

# Server Configuration
PORT=3000
NODE_ENV=production

# Referral Configuration
REFERRAL_REWARD=5
MIN_WITHDRAWAL_AMOUNT=100

# Bot Configuration
BOT_URL=https://t.me/your_bot_username
EOL
    echo "📝 Please edit the .env file with your actual configuration"
    echo "❌ Deployment stopped. Configure .env file first."
    exit 1
fi

echo "✅ Environment configuration found"

# Create data directory for JSON storage fallback
mkdir -p data

# Test the application
echo "🧪 Testing application..."
timeout 10s npm start &
TEST_PID=$!

sleep 5

# Check if the server is running
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Application test successful"
    kill $TEST_PID 2>/dev/null
else
    echo "❌ Application test failed"
    kill $TEST_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎉 Deployment preparation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your .env file with actual values"
echo "2. Set up MongoDB database (or use JSON fallback)"
echo "3. Deploy to your preferred platform:"
echo ""
echo "   🌐 Render.com:"
echo "   - Push code to GitHub"
echo "   - Connect repository to Render"
echo "   - Set environment variables"
echo "   - Deploy"
echo ""
echo "   🖥️  Local:"
echo "   - npm start"
echo ""
echo "   🐳 Docker:"
echo "   - docker build -t telegram-bot ."
echo "   - docker run -p 3000:3000 telegram-bot"
echo ""
echo "📱 Bot URL: https://t.me/Referneww_bot"
echo "🔧 Admin Panel: http://your-domain.com/admin"
echo ""
echo "🆘 Support: @youbtech"
echo ""
echo "✨ Powered by You B Tech"

