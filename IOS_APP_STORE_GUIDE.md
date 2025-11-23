# TalebEdu iOS App Store Deployment Guide

## ✅ Prerequisites Checklist

- [x] MacBook with macOS 13+ installed
- [x] Apple Developer Account ($99/year)
- [x] Xcode 14+ installed from Mac App Store
- [x] GitHub account with project exported
- [x] NFC functionality configured and tested
- [x] Admin panel includes NFC Management (accessible at `/dashboard/admin/nfc`)

## 📋 Complete Deployment Steps

### Step 1: Install Development Tools

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Install CocoaPods (iOS dependency manager)
sudo gem install cocoapods
```

### Step 2: Clone and Setup Project

```bash
# Clone your GitHub repository
git clone YOUR_GITHUB_REPO_URL
cd talebedu

# Install dependencies
npm install --legacy-peer-deps

# Add iOS platform
npx cap add ios

# Build the web app
npm run build

# Sync with native iOS platform
npx cap sync ios
```

### Step 3: Configure in Xcode

```bash
# Open project in Xcode
npx cap open ios
```

In Xcode:

1. **Select App Target**: Click on "App" in the left sidebar

2. **Update Bundle Identifier**:
   - Go to "Signing & Capabilities" tab
   - Change Bundle Identifier to: `com.talebedu.app`

3. **Configure Signing**:
   - Select your Apple Developer Team
   - Enable "Automatically manage signing"

4. **Update App Display Name**:
   - Go to "General" tab
   - Set Display Name to: `TalebEdu`

5. **Set Version Information**:
   - Version: `1.0.0`
   - Build: `1`

6. **Configure Capabilities**:
   - Click "+ Capability" button
   - Add "Near Field Communication Tag Reading"
   - Verify Info.plist has:
     ```xml
     <key>NFCReaderUsageDescription</key>
     <string>This app needs NFC to scan student wristbands for attendance tracking</string>
     ```

7. **Update App Icons**:
   - In Assets.xcassets, ensure AppIcon has 1024x1024 image
   - Required for App Store submission

### Step 4: Test on Physical Device

1. **Connect iPhone** to MacBook via USB

2. **Trust Computer** on iPhone when prompted

3. **Select Device** in Xcode:
   - Top toolbar: Click device selector
   - Choose your connected iPhone

4. **Run App**:
   - Press ▶️ Play button or Cmd+R
   - First time: Go to Settings → General → VPN & Device Management
   - Trust your developer certificate

5. **Test NFC Features**:
   - Login as admin
   - Navigate to "NFC Management" in sidebar
   - Test NFC writing functionality
   - Verify NFC reading at checkpoints

### Step 5: Prepare for App Store

1. **Create App in App Store Connect**:
   - Go to https://appstoreconnect.apple.com
   - Click "+" → New App
   - Platform: iOS
   - Name: TalebEdu
   - Primary Language: English
   - Bundle ID: com.talebedu.app
   - SKU: com.talebedu.app

2. **Prepare App Store Assets**:
   - App Icon (1024x1024 PNG)
   - Screenshots (6.5" iPhone Pro Max):
     - 2778 x 1284 px (minimum 2 required)
   - App Description (4000 chars max)
   - Keywords (100 chars max)
   - Privacy Policy URL (required)
   - Support URL (required)

3. **Configure App Information**:
   - Category: Education
   - Age Rating: Complete questionnaire
   - Pricing: Free or Paid

### Step 6: Build for Distribution

1. **Archive the App** in Xcode:
   - Select "Any iOS Device (arm64)" as destination
   - Menu: Product → Archive
   - Wait for build to complete (~5-10 mins)

2. **Distribute to App Store**:
   - Archive Organizer opens automatically
   - Click "Distribute App"
   - Select "App Store Connect"
   - Select "Upload"
   - Choose automatic signing
   - Review app.ipa details
   - Click "Upload"

3. **Wait for Processing**:
   - Takes 10-60 minutes
   - Check App Store Connect for status
   - You'll receive email when processing completes

### Step 7: Submit for Review

1. **Complete App Store Information**:
   - Add screenshots
   - Write app description
   - Set age rating
   - Add privacy policy

2. **Select Build**:
   - In App Store Connect
   - Go to your app version
   - Click "+ Build"
   - Select the uploaded build

3. **Submit for Review**:
   - Click "Submit for Review"
   - Answer export compliance questions
   - Review takes 1-3 days typically

## 🎯 NFC Functionality Verification

✅ **NFC Management is configured and accessible**:
- Route: `/dashboard/admin/nfc`
- Sidebar: "NFC Management" visible to admin role
- Features:
  - Write NFC tags for students, teachers, drivers, employees
  - Support for multiple NFC tag types
  - Real-time NFC status detection
  - Bilingual interface (English/Arabic)

## 📱 Production Configuration

The app is now configured for production:
- ✅ Server URL removed from capacitor.config.ts
- ✅ Splash screen configured
- ✅ iOS content inset settings optimized
- ✅ Push notifications configured
- ✅ NFC capabilities enabled

## 🔄 Future Updates

To release updates:

```bash
# 1. Make changes in Lovable or locally
git pull

# 2. Rebuild
npm run build
npx cap sync ios

# 3. Open in Xcode
npx cap open ios

# 4. Increment version/build number
# 5. Archive and upload new build
# 6. Submit new version in App Store Connect
```

## 🆘 Troubleshooting

### Build Errors

**Error: "No bundle identifier found"**
- Solution: Set Bundle ID in Xcode General tab

**Error: "Failed to find a suitable device"**
- Solution: Connect iPhone or select simulator

### NFC Issues

**Error: "NFC not available"**
- NFC only works on physical devices (iPhone 7+)
- Not available in iOS Simulator
- Check Info.plist has NFCReaderUsageDescription

### Signing Issues

**Error: "Failed to create provisioning profile"**
- Verify Apple Developer account is active
- Check Bundle ID matches in both Xcode and App Store Connect
- Enable "Automatically manage signing"

## 📚 Useful Resources

- [Apple Developer Portal](https://developer.apple.com)
- [App Store Connect](https://appstoreconnect.apple.com)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)

## 🎉 Success Criteria

Your app is ready when:
- ✅ Builds without errors in Xcode
- ✅ Runs on physical iPhone
- ✅ NFC writing works in admin panel
- ✅ NFC reading works at checkpoints
- ✅ All core features functional
- ✅ App icons display correctly
- ✅ Successfully uploaded to App Store Connect
- ✅ Passes App Store review

## 💡 Pro Tips

1. **Test Thoroughly**: Test all features on physical device before submitting
2. **Beta Testing**: Use TestFlight for beta testing before public release
3. **Phased Release**: Consider phased release for gradual rollout
4. **Monitor Crashes**: Use Xcode Organizer to monitor crash reports
5. **Update Regularly**: Plan for regular updates based on user feedback

---

**Need Help?** If you encounter issues, refer to the troubleshooting section or check the official documentation links above.
