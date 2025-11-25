import { toast } from 'sonner';
import { Capacitor, registerPlugin } from '@capacitor/core';

interface NFCPlugin {
  isAvailable(): Promise<{ available: boolean }>;
  write(options: { data: string }): Promise<{ success: boolean }>;
  read(): Promise<{ data: string }>;
  stopScan(): Promise<void>;
}

// Register plugin using modern Capacitor API
const NFCPluginNative = Capacitor.isNativePlatform() 
  ? registerPlugin<NFCPlugin>('NFCPlugin')
  : null;

export interface NFCData {
  id: string;
  type: 'student' | 'teacher' | 'driver' | 'employee';
  name: string;
  additionalData?: Record<string, any>;
}

class NFCService {
  private isNFCSupported: boolean = false;
  private isScanning: boolean = false;

  constructor() {
    this.checkNFCSupport();
  }

  private async checkNFCSupport(): Promise<boolean> {
    // For native iOS/Android
    if (Capacitor.isNativePlatform() && NFCPluginNative) {
      try {
        const result = await NFCPluginNative.isAvailable();
        this.isNFCSupported = result.available;
        return result.available;
      } catch (error) {
        console.error('NFC check failed:', error);
        this.isNFCSupported = false;
        return false;
      }
    }
    
    // Check if Web NFC API is available (fallback)
    if ('NDEFReader' in window) {
      this.isNFCSupported = true;
      return true;
    }

    this.isNFCSupported = false;
    return false;
  }

  async requestPermission(): Promise<boolean> {
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
    if (!this.isNFCSupported) {
      toast.error('NFC is not supported on this device');
      return false;
    }

    try {
      // For native iOS/Android
      if (Capacitor.isNativePlatform() && NFCPluginNative) {
        console.log('Writing NFC tag (native iOS/Android):', data);
        const result = await NFCPluginNative.write({ 
          data: JSON.stringify(data) 
        });
        
        if (result.success) {
          toast.success('NFC tag written successfully');
          return true;
        } else {
          toast.error('Failed to write NFC tag');
          return false;
        }
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
    if (!this.isNFCSupported) {
      toast.error('NFC is not supported on this device');
      return null;
    }

    try {
      // For native iOS/Android
      if (Capacitor.isNativePlatform() && NFCPluginNative) {
        console.log('Reading NFC tag (native iOS/Android)');
        const result = await NFCPluginNative.read();
        
        if (result.data) {
          const parsedData = JSON.parse(result.data);
          toast.success('NFC tag read successfully');
          return parsedData as NFCData;
        } else {
          toast.error('No data found on NFC tag');
          return null;
        }
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
    if (this.isScanning) {
      return;
    }

    if (!this.isNFCSupported) {
      toast.error('NFC is not supported on this device');
      return;
    }

    this.isScanning = true;

    try {
      // For native iOS/Android - use read in a loop
      if (Capacitor.isNativePlatform() && NFCPluginNative) {
        console.log('Starting NFC scan (native iOS/Android)');
        // Note: iOS requires user interaction for each scan
        // Continuous scanning is handled by repeatedly calling read()
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
    
    if (Capacitor.isNativePlatform() && NFCPluginNative) {
      try {
        await NFCPluginNative.stopScan();
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
export const nfcService = new NFCService();
