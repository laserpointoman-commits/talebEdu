import { toast } from 'sonner';

// Declare Capacitor on window for TypeScript
declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean;
    };
  }
}

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
    // Check if Web NFC API is available (Chrome Android)
    if ('NDEFReader' in window) {
      this.isNFCSupported = true;
      return true;
    }
    
    // For iOS/native apps without Web NFC, NFC is not currently supported
    // This prevents build errors while maintaining graceful degradation
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

      // Fallback: simulation mode for development/testing
      console.log('Writing NFC tag (simulation):', data);
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('NFC tag written successfully (Simulation Mode)');
      return true;

    } catch (error: any) {
      console.error('Error writing NFC tag:', error);
      
      if (error.name === 'NotAllowedError') {
        toast.error('NFC permission denied');
      } else if (error.name === 'NetworkError') {
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
                resolve(data);
                return;
              }
            }
            resolve(null);
          });
        });
      }

      // Native NFC not currently implemented
      // For iOS/Android native support, additional plugin setup required

      return null;

    } catch (error: any) {
      console.error('Error reading NFC tag:', error);
      
      if (error.name === 'NotAllowedError') {
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

      // Native continuous scanning not currently implemented
      // Using Web NFC API for supported browsers

    } catch (error) {
      console.error('Error starting NFC scan:', error);
      this.isScanning = false;
      throw error;
    }
  }

  stopScanning(): void {
    this.isScanning = false;
    // Cleanup would go here
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
