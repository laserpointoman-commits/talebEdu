// NFC Service for Capacitor iOS/Android
// Uses native CoreNFC on iOS via custom plugin bridge

import { Capacitor, registerPlugin } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { toast } from "sonner";

export interface NFCData {
  id: string;
  type: "student" | "teacher" | "driver" | "employee";
  name: string;
  additionalData?: Record<string, unknown>;
}

interface NFCPluginInterface {
  isSupported(): Promise<{ supported: boolean }>;
  readOnce?: () => Promise<{ message?: string | null }>;
  startScanning(): Promise<{ success: boolean }>;
  stopScanning(): Promise<{ success: boolean }>;
  write(options: { message: string }): Promise<{ success: boolean }>;
  addListener(eventName: string, callback: (data: unknown) => void): Promise<{ remove: () => void }>;
}

// Try to register the native NFC plugin if available
let NfcPlugin: NFCPluginInterface | null = null;

try {
  if (Capacitor.isNativePlatform()) {
    NfcPlugin = registerPlugin<NFCPluginInterface>('NfcPlugin');
  }
} catch (e) {
  console.log('NFC Plugin not available:', e);
}

class NFCService {
  private supported: boolean | null = null; // null = not yet checked
  private scanning: boolean = false;
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;
  private scanCallback: ((data: NFCData) => void) | null = null;
  private listenerHandle: { remove: () => void } | null = null;

  constructor() {
    this.initPromise = this.initializeNFC();
  }

  /**
   * Reset NFC service state - call this after logout to ensure
   * the service is ready for a fresh login session (e.g. NFC PIN login).
   */
  reset(): void {
    console.log('NFC: Resetting service state');
    this.stopScanning().catch(() => {});
    this.scanning = false;
    this.scanCallback = null;
    if (this.listenerHandle) {
      try { this.listenerHandle.remove(); } catch {}
      this.listenerHandle = null;
    }
  }

  private async initializeNFC(): Promise<void> {
    try {
      console.log('NFC: Initializing...', {
        isNative: Capacitor.isNativePlatform(),
        platform: Capacitor.getPlatform(),
        hasPlugin: !!NfcPlugin
      });

      if (!Capacitor.isNativePlatform()) {
        // Web fallback - check for Web NFC API
        this.supported = 'NDEFReader' in window;
        console.log('NFC Web API supported:', this.supported);
        return;
      }

      // On native platform, try to use the plugin
      if (NfcPlugin) {
        try {
          const result = await NfcPlugin.isSupported();
          this.supported = result.supported;
          console.log('Native NFC plugin isSupported result:', this.supported);
        } catch (pluginError) {
          console.warn('NFC plugin isSupported call failed:', pluginError);
          // Fallback: On iOS iPhone 7+, NFC is generally available
          const isIOS = Capacitor.getPlatform() === 'ios';
          const isAndroid = Capacitor.getPlatform() === 'android';
          this.supported = isIOS || isAndroid;
          console.log('NFC assumed supported (fallback):', this.supported);
        }
      } else {
        // No plugin registered, assume available on native
        const isIOS = Capacitor.getPlatform() === 'ios';
        const isAndroid = Capacitor.getPlatform() === 'android';
        this.supported = isIOS || isAndroid;
        console.log('NFC assumed supported (no plugin):', this.supported);
      }
    } catch (error) {
      console.error('Error initializing NFC:', error);
      // On native platforms, assume NFC might be available
      this.supported = Capacitor.isNativePlatform();
    } finally {
      this.initialized = true;
    }
  }

  async isSupportedAsync(): Promise<boolean> {
    // Wait for initialization
    if (this.initPromise) {
      await this.initPromise;
    }

    // If still null, do a fresh check
    if (this.supported === null) {
      if (Capacitor.isNativePlatform()) {
        // Default to true on native - let the actual NFC call fail if not supported
        this.supported = true;
      } else {
        this.supported = 'NDEFReader' in window;
      }
    }

    return this.supported;
  }

  isSupported(): boolean {
    // For sync check, if not initialized yet, assume true on native
    if (this.supported === null) {
      return Capacitor.isNativePlatform() || 'NDEFReader' in window;
    }
    return this.supported;
  }

  async requestPermission(): Promise<boolean> {
    // iOS handles NFC permission implicitly when you start scanning
    // Android requires NFC permission in manifest
    const isSupported = await this.isSupportedAsync();
    return isSupported;
  }

