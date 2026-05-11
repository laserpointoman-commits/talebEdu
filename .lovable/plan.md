# خطة الإطلاق — 3 شهور للمدرسة الأولى

## القرارات المعتمدة
- **الموعد:** 3 شهور (إطلاق ضيّق وقوي، لا "كل شيء دفعة وحدة")
- **الدعم:** موظف فني بدوام جزئي + أنا وأنت للتطوير
- **الهيكل:** قاعدة بيانات موحّدة + `school_id` + RLS صارم لكل جدول

---

## فلسفة الإطلاق

في 3 شهور، **مستحيل** نطلع 12 نظام بجودة Production. الواقع:
- **شهر 1:** هيكلة multi-tenant + إصلاح ما بُني سابقاً ليدعم school_id
- **شهر 2:** MVP الميداني (باص + حضور + إشعارات + محفظة أساسية)
- **شهر 3:** اختبار حقيقي في مدرسة تجريبية + إصلاح bugs + تدريب

**ما يدخل MVP:** الباص، الحضور NFC، إشعارات ولي الأمر، المحفظة الأساسية، Thawani topup، لوحات إدارة المدرسة.
**ما يتأجل لما بعد المدرسة الأولى:** المقصف الكامل، المتجر، الماسنجر الاجتماعي للطلاب، الـ Payroll، التقارير المتقدمة، Offline mode الكامل.

---

## المرحلة 1 — التأسيس (الأسابيع 1-4)

### 1.1 Multi-tenancy (الأهم)
- إضافة جدول `schools` (الاسم، الشعار، الإعدادات، حالة الاشتراك)
- إضافة عمود `school_id` لكل الجداول الرئيسية (~40 جدول)
- كتابة security definer function: `get_user_school_id()`
- تحديث **كل** RLS policy لتفلتر بـ `school_id = get_user_school_id()`
- Migration script لتعبئة `school_id` للبيانات الموجودة

### 1.2 تنظيف الكود الموجود
- مراجعة الـ Edge Functions (50+) للتأكد من احترام school_id
- مراجعة كل query في الـ frontend (~150 ملف)
- إزالة الـ test/demo accounts من production schema

### 1.3 الأمان الأساسي
- تشغيل Security Scan + Linter وإصلاح كل warnings
- تفعيل Leaked Password Protection (HIBP)
- مراجعة الـ secrets (Thawani, FCM, APNS)
- Rate limiting على endpoints الحساسة (login, payment, NFC scan)
- Audit log لكل العمليات المالية

### 1.4 البنية التحتية
- ترقية Supabase instance حسب الحاجة
- إعداد backups يومية + اختبار restore
- Monitoring: Sentry للـ errors + Lovable analytics
- Status page بسيط للعميل

---

## المرحلة 2 — MVP الميداني (الأسابيع 5-8)

### 2.1 نظام الباص
- إصلاح bugs `bus-attendance-trip-scoping` و `nfc-scan-loop-stability`
- اختبار GPS في ظروف ضعف الإنترنت
- زر "تسجيل غياب" عند الوصول للموقع (بدون مهلة) — حسب اتفاقنا
- Auto-absence عند End Trip في المدرسة
- تتبع لحظي لولي الأمر (Live + Last Known)

### 2.2 الحضور المدرسي (NFC)
- تثبيت كود التحقق NFC
- تنبيه ولي الأمر فوراً عند دخول/خروج الطفل من المدرسة
- لوحة الحضور للإدارة + تقارير يومية

### 2.3 المحفظة (مبسّطة)
- Thawani topup للولي (per-school merchant)
- المصروف اليومي عند دخول المدرسة (NFC)
- بدون حد أقصى للحصالة (حسب اتفاقنا)
- شاشة المعاملات لولي الأمر + الطالب
- إيقاف/استبدال السوار (سعر مرن لكل مدرسة)

### 2.4 الإشعارات
- FCM (Android) + APNS (iOS) — مُختبرة في البيئة الحقيقية
- 4 أنواع للـ MVP: حضور المدرسة، حضور الباص، وصول الباص للمنطقة، معاملات المحفظة
- إعدادات الإشعار لكل مستخدم

### 2.5 لوحات الإدارة
- لوحة مدير المدرسة: طلاب، معلمين، باصات، خطوط، إعدادات
- لوحة المشرف (CM30): قائمة طلاب الباص + scan + GPS
- لوحة ولي الأمر: أبناء، حضور، باص، محفظة، إشعارات

---

## المرحلة 3 — الاختبار الميداني (الأسابيع 9-12)

