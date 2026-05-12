# TalebEdu — Complete 3-Month Execution Plan

**Context:** Ministry of Education (Oman) initial contract. Trial school: 1,000 students for 2 months. Possible expansion: 10 schools (~10,000 students). Solo founder, no engineering team. Devices ready: CM30 buses, school entrance scanners. Pending: canteen POS device.

**Hard rule:** No new feature requests during the trial. Every week below is scoped to lock-in success of the trial school.

---

# 0) Architecture Principles (Locked Decisions)

These rules govern every decision below. Any future request that violates them is rejected by default.

## 0.1 One App, One Experience
- **Single app for all human users:** Parents, School Staff, Students, Admins all use the same TalebEdu app. No separate downloads.
- **No fragmentation in this phase.** Goal = daily adoption with zero friction. Splitting apps comes only after 100k MAU, never before.
- **Device-only apps stay separate:** CM30 bus mode, school-entrance kiosk, canteen POS — these are *device firmware*, not user apps.

## 0.2 Modular Internally, Unified Externally
```text
src/
  core/         Auth, Profile, Notifications, Theme, i18n
  modules/      attendance/ transport/ messenger/ remote-learning/
                canteen/ newsfeed/ wallet/ schedule/ family/
  shared/       UI components, hooks, utils
  features/     thin route wrappers that lazy-load modules
```
- Every module is **lazy-loaded** via `React.lazy` + `Suspense` (no fallback UI — empty fragment, instant nav rule).
- Every module owns its own Dexie tables, hooks, and Edge Functions.
- Cross-module communication only via `core/` events or Supabase Realtime — never direct imports.
- A module can be removed/disabled via Feature Flag without touching others.

## 0.3 Messenger = Internal Module (Not Separate App)
- Lives at `/messages` inside the main app.
- WebSocket / Realtime channel opens **only when the user enters Messages**, closes on exit. Background = Push only.
- Dexie cache stays warm so re-entry is instant.
- Calls (WebRTC) initialize on demand — never on app launch.
- This kills 90% of battery + crash risk while keeping UX seamless.

## 0.4 Remote Learning = Embedded WebView
- Live class UI runs as a managed WebView wrapping Daily.co (or Jitsi).
- Native shell handles: auth handoff (signed token), camera/mic permissions, picture-in-picture, attendance ping back to native layer.
- Updates to the live-class UI ship instantly without App Store review.
- Native CallKit / VoIP push reused only for *teacher↔student 1:1 voice calls*, not classroom video.

## 0.5 Feature Flags from Day One (W1)
- Table `feature_flags(key, enabled, rollout_percent, school_ids[], roles[])`.
- Hook `useFeatureFlag('messenger_v2')` everywhere.
- Every new module ships behind a flag. Default OFF for production, ON for trial school only.
- Lets us kill a broken feature in 1 second without redeploying.

## 0.6 Performance Budgets (Enforced)
| Metric | Budget |
|---|---|
| Initial JS bundle (main route) | ≤ 350 KB gzipped |
| Time to interactive (4G) | ≤ 2.0 s |
| Route transition | ≤ 100 ms (no loaders allowed) |
| Cold start (native) | ≤ 1.5 s |
| Memory on CM30 | ≤ 250 MB sustained |
| Battery drain (idle parent app) | ≤ 2%/hour |

CI fails the build if any budget regresses by >10%.

## 0.7 Risk Mitigation (Built-In, Not Bolted-On)
- **Crash isolation:** every module wrapped in `<ErrorBoundary>` with Sentry capture + auto-fallback UI. A broken module never takes down the app.
- **Defensive realtime:** every Supabase subscription has a 30 s heartbeat + auto-reconnect with exponential backoff.
- **Offline-first writes:** all mutations go through the Outbox (Dexie). Network failure = silent retry, not error.
- **Sentry + LogRocket** wired in W1 for production observability.
- **Kill-switch per module** via feature flag (see 0.5).
- **Rate limiting** on every Edge Function (per user + per school) to prevent abuse and runaway costs.
- **Cost alarms:** Lovable Cloud + Daily.co + WhatsApp daily-spend alerts wired to founder phone.