  private parseTagMessage(message: string): NFCData {
    const trimmed = (message ?? '').trim();

      const normalizeId = (raw: string): string => {
        // Normalize across plugins / tags (trim, strip nulls).
        // IMPORTANT: Do NOT strip the "NFC-" prefix because our app stores real IDs like
        // "NFC-STD-000000123" in the database and on tags.
        let cleaned = (raw ?? '')
          .replace(/\u0000/g, '')
          // Some readers prepend a label like "NFC: <id>"; strip ONLY the colon variant.
          .replace(/^NFC\s*:\s*/i, '')
          .trim();

      // If it looks like a raw UID (often returned as hex, sometimes with separators),
      // canonicalize it so backend lookups are consistent.
      const compact = cleaned.replace(/[^0-9a-fA-F]/g, '');
      const looksLikeHexUid = compact.length >= 8 && compact.length <= 32 && /^[0-9a-fA-F]+$/.test(compact);
      if (looksLikeHexUid) {
        cleaned = compact.toUpperCase();
      }

      return cleaned;
    };
    try {
      const parsed = JSON.parse(trimmed) as Partial<NFCData>;
      if (parsed && typeof parsed.id === 'string') {
        return {
          id: normalizeId(parsed.id),
          type: (parsed.type ?? 'student') as NFCData['type'],
          name: parsed.name ?? '',
          additionalData: parsed.additionalData
        };
      }
    } catch {
      // not JSON
    }

    return {
      id: normalizeId(trimmed),
      type: 'student',
      name: ''
    };
  }

