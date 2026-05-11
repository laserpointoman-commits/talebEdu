# إضافة على الخطة: Messenger 2.0 — سلس + مكالمات حقيقية

نضيف هذا المسار على خطة الـ Hybrid UI Design System، كمسار مستقل يبدأ بالتوازي مع باقي الجولات، لأن الوضع الحالي للمسنجر سيء و المكالمات لا تعمل.

---

## 1) المشاكل الحالية (التشخيص)

من فحص الكود الحالي (`src/pages/Messenger.tsx`, `src/components/messenger/*`, `CallServiceBootstrap.tsx`, `CallScreen.tsx`):

- **بنية متضخمة:** أكثر من 25 ملف في مجلد `messenger/` مع تكرار (`ChatHeader` + `SimplifiedChatHeader`، `MessageBubble` + `EnhancedMessageBubble`، `WhatsAppTheme` + `MessengerTheme`).
- **بطء واضح:** لا يوجد Virtualization لقائمة الرسائل، إعادة render كاملة عند كل رسالة جديدة.
- **مكالمات لا تعمل:** لا يوجد WebRTC حقيقي، فقط شاشة `CallScreen` بدون Signaling Server ولا STUN/TURN ولا تكامل CallKit/ConnectionService.
- **لا يوجد Push للمكالمات:** المكالمة لا تصل إذا كان التطبيق مغلق (لا VoIP push على iOS، ولا high-priority FCM على Android).
- **تجربة استخدام ضعيفة:** لا "تم التسليم/تمت القراءة" بشكل موثوق، لا typing indicator حقيقي عبر Realtime، الصوتيات والمرفقات بطيئة.

---

## 2) أهداف Messenger 2.0

- **سرعة:** فتح المحادثة < 200ms، تمرير 60fps حتى مع 10,000 رسالة.
- **موثوقية:** الرسالة تصل دائماً (queue offline + retry)، المكالمة ترن دائماً حتى لو التطبيق مغلق.
- **مكالمات حقيقية:** صوت + فيديو P2P عبر WebRTC، جودة HD، تعمل خلف NAT.
- **تجربة حديثة:** على مستوى WhatsApp/Telegram من ناحية الإحساس.

---

## 3) المعمارية الجديدة

### أ. طبقة الرسائل (Realtime + Offline-first)
- **Supabase Realtime** للرسائل الحية (موجود، نُحسّن استخدامه).
- **IndexedDB cache** عبر Dexie للرسائل المحلية → فتح فوري بدون انتظار الشبكة.
- **Outbox pattern:** الرسالة تُحفظ محلياً فوراً بحالة `pending`، تُرسل في الخلفية، تُحدّث إلى `sent/delivered/read`.
- **Virtualized list** عبر `@tanstack/react-virtual` لقائمة الرسائل والمحادثات.

### ب. طبقة المكالمات (WebRTC حقيقية)
- **Signaling:** Edge Function جديدة `call-signaling` تستخدم Supabase Realtime (Broadcast channels) لتبادل SDP/ICE بين الطرفين.
- **STUN/TURN:** خدمة TURN مُدارة (Twilio Network Traversal أو Metered.ca أو Cloudflare Calls) — secret يُضاف لاحقاً.
- **WebRTC:** عبر `simple-peer` أو RTCPeerConnection مباشرة، يدعم صوت + فيديو + مشاركة شاشة.
- **CallKit (iOS) + ConnectionService (Android):** عبر `@capacitor-community/call-kit` و plugin مخصص أو `capacitor-voip-pushnotification` → المكالمة ترن في شاشة قفل النظام.
- **VoIP Push (iOS) + High-priority FCM (Android):** Edge Function `push-call` ترسل push مع payload خاص يوقظ التطبيق فوراً.

### ج. طبقة الإشعارات
- توحيد قنوات FCM/APNS الحالية مع قناة جديدة `voip` ذات أولوية عالية.

---

## 4) إعادة هيكلة الملفات

```text
src/features/messenger/
  data/
    db.ts                  # Dexie schema
    outbox.ts              # queue + retry
    useMessages.ts         # hook موحّد
    useConversations.ts
  call/
    CallProvider.tsx       # Context + state machine (idle/ringing/active/ended)
    useWebRTC.ts           # peer connection
    signaling.ts           # Realtime broadcast
    callKit.ts             # CallKit/ConnectionService bridge
  ui/
    ConversationList.tsx   # virtualized
    MessageList.tsx        # virtualized
    MessageBubble.tsx      # موحّد (يحذف Enhanced + العادي)
    Composer.tsx           # موحّد (نص + صوت + مرفقات)
    CallScreen.tsx         # شاشة مكالمة جديدة
    IncomingCallSheet.tsx  # شاشة الرنين
  index.tsx                # الصفحة الرئيسية
```