## 0.8 Naming & Branding (Locked)
- Use **"System" / "نظام"** — never "Application".
- Full name: **Smart Student Safety and Tracking System**.
- Sky-400→600 brand gradient. `rounded-2xl` cards. Masked PINs (`●`).
- No Framer Motion. No splash screens. No CSS pulse loaders.

---

## Master Roadmap (12 weeks)

| Week | Track |
|---|---|
| W1 | Role/permission cleanup, RLS audit, Health Check, audit log, daily backups, **Feature Flags + Sentry + Modular folder restructure + ErrorBoundaries** |
| W2 | Multi-School Architecture + Messenger 2.0 restructure (Dexie, virtualized lists, unified components) |
| W3 | News Feed + Auto Schedule generator + Messenger WebRTC core |
| W4 | Remote Learning Stage 1 (live classes, chat, auto attendance) + Messenger CallKit/ConnectionService + VoIP Push + Hybrid UI Design System foundation |
| W5 | Remote Learning Stage 2 (recording, library, digital assignments) + Offline Mode upgrade (Dexie + Sync engine) + Biometric Login |
| W6 | Canteen Cash Register (Sunmi V2 Pro integration) + Remote Learning advanced features (AI summary, parent reports) |
| W7 | Family Sharing (DB + UI + permissions) + Substitute Teacher Auto-Match + WhatsApp Business integration |
| W8 | Bulk import (Excel) + School Setup Wizard + bulk NFC card generation |
| W9 | Multi-school monitoring dashboard, automatic alerts, simple Help Desk |
| W10 | Home Screen Widget (iOS WidgetKit + Android AppWidgetProvider) |
| W11 | Apple Watch + Wear OS (read-only MVP) |
| W12 | Load test (10,000 fake students), failure simulations, user guides (PDF), training videos, official Ministry deliverables |

---

# 1) Stabilization & Security Phase (W1)

**Goal:** Make the existing system bullet-proof before adding anything new. This is the foundation that protects the founder from Ministry-level liability.

## 1.1 Role & Permission Cleanup
- Unify the dual logic between `profiles.role` and `user_role_assignments` — single source of truth in `user_role_assignments` with the existing `has_role()` SECURITY DEFINER function.
- Remove all client-side role checks; route guards must call `has_role()`.
- Test matrix: admin, school_admin, teacher, parent, student, driver, supervisor, canteen — every screen, every action.

