# CM30 Android Device Setup (Bus + School Attendance)

This project already includes an Android build (Capacitor). These steps prepare a **dedicated “Device Mode”** experience for fast NFC scanning + GPS tracking.

## 1) Build the Android app

1. Export the project to your GitHub and pull it locally.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build web assets:
   ```bash
   npm run build
   ```
4. Sync to Android:
   ```bash
   npx cap sync android
   ```
5. Open Android Studio:
   ```bash
   npx cap open android
   ```
6. In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.

## 2) Install the APK on the CM30

**Option A (recommended):** install by USB from Android Studio (Run).

**Option B:** copy the generated APK to the device and install it.

## 3) Device permissions (must do)

On the CM30, enable:

- **NFC**: Settings → NFC → ON
- **Location**: Settings → Location → ON
- App permissions → allow **Location (Precise)**

## 4) Turn off battery restrictions (prevents GPS stop + scan lag)

On the CM30:

- Settings → Battery → Battery optimization → find the app → **Don’t optimize**
- Allow the app to run in background (vendor-specific “Autostart” / “Background activity”)

## 5) How the Device Mode flow works

### Login (fast)

Open:
- Bus device login: `/device/login?type=bus&device=CM30-BUS-001`
- School gate login: `/device/login?type=school_gate&device=CM30-GATE-001`

Login methods:
- **NFC + PIN** (same as staff login)
- **Email + password**

Only **Driver** and **Supervisor** accounts are allowed.

### Bus device

1. Choose **To School** or **To Home**
2. Tap **Start Trip**
3. GPS starts sending location updates automatically
4. Continuous NFC scan loop starts (optimized for stability)

### Scan feedback

- **Success**: full-screen **green** confirmation + student name
- **Failure**: full-screen **red** confirmation + reason
- Sounds use a built-in chime (WebAudio) to avoid copyrighted audio.

## 6) Recommended CM30 operational settings

- Screen timeout: 5–10 minutes (or Always on while on power)
- Disable “touch sounds” (optional)
- Use a stable network (Wi‑Fi) for fastest recording

## 7) Troubleshooting

- If NFC scanning doesn’t start: confirm NFC is enabled, and re-open the app.
- If GPS doesn’t update: confirm Location permission is “Allow all the time” (if available) and battery optimization is disabled.

## 8) Lock the app on screen (Kiosk mode) + secret PIN exit

We added a native Android kiosk helper that attempts to enter **Lock Task** mode.

### What you get
- App stays on screen
- Users can’t leave the app using Home/Recent
- Exit is possible only via **secret PIN** (long-press gesture)

### How to exit (secret)
- Long‑press anywhere on the login/device screen for ~1.2s
- Enter the exit PIN

Default exit PIN: **2580**

### IMPORTANT: Device Owner requirement (recommended)
For strongest kiosk behavior, Android requires the app to be allowed as a **Device Owner** (Android Enterprise). This usually needs the device to be factory reset (common kiosk setup).

If you have ADB access during provisioning, you can set device owner using:
```bash
adb shell dpm set-device-owner com.talebedu.app/.KioskDeviceAdminReceiver
```

If your CM30 is managed (MDM/EMM), ask your provider to set the app as kiosk / device owner.

