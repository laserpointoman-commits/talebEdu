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
