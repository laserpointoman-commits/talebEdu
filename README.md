# TalebEdu - School Management System

A comprehensive school management platform built with React, TypeScript, Tailwind CSS, and Capacitor for iOS and Android.

## Project Info

**Lovable Project URL**: https://lovable.dev/projects/b9b768f5-1a7c-4563-ab9c-d1b25b963f4b

## Features

- 📱 **Native Mobile Apps** - iOS and Android support via Capacitor
- 🏫 **Multi-Role System** - Admin, Teacher, Parent, Student, Driver dashboards
- 📊 **Finance Management** - Fee tracking, payments, installments
- 🚌 **Bus Tracking** - Real-time GPS tracking for school buses
- 🍽️ **Canteen Management** - Digital ordering and payment system
- 💳 **Digital Wallet** - Student wallets for payments
- 📝 **Attendance** - NFC-based attendance tracking
- 📚 **Grades & Exams** - Academic performance tracking
- 💬 **Messaging** - Internal communication system
- 🔔 **Push Notifications** - Real-time alerts for parents and staff
- 🌐 **Bilingual** - Arabic and English language support

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: Tailwind CSS, Shadcn/ui, Framer Motion
- **Mobile**: Capacitor 7 (iOS & Android)
- **Backend**: Supabase (via Lovable Cloud)
- **State Management**: TanStack Query, React Context
- **Maps**: Mapbox GL
- **Forms**: React Hook Form, Zod validation

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- For iOS: macOS with Xcode 15+, CocoaPods
- For Android: Android Studio, JDK 17+

### Web Development

```bash
# Clone repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

### Mobile Development

**📖 See [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) for complete iOS and Android setup.**

Quick commands:

```bash
# Verify setup
node verify-setup.js

# Build web assets
npm run build

# Sync to native projects
npx cap sync

# Open iOS (macOS only)
npx cap open ios

# Open Android
npx cap open android
```

## NFC Functionality

TalebEdu uses custom native NFC implementation:
- **iOS**: CoreNFC plugin (`ios/App/App/NFCPlugin.swift`)
- **Android**: Native Android NFC APIs
- **Requirements**: Physical device with NFC (iPhone 7+ or NFC-enabled Android)

## Documentation

- **[BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md)** - Complete iOS/Android build guide
- **[verify-setup.js](verify-setup.js)** - Setup verification script
- **[QUICK_START.sh](QUICK_START.sh)** - Automated setup (macOS/Linux)

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
node verify-setup.js # Verify project setup
```

## Project Structure

```
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── services/       # Services (NFC, notifications, etc.)
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom hooks
│   └── integrations/   # Supabase integration
├── ios/
│   └── App/            # iOS native project
│       └── App/
│           ├── NFCPlugin.swift      # Custom NFC plugin
│           ├── AppDelegate.swift
│           ├── Info.plist
│           └── App.entitlements
├── android/
│   └── app/            # Android native project
├── supabase/           # Supabase configuration
└── public/             # Static assets
```

## Deployment

### Web
Simply open [Lovable](https://lovable.dev/projects/b9b768f5-1a7c-4563-ab9c-d1b25b963f4b) and click Share → Publish.

### Mobile App Stores
- **iOS**: Archive in Xcode → Upload to App Store Connect
- **Android**: Generate signed AAB → Upload to Google Play Console

See [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) for production build steps.

## Troubleshooting

### Common Issues

**iOS Build Errors:**
```bash
cd ios/App
pod deintegrate
rm -rf Pods Podfile.lock
pod install --repo-update
cd ../..
npx cap sync ios
```

**Android Build Errors:**
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

**NFC Not Working:**
- iOS: Manually add NFCPlugin.swift to Xcode project
- iOS: Enable "Near Field Communication Tag Reading" capability
- Test on physical device (simulators don't support NFC)

See [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) for detailed troubleshooting.

## Editing This Project

**Use Lovable:**
Visit the [Lovable Project](https://lovable.dev/projects/b9b768f5-1a7c-4563-ab9c-d1b25b963f4b) and start prompting. Changes are committed automatically.

**Use Your IDE:**
Clone this repo and push changes. Pushed changes reflect in Lovable.

**GitHub Codespaces:**
Click "Code" → "Codespaces" → "New codespace" to edit in the browser.

## Custom Domain

To connect a custom domain, navigate to Project > Settings > Domains in Lovable.

Read more: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## License

Proprietary - TalebEdu School Management System

---

Built with ❤️ using [Lovable](https://lovable.dev)
