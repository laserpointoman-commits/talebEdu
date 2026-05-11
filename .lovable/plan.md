# خطة تطوير واجهة المستخدم — Hybrid Design System

## الهدف
نظام تصميم موحّد لكن بـ4 شخصيات بصرية حسب المستخدم. كل واجهة تخدم احتياج مختلف، مع الحفاظ على Sky branding الحالي + إضافة Light/Dark Mode للجميع.

---

## 1. الأساس المشترك (Design Tokens)

### Color System (HSL في `index.css`)
```text
Light Mode:
  --background: 0 0% 100%
  --foreground: 222 47% 11%
  --card: 0 0% 100%
  --muted: 210 40% 96%
  --border: 214 32% 91%
  --primary: 199 89% 48%        (Sky-500 — يبقى كما هو)
  --primary-glow: 198 93% 60%   (Sky-400)
  --primary-deep: 201 90% 35%   (Sky-700)
  --success: 142 71% 45%
  --warning: 32 95% 50%
  --danger: 0 84% 60%

Dark Mode:
  --background: 222 47% 6%      (#0a0e1a)
  --foreground: 210 40% 98%
  --card: 222 47% 9%
  --muted: 217 33% 14%
  --border: 217 33% 18%
  --primary: 198 93% 60%        (Sky-400 أوضح في الظلام)
  + glass tokens: --glass-bg, --glass-border, --glass-blur
```

### Typography
- **عربي UI:** IBM Plex Sans Arabic (موجود) — أوزان 400/500/600/700
- **English UI:** Inter (موجود)
- **أرقام تقنية (IDs, NFC, مبالغ):** IBM Plex Mono / JetBrains Mono
- **Display للعناوين الكبيرة:** Outfit (Super Admin + Parent فقط)

### Spacing & Radius
- Radius: `rounded-2xl` (16px) للبطاقات، `rounded-xl` للأزرار، `rounded-full` للشارات
- Spacing scale موحّد: 4 / 8 / 12 / 16 / 24 / 32 / 48
- Shadows: 4 طبقات (`shadow-sm`, `shadow-card`, `shadow-elevated`, `shadow-glow`)

### Motion (يحترم memory: NO Framer Motion)
- انتقالات CSS فقط: `transition-colors`, `transition-transform`
- Hover: `hover:-translate-y-0.5` + `hover:shadow-elevated`
- لا splash، لا pulse loaders، لا entrance animations

---

## 2. شخصيات الواجهات الأربع

### A. Super Admin (`/super-admin/*`) — Glass Command Center
**الإحساس:** مركز قيادة، نظرة شاملة على كل المدارس.

```text
┌─────────────────────────────────────────────────┐
│  [Logo]  TalebEdu Control          [User] [🌙] │
├─────────────────────────────────────────────────┤
│  KPI Strip:                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │
│  │ 12   │ │8,420 │ │ 96%  │ │ OMR  │           │
│  │Schools│ │Students│ │Uptime│ │24,500│         │
│  └──────┘ └──────┘ └──────┘ └──────┘           │
├─────────────────────────────────────────────────┤
│  Schools Grid (cards with live status)          │
│  Real-time activity feed (right rail)           │
└─────────────────────────────────────────────────┘
```

- **Background:** Dark default، gradient `#0a0e1a → #0f172a` مع noise خفيف
- **Cards:** `bg-card/60 backdrop-blur-xl` + border مضيء عند hover
- **Live dots:** نقاط Sky نابضة بـ CSS فقط (لا JS)
- **Density:** متوسطة، KPIs بارزة، جداول مدمجة

### B. School Admin (`/dashboard/*`) — Neo-Operational
**الإحساس:** أداة عمل يومية، كثافة بيانات عالية، كفاءة قصوى.

```text
┌──────┬──────────────────────────────────────────┐
│      │  Header: School name + date + actions   │
│ Side ├──────────────────────────────────────────┤
│ nav  │  KPI row (4-6 metrics)                  │
│      │  Main table / chart                     │
│      │  Secondary panel                        │
└──────┴──────────────────────────────────────────┘
```

- **Layout:** Sidebar ثابت يسار + main content
- **Cards:** `bg-card border` بدون glass، shadow خفيف
- **Tables:** كثيفة، monospace للـ IDs، sticky header
- **Accent:** Sky-500 على الأزرار الأساسية فقط، باقي الصفحة محايدة

### C. Supervisor / CM30 (`/supervisor`, `/checkpoints`) — Operational Mobile
**الإحساس:** ميداني، أزرار كبيرة، قراءة سريعة، يعمل بقفاز.

- **Min touch target:** 48×48px
- **Font sizes:** أكبر بـ 15% من النسخة الويب
- **Buttons:** `h-12` للأساسي، gradient Sky واضح
- **Status:** badges كبيرة بألوان واضحة (أخضر/أحمر/برتقالي)
- **Headers:** ثابتة fixed + safe-area-inset (memory موجود)
- **يحافظ على:** كل constraints الـ CM30 الموجودة (kiosk, NFC, masked PINs)