### 3.1 مدرسة تجريبية واحدة (Pilot)
- اختيار مدرسة صغيرة (50-100 طالب) للأسبوع 9-10
- تثبيت أجهزة CM30 + اختبار NFC في الجو الحار/البارد
- اختبار GPS في مناطق التغطية الضعيفة
- Stress test: 100 scan متزامن + 50 إشعار/دقيقة

### 3.2 التدريب والمحتوى
- 6 فيديوهات تدريب (دور لكل: مدير، ولي أمر، معلم، سائق، مشرف، طالب)
- دليل تركيب CM30 خطوة بخطوة
- FAQ مكتوب للأسئلة الشائعة
- WhatsApp Business للدعم السريع

### 3.3 إصلاح Bugs + Polish
- مراجعة كل التقارير من المدرسة التجريبية
- Performance: تحميل الصفحات < 2 ثانية
- Battery optimization للـ GPS

### 3.4 الاستعداد التشغيلي
- تعيين موظف الدعم الفني وتدريبه (الأسبوع 11)
- SOPs (Standard Operating Procedures): تركيب جهاز جديد، إضافة طالب، حل مشكلة دفع
- E&O Insurance أو على الأقل Terms of Service واضحة
- خطة طوارئ: إذا نزل Supabase، إذا فشل Thawani، إذا ضاع جهاز CM30

---

## ما يتأجل (لما بعد الإطلاق)

| الميزة | الموعد المقترح |
|--------|---------------|
| المقصف الكامل + Parental Controls المتقدمة | شهر 4-5 |
| المتجر الإلكتروني | شهر 5-6 |
| Payroll + Employee Management | شهر 6-7 |
| Messenger الاجتماعي للطلاب | شهر 7+ |
| Offline-first mode الكامل | شهر 4-6 (تدريجي) |
| تقارير متقدمة + Analytics للمدير | شهر 5+ |
| Emergency Call System polish | شهر 4 |

---

## تفاصيل تقنية (للمراجعة)

### قاعدة البيانات
```text
schools (id, name, name_ar, logo_url, settings jsonb, subscription_status, created_at)
school_settings (school_id, bracelet_price, allowance_default, ...)
school_subscriptions (school_id, plan, active_users, monthly_fee)
```

كل جدول حالي يحصل على:
- `school_id uuid not null references schools(id)`
- Index على `school_id`
- RLS policy: `school_id = public.get_user_school_id()`

### Edge Functions الجديدة المطلوبة
- `school-onboarding` (إنشاء مدرسة + admin أول)
- `thawani-merchant-setup` (per-school merchant account)
- `monthly-billing` (فاتورة رسوم الأساور المستخدمة + 2% commission)
- `bracelet-inventory` (تتبع الأساور الموزعة لكل مدرسة)

### المخاطر الكبرى وكيف نتفاداها

| الخطر | التخفيف |
|-------|----------|
| migration ضخم يكسر بيانات قديمة | كل migration على staging أولاً، rollback plan |
| Thawani يرفض دفعة في وقت حرج | Webhook retry + manual reconciliation tool |
| Apple يرفض النشر | تقديم build مبكر في الأسبوع 8، ليس الأسبوع 12 |
| ولي أمر يخسر فلوس بسبب bug | Audit log كامل + insurance + SLA reverse charge |
| السائق ينسى End Trip | Geofence auto-end عند المدرسة |

---

## الخطوة الأولى الفعلية بعد الموافقة

**الأسبوع 1:** نبدأ بـ migration الـ multi-tenancy. هذا أساس كل شيء وأخطر شيء — لو غلط، الباقي ينهار.

أولاً نسوي:
1. جدول `schools` + `get_user_school_id()` function
2. إضافة `school_id` لـ 5 جداول حرجة (students, profiles, buses, bus_routes, attendance_records) كنموذج أولي
3. تحديث RLS لهذه الجداول الخمسة
4. اختبار شامل في staging
5. لو نجح، نطبق على باقي الجداول دفعة وحدة

**ما أبيك تعمله الآن:**
- تأكيد اسم الشركة الرسمي (للـ schools.created_by الأول)
- إعداد حساب Thawani Test merchant
- لو ممكن، اسم المدرسة التجريبية المستهدفة

---

## ملاحظة شخصية

هذا plan طموح لكن قابل للتنفيذ بشرط:
1. **ما نضيف scope جديد** خلال الـ 3 شهور (أنا بقولها كل ما تطلب feature: "بعد الإطلاق")
2. **توظيف الدعم الفني في الأسبوع 8 على الأكثر** (ليس بعد الإطلاق)
3. **المدرسة التجريبية تكون صغيرة** (50-100 طالب، ليس 500)

لو وافقت، نبدأ فوراً بالأسبوع 1.