يُحذف من `src/components/messenger/`:
- `SimplifiedChatHeader` (يدمج مع `ChatHeader`)
- `EnhancedMessageBubble` (يدمج مع `MessageBubble`)
- `WhatsAppTheme` (يستخدم design tokens الجديدة)

---

## 5) التصميم (يتبع نظام Hybrid UI Design System)

- **شخصية:** Editorial Calm للوالدين، Operational للمشرف/السائق، Neo-Operational لإدارة المدرسة.
- **Light + Dark** افتراضياً.
- **Bubbles:** `rounded-2xl`، ظل خفيف، Sky-500 للرسائل الصادرة، `bg-card` للواردة.
- **Header:** ثابت مع safe-area-inset، اسم + حالة (online/typing) + زرّي اتصال صوتي/مرئي.
- **Composer:** ثابت أسفل، يدعم النص + الصوت (waveform) + المرفقات + الموقع + الإيموجي.
- **Call Screen:** Full-screen gradient Sky→Slate، صورة كبيرة، أزرار دائرية كبيرة (Mute/Speaker/Camera/End)، عدّاد مدة، مؤشّر جودة الشبكة.
- **Incoming Call:** يظهر كـ Bottom Sheet داخل التطبيق + شاشة قفل النظام عبر CallKit.

---

## 6) خطة التنفيذ (تُضاف للأسابيع الأربعة)

| الأسبوع | المهمة |
|---|---|
| **W2** (بالتوازي مع Super Admin) | إعادة هيكلة `features/messenger/`، Dexie + Outbox، Virtualized lists، توحيد المكوّنات المكرّرة |
| **W3** | WebRTC Core: signaling عبر Edge Function، STUN/TURN، مكالمة صوت P2P تعمل بين متصفحين |
| **W4** | CallKit (iOS) + ConnectionService (Android) + VoIP push، فيديو، مشاركة شاشة، QA كامل |

---

## 7) ما يحتاج قرار / Secrets لاحقاً (لا ننفّذ الآن)

- مزوّد TURN: **Twilio** (موثوق، مدفوع per-minute) أو **Metered.ca** (أرخص، خطة مجانية محدودة) أو **Cloudflare Calls** (الأحدث).
- تأكيد إبقاء FCM/APNS الحاليين أم إضافة قناة VoIP منفصلة (موصى به).

---

## 8) خارج النطاق

- مكالمات جماعية (Group calls) — مرحلة لاحقة (تحتاج SFU مثل LiveKit).
- تشفير E2E — مرحلة لاحقة.
- Stories / Status — غير مطلوب.

---

هل نضيف هذا المسار للخطة الرئيسية ونبقى في وضع التخطيط، أم تريد مناقشة مزوّد TURN أولاً؟

---

# إضافة على الخطة: ميزات تنافسية مختارة (Phase 2)

بناءً على اختيار المستخدم، تُضاف الميزات التالية كمسار مستقل بعد إنجاز Hybrid UI + Messenger 2.0. لا تنفيذ الآن — تخطيط فقط.

## 1) Family Sharing — مشاركة عائلية (#8)

- **الفكرة:** كل طالب يرتبط بحساب "عائلة" واحد، وداخل العائلة عدة أفراد (الأب، الأم، الجد، السائق الخاص، المربية) كلٌ بصلاحيات مختلفة.
- **الأدوار داخل العائلة:** `primary_guardian` (تحكم كامل + مالي)، `guardian` (متابعة + استلام)، `viewer` (متابعة فقط بدون إشعارات حساسة)، `pickup_only` (يظهر فقط في Smart Pickup).
- **قاعدة البيانات:** جدولان جديدان `families` و `family_members(family_id, user_id, role, can_pickup, can_receive_alerts, can_view_finance)`، مع ربط `students.family_id`.
- **UI:** صفحة "عائلتي" داخل الإعدادات → دعوة عبر رقم/إيميل، اختيار الصلاحيات، إزالة عضو، سجل النشاط.
- **الإشعارات:** كل عضو يستلم حسب `can_receive_alerts`، مع منع تكرار الإشعار للحدث الواحد (deduplication على مستوى العائلة).

