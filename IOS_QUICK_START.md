# 🚀 TalebEdu iOS - Quick Start Checklist

## Before You Start

✅ MacBook with macOS 13+  
✅ Apple Developer Account ($99/year)  
✅ Xcode 14+ from Mac App Store  
✅ Project exported to GitHub  

---

## Step-by-Step Commands

### 1️⃣ Initial Setup (One Time)

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Install CocoaPods
sudo gem install cocoapods
```

### 2️⃣ Get Project Ready

```bash
# Clone your repo
git clone YOUR_GITHUB_REPO_URL
cd talebedu

# Install everything
npm install --legacy-peer-deps

# Add iOS
npx cap add ios

# Build web app
npm run build

# Sync to iOS
npx cap sync ios

# Open in Xcode
npx cap open ios
```

### 3️⃣ In Xcode (5 minutes)

1. Select "App" in left sidebar
2. Go to "Signing & Capabilities"
3. Choose your Apple Developer Team
4. Check "Automatically manage signing"
5. Verify NFC capability is enabled

### 4️⃣ Test on iPhone

1. Connect iPhone via USB
2. Select your iPhone in Xcode (top toolbar)
3. Press ▶️ or Cmd+R
4. On iPhone: Settings → General → VPN & Device Management → Trust

### 5️⃣ Test NFC Feature

1. Login as admin
2. Look for "NFC Management" in sidebar
3. Test writing an NFC tag
4. Done! ✅

---

## 📤 Upload to App Store

### Quick Upload

```bash
# In Xcode:
# 1. Select "Any iOS Device (arm64)"
# 2. Menu: Product → Archive
# 3. Wait ~5-10 mins
# 4. Click "Distribute App"
# 5. Choose "App Store Connect"
# 6. Upload
```

### In App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Create new app (if first time)
3. Wait for build to process (10-60 mins)
4. Add screenshots & description
5. Submit for review

---

## ⚡ Super Quick Reference

**Run on device:**
```bash
npm run build && npx cap sync ios && npx cap open ios
```

**Update after changes:**
```bash
git pull
npm run build
npx cap sync ios
# Then archive in Xcode
```

---

## 🆘 Common Issues

**"NFC not working"**  
→ Only works on real iPhone, not simulator

**"Can't find iPhone"**  
→ Connect USB, trust computer on iPhone

**"Build failed"**  
→ Run `npm install --legacy-peer-deps` again

**"Can't archive"**  
→ Select "Any iOS Device (arm64)" first

---

## ✨ NFC Management Location

**Admin Access:**
- Login as admin
- Sidebar → "NFC Management"
- Write tags for students/teachers/staff
- Supports English & Arabic

---

## 📋 App Store Requirements

Required assets:
- ✅ App Icon: 1024x1024 PNG
- ✅ Screenshots: At least 2 (2778x1284 px)
- ✅ Description: What your app does
- ✅ Privacy Policy URL
- ✅ Support URL

---

## 🎯 You're Done When...

- ✅ App runs on your iPhone
- ✅ NFC management accessible as admin
- ✅ Can write NFC tags successfully
- ✅ App uploaded to App Store Connect
- ✅ Submitted for review

---

**Need detailed help?** See `IOS_APP_STORE_GUIDE.md` for complete instructions.
