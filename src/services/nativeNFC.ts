import { toast } from 'sonner';

// Native iOS NFC Service
// This service provides NFC functionality for iOS devices using CoreNFC

export interface NFCData {
  id: string;
  type: 'student' | 'teacher' | 'driver' | 'employee';
  name: string;
  additionalData?: Record<string, any>;
}

declare global {
  interface Window {
    webkit?: {
      messageHandlers?: {
        nfc?: {
          postMessage: (message: any) => void;
        };
      };
    };
  }
}

class NativeNFCService {
  private isNFCSupported: boolean = false;
  private isScanning: boolean = false;

  constructor() {
    this.checkNFCSupport();
  }

  private checkNFCSupport(): boolean {
    // Check if running on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    // Check if Web NFC API is available (for Android Chrome)
    if ('NDEFReader' in window) {
      this.isNFCSupported = true;
      return true;
    }
    
    // For iOS, we'll use native bridge when available
    if (isIOS && window.webkit?.messageHandlers?.nfc) {
      this.isNFCSupported = true;
      return true;
    }
    
    // Assume iOS devices support NFC (will be handled by native code)
    if (isIOS) {
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
      // Web NFC API (Android Chrome)
      if ('NDEFReader' in window) {
        return true;
      }

      // iOS native bridge
      if (window.webkit?.messageHandlers?.nfc) {
        window.webkit.messageHandlers.nfc.postMessage({
          action: 'requestPermission'
        });
        return true;
      }

      // For iOS, permission is handled at runtime
      return true;
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
      // Web NFC API (Android Chrome)
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

      // iOS native bridge
      if (window.webkit?.messageHandlers?.nfc) {
        window.webkit.messageHandlers.nfc.postMessage({
          action: 'writeTag',
          data: data
        });
        
        // Wait for response from native code
        return new Promise((resolve) => {
          const handler = (event: any) => {
            if (event.detail.action === 'writeComplete') {
              window.removeEventListener('nfcResponse', handler);
              if (event.detail.success) {
                toast.success('NFC tag written successfully');
                resolve(true);
              } else {
                toast.error('Failed to write NFC tag');
                resolve(false);
              }
            }
          };
          window.addEventListener('nfcResponse', handler);
          
          // Timeout after 30 seconds
          setTimeout(() => {
            window.removeEventListener('nfcResponse', handler);
            toast.error('NFC write timeout');
            resolve(false);
          }, 30000);
        });
      }

      // Fallback simulation
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
      // Web NFC API (Android Chrome)
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

      // iOS native bridge
      if (window.webkit?.messageHandlers?.nfc) {
        window.webkit.messageHandlers.nfc.postMessage({
          action: 'readTag'
        });
        
        return new Promise((resolve) => {
          const handler = (event: any) => {
            if (event.detail.action === 'readComplete') {
              window.removeEventListener('nfcResponse', handler);
              resolve(event.detail.data || null);
            }
          };
          window.addEventListener('nfcResponse', handler);
          
          // Timeout after 30 seconds
          setTimeout(() => {
            window.removeEventListener('nfcResponse', handler);
            resolve(null);
          }, 30000);
        });
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
      // Web NFC API (Android Chrome)
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

      // iOS native bridge
      if (window.webkit?.messageHandlers?.nfc) {
        window.webkit.messageHandlers.nfc.postMessage({
          action: 'startScanning'
        });
        
        const handler = (event: any) => {
          if (event.detail.action === 'tagRead' && event.detail.data) {
            onTagRead(event.detail.data);
          }
        };
        window.addEventListener('nfcResponse', handler);
      }

    } catch (error) {
      console.error('Error starting NFC scan:', error);
      this.isScanning = false;
      throw error;
    }
  }

  stopScanning(): void {
    this.isScanning = false;
    
    // Stop iOS native scanning
    if (window.webkit?.messageHandlers?.nfc) {
      window.webkit.messageHandlers.nfc.postMessage({
        action: 'stopScanning'
      });
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
