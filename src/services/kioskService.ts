import { Capacitor, registerPlugin } from "@capacitor/core";

interface KioskPlugin {
  start: () => Promise<{ locked: boolean; reason?: string }>
  stop: () => Promise<{ locked: boolean; reason?: string }>
  isLocked: () => Promise<{ locked: boolean }>
}

const Kiosk = registerPlugin<KioskPlugin>("Kiosk");

const DEFAULT_EXIT_PIN = "2580";

export const kioskService = {
  isAndroid() {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  },

  async startKiosk(): Promise<boolean> {
    if (!this.isAndroid()) return false;
    try {
      const res = await Kiosk.start();
      return !!res.locked;
    } catch {
      return false;
    }
  },

  async stopKiosk(): Promise<boolean> {
    if (!this.isAndroid()) return false;
    try {
      const res = await Kiosk.stop();
      return !res.locked;
    } catch {
      return false;
    }
  },

  async isLocked(): Promise<boolean> {
    if (!this.isAndroid()) return false;
    try {
      const res = await Kiosk.isLocked();
      return !!res.locked;
    } catch {
      return false;
    }
  },

  getExitPin(): string {
    return localStorage.getItem("kiosk_exit_pin") || DEFAULT_EXIT_PIN;
  },
};