## 2) Substitute Teacher Auto-Match — البديل الذكي (#12)

- **الفكرة:** عند تسجيل غياب معلم، النظام يقترح تلقائياً معلماً بديلاً متاحاً في نفس الحصة بناءً على: التخصص + التوفر في الجدول + عدد الحصص الإضافية هذا الأسبوع.
- **خوارزمية الترتيب:** `score = specialization_match*0.5 + availability*0.3 + (1 - load_ratio)*0.2`.
- **التدفق:** غياب → اقتراح Top 3 → ضغطة واحدة من المدير لإرسال طلب تغطية → قبول/رفض من المعلم البديل → تحديث جدول الحصص + إشعار الطلاب/الأهل.
- **قاعدة البيانات:** `substitute_requests(absent_teacher_id, period_id, substitute_teacher_id, status, score, responded_at)`.
- **Edge Function:** `match-substitute` تحسب الترشيحات.

## 3) Home Screen Widget — ودجت الشاشة الرئيسية (#16)

- **iOS:** WidgetKit عبر Swift target جديد داخل مشروع Xcode، يقرأ من App Group مشترك مع التطبيق الرئيسي.
- **Android:** AppWidgetProvider عبر Java/Kotlin داخل `android/app`.
- **محتوى الودجت:**
  - للأهل: "الباص على بُعد X دقيقة" + حالة الطفل (في المدرسة / في الباص / في البيت) + الرصيد المتبقي.
  - للمعلم: عدد الطلاب الحاضرين / الغائبين اليوم.
- **تحديث البيانات:** كل 5 دقائق + Push silent عند تغيّر حرج (وصول الباص، نزول الطفل).
- **يحتاج لاحقاً:** Capacitor plugin مخصص لكتابة البيانات في App Group / SharedPreferences.

## 4) Apple Watch / Wear OS (#17)

- **النطاق المبدئي:** Read-only فقط (لا تنفيذ إجراءات حساسة من الساعة).
- **الميزات:**
  - إشعارات فورية (وصول الباص، دخول/خروج المدرسة، رسائل المسنجر).
  - Glance: حالة الطفل + الرصيد + الباص.
  - Complication على وجه الساعة (iOS).
- **التقنية:** WatchKit App مستقل + Wear OS module منفصل، يتواصلان مع التطبيق الأم عبر WatchConnectivity / Data Layer API.
- **مرحلة لاحقة:** زر "أنا قادم لاستلام طفلي" من الساعة (يفعّل Smart Pickup).

## 5) Offline Mode المحسّن (#19)

- **القائم حالياً:** يوجد `useOffline` + `offlineStorage` بسيط (localStorage queue).
- **الترقية المطلوبة:**
  - الانتقال إلى **Dexie (IndexedDB)** مع schema موحّد لكل الكيانات الحرجة (students, attendance, messages, wallet_transactions).
  - **Sync engine** ذكي: pull-then-push، حل تعارضات `last-write-wins` مع timestamp من الخادم، Outbox queue مع retry exponential backoff.
  - **Offline-first للأجهزة الحرجة:** CM30، شاشات الباص، شاشات بوابة المدرسة → تعمل كاملاً بدون إنترنت لمدة 24 ساعة، مزامنة تلقائية عند العودة.
  - **مؤشّر بصري:** OfflineIndicator موسّع يعرض عدد العناصر في القائمة + آخر مزامنة + زر "زامن الآن".
  - **Service Worker:** caching strategy: stale-while-revalidate للقراءات، queue للكتابات.

## 6) WhatsApp Business Integration (#20)

- **الفكرة:** الأهل الذين لا يفتحون التطبيق يصلهم نفس الإشعار الحرج عبر WhatsApp رسمي.
- **التقنية:** WhatsApp Cloud API (Meta) عبر Edge Function `send-whatsapp`.
- **القنوات المغطاة:** وصول الباص، الغياب، رصيد منخفض، إيصال الدفع، إشعارات الطوارئ.
- **القوالب (Templates):** يجب اعتمادها مسبقاً من Meta Business Manager (نوع `UTILITY` و `AUTHENTICATION`).
- **التفعيل:** اختياري لكل ولي أمر من الإعدادات → "تفعيل إشعارات WhatsApp" + التحقق من الرقم عبر OTP.
- **التكلفة:** ~0.005-0.03 USD لكل رسالة حسب الدولة → تُحسب كتكلفة تشغيلية، مجانية للأهل.
- **Secrets المطلوبة لاحقاً:** `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_BUSINESS_ACCOUNT_ID`.

