# 🔧 حل مشاكل تشغيل تطبيق iOS

## الخطوات الضرورية بعد التعديلات الأخيرة

### 1️⃣ تحديث المشروع من GitHub

```bash
cd ~/Desktop/talebedu  # أو المسار حيث المشروع
git pull origin main
```

### 2️⃣ تثبيت الحزم من جديد

```bash
npm install --legacy-peer-deps
```

### 3️⃣ بناء المشروع

```bash
npm run build
```

### 4️⃣ مزامنة iOS (مهم جداً!)

```bash
npx cap sync ios
```

### 5️⃣ تثبيت CocoaPods Dependencies

```bash
cd ios/App
pod install --repo-update
cd ../..
```

### 6️⃣ فتح المشروع في Xcode

```bash
npx cap open ios
```

---

## ⚠️ إذا واجهت مشاكل في Xcode

### المشكلة: "No such module"

**الحل:**
1. في Xcode، اذهب إلى: **Product → Clean Build Folder** (أو Shift+Cmd+K)
2. أغلق Xcode تماماً
3. افتح Terminal وشغّل:
```bash
cd ios/App
rm -rf Pods
rm Podfile.lock
pod install --repo-update
cd ../..
npx cap open ios
```

### المشكلة: Build Failed أو Errors في Signing

**الحل:**
1. في Xcode، اختر مشروع **App** من القائمة اليسرى
2. اذهب إلى **Signing & Capabilities**
3. تأكد من اختيار **Team** (حساب Apple Developer الخاص بك)
4. فعّل **Automatically manage signing**

### المشكلة: NFC لا يعمل

**السبب:** NFC لا يعمل على Simulator، يحتاج iPhone حقيقي

**الحل:**
1. وصّل iPhone بالكمبيوتر عن طريق USB
2. في Xcode، اختر جهازك من القائمة العلوية (بدلاً من Simulator)
3. اضغط **▶️** أو Cmd+R

---

## 📋 نقاط التحقق قبل التشغيل

✅ هل قمت بتشغيل `git pull`؟  
✅ هل قمت بتشغيل `npm install --legacy-peer-deps`؟  
✅ هل قمت بتشغيل `npm run build`؟  
✅ هل قمت بتشغيل `npx cap sync ios`؟  
✅ هل قمت بتشغيل `pod install` في مجلد `ios/App`؟  
✅ هل اخترت Team في Xcode؟  

---

## 🚀 الخطوات السريعة (افعل كل شيء مرة واحدة)

```bash
# 1. تحديث المشروع
cd ~/Desktop/talebedu
git pull origin main

# 2. تثبيت وبناء
npm install --legacy-peer-deps
npm run build

# 3. مزامنة iOS
npx cap sync ios

# 4. CocoaPods
cd ios/App
pod install --repo-update
cd ../..

# 5. فتح Xcode
npx cap open ios
```

**بعد فتح Xcode:**
1. اختر مشروع App
2. اذهب إلى Signing & Capabilities
3. اختر Team
4. فعّل Automatically manage signing
5. اختر جهاز iPhone (ليس Simulator)
6. اضغط ▶️

---

## 🆘 إذا لم تحل المشكلة

جرب إزالة المشروع وإعادة إنشائه:

```bash
# احذف مجلد iOS القديم
rm -rf ios

# أضف iOS من جديد
npx cap add ios

# بناء ومزامنة
npm run build
npx cap sync ios

# CocoaPods
cd ios/App
pod install --repo-update
cd ../..

# فتح Xcode
npx cap open ios
```

---

## ✅ كيف تعرف أن كل شيء يعمل؟

1. المشروع يفتح في Xcode بدون أخطاء حمراء
2. عند اختيار جهاز iPhone، الزر ▶️ يعمل
3. التطبيق يظهر على iPhone بدون crash
4. يمكنك تسجيل الدخول كـ admin
5. خيار "NFC Management" يظهر في القائمة

---

## 📞 معلومات مفيدة

- **NFC يعمل فقط على iPhone حقيقي** (ليس على Simulator)
- **iPhone 7 أو أحدث** مطلوب لـ NFC
- **iOS 14.0 أو أحدث** مطلوب

---

## 🎯 التعديلات الأخيرة التي تمت

تم تحديث الملفات التالية لحل مشاكل البناء:

1. ✅ `ios/App/Podfile` - أضيفت جميع الـ Capacitor plugins
2. ✅ `ios/App/App/AppDelegate.swift` - أضيف دعم Push Notifications
3. ✅ `ios/App/App/Info.plist` - أضيفت Background Modes

**لذلك لازم تعمل `git pull` و `pod install` عشان تحصل على هذه التحديثات!**