  private async hapticSuccess(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      // ignore
    }
  }

  async writeTag(data: NFCData): Promise<boolean> {
    const isSupported = await this.isSupportedAsync();
    if (!isSupported) {
      toast.error("NFC is not supported on this device");
      return false;
    }

    try {
      // CRITICAL: Write ONLY the ID to minimize tag space usage
      // Most NFC tags have very limited storage (48-144 bytes)
      // The ID is sufficient - we look up full data from database on read
      const message = data.id;
      console.log("Writing NFC tag with compact ID:", message, "(full data:", data, ")");

      if (!Capacitor.isNativePlatform()) {
        // Web NFC API
        if ('NDEFReader' in window) {
          const ndef = new (window as unknown as { NDEFReader: new () => NDEFReader }).NDEFReader();
          await ndef.write({
            records: [{ recordType: 'text', data: message }]
          });
          toast.success("NFC tag written successfully");
          return true;
        }
        toast.error("Web NFC not available");
        return false;
      }

      if (NfcPlugin) {
        const result = await NfcPlugin.write({ message });
        if (result.success) {
          toast.success("NFC tag written successfully");
        }
        return result.success;
      }

      // Native platform without plugin - show instructions
      toast.error("NFC write requires native plugin setup");
      return false;
    } catch (error) {
      console.error('Error writing NFC tag:', error);
      toast.error("Failed to write NFC tag");
      return false;
    }
  }

  async eraseTag(): Promise<boolean> {
    const isSupported = await this.isSupportedAsync();
    if (!isSupported) {
      toast.error("NFC is not supported on this device");
      return false;
    }

    try {
      console.log("Erasing NFC tag...");

      // Write minimal erase marker - just "X" to indicate erased
      const emptyData = "X";

      if (!Capacitor.isNativePlatform()) {
        // Web NFC API
        if ('NDEFReader' in window) {
          const ndef = new (window as unknown as { NDEFReader: new () => NDEFReader }).NDEFReader();
          await ndef.write({
            records: [{ recordType: 'text', data: emptyData }]
          });
          toast.success("NFC tag erased successfully");
          return true;
        }
        toast.error("Web NFC not available");
        return false;
      }

      if (NfcPlugin) {
        const result = await NfcPlugin.write({ message: emptyData });
        if (result.success) {
          toast.success("NFC tag erased successfully");
        }
        return result.success;
      }

      // Native platform without plugin
      toast.error("NFC erase requires native plugin setup");
      return false;
    } catch (error) {
      console.error('Error erasing NFC tag:', error);
      toast.error("Failed to erase NFC tag");
      return false;
    }
  }

  async readTag(): Promise<NFCData | null> {
    // Ensure we check support properly
    const isSupported = await this.isSupportedAsync();
    if (!isSupported) {
      toast.error("NFC is not supported on this device");
      return null;
    }

    // Prefer single-shot native read to avoid the in-app blocking dialog and long-running sessions
    if (Capacitor.isNativePlatform() && NfcPlugin && typeof NfcPlugin.readOnce === 'function') {
      if (this.scanning) {
        toast.info("NFC scanning already active");
        return null;
      }

      this.scanning = true;
      try {
        const result = await NfcPlugin.readOnce();
        const message = (result?.message ?? '') as string;
        if (!message) return null;

        const data = this.parseTagMessage(message);
        await this.hapticSuccess();
        return data;
      } catch (error) {
        console.error('Error reading NFC tag:', error);
        toast.error("Failed to read NFC tag");
        return null;
      } finally {
        this.scanning = false;
      }
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.stopScanning();
        toast.info("NFC scan timed out");
        resolve(null);
      }, 30000);

      this.startScanning((data) => {
        clearTimeout(timeout);
        this.stopScanning();
        resolve(data);
      }).catch((error) => {
        clearTimeout(timeout);
        console.error('Error reading NFC tag:', error);
        toast.error("Failed to read NFC tag");
        resolve(null);
      });
    });
  }


  async startScanning(onTagRead: (data: NFCData) => void): Promise<void> {
    // Ensure we check support properly
    const isSupported = await this.isSupportedAsync();
    console.log('NFC startScanning - isSupported:', isSupported);
    
    if (!isSupported) {
      toast.error("NFC is not supported on this device");
      return;
    }

    if (this.scanning) {
      console.log('NFC scanning already active');
      return;
    }

    this.scanCallback = onTagRead;
    this.scanning = true;

    try {
      if (!Capacitor.isNativePlatform()) {
        // Web NFC API
        if ('NDEFReader' in window) {
          const ndef = new (window as unknown as { NDEFReader: new () => NDEFReader }).NDEFReader();
          await ndef.scan();
          
          ndef.addEventListener('reading', (event: NDEFReadingEvent) => {
            try {
              const record = event.message.records[0];
              if (record && record.recordType === 'text') {
                const decoder = new TextDecoder();
                const text = decoder.decode(record.data);
                const data = JSON.parse(text) as NFCData;
                if (this.scanCallback) {
                  this.scanCallback(data);
                  toast.success("NFC tag scanned successfully");
                }
              }
            } catch (e) {
              console.error('Error parsing NFC data:', e);
              toast.error("Invalid NFC tag format");
            }
          });
          return;
        }
        toast.error("Web NFC not available");
        this.scanning = false;
        return;
      }

      console.log('NFC: Starting native scanning, NfcPlugin available:', !!NfcPlugin);

      if (NfcPlugin) {
        // Set up listener for tag reads BEFORE starting scanning
        console.log('NFC: Setting up nfcTagRead listener...');
        this.listenerHandle = await NfcPlugin.addListener('nfcTagRead', (event: unknown) => {
          console.log('NFC: Tag read event received:', event);
          try {
            const eventData = event as { message?: string };
            if (eventData.message) {
              const parsed = this.parseTagMessage(eventData.message);
              if (this.scanCallback) {
                this.scanCallback(parsed);
                toast.success("NFC tag scanned successfully");
              }
            }
          } catch (e) {
            console.error('Error handling NFC event:', e);
            toast.error("Error processing NFC tag");
          }
        });

        console.log('NFC: Calling startScanning on plugin...');
        await NfcPlugin.startScanning();
        console.log("NFC: Scanning started successfully");
        return;
      }

      // Native platform without plugin - this shouldn't happen
      console.error('NFC: Native platform but no plugin available');
      toast.error("NFC plugin not available");
      this.scanning = false;
    } catch (error) {
      this.scanning = false;
      this.scanCallback = null;
      console.error('Error starting NFC scan:', error);
      toast.error("Failed to start NFC scanning");
      throw error;
    }
  }

  async stopScanning(): Promise<void> {
    if (!this.scanning) return;

    this.scanning = false;
    this.scanCallback = null;

    try {
      if (this.listenerHandle) {
        this.listenerHandle.remove();
        this.listenerHandle = null;
      }

      if (NfcPlugin && Capacitor.isNativePlatform()) {
        await NfcPlugin.stopScanning();
      }
    } catch (error) {
      console.error('Error stopping NFC scan:', error);
    }
  }

  isScanningActive(): boolean {
    return this.scanning;
  }

  // Single-shot read for logout confirmation and quick scans
  async readOnce(): Promise<NFCData> {
    const isSupported = await this.isSupportedAsync();
    if (!isSupported) {
      throw new Error("NFC is not supported on this device");
    }

    if (this.scanning) {
      throw new Error("NFC scanning already active");
    }

    this.scanning = true;
    try {
      if (Capacitor.isNativePlatform() && NfcPlugin && typeof NfcPlugin.readOnce === 'function') {
        const result = await NfcPlugin.readOnce();
        const message = (result?.message ?? '') as string;
        if (!message) {
          throw new Error("No NFC data read");
        }

        const data = this.parseTagMessage(message);
        await this.hapticSuccess();
        return data;
      }

      // Fallback to using readTag for non-native or older plugins
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.stopScanning();
          reject(new Error("NFC scan timed out"));
        }, 30000);

        this.startScanning((data) => {
          clearTimeout(timeout);
          this.stopScanning();
          resolve(data);
        }).catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    } finally {
      this.scanning = false;
    }
  }
}

// Web NFC types
interface NDEFReader {
  scan(): Promise<void>;
  write(options: { records: Array<{ recordType: string; data: string }> }): Promise<void>;
  addEventListener(type: 'reading', callback: (event: NDEFReadingEvent) => void): void;
}

interface NDEFReadingEvent extends Event {
  message: {
    records: Array<{
      recordType: string;
      data: ArrayBuffer;
    }>;
  };
}

export const nfcService = new NFCService();