### D. Parent App (`/parent/*`) — Editorial Calm
**الإحساس:** هادئ، عاطفي، مطمئن. يستخدمه أهالي غير تقنيين.

```text
┌─────────────────────────────────────┐
│  مرحباً، أبو محمد                    │
│  ┌─────────────────────────────┐   │
│  │  محمد علي                    │   │
│  │  [صورة]  الصف الخامس / أ     │   │
│  │  ─────────────────────────   │   │
│  │  ✓ في المدرسة منذ 7:42 ص    │   │
│  │  الرصيد: 4.250 ر.ع.          │   │
│  └─────────────────────────────┘   │
│  [Quick actions: شحن، رسالة، طوارئ]│
│  Timeline: آخر الأحداث              │
└─────────────────────────────────────┘
```

- **Layout:** عمود واحد، مسافات واسعة (24-32px padding)
- **Typography:** عناوين كبيرة (24-32px)، body مريح (16-17px)
- **Cards:** `rounded-2xl` بدون border، shadow خفيف، خلفية بيضاء نقية
- **Color:** Sky كـ accent فقط، باقي محايد دافئ
- **Bottom nav:** 4 أيقونات كبيرة (الرئيسية، المحفظة، الرسائل، الملف)

---

## 3. مكتبة المكونات الموحّدة

ملفات جديدة في `src/components/ui-v2/`:
- `KPICard.tsx` — بطاقة إحصاء (3 variants: compact / standard / hero)
- `LiveBadge.tsx` — شارة "مباشر" مع نقطة نابضة CSS
- `DataTable.tsx` — جدول كثيف موحّد (sortable, filterable, sticky header)
- `PersonaShell.tsx` — wrapper يطبّق theme variant حسب المستخدم
- `GlassCard.tsx` — بطاقة زجاجية للـ Super Admin
- `EditorialCard.tsx` — بطاقة هادئة للأهل
- `OperationalButton.tsx` — زر كبير للميدان (CM30/Supervisor)
- `StatPill.tsx` — chip صغير للأرقام
- `EmptyState.tsx` — حالة فارغة موحّدة بصرياً
- `ThemeToggle.tsx` — مفتاح Light/Dark + persisted في localStorage

كل المكونات تستخدم semantic tokens فقط (لا ألوان مباشرة).

---

## 4. خطة التنفيذ على 4 جولات

| الجولة | المحتوى | الوقت المقدّر |
|---|---|---|
| **1** | Tokens (index.css + tailwind.config) + Light/Dark toggle + 4 مكونات أساسية (KPICard, LiveBadge, DataTable, ThemeToggle) | جلسة واحدة |
| **2** | Super Admin Dashboard كامل بالـ Glass Command Center | جلسة واحدة |
| **3** | School Admin Dashboard refresh (Sidebar + KPI row + tables) | جلسة واحدة |
| **4** | Parent App home + Supervisor mobile polish | جلسة واحدة |

كل جولة = PR مستقل، قابل للاختبار، لا يكسر الموجود.

---

## 5. مبادئ ثابتة (لا تتغيّر)

1. **NO Framer Motion** — انتقالات CSS فقط
2. **NO splash / pulse loaders** — skeleton states أو فراغ نظيف
3. **Masked PINs (●)** في كل مكان — موجود
4. **Fixed headers + safe-area-insets** على الموبايل — موجود
5. **High-density Mono** للـ IDs والأرقام التقنية
6. **Sky branding** — نفس الـ Sky-400 → 600 الحالي

---

## التقنيات
- Tailwind CSS v3 + CSS variables (HSL)
- shadcn/ui كأساس + variants مخصصة عبر `cva`
- Capacitor 7 (يعمل على iOS + Android بدون تغيير)
- Theme persistence: `localStorage` + `<html data-theme>` switcher
- لا مكتبات جديدة (zero new dependencies)

---

## خارج النطاق
- إعادة بناء صفحات الميزات الفردية (Bus tracking, Wallet, إلخ) — تتطوّر تدريجياً مع كل feature
- Logo جديد أو هوية كاملة — Sky يبقى كما هو
- Animations معقدة — ممنوعة بحكم memory

---

## النتيجة المتوقعة
- 4 واجهات بشخصيات مميزة لكن متناغمة
- Light + Dark على الكل
- صفر animations ثقيلة → سرعة فائقة
- مكتبة `ui-v2` قابلة لإعادة الاستخدام في كل ميزة قادمة
- جاهزية كاملة لعرض أي شاشة على المستثمرين/المدارس بمظهر احترافي

بعد الموافقة، نبدأ بالجولة 1 (Tokens + المكونات الأساسية).