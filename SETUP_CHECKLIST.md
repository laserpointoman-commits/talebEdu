# TalebEdu Setup Checklist

Use this checklist to ensure your project is fully configured and ready to build.

## ✅ Initial Setup

- [ ] **Node.js & npm installed** (v18+)
  ```bash
  node --version
  npm --version
  ```

- [ ] **Git repository cloned**
  ```bash
  git clone <YOUR_GIT_URL>
  cd talebedu
  ```

- [ ] **Dependencies installed**
  ```bash
  npm install
  ```

- [ ] **Setup verification passed**
  ```bash
  node verify-setup.js
  ```

- [ ] **Web assets built**
  ```bash
  npm run build
  ```

- [ ] **Capacitor synced**
  ```bash
  npx cap sync
  ```

## 📱 iOS Setup (macOS Only)

### Prerequisites
- [ ] **macOS** with Xcode 15+ installed
- [ ] **CocoaPods** installed
  ```bash
  sudo gem install cocoapods
  ```
- [ ] **Apple Developer Account** (for physical device testing)

### iOS Configuration

- [ ] **iOS platform added** (if not present)
  ```bash
  npx cap add ios
  ```

- [ ] **CocoaPods installed**
  ```bash
  cd ios/App
  pod install --repo-update
  cd ../..
  ```

- [ ] **Open project in Xcode**
  ```bash
  npx cap open ios
  ```

- [ ] **NFCPlugin.swift added to Xcode project**
  1. Right-click "App" folder in Xcode
  2. Select "Add Files to 'App'..."
  3. Navigate to `ios/App/App/NFCPlugin.swift`
  4. **Uncheck** "Copy items if needed"
  5. **Check** "Add to targets: App"
  6. Click "Add"

- [ ] **Signing configured in Xcode**
  1. Select "App" target
  2. Go to "Signing & Capabilities"
  3. Select your Team
  4. Choose provisioning profile

- [ ] **Capabilities verified**
  - [ ] Near Field Communication Tag Reading (required for NFC)
  - [ ] Push Notifications (if using notifications)
  - [ ] Background Modes → Remote notifications

- [ ] **Build successful**
  - Press Cmd+B in Xcode
  - Check for zero errors

- [ ] **App runs on simulator/device**
  - Select device/simulator
  - Press Cmd+R to run

### iOS Known Issues

- [ ] **No ExxiliCapacitorNfc errors** (old plugin removed)
- [ ] **No WKProcessPool warnings** (can be ignored, from Capacitor)
- [ ] **NFCPlugin properly registered** in AppDelegate.swift
- [ ] **NFC only works on physical iPhone 7+** (not simulators)

## 🤖 Android Setup

### Prerequisites
- [ ] **Android Studio** installed
- [ ] **Android SDK 24+** (Android 7.0+)
- [ ] **JDK 17+** installed

### Android Configuration

- [ ] **Android platform added** (if not present)
  ```bash
  npx cap add android
  ```

- [ ] **Open project in Android Studio**
  ```bash
  npx cap open android
  ```

- [ ] **Gradle sync completed**
  - Android Studio prompts automatically
  - Click "Sync Now" if needed

- [ ] **AndroidManifest.xml has NFC permissions**
  - Should already be configured
  - Verify in `android/app/src/main/AndroidManifest.xml`

- [ ] **Build successful**
  - Click Build → Make Project
  - Check for zero errors

- [ ] **App runs on emulator/device**
  - Select device/emulator
  - Click Run (green play button)

### Android Known Issues

- [ ] **No Gradle sync errors**
- [ ] **NFC only works on physical device** (not emulators)
- [ ] **NFC enabled in device settings**

## 🔧 NFC Verification

### iOS NFC Test

- [ ] **Physical iPhone 7 or newer** available
- [ ] **NFCPlugin.swift** added to Xcode project
- [ ] **"Near Field Communication Tag Reading"** capability enabled
- [ ] **App.entitlements** includes NFC formats
  ```xml
  <key>com.apple.developer.nfc.readersession.formats</key>
  <array>
    <string>NDEF</string>
    <string>TAG</string>
  </array>
  ```
- [ ] **Info.plist** includes NFCReaderUsageDescription
- [ ] **NFC write test successful**
  - Navigate to student card (admin role)
  - Click "Write NFC"
  - Hold tag near phone
  - Verify success message
- [ ] **NFC read test successful**
  - Navigate to attendance page
  - Click "Start Scanning"
  - Hold tag near phone
  - Verify student data appears

### Android NFC Test

- [ ] **Physical Android device with NFC** available
- [ ] **NFC enabled** in device settings
- [ ] **AndroidManifest.xml** has NFC permissions
- [ ] **NFC write test successful**
- [ ] **NFC read test successful**

## 🌐 Web Verification

- [ ] **Development server runs**
  ```bash
  npm run dev
  ```

- [ ] **Production build successful**
  ```bash
  npm run build
  ```

- [ ] **Preview works**
  ```bash
  npm run preview
  ```

- [ ] **No console errors** in browser DevTools

## 🚀 Pre-Production Checklist

### Code Quality
- [ ] **ESLint passing**
  ```bash
  npm run lint
  ```
- [ ] **No TypeScript errors**
- [ ] **All features tested**

### iOS Pre-Production
- [ ] **Builds with zero errors** in Release mode
- [ ] **All warnings addressed** (or documented as acceptable)
- [ ] **Tested on multiple iOS devices**
- [ ] **Provisioning profile** configured for distribution
- [ ] **App icons** present in all sizes
- [ ] **Launch screen** displays correctly

### Android Pre-Production
- [ ] **Builds with zero errors** in Release mode
- [ ] **Signed APK/AAB** can be generated
- [ ] **Tested on multiple Android devices**
- [ ] **App icons** present in all densities
- [ ] **Splash screen** displays correctly

### Backend/Cloud
- [ ] **Supabase connection** working
- [ ] **Authentication** functional
- [ ] **Database queries** successful
- [ ] **Edge functions** deployed and working
- [ ] **Push notifications** configured (if using)

## 📝 Final Verification

Run the automated verification:
```bash
node verify-setup.js
```

Expected output: **✅ Setup verification PASSED!**

## 🆘 If Something Goes Wrong

1. **Check the error message carefully**
2. **Refer to [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md)**
3. **Run verification script**: `node verify-setup.js`
4. **Clean and rebuild**:
   - iOS: `cd ios/App && pod deintegrate && rm -rf Pods Podfile.lock && pod install`
   - Android: `cd android && ./gradlew clean`
5. **Check Xcode/Android Studio console logs**
6. **Verify all capabilities/permissions are enabled**

## ✨ Success Criteria

You're ready for production when:
- ✅ All checkboxes above are checked
- ✅ `node verify-setup.js` passes
- ✅ App builds without errors on both platforms
- ✅ App runs on physical devices
- ✅ NFC functionality works on physical devices
- ✅ All core features tested and functional

---

**Need Help?** See [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) for detailed step-by-step instructions.
