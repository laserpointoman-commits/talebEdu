# خطة الإطلاق — 3 شهور (12 أسبوع)

**الهدف:** نظام multi-tenant جاهز لـ 50+ مدرسة، مستقر، آمن، ومراقَب — كأنه مجرّب من سنين.

**فريق العمل:**
- البرمجة: أنا (Lovable) + أنت
- العقود/القانوني/مبيعات: شريكك
- الدعم: شخص part-time + Cloude Agent
- التركيب: أنت + الفني

---

## القرارات المعتمدة

| البند | القرار |
|------|-------|
| Monitoring | Sentry + Cloudflare WAF + UptimeRobot |
| Environments | Staging + Production منفصلين |
| Backups (الآن) | Daily backups المجاني (Supabase الافتراضي) |
| Backups (عند أول مدرسة) | Daily + PITR + S3 weekly external |
| اسم Super Admin | TalebEdu |
| Demo School | تم الإنشاء (00000000-0000-0000-0000-000000000001) |
| MVP Priority | **توصيتي:** Auth + Multi-tenancy + Dashboards أولاً، بعدين Bus، بعدين Wallet |

---

## رأيي في ترتيب الأولوية (بدون مجاملة)

**أنت قلت "ما تعرف"، فأرتّب لك حسب الأهم لاستقرار الإنتاج:**

1. **Auth + Multi-tenancy + RLS صلب** = الأساس. لو فيه bug هنا، كل المدارس تشوف بيانات بعض. كارثة.
2. **Bus + NFC + GPS + Auto-absence** = الميزة الأساسية اللي تبيع المنتج. مدارس تدفع علشانها.
3. **Wallet + Thawani** = إيراد إضافي + per-school merchant معقّد. آخر شيء عشان نضمن استقرار الـ core.

---

## الشهر الأول — الأساس والبنية التحتية (الأسابيع 1-4)

### الأسبوع 1: إكمال Multi-tenancy
- ربط باقي ~35 جدول بـ `school_id` (students, attendance_records, buses, bus_routes, teachers, employees, wallet_balances, fees, إلخ)
- إضافة triggers تلقائية لـ `set_school_id_from_user` على كل جدول
- Composite indexes على `(school_id, ...)` للأداء
- اختبار RLS بمستخدم وهمي من مدرستين مختلفتين

### الأسبوع 2: Super Admin Dashboard
- صفحة `/super-admin` — إنشاء مدرسة جديدة، إنشاء admin أول للمدرسة
- صفحة قائمة المدارس مع الإحصائيات (عدد طلاب، حالة الاشتراك)
- صفحة تفعيل/تعطيل مدرسة
- الصلاحية: فقط `super_admin` role

### الأسبوع 3: Staging Environment
- إنشاء مشروع Lovable Cloud ثاني للـ Staging
- Workflow: تطوير → Staging → اختبار → Production
- Seed data لـ Staging (مدرسة وهمية + 100 طالب + 5 باصات)
- توثيق كيف نطلق migration على Staging قبل Production

### الأسبوع 4: Monitoring & Security
- إعداد Sentry (Frontend + Edge Functions) — تتبّع أخطاء حقيقية
- إعداد Cloudflare WAF أمام الدومين — حماية من DDoS و bots
- إعداد UptimeRobot — فحص كل دقيقة + تنبيه على جوالك
- Audit log: كل عملية حساسة (إنشاء/حذف/تعديل صلاحيات) تتسجّل
- Rate limiting per school (موجود، نتأكد يشتغل بـ school_id)

---

## الشهر الثاني — ميزات الباص الأساسية (الأسابيع 5-8)

### الأسبوع 5: Bus + NFC تنظيف
- مراجعة كاملة للـ NFC scanning loop (موجود ومعمول)
- التأكد من scoping بـ school_id (سائق ما يقدر يفحص طالب من مدرسة ثانية)
- اختبار CM30 device في Staging مع school_id تجريبي
- إصلاح أي bugs ظاهرة في logs الحالية

### الأسبوع 6: GPS Tracking + Real-time
- مراجعة Supabase Realtime channels — تأكيد أن كل قناة scoped بـ school_id
- اختبار الأداء مع 5 باصات × 50 طالب يبثّون موقع كل 5 ثواني
- Fallback polling لما Realtime يفشل (موجود)

