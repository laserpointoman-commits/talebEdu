import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';

// Declare NFC plugin interface
interface NFCPlugin {
  isAvailable(): Promise<{ available: boolean }>;
  write(options: { data: NFCData }): Promise<{ success: boolean }>;
  read(): Promise<NFCData>;
  startScanning(): Promise<void>;
  stopScanning(): Promise<void>;
  addListener(eventName: string, listenerFunc: (data: any) => void): Promise<any>;
  removeAllListeners(): Promise<void>;
}

// Get NFC plugin
const getNFCPlugin = (): NFCPlugin | null => {
  if (Capacitor.isNativePlatform()) {
    return (Capacitor as any).Plugins.NFCPlugin as NFCPlugin;
  }
  return null;
};

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
    // Check for native NFC plugin first (iOS)
    const nfcPlugin = getNFCPlugin();
    if (nfcPlugin) {
      try {
        const result = await nfcPlugin.isAvailable();
        this.isNFCSupported = result.available;
        return result.available;
      } catch (error) {
        console.log('Native NFC not available:', error);
      }
    }
    
    // Check if Web NFC API is available (Chrome Android)
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

      // Native NFC requires specific plugins - currently using Web NFC only
      // For iOS native support, additional setup would be required

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
      // Try native NFC plugin first (iOS)
      const nfcPlugin = getNFCPlugin();
      if (nfcPlugin) {
        const result = await nfcPlugin.write({ data });
        if (result.success) {
          toast.success('NFC tag written successfully');
          return true;
        }
      }

      // For Web NFC API (Chrome Android)
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
      
      if (error.name === 'NotAllowedError' || error.includes('permission')) {
        toast.error('NFC permission denied');
      } else if (error.name === 'NetworkError' || error.includes('not found')) {
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
      // Try native NFC plugin first (iOS)
      const nfcPlugin = getNFCPlugin();
      if (nfcPlugin) {
        const data = await nfcPlugin.read();
        toast.success('NFC tag read successfully');
        return data;
      }

      // For Web NFC API (Chrome Android)
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
                toast.success('NFC tag read successfully');
                resolve(data);
                return;
              }
            }
            resolve(null);
          });
        });
      }

      toast.error('NFC not available');
      return null;

    } catch (error: any) {
      console.error('Error reading NFC tag:', error);
      
      if (error.name === 'NotAllowedError' || error.includes('permission')) {
        toast.error('NFC permission denied');
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
      // Try native NFC plugin first (iOS)
      const nfcPlugin = getNFCPlugin();
      if (nfcPlugin) {
        await nfcPlugin.startScanning();
        
        // Listen for tag reads
        await nfcPlugin.addListener('nfcTagRead', (data: NFCData) => {
          onTagRead(data);
        });
        
        return;
      }

      // For Web NFC API
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
    
    // Stop native NFC scanning
    const nfcPlugin = getNFCPlugin();
    if (nfcPlugin) {
      try {
        await nfcPlugin.stopScanning();
        await nfcPlugin.removeAllListeners();
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