---

## ترتيب التنفيذ المقترح (يُضاف بعد W4)

| الأسبوع | الميزة |
|---|---|
| **W5** | Offline Mode المحسّن (Dexie + Sync engine) — أساس لباقي الميزات |
| **W6** | Family Sharing (DB + UI + Permissions) |
| **W7** | Substitute Teacher Auto-Match + WhatsApp Business |
| **W8** | Home Screen Widget (iOS + Android) |
| **W9** | Apple Watch + Wear OS (read-only MVP) |

---

## ما يحتاج قرار / Secrets لاحقاً

- WhatsApp Business: حساب Meta Business + قوالب معتمدة + الأرقام المعتمدة.
- Apple Watch: يحتاج Apple Developer Account نفسه (موجود) لكن target جديد في Xcode.
- Widget: لا secrets، فقط App Group identifier.

---

هل نعتمد هذا الترتيب (W5→W9) أم تريد تقديم/تأخير ميزة معيّنة؟

---

## 7) تسجيل الدخول بالبصمة (Face ID / Touch ID / بصمة Android)

- **الهدف:** تسجيل دخول فوري وآمن بدون كتابة البريد وكلمة المرور في كل مرة، مع الحفاظ على نفس مستوى الأمان.
- **الوضع الحالي:** يوجد `src/services/nativeAuth.ts` يستخدم `capacitor-native-biometric` ويحفظ بيانات الاعتماد في Keychain (iOS) / Keystore (Android)، وهناك `BiometricGuard.tsx`. لكن التجربة غير مكتملة في شاشة تسجيل الدخول وليست مفعّلة افتراضياً.
- **التغييرات المطلوبة:**
  - **شاشة Auth:** بعد أول تسجيل دخول ناجح بكلمة المرور → Dialog "هل تريد تفعيل تسجيل الدخول بـ Face ID / بصمة الإصبع؟" (مرة واحدة لكل جهاز).
  - **زر Face ID / Fingerprint كبير وواضح** أعلى نموذج تسجيل الدخول إذا اكتشفنا وجود credentials محفوظة على الجهاز (`hasSavedCredentials()`).
  - **اكتشاف نوع البصمة تلقائياً:** أيقونة Face ID على iPhone X+، Touch ID على القديمة، Fingerprint على Android (عبر `biometryType` من `NativeBiometric.isAvailable()`).
  - **التحقق التلقائي عند فتح التطبيق:** إذا كانت الجلسة منتهية والـ credentials محفوظة → عرض البصمة فوراً بدون انتظار المستخدم (اختياري في الإعدادات).
  - **Fallback آمن:** بعد 3 محاولات فاشلة أو رفض البصمة → الرجوع لتسجيل الدخول العادي.
  - **إدارة من الإعدادات:** Settings → الأمان → تبديل "تفعيل البصمة" + زر "نسيان بياناتي على هذا الجهاز" (يمسح Keychain).
  - **حماية الإجراءات الحساسة (اختياري لاحقاً):** طلب البصمة قبل: تحويل من المحفظة، تغيير كلمة المرور، حذف الحساب — عبر `BiometricGuard`.
- **الأمان:**
  - البيانات محفوظة في Keychain/Keystore الأصلي للجهاز فقط (مشفّرة hardware-backed)، لا تُرسل للخادم أبداً.
  - عند تغيير كلمة المرور → تحديث الـ credentials المحفوظة تلقائياً، أو مسحها وطلب إعادة تفعيل.
  - عند تسجيل الخروج اليدوي → خيار "احتفظ بالبصمة لتسجيل الدخول مرة أخرى" أم "امسح كل شيء".
- **Web (PWA):** غير مدعومة عبر `capacitor-native-biometric`. الخيار المستقبلي: WebAuthn / Passkeys للمتصفحات الحديثة (مرحلة منفصلة).
- **الاعتماد على المنصة:**
  - iOS: مفتاح `NSFaceIDUsageDescription` في `Info.plist` (يُتحقق ويُضاف إن لم يكن موجوداً).
  - Android: صلاحية `USE_BIOMETRIC` في `AndroidManifest.xml`.
- **الترتيب:** يُضاف في **W5** بالتوازي مع Offline Mode (مهمة صغيرة UI + 2 hooks، الـ service جاهز).
