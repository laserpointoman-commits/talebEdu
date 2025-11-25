import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';

// Native iOS NFC Service
// This service provides NFC functionality for iOS devices using CoreNFC via Capacitor plugin

export interface NFCData {
  id: string;
  type: 'student' | 'teacher' | 'driver' | 'employee';
  name: string;
  additionalData?: Record<string, any>;
}

interface NFCBridgePlugin {
  checkAvailability(): Promise<{ available: boolean }>;
  readTag(): Promise<NFCData>;
  writeTag(options: { data: NFCData }): Promise<{ success: boolean }>;
  stopScan(): Promise<void>;
}

// Register the native plugin
const NFCBridge = Capacitor.registerPlugin<NFCBridgePlugin>('NFCBridgePlugin');

class NativeNFCService {
  private isNFCSupported: boolean = false;
  private isScanning: boolean = false;

  constructor() {
    this.checkNFCSupport();
  }

  private async checkNFCSupport(): Promise<boolean> {
    try {
      // Check if running on native platform
      if (Capacitor.isNativePlatform()) {
        const result = await NFCBridge.checkAvailability();
        this.isNFCSupported = result.available;
        return result.available;
      }
      
      // Check if Web NFC API is available (for Android Chrome web)
      if ('NDEFReader' in window) {
        this.isNFCSupported = true;
        return true;
      }
    } catch (error) {
      console.error('Error checking NFC support:', error);
    }

    this.isNFCSupported = false;
    return false;
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isNFCSupported) {
      toast.error('NFC is not supported on this device');
      return false;
    }

    // On native iOS, permission is requested automatically when NFC is used
    return true;
  }

  async writeTag(data: NFCData): Promise<boolean> {
    if (!this.isNFCSupported) {
      toast.error('NFC is not supported on this device');
      return false;
    }

    try {
      // Use native plugin on iOS/Android
      if (Capacitor.isNativePlatform()) {
        const result = await NFCBridge.writeTag({ data });
        if (result.success) {
          toast.success('NFC tag written successfully');
          return true;
        } else {
          toast.error('Failed to write NFC tag');
          return false;
        }
      }

      // Web NFC API fallback (Android Chrome web)
      if ('NDEFReader' in window) {
        const ndef = new (window as any).NDEFReader();
        
        const records = [
          {
            recordType: "text",
            data: JSON.stringify(data)
          }
        ];

        await ndef.write({ records });
        toast.success('NFC tag written successfully');
        return true;
      }

      toast.error('NFC not available');
      return false;

    } catch (error: any) {
      console.error('Error writing NFC tag:', error);
      
      if (error.message?.includes('permission')) {
        toast.error('NFC permission denied');
      } else if (error.message?.includes('not found') || error.message?.includes('No tag')) {
        toast.error('No NFC tag found nearby');
      } else {
        toast.error('Failed to write NFC tag');
      }
      
      return false;
    }
  }

  async readTag(): Promise<NFCData | null> {
    if (!this.isNFCSupported) {
      toast.error('NFC is not supported on this device');
      return null;
    }

    try {
      // Use native plugin on iOS/Android
      if (Capacitor.isNativePlatform()) {
        const data = await NFCBridge.readTag();
        return data;
      }

      // Web NFC API fallback (Android Chrome web)
      if ('NDEFReader' in window) {
        const ndef = new (window as any).NDEFReader();
        
        await ndef.scan();
        
        return new Promise((resolve) => {
          ndef.addEventListener("reading", ({ message, serialNumber }: any) => {
            for (const record of message.records) {
              if (record.recordType === "text") {
                const textDecoder = new TextDecoder(record.encoding);
                const text = textDecoder.decode(record.data);
                const data = JSON.parse(text);
                resolve(data);
                return;
              }
            }
            resolve(null);
          });
        });
      }

      return null;

    } catch (error: any) {
      console.error('Error reading NFC tag:', error);
      
      if (error.message?.includes('permission') || error.message?.includes('cancelled')) {
        // User cancelled or denied permission
        return null;
      } else {
        toast.error('Failed to read NFC tag');
      }
      
      return null;
    }
  }

  async startScanning(onTagRead: (data: NFCData) => void): Promise<void> {
    if (this.isScanning) {
      return;
    }

    if (!this.isNFCSupported) {
      toast.error('NFC is not supported on this device');
      return;
    }

    this.isScanning = true;

    try {
      // On native platforms, use continuous scanning
      if (Capacitor.isNativePlatform()) {
        // iOS/Android native scanning - read one tag at a time
        while (this.isScanning) {
          try {
            const data = await NFCBridge.readTag();
            if (data && this.isScanning) {
              onTagRead(data);
            }
          } catch (error: any) {
            if (error.message?.includes('cancelled') || !this.isScanning) {
              break;
            }
            console.error('NFC scan error:', error);
          }
        }
        return;
      }

      // Web NFC API fallback (Android Chrome web)
      if ('NDEFReader' in window) {
        const ndef = new (window as any).NDEFReader();
        await ndef.scan();

        ndef.addEventListener("reading", ({ message, serialNumber }: any) => {
          for (const record of message.records) {
            if (record.recordType === "text") {
              const textDecoder = new TextDecoder(record.encoding);
              const text = textDecoder.decode(record.data);
              const data = JSON.parse(text);
              onTagRead(data);
            }
          }
        });

        ndef.addEventListener("readingerror", () => {
          console.error('NFC reading error');
        });
      }

    } catch (error) {
      console.error('Error starting NFC scan:', error);
      this.isScanning = false;
      throw error;
    }
  }

  async stopScanning(): Promise<void> {
    this.isScanning = false;
    
    // Stop native scanning
    if (Capacitor.isNativePlatform()) {
      try {
        await NFCBridge.stopScan();
      } catch (error) {
        console.error('Error stopping NFC scan:', error);
      }
    }
  }

  isSupported(): boolean {
    return this.isNFCSupported;
  }

  isScanningActive(): boolean {
    return this.isScanning;
  }
}

// Singleton instance
export const nativeNFCService = new NativeNFCService();
