// NFC Service for Capacitor iOS/Android
// Uses native CoreNFC on iOS via custom plugin bridge

import { Capacitor, registerPlugin } from '@capacitor/core';
import { toast } from "sonner";

export interface NFCData {
  id: string;
  type: "student" | "teacher" | "driver" | "employee";
  name: string;
  additionalData?: Record<string, unknown>;
}

interface NFCPluginInterface {
  isSupported(): Promise<{ supported: boolean }>;
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
  private supported: boolean = false;
  private scanning: boolean = false;
  private initialized: boolean = false;
  private scanCallback: ((data: NFCData) => void) | null = null;
  private listenerHandle: { remove: () => void } | null = null;

  constructor() {
    this.initializeNFC();
  }

  private async initializeNFC(): Promise<void> {
    try {
      if (!Capacitor.isNativePlatform()) {
        // Web fallback - check for Web NFC API
        this.supported = 'NDEFReader' in window;
        this.initialized = true;
        console.log('NFC Web API supported:', this.supported);
        return;
      }

      if (NfcPlugin) {
        const result = await NfcPlugin.isSupported();
        this.supported = result.supported;
        console.log('Native NFC supported:', this.supported);
      } else {
        // Fallback: On iOS, NFC is generally available on iPhone 7+
        const isIOS = Capacitor.getPlatform() === 'ios';
        const isAndroid = Capacitor.getPlatform() === 'android';
        this.supported = isIOS || isAndroid;
        console.log('NFC assumed supported on native platform:', this.supported);
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
    // Wait for initialization if needed
    if (!this.initialized) {
      await new Promise<void>((resolve) => {
        const checkInit = () => {
          if (this.initialized) {
            resolve();
          } else {
            setTimeout(checkInit, 50);
          }
        };
        checkInit();
      });
    }
    return this.supported;
  }

  isSupported(): boolean {
    return this.supported;
  }

  async requestPermission(): Promise<boolean> {
    // iOS handles NFC permission implicitly when you start scanning
    // Android requires NFC permission in manifest
    return this.supported;
  }

  async writeTag(data: NFCData): Promise<boolean> {
    if (!this.supported) {
      toast.error("NFC is not supported on this device");
      return false;
    }

    try {
      const message = JSON.stringify(data);
      console.log("Writing NFC tag:", data);

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

  async readTag(): Promise<NFCData | null> {
    if (!this.supported) {
      toast.error("NFC is not supported on this device");
      return null;
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
    if (!this.supported) {
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

      if (NfcPlugin) {
        // Set up listener for tag reads
        this.listenerHandle = await NfcPlugin.addListener('nfcTagRead', (event: unknown) => {
          try {
            const eventData = event as { message?: string };
            if (eventData.message) {
              const data = JSON.parse(eventData.message) as NFCData;
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

        await NfcPlugin.startScanning();
        console.log("NFC scanning started");
        return;
      }

      // Native platform without plugin
      toast.error("NFC scanning requires native plugin setup");
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