## 1.2 RLS Audit
- Inspect every RLS policy across all 100+ tables.
- Replace any `auth.uid() IS NOT NULL` (overly permissive) with role-scoped + school-scoped policies.
- Ensure sensitive tables (drivers' license info, wallet transactions, medical records) are admin-only.
- Run `supabase--linter` and resolve all warnings.

## 1.3 Health Check Dashboard
- New page `/admin/system-health` accessible to super-admin only.
- Live status of: DB connection, Realtime, Storage, Edge Functions, FCM/APNS delivery rate, NFC scan success rate per device, last bus GPS update per route.
- Color-coded (green/yellow/red) with timestamp of last check.

## 1.4 Audit Log
- Append-only `audit_logs` table capturing: who, what, when, before/after for every sensitive mutation (role change, wallet transfer, attendance edit, student deletion).
- Admin-only viewer with filters by user, table, date range.

## 1.5 Backup & Disaster Recovery
- Daily automatic Postgres backups (Lovable Cloud built-in) verified in writing.
- Documented Disaster Recovery Plan (DRP): RTO 4h, RPO 24h.
- Rollback button on every deployment via Lovable revert.

## 1.6 Security Documentation (for the Ministry)
- Architecture Document (PDF)
- Security & Privacy Policy (Oman PDPL-compatible)
- Proposed SLA (response times, uptime targets, data ownership clauses)
- Incident response procedure

---

# 2) Multi-School Architecture (W2)

**Goal:** Enable safe expansion to 10 schools without rewriting anything later.

- New `schools` table (name, license_number, address, phone, logo, plan_tier).
- Add `school_id` foreign key to every tenant-scoped table (students, teachers, classes, buses, routes, attendance, finance, etc.).
- Migration script to assign existing data to "School #1".
- New role: `school_admin` (sees their school only).
- New role: `super_admin` (sees all schools).
- All RLS policies updated to enforce `school_id = (SELECT school_id FROM profiles WHERE id = auth.uid())`.
- New Super Admin dashboard: aggregate metrics across schools, drill-down per school, system health per school.
- School switcher UI for super_admin.

---

# 3) Hybrid UI Design System (W4 in parallel)

**Goal:** Different visual personality per persona, unified design tokens, light + dark.

- Sky-400 to 600 brand gradient, `rounded-2xl` cards, masked PINs (●) everywhere.
- Four persona interfaces:
  - **Super Admin** — Glass / metric-dense
  - **School Admin** — Neo-Operational
  - **Supervisor / Driver** — Operational Mobile (high-density, large touch targets)
  - **Parent** — Editorial Calm (calmer typography, generous spacing)
- Centralized design tokens in `index.css` and `tailwind.config.ts`.
- No Framer Motion, no splash screens, no CSS pulse loaders (instant navigation rule).
- Mobile fixed headers/footers with safe-area-insets, `h-[100dvh]`, `overscroll-none`.

---

# 4) Messenger 2.0 (W2–W4)

## 4.1 Diagnosis (Current State)
- 25+ duplicated files in `src/components/messenger/` (`ChatHeader` + `SimplifiedChatHeader`, `MessageBubble` + `EnhancedMessageBubble`, `WhatsAppTheme` + `MessengerTheme`).
- No Virtualization → janky on large conversations.
- No real WebRTC, no STUN/TURN, no CallKit/ConnectionService → calls don't actually work.
- No VoIP push → calls don't ring when app is closed.
- Unreliable delivered/read receipts.

## 4.2 Goals
- Conversation open in <200ms.
- 60fps scrolling with 10,000+ messages.
- Messages always deliver (offline queue + retry).
- Calls always ring (VoIP push + system call UI).
- WhatsApp/Telegram-quality feel.

## 4.3 New Architecture
- **Messages:** Supabase Realtime + Dexie (IndexedDB) cache for instant open. Outbox pattern with `pending → sent → delivered → read`. `@tanstack/react-virtual` for both conversation list and message list.
- **Calls:** Edge Function `call-signaling` over Supabase Realtime Broadcast for SDP/ICE exchange. Managed TURN service (Twilio Network Traversal, Metered.ca, or Cloudflare Calls). WebRTC via `simple-peer` or raw RTCPeerConnection. Audio + video + screen share.
- **System integration:** `@capacitor-community/call-kit` (iOS) + custom ConnectionService plugin (Android). VoIP push via `capacitor-voip-pushnotification` and a dedicated `push-call` Edge Function. New high-priority `voip` notification channel.

## 4.4 File Restructure
```text
src/features/messenger/
  data/    db.ts, outbox.ts, useMessages.ts, useConversations.ts
  call/    CallProvider.tsx, useWebRTC.ts, signaling.ts, callKit.ts
  ui/      ConversationList.tsx, MessageList.tsx, MessageBubble.tsx,
           Composer.tsx, CallScreen.tsx, IncomingCallSheet.tsx
  index.tsx
```
Delete from `src/components/messenger/`: `SimplifiedChatHeader`, `EnhancedMessageBubble`, `WhatsAppTheme`.

## 4.5 Out of Scope (later)
- Group calls (needs SFU like LiveKit)
- E2E encryption
- Stories / Status

---

# 5) News Feed (W3)

- **Publishers:** School only (admin / school_admin role).
- **Content:** text + images + video, target audience selector (everyone / specific class / parents only / staff only), pin important posts.
- **Reactions:** like + optional comments (toggle per post).
- **Notifications:** automatic push to targeted audience on publish.
- **DB:** `news_posts(school_id, author_id, title, body, media_urls[], target_audience, pinned, published_at)` and `news_reactions`, `news_comments`.

---

# 6) Auto Schedule Generator (W3)

- **Input:** subjects, teachers (with subjects taught and weekly load), classes, classrooms, weekly hours per subject per class, working days/hours, breaks.
- **Output:** weekly timetable per class and per teacher, downloadable PDF.
- **Algorithm:** Constraint Satisfaction Problem (CSP) — runs as an Edge Function `generate-schedule`.
- **Hard constraints:** no teacher in two places at once, no classroom double-booked, no class with two subjects at once.
- **Soft constraints:** difficult subjects in morning, balanced distribution across the week, respect teacher preferences (no classes after break, days off).
- **Manual edits:** drag-and-drop after generation; regenerate on teacher absence or new subject.

---

# 7) Remote Learning (W4–W6) — The Ministry's #1 Priority

**Why this matters:** the Ministry's existing platform "Noor" has known reliability problems. This is the differentiator that wins the contract.

## 7.1 Stage 1 — Foundations (W4)
- Live classrooms (HD video, screen share, raise hand, in-class chat).
- Auto attendance — student joining a class is automatically marked present in the existing attendance system.
- Per-class audience: only enrolled students join, teacher mute/kick controls.
- Provider: **Daily.co** (recommended, ~10,000 free minutes/month, then ~$0.004/min/participant) with Jitsi as fallback.

## 7.2 Stage 2 — Content (W5)
- Auto recording of every session, stored in Supabase Storage, auto-indexed in the student library.
- **Smart Library:** PDFs, videos, presentations organized by subject/class/section with AI-powered search.
- **Digital assignments & quizzes:** multiple question types (MCQ, true/false, essay), auto-grading for objective questions, in-app submission.
- **Offline downloads:** cache lessons for low-connectivity rural schools.

## 7.3 Stage 3 — Differentiators (W6)
- **AI post-class summary** via Lovable AI Gateway (Gemini): auto-generated summary, review questions, study plan.
- **AI student tutor:** answers questions from the recorded lessons.
- **Live translation** for non-Arabic-native students.
- **Parent dashboard:** virtual class schedule, per-class report (attendance, engagement, comprehension), recordings access, direct teacher messaging.
- Achievements & badges, polls, Q&A board.

## 7.4 Competitive edge over Noor / Zoom / Teams
- Integrated with attendance, grades, assignments — single system.
- Auto attendance vs manual.
- Per-class parent reports vs none.
- AI summary vs none.
- 100% Arabic UI.
- Offline mode for weak networks.

## 7.5 Costs
- Daily.co: ~$50–200/month at trial scale.
- Storage (recordings): ~$30–80/month.
- AI: within Lovable AI quota.

---

# 8) Canteen Cash Register (W6)

## 8.1 Hardware
- **Recommendation:** Sunmi V2 Pro (~80–120 OMR) — Android + NFC + integrated thermal printer + battery + barcode scanner. Available in Oman through official distributor.
- Alternatives: Sunmi P2 Lite (60–90 OMR, no battery), or repurposed CM30 (no printer).

## 8.2 Flow
1. Student taps NFC bracelet/card.
2. Cashier selects items on touchscreen.
3. Auto-deduct from student wallet.
4. Print thermal receipt + push notification to parent with itemized purchase.

## 8.3 Software
- New `canteen` role with dedicated cashier UI optimized for the Sunmi screen size.
- Item catalog managed by school admin (name, price, category, image, daily limit per student).
- Daily X/Z reports per cashier and per school.
- Integration with existing wallet allowance/restrictions logic.

---

# 9) Family Sharing (W7)

- **Model:** Each student belongs to a `family`. Each family has multiple `family_members` with distinct roles.
- **Roles:** `primary_guardian` (full control + finance), `guardian` (monitor + receive alerts), `viewer` (monitor only, no sensitive alerts), `pickup_only` (visible in Smart Pickup, no app access).
- **DB:** `families` and `family_members(family_id, user_id, role, can_pickup, can_receive_alerts, can_view_finance)`. Add `students.family_id`.
- **UI:** "My Family" page in Settings — invite by phone/email, permission editor, remove member, activity log.
- **Notifications:** route per `can_receive_alerts`, deduplicate per event so the same alert doesn't fire to all 5 members independently.

---

# 10) Substitute Teacher Auto-Match (W7)

- **Trigger:** teacher absence registered.
- **Algorithm:** `score = specialization_match*0.5 + availability*0.3 + (1 - load_ratio)*0.2`.
- **Flow:** Top 3 candidates surfaced to admin → one-tap "Send coverage request" → teacher accepts/rejects → schedule auto-updated → students/parents notified.
- **DB:** `substitute_requests(absent_teacher_id, period_id, substitute_teacher_id, status, score, responded_at)`.
- **Edge Function:** `match-substitute`.

---

# 11) WhatsApp Business Integration (W7)

- **Goal:** parents who don't open the app still receive critical alerts.
- **Tech:** WhatsApp Cloud API (Meta) via Edge Function `send-whatsapp`.
- **Channels covered:** bus arrival, absence, low balance, payment receipt, emergency.
- **Templates:** `UTILITY` and `AUTHENTICATION` types pre-approved in Meta Business Manager.
- **Opt-in:** per-parent toggle in settings + phone OTP verification.
- **Cost:** ~$0.005–0.03/message depending on country — operational cost, free to parents.
- **Secrets needed later:** `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_BUSINESS_ACCOUNT_ID`.

---

# 12) Offline Mode Upgrade (W5)

- **Current:** simple `useOffline` + `offlineStorage` with localStorage queue.
- **Upgrade:**
  - Move to **Dexie (IndexedDB)** with unified schema for all critical entities (students, attendance, messages, wallet_transactions).
  - **Sync engine:** pull-then-push, `last-write-wins` with server timestamps, exponential backoff retry, conflict logging.
  - **Offline-first for critical devices:** CM30, bus screens, school entrance — fully functional offline for 24h, auto-sync on reconnect.
  - **Visual indicator:** OfflineIndicator shows pending queue count, last sync time, "Sync now" button.
  - **Service Worker:** stale-while-revalidate for reads, queued POSTs for writes.

---

# 13) Biometric Login (W5)

- **Goal:** instant secure login without re-typing credentials, same security level.
- **Current:** `src/services/nativeAuth.ts` already uses `capacitor-native-biometric` with Keychain (iOS) / Keystore (Android), `BiometricGuard.tsx` exists but Auth screen UX is incomplete.
- **Changes:**
  - After first successful password login → one-time dialog "Enable Face ID / Fingerprint login?".
  - Large biometric button on Auth screen if saved credentials exist on device (`hasSavedCredentials()`).
  - Auto-detect biometric type (Face ID on iPhone X+, Touch ID otherwise, Fingerprint on Android) via `biometryType` from `NativeBiometric.isAvailable()`.
  - Auto-trigger biometric prompt on app open if session expired and credentials saved (configurable in Settings).
  - Fallback to password after 3 failed attempts.
  - Settings → Security → toggle "Biometric login" + "Forget my data on this device" (clears Keychain).
  - Optional later: biometric required before sensitive actions (wallet transfer, password change, account delete) via `BiometricGuard`.
- **Security:** credentials stored only in hardware-backed Keychain/Keystore, never sent to server. Password change auto-updates saved credentials or clears them. On manual logout: choice to keep or clear biometric data.
- **Web (PWA):** not supported by `capacitor-native-biometric` — future track via WebAuthn / Passkeys.
- **Platform requirements:** iOS `NSFaceIDUsageDescription` in `Info.plist`; Android `USE_BIOMETRIC` permission.

---

# 14) Bulk Operations & School Setup Wizard (W8)

- **Bulk Excel import:** students, parents, teachers, classes, buses, routes — with pre-import validation and preview/diff screen.
- **Bulk NFC card generation:** select a class → generate all NFC IDs → printable PDF sheet with QR/barcode for printing on plastic cards.
- **School Setup Wizard:** step-by-step (school info → admin user → academic year → classes → import students → import staff → assign buses → done). Designed so a non-technical school owner can launch a new school in < 30 minutes.

---

# 15) Multi-School Operations (W9)

- Cross-school monitoring dashboard for super_admin.
- Automatic alerts (push + email + WhatsApp) on critical issues (school offline, GPS down, attendance not recorded, payment failures).
- Simple Help Desk: in-app ticket per school, conversation thread, status workflow (open → in-progress → resolved), founder gets a unified inbox.

---

# 16) Home Screen Widget (W10)

- **iOS:** WidgetKit Swift target inside the existing Xcode project, reads from a shared App Group container.
- **Android:** AppWidgetProvider in `android/app`.
- **Content:**
  - Parent: "Bus arriving in X min" + child status (at school / on bus / at home) + wallet balance.
  - Teacher: today's present/absent count.
- **Updates:** every 5 min + silent push on critical state change (bus arrival, child off bus).
- **Requires:** new Capacitor plugin to write data into App Group / SharedPreferences.

---

# 17) Apple Watch + Wear OS (W11)

- **Initial scope:** read-only.
- **Features:** instant notifications (bus arrival, school entry/exit, messenger), Glance (child status + balance + bus), watch-face Complication (iOS).
- **Tech:** standalone WatchKit App + Wear OS module, communicating via WatchConnectivity / Data Layer API.
- **Later:** "I'm here to pick up my child" button (triggers Smart Pickup).

---

# 18) Final Testing & Ministry Deliverables (W12)

- Load test: 10,000 fake students simulating a full school day.
- Failure simulations: network outage, low battery on CM30, FCM/APNS failures, TURN unavailable.
- User guides per role (PDF, Arabic).
- Short training videos per role.
- Two-week support plan.
- Final delivery package to the Ministry: Architecture Doc, Security Policy, DRP, SLA, user guides, training videos, contact escalation matrix.

---

# Cost Summary

| Scale | Lovable Cloud | Daily.co (RL) | Storage | WhatsApp | Total/month |
|---|---|---|---|---|---|
| 1 school (1,000 students) | $20–40 | $0–50 | $10–20 | $5–15 | ~$40–125 |
| 10 schools (10,000 students) | $200–300 | $50–200 | $30–80 | $50–150 | ~$330–730 |

---

# Hardware Procurement (before W6)

- Canteen POS: **Sunmi V2 Pro** ×1 per canteen, 80–120 OMR each.
- Buses: existing CM30 (sufficient).
- School entrance: existing scanners (sufficient).

---

# Decisions Required from User (no implementation until then)

1. **TURN provider** for WebRTC: Twilio (reliable, paid per minute), Metered.ca (cheaper, limited free tier), or Cloudflare Calls (newest)?
2. **Video provider** for Remote Learning: Daily.co (recommended) or Jitsi (fully free, lower quality)?
3. **WhatsApp Business** Meta account + approved templates + verified phone number — needs founder action.
4. **Apple Watch** target — uses existing Apple Developer account, but a new Xcode target needs to be created.
5. **Sunmi V2 Pro** — confirm purchase + Oman distributor before W6.

---

# Out of Scope (Phase 2+)

- Group video calls (needs SFU like LiveKit)
- End-to-end encryption
- Stories / Status feed
- Marketplace (#13), After-School Activities (#14), Pediatric Health Records (#15) — revenue ideas to revisit after Ministry trial succeeds
- AI Safety Copilot (#1), Parent Peace-of-Mind Score (#2), Smart Pickup (#4), Geofence (#3), Daily Story (#5), Achievements (#6), Voice Messages (#7), Public School Page (#9), Satisfaction Pulse (#10), Voice Incident Reporting (#11)
