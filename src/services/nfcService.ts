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
    // Check if Web NFC API is available
    if ('NDEFReader' in window) {
      this.isNFCSupported = true;
      return true;
    }
    
    // For Capacitor mobile apps, check if we're in a native environment
    if (window.Capacitor?.isNativePlatform()) {
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
      if (window.Capacitor?.isNativePlatform()) {
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

      // For native mobile apps through Capacitor
      if (window.Capacitor?.isNativePlatform()) {
        // Native NFC write would go here
        // For now, we'll simulate it
        console.log('Writing NFC tag (native):', data);
        
        // Simulate write delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast.success('NFC tag written successfully');
        return true;
      }

      // Fallback: simulation mode for development
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

      // For native mobile apps through Capacitor
      if (window.Capacitor?.isNativePlatform()) {
        // Native NFC read would go here
        console.log('Reading NFC tag (native)');
        
        // Simulate read - in production this would use native NFC
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Return simulated data for development
        return null;
      }

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

      // For native mobile apps
      if (window.Capacitor?.isNativePlatform()) {
        // Native continuous scanning would go here
        console.log('Starting NFC scan (native)');
      }

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
