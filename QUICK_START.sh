#!/bin/bash

echo "======================================"
echo "TalebEdu - Quick Start Setup"
echo "======================================"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ npm found"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ npm install failed"
    exit 1
fi

echo "✅ Dependencies installed"

# Build web assets
echo ""
echo "🔨 Building web assets..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Web assets built"

# Sync Capacitor
echo ""
echo "🔄 Syncing Capacitor..."
npx cap sync

if [ $? -ne 0 ]; then
    echo "❌ Capacitor sync failed"
    exit 1
fi

echo "✅ Capacitor synced"

# Check platform
echo ""
echo "======================================"
echo "Setup Complete! 🎉"
echo "======================================"
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "📱 iOS Setup:"
    echo "   1. cd ios/App"
    echo "   2. pod install --repo-update"
    echo "   3. cd ../.."
    echo "   4. npx cap open ios"
    echo "   5. In Xcode: Add NFCPlugin.swift to project"
    echo "   6. Build and Run"
    echo ""
fi

echo "🤖 Android Setup:"
echo "   1. npx cap open android"
echo "   2. Let Gradle sync"
echo "   3. Build and Run"
echo ""
echo "📖 See BUILD_INSTRUCTIONS.md for detailed steps"
