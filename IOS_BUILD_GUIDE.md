# iOS Build Guide - TalebEdu Native App

## Prerequisites
- macOS with Xcode 15+ installed
- Apple Developer Account
- CocoaPods installed: `sudo gem install cocoapods`
- Node.js 18+ and npm

## Step 1: Clone and Setup

```bash
# Clone your repository
git clone <your-repo-url>
cd <project-folder>

# Install dependencies
npm install --legacy-peer-deps

# Build the web assets
npm run build
```

## Step 2: iOS Platform Setup

```bash
# Add iOS platform (if not already added)
npx cap add ios

# Sync web assets to iOS
npx cap sync ios

# Install iOS dependencies
cd ios/App
pod install --repo-update
cd ../..
```

## Step 3: Open in Xcode

```bash
npx cap open ios
```

## Step 4: Configure in Xcode

### 4.1 General Settings
1. Select "App" target in left sidebar
2. Go to "Signing & Capabilities" tab
3. **Bundle Identifier**: `com.talebedu.app` (or your custom one)
4. **Team**: Select your Apple Developer team
5. **Provisioning Profile**: Automatic signing recommended

### 4.2 Enable NFC Capability
1. Stay in "Signing & Capabilities" tab
2. Click "+ Capability" button
3. Add "Near Field Communication Tag Reading"
4. The `App.entitlements` file is already configured

### 4.3 Version & Build
1. Go to "General" tab
2. **Version**: 1.0.0
3. **Build**: 1
4. **Deployment Target**: iOS 16.0 or later

### 4.4 App Icons
1. In Project Navigator, select `Assets.xcassets`
2. Select `AppIcon`
3. Drag your app icon images (you can use https://www.appicon.co to generate all sizes)

## Step 5: Test on Real Device

### Connect iPhone
1. Connect your iPhone via USB
2. Trust the computer on your iPhone if prompted
3. In Xcode, select your iPhone from the device dropdown (top toolbar)

### Build and Run
1. Click the Play button (▶️) in Xcode, or press `Cmd + R`
2. Wait for build to complete
3. On first run, go to iPhone Settings → General → VPN & Device Management → Trust your developer certificate

### Test NFC
1. Open the app on your iPhone
2. Navigate to Students page
3. Click "Write NFC" button on any student card
4. Hold an NFC tag near the top of your iPhone
5. The tag should be written with student data

## Step 6: Archive for App Store

### Create Archive
1. In Xcode, select "Any iOS Device (arm64)" from device dropdown
2. Menu: Product → Archive
3. Wait for archiving process (5-10 minutes)

### Upload to App Store
1. When archive completes, Organizer window opens
2. Select your archive
3. Click "Distribute App"
4. Select "App Store Connect"
5. Click "Upload"
6. Follow the wizard to complete upload

## Troubleshooting

### Build Errors

**"Command PhaseScriptExecution failed"**
```bash
cd ios/App
pod deintegrate
pod install --repo-update
cd ../..
```

**"No such module 'Capacitor'"**
```bash
npx cap sync ios
cd ios/App && pod install && cd ../..
```

**Signing issues**
- Ensure you're signed in to Xcode with your Apple ID (Preferences → Accounts)
- Change Bundle Identifier to something unique if needed
- Enable "Automatically manage signing"

### NFC Not Working

1. **Check Info.plist**: Should have `NFCReaderUsageDescription`
2. **Check Entitlements**: `App.entitlements` should exist with NFC formats
3. **Check Capabilities**: "Near Field Communication Tag Reading" enabled in Xcode
4. **Device**: NFC only works on iPhone 7 and newer (not on simulators)

### App Crashes on Launch

1. Check Console output in Xcode for error details
2. Verify all Pods are installed: `cd ios/App && pod install`
3. Clean build folder: Xcode → Product → Clean Build Folder
4. Delete DerivedData: `rm -rf ~/Library/Developer/Xcode/DerivedData/`

### Status Bar Overlap

The app is configured with safe area insets. If you still see overlap:
1. Check that `contentInset: 'always'` is in `capacitor.config.ts`
2. Verify CSS has safe area variables in `src/index.css`

## Hot Reload for Development

For faster development, you can point the iOS app to your development server:

1. In `capacitor.config.ts`, uncomment and set:
```typescript
server: {
  url: 'https://b9b768f5-1a7c-4563-ab9c-d1b25b963f4b.lovableproject.com',
  cleartext: true
}
```

2. Run `npx cap sync ios`
3. Changes in Lovable will reflect immediately on your iPhone

**Important**: Remove the `server` config before building for production!

## Production Checklist

- [ ] Remove development `server` config from capacitor.config.ts
- [ ] Set proper version and build numbers
- [ ] Test all features on real iPhone
- [ ] Verify NFC read/write works
- [ ] Test in both light and dark mode
- [ ] Check all pages for status bar overlap
- [ ] Prepare screenshots for App Store
- [ ] Write App Store description
- [ ] Set up App Store Connect listing

## Next Steps

After successful build:
1. Create app in App Store Connect
2. Upload screenshots (6.7", 6.5", 5.5" sizes)
3. Fill in app metadata (description, keywords, etc.)
4. Submit for review
5. Wait for Apple's approval (usually 1-3 days)

## Support

- Apple Developer Documentation: https://developer.apple.com/documentation/
- Capacitor iOS Docs: https://capacitorjs.com/docs/ios
- NFC iOS Guide: https://developer.apple.com/documentation/corenfc

Good luck with your App Store submission! 🚀
