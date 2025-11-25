# iOS Build Instructions - TalebEdu

## Complete Setup Guide for Building on iPhone

### Prerequisites
- macOS with Xcode 14 or later installed
- Apple Developer Account
- Physical iPhone device (iOS 13+)
- CocoaPods installed

### Step 1: Clone and Install Dependencies

```bash
# Clone your repository
git clone [your-repo-url]
cd talebedu

# Install Node modules
npm install --legacy-peer-deps

# Install iOS dependencies
cd ios/App
pod install --repo-update
cd ../..
```

### Step 2: Build the Web App

```bash
# Build the production web files
npm run build
```

### Step 3: Sync with iOS

```bash
# Sync web files to native iOS project
npx cap sync ios
```

### Step 4: Open in Xcode

```bash
# Open the iOS project in Xcode
npx cap open ios
```

### Step 5: Configure Xcode Project

#### A. Signing & Capabilities

1. Select the **App** target in Xcode
2. Go to **Signing & Capabilities** tab
3. Select your **Development Team**
4. Update **Bundle Identifier** to your unique identifier (e.g., `com.yourcompany.talebedu`)

#### B. Add NFC Capability

1. In **Signing & Capabilities**, click **+ Capability**
2. Add **Near Field Communication Tag Reading**
3. Verify `App.entitlements` file is created with NFC formats

#### C. Device Settings

1. Connect your iPhone via USB
2. Select your iPhone as the build destination in Xcode
3. Trust the computer on your iPhone if prompted

#### D. Provisioning Profile

1. Make sure you have a development provisioning profile
2. Xcode will automatically create one if needed
3. Go to **Preferences > Accounts** to manage certificates

### Step 6: Build and Run on Device

1. Select your iPhone device in Xcode
2. Click the **Play** button (▶️) or press **Cmd + R**
3. Wait for the build to complete
4. The app will launch on your iPhone

### Step 7: Trust the Developer

First time running:
1. Go to **Settings** on your iPhone
2. **General** → **VPN & Device Management**
3. Tap your developer account
4. Tap **Trust**
5. Return to home screen and launch TalebEdu

## NFC Implementation

### Current Status
- NFC entitlements configured
- Info.plist updated with usage description
- Native NFC service bridge created at `src/services/nativeNFC.ts`
- Web NFC fallback for Android Chrome

### To Enable Full NFC:
1. Follow `IOS_NFC_SETUP.md` to implement native Swift code
2. Add `NFCBridge.swift` to your Xcode project
3. Update `AppDelegate.swift` with NFC message handler
4. Build and test on physical device

**Important**: NFC does NOT work on iOS Simulator. You must test on a physical iPhone 7 or later.

## Native iOS Enhancements

### Applied Improvements:
✅ Native iOS fonts (SF Pro)
✅ Larger text size (17px base)
✅ Safe area insets for notches
✅ Disabled bounce scrolling
✅ Native keyboard behavior
✅ Status bar styling
✅ Smooth transitions
✅ iOS-specific CSS utilities

### Visual Styling:
- Typography matches iOS native apps
- Button sizes increased for better touch targets (50px minimum)
- Card corners rounded to 12px (iOS standard)
- Input fields with proper iOS styling
- Native iOS shadows and effects

## Testing

### On Simulator:
```bash
# Open iOS simulator
npx cap run ios
```
Note: NFC will not work in simulator

### On Physical Device:
1. Connect iPhone via USB
2. Build and run from Xcode
3. Test NFC features with actual NFC tags

## Troubleshooting

### Build Failures:
```bash
# Clean build
cd ios/App
rm -rf Pods Podfile.lock
pod install --repo-update
cd ../..
npx cap sync ios
```

### Pod Installation Issues:
```bash
# Update CocoaPods
sudo gem install cocoapods
pod repo update
```

### Signing Issues:
1. Check that your Apple ID is added in Xcode
2. Generate certificates in Apple Developer portal
3. Download and install provisioning profiles
4. Select correct team in Xcode

### NFC Not Working:
- Verify device has NFC (iPhone 7+)
- Check entitlements file is present
- Ensure capability is added in Xcode
- Test on physical device, not simulator
- Check usage description in Info.plist

### App Crashes on Launch:
1. Check console logs in Xcode
2. Verify all Capacitor plugins are installed
3. Run `pod install` again
4. Clean build folder (Cmd + Shift + K)

## File Structure

```
ios/
├── App/
│   ├── App/
│   │   ├── AppDelegate.swift
│   │   ├── Info.plist
│   │   ├── App.entitlements (NFC config)
│   │   └── Assets.xcassets/
│   ├── App.xcodeproj/
│   ├── Podfile
│   └── Pods/
└── capacitor.config.ts (root)
```

## Next Steps for App Store

1. **Test Thoroughly**: Test all features on physical device
2. **Screenshots**: Take required screenshots on different device sizes
3. **App Icon**: Ensure high-quality 1024x1024 icon
4. **Version Number**: Set proper version in Xcode
5. **Archive**: Create archive build for distribution
6. **Upload**: Upload to App Store Connect
7. **Submit**: Complete App Store information and submit

## Resources

- [Apple Developer Portal](https://developer.apple.com)
- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [CoreNFC Documentation](https://developer.apple.com/documentation/corenfc)
- [App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)

## Support

For issues specific to:
- **Xcode**: Check Apple Developer Forums
- **Capacitor**: Check Capacitor Discord/GitHub
- **NFC**: Refer to `IOS_NFC_SETUP.md`

---

**Ready to Build!** Your project is now fully configured for iOS deployment. Follow the steps above to build and run on your iPhone.
