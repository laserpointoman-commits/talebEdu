# TalebEdu - iOS & Android Build Instructions

## Prerequisites

### For iOS:
- macOS with Xcode 15+ installed
- CocoaPods installed (`sudo gem install cocoapods`)
- iOS 16+ device or simulator
- Apple Developer account (for physical device testing)

### For Android:
- Android Studio installed
- Android SDK 24+ (Android 7.0+)
- JDK 17+
- Android device or emulator

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Build Web Assets

```bash
npm run build
```

### 3. Add Platforms (First Time Only)

If platforms are not already added:

```bash
npx cap add ios
npx cap add android
```

### 4. Sync Native Projects

```bash
npx cap sync
```

## iOS Setup

### 1. Install CocoaPods Dependencies

```bash
cd ios/App
pod deintegrate  # Only if you had previous issues
rm -rf Pods Podfile.lock  # Only if you had previous issues
pod install --repo-update
cd ../..
```

### 2. Open in Xcode

```bash
npx cap open ios
```

### 3. Configure Signing & Capabilities

In Xcode:
1. Select the "App" target
2. Go to "Signing & Capabilities"
3. Select your Team
4. Verify these capabilities are enabled:
   - **Near Field Communication Tag Reading** (required for NFC)
   - **Push Notifications** (if using notifications)
   - **Background Modes** → Remote notifications

### 4. Add NFCPlugin to Xcode Project

**IMPORTANT:** Manually add the NFCPlugin.swift file to your Xcode project:

1. In Xcode, right-click on the "App" folder
2. Select "Add Files to 'App'..."
3. Navigate to `ios/App/App/NFCPlugin.swift`
4. Make sure "Copy items if needed" is **unchecked**
5. Make sure "Add to targets: App" is **checked**
6. Click "Add"

### 5. Build and Run

1. Select your device or simulator
2. Click "Build" (Cmd+B) to verify no errors
3. Click "Run" (Cmd+R) to launch on device/simulator

**Note:** NFC functionality only works on **physical iPhone 7 or newer** devices, not in simulators.

## Android Setup

### 1. Open in Android Studio

```bash
npx cap open android
```

### 2. Sync Gradle

Android Studio will automatically prompt to sync Gradle. Click "Sync Now" if prompted.

### 3. Configure NFC (if not already done)

The AndroidManifest.xml already includes NFC permissions:
```xml
<uses-permission android:name="android.permission.NFC" />
<uses-feature android:name="android.hardware.nfc" android:required="false" />
```

### 4. Build and Run

1. Select your device or emulator
2. Click "Run" (green play button) or Shift+F10
3. Wait for build to complete and app to launch

**Note:** For NFC testing on Android, you need a physical device with NFC capability.

## Troubleshooting

### iOS Build Errors

**"ExxiliCapacitorNfc.framework: No such file or directory"**
- This means you have old plugin cache. Run:
```bash
cd ios/App
pod deintegrate
rm -rf Pods Podfile.lock ~/Library/Developer/Xcode/DerivedData
pod install --repo-update
cd ../..
npx cap sync ios
```

**"Value of type 'CAPPluginCall' has no member 'success'"**
- Old CocoaPods cache. Follow the cleanup steps above.

**NFC Not Working**
- Ensure you added NFCPlugin.swift to Xcode project manually (step 4 above)
- Verify "Near Field Communication Tag Reading" capability is enabled
- Make sure App.entitlements includes NFC formats
- NFC only works on physical iPhone 7+ devices

### Android Build Errors

**Gradle Sync Failed**
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

**NFC Not Working**
- Check AndroidManifest.xml has NFC permissions
- Test on physical device with NFC (not emulator)
- Ensure NFC is enabled in device settings

## Development Workflow

### After Code Changes

1. Build web assets:
```bash
npm run build
```

2. Sync to native projects:
```bash
npx cap sync
```

3. Rebuild and run in Xcode or Android Studio

### Quick iOS Updates (without full rebuild)

If only web code changed:
```bash
npm run build && npx cap copy ios && npx cap sync ios
```

### Quick Android Updates (without full rebuild)

If only web code changed:
```bash
npm run build && npx cap copy android && npx cap sync android
```

## NFC Functionality

### iOS NFC Implementation

- Uses custom native CoreNFC plugin (`ios/App/App/NFCPlugin.swift`)
- Supports NFC read and write operations
- Works only on **physical iPhone 7 or newer**
- Requires "Near Field Communication Tag Reading" capability in Xcode

### Android NFC Implementation

- Uses native Android NFC APIs
- Configured in AndroidManifest.xml
- Works on NFC-enabled Android devices
- Test on physical device (emulators don't have NFC)

### Testing NFC

1. Write NFC tag:
   - Navigate to student card in admin role
   - Click "Write NFC" button
   - Hold NFC tag near phone
   - Wait for success message

2. Read NFC tag:
   - Navigate to attendance/scanning page
   - Click "Start Scanning"
   - Hold NFC tag near phone
   - Verify student data appears

## Production Build

### iOS Production

1. Archive in Xcode (Product → Archive)
2. Upload to App Store Connect
3. Submit for review

### Android Production

1. Generate signed APK/AAB in Android Studio
2. Upload to Google Play Console
3. Submit for review

## Notes

- **Capacitor Config:** Uses TypeScript (`.ts`) which is fully supported by Capacitor 7+
- **Hot Reload:** Development server can be used for faster testing (see capacitor.config.ts server config)
- **NFC:** Custom native implementation, no third-party plugins needed
- **Warnings:** Some deprecation warnings are from Capacitor's internal code and won't affect functionality

## Support

For issues:
1. Check console logs in Xcode/Android Studio
2. Verify all capabilities are enabled
3. Ensure latest dependencies: `npm install && npx cap sync`
4. Clean builds: delete DerivedData (iOS) or ./gradlew clean (Android)
