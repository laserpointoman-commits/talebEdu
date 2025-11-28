import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';

export interface NFCData {
  id: string;
  type: 'student' | 'teacher' | 'driver' | 'employee';
  name: string;
  additionalData?: Record<string, any>;
}

class NFCService {
  private isNFCSupported: boolean = false;
  private isScanning: boolean = false;
  private supportCheckPromise: Promise<boolean> | null = null;

  constructor() {
    // Start the check but don't block
    this.supportCheckPromise = this.checkNFCSupport();

    // For native iOS/Android, optimistically assume NFC is available
    // (will be confirmed by checkNFCSupport)
    if (Capacitor.isNativePlatform()) {
      this.isNFCSupported = true;
    }
  }

  private async checkNFCSupport(): Promise<boolean> {
    // For native iOS/Android, check if Web NFC API is available
    if (Capacitor.isNativePlatform()) {
      // On native platforms, we'll assume NFC is supported
      // The actual check will happen when trying to use NFC
      this.isNFCSupported = true;
      return true;
    }

    // Check if Web NFC API is available (fallback)
    if ('NDEFReader' in window) {
      this.isNFCSupported = true;
      return true;
    }

    this.isNFCSupported = false;
    return false;
  }
  
  private async ensureSupportChecked(): Promise<void> {
    if (this.supportCheckPromise) {
      await this.supportCheckPromise;
    }
  }

  async requestPermission(): Promise<boolean> {
    await this.ensureSupportChecked();
    
    if (!this.isNFCSupported) {
      toast.error('NFC is not supported on this device');
      return false;
    }

    try {
      // For Web NFC API
      if ('NDEFReader' in window) {
        // Permission is requested when starting to scan
        return true;
      }

      // For native mobile apps through Capacitor
      if (Capacitor.isNativePlatform()) {
        // Native permission handling would go here
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error requesting NFC permission:', error);
      return false;
    }
  }

  async writeTag(data: NFCData): Promise<boolean> {
    await this.ensureSupportChecked();
    
    if (!this.isNFCSupported) {
      toast.error('NFC is not supported on this device');
      return false;
    }

    try {
      // For native iOS/Android - note: requires @capawesome-team/capacitor-nfc plugin to be installed
      if (Capacitor.isNativePlatform()) {
        console.log('Writing NFC tag (native iOS/Android):', data);
        // This will work once the plugin is installed via npm install @capawesome-team/capacitor-nfc
        toast.info('NFC write ready - please install @capawesome-team/capacitor-nfc plugin');
        return false;
      }

      // For Web NFC API (Chrome Android) - fallback
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

      // Simulation mode for development
      console.log('Writing NFC tag (simulation):', data);
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('NFC tag written successfully (Simulation Mode)');
      return true;

    } catch (error: any) {
      console.error('Error writing NFC tag:', error);
      
      if (error.message?.includes('User canceled')) {
        toast.info('NFC write canceled');
      } else if (error.message?.includes('not available')) {
        toast.error('NFC not available on this device');
      } else {
        toast.error('Failed to write NFC tag');
      }
      
      return false;
    }
  }

  async readTag(): Promise<NFCData | null> {
    await this.ensureSupportChecked();
    
    if (!this.isNFCSupported) {
      toast.error('NFC is not supported on this device');
      return null;
    }

    try {
      // For native iOS/Android - note: requires @capawesome-team/capacitor-nfc plugin to be installed
      if (Capacitor.isNativePlatform()) {
        console.log('Reading NFC tag (native iOS/Android)');
        toast.info('NFC read ready - please install @capawesome-team/capacitor-nfc plugin');
        return null;
      }

      // For Web NFC API (Chrome Android) - fallback
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
      
      if (error.message?.includes('User canceled')) {
        toast.info('NFC read canceled');
      } else {
        toast.error('Failed to read NFC tag');
      }
      
      return null;
    }
  }

  async startScanning(onTagRead: (data: NFCData) => void): Promise<void> {
    await this.ensureSupportChecked();
    
    if (this.isScanning) {
      return;
    }

    if (!this.isNFCSupported) {
      toast.error('NFC is not supported on this device');
      return;
    }

    this.isScanning = true;

    try {
      // For native iOS/Android - note: requires @capawesome-team/capacitor-nfc plugin to be installed
      if (Capacitor.isNativePlatform()) {
        console.log('Starting NFC scan (native iOS/Android)');
        toast.info('NFC scan ready - please install @capawesome-team/capacitor-nfc plugin');
        return;
      }

      // For Web NFC API - fallback
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
  }

  isSupported(): boolean {
    return this.isNFCSupported;
  }

  isScanningActive(): boolean {
    return this.isScanning;
  }
}

// Singleton instance
export const nfcService = new NFCService();