### الأسبوع 7: Auto-absence + Notifications
- تأكيد منطق الغياب التلقائي (End Trip → mark no-shows)
- Notification queue scoped per school
- اختبار FCM (Android) + APNS (iOS) في Staging

### الأسبوع 8: Parent App Polish
- تأكيد parent يشوف فقط أطفاله في مدرسته
- Live bus map للولي
- Performance check: صفحة الباص تفتح < 1 ثانية

---

## الشهر الثالث — Wallet + Pre-launch (الأسابيع 9-12)

### الأسبوع 9: Wallet Foundation
- Wallet balance scoped بـ school_id
- Daily allowance على NFC entry (موجود)
- Savings cap + bracelet stop/replace flows

### الأسبوع 10: Thawani per-school Merchants
- جدول `school_payment_configs` (Thawani publishable + secret per school)
- Edge function `thawani-checkout` يستخدم credentials المدرسة الصحيحة
- Top-up flow + 2% fee
- Monthly commission invoice generator

### الأسبوع 11: Load Testing + Security Audit
- محاكاة 500 NFC scan/دقيقة على staging
- محاكاة 1000 parent يفتحون التطبيق نفس اللحظة
- اختبار اختراق: مستخدم من مدرسة A يحاول يصل بيانات مدرسة B (لازم يفشل)
- مراجعة كل RLS policy يدوياً
- Supabase linter — صفر warnings

### الأسبوع 12: Onboarding المدرسة الأولى
- ترقية Backups إلى PITR + S3 weekly
- إنشاء أول مدرسة حقيقية في Production
- تركيب CM30 ميداني
- مراقبة 24 ساعة كاملة قبل التسليم النهائي

---

## التقنيات التي سنستخدمها (الأحدث)

| الطبقة | التقنية | السبب |
|--------|---------|-------|
| Frontend | React 18 + Vite 5 + TS 5 | الموجود، الأفضل |
| Backend | Supabase (Lovable Cloud) | شغّال، RLS قوي |
| Mobile | Capacitor 7 + JDK 21 | الموجود |
| Monitoring | Sentry + UptimeRobot | معيار الصناعة |
| CDN/Security | Cloudflare WAF | حماية عند first school |
| AI | Lovable AI Gateway | بدون API keys |
| Payments | Thawani per-school | متطلب السوق العماني |
| Push | FCM + APNS | معمول |

---

## ما لن نضيفه (Out of Scope للـ 3 شهور)

- مدفوعات Stripe/Paddle (Thawani كافي للسوق المحلي)
- E-commerce store كامل (يأتي بعد الإطلاق)
- AI tutoring features
- Video calls (Emergency call System موجود وكافي)
- Self-signup للمدارس (أنت تُنشئ يدوياً)

---

## مخرجات نهاية كل أسبوع

كل جمعة، نتفق على:
1. ما تم
2. ما تأخر ولماذا
3. خطة الأسبوع الجاي
4. أي قرار يحتاج موافقتك

---

## المخاطر التي عرّفتها لك مسبقاً

| الخطر | الاحتمال | الحل |
|------|---------|------|
| Production down وأنا نائم | متوسط | UptimeRobot + Auto-rollback + استشاري Senior جاهز |
| RLS bug يكشف بيانات مدارس | منخفض (مع الاختبار) | اختبار اختراق أسبوع 11 + audit log |
| CM30 يهنق ميدانياً | عالي | تركيب أول مدرسة بحضورك + spare device |
| Thawani API يتغير | منخفض | wrapper layer + version locking |

---

## الخطوة الجاية

لو الخطة موافق عليها، أبدأ **الأسبوع 1: ربط باقي الجداول بـ school_id**. هذي migration كبيرة (~35 جدول)، سأقسّمها على دفعتين عشان نختبر بين كل دفعة.

**سؤال أخير قبل ما نبدأ التنفيذ:**
هل تبيني أحوّلك أنت إلى `super_admin` الآن؟ لو نعم، أعطني إيميلك المسجّل.
