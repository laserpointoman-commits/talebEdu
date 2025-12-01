import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';

export interface NFCData {
  id: string;
  type: 'student' | 'teacher' | 'driver' | 'employee';
  name: string;
  additionalData?: Record<string, any>;
}

// Import the @trentrand/capacitor-nfc plugin
let NfcPlugin: any = null;
try {
  // @ts-ignore - dynamic import
  NfcPlugin = (Capacitor as any).Plugins?.Nfc || (window as any)?.Capacitor?.Plugins?.Nfc;
} catch (e) {
  console.warn('NFC plugin not available:', e);
}

class NFCService {
  private isNFCSupported: boolean = false;
  private isScanning: boolean = false;
  private listenerHandle: any = null;

  constructor() {
    this.checkNFCSupport();
  }

  private async checkNFCSupport(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      // Web NFC API fallback
      if ('NDEFReader' in window) {
        this.isNFCSupported = true;
      }
      return;
    }

    // Check if plugin is available
    if (!NfcPlugin) {
      console.error('NFC plugin is not installed');
      this.isNFCSupported = false;
      return;
    }

    try {
      const result = await NfcPlugin.isEnabled();
      this.isNFCSupported = result?.enabled ?? false;
    } catch (error) {
      console.error('NFC check failed:', error);
      this.isNFCSupported = false;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isNFCSupported) {
      toast.error('NFC is not supported on this device');
      return false;
    }
    return true;
  }

  private createNFCRecord(data: NFCData): any {
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const bytes = encoder.encode(jsonString);
    
    // Create DataView from the bytes
    const buffer = new ArrayBuffer(bytes.length);
    const view = new DataView(buffer);
    bytes.forEach((byte, index) => view.setUint8(index, byte));

    return {
      recordType: 'text',
      mediaType: 'text/plain',
      data: view
    };
  }

  async writeTag(data: NFCData): Promise<boolean> {
    if (!this.isNFCSupported) {
      toast.error('NFC is not supported on this device');
      return false;
    }

    if (!NfcPlugin) {
      toast.error('NFC plugin is not installed');
      return false;
    }

    try {
      console.log('Writing NFC tag (native iOS/Android):', data);

      const record = this.createNFCRecord(data);
      
      await NfcPlugin.write({
        records: [record],
        timeout: 30000 // 30 second timeout
      });

      toast.success('NFC tag written successfully');
      return true;
    } catch (error: any) {
      console.error('Error writing NFC tag:', error);

      if (error?.message?.includes('User canceled') || error?.message?.includes('cancelled')) {
        toast.info('NFC write canceled');
      } else if (error?.code === 'UNIMPLEMENTED') {
        toast.error('NFC write is not implemented in this build');
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

    if (!NfcPlugin) {
      toast.error('NFC plugin is not installed');
      return null;
    }

    try {
      return await new Promise<NFCData | null>((resolve) => {
        let resolved = false;

        const onTagRead = (event: any) => {
          if (resolved) return;
          
          try {
            console.log('NFC tag read event:', event);
            
            // Parse the NFC data from the event
            const records = event?.records || [];
            
            for (const record of records) {
              if (record.recordType === 'text') {
                // Extract text data from DataView
                const dataView = record.data;
                const bytes = new Uint8Array(dataView.buffer);
                const decoder = new TextDecoder();
                const text = decoder.decode(bytes);
                
                try {
                  const parsed = JSON.parse(text);
                  resolved = true;
                  this.stopScanning();
                  resolve(parsed as NFCData);
                  return;
                } catch (e) {
                  console.error('Failed to parse NFC data:', e);
                }
              }
            }
            
            if (!resolved) {
              resolved = true;
              this.stopScanning();
              toast.error('Invalid NFC tag format');
              resolve(null);
            }
          } catch (err) {
            console.error('Error parsing NFC tag:', err);
            if (!resolved) {
              resolved = true;
              this.stopScanning();
              resolve(null);
            }
          }
        };

        // Add listener for NFC tag reads
        NfcPlugin.addListener('nfcTagRead', onTagRead).then((handle: any) => {
          this.listenerHandle = handle;
        });

        // Start scanning
        NfcPlugin.startScan({ timeout: 30000 }).catch((err: any) => {
          console.error('Failed to start NFC scan:', err);
          if (!resolved) {
            resolved = true;
            toast.error('Failed to start NFC scan');
            resolve(null);
          }
        });

        // Timeout fallback
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            this.stopScanning();
            toast.info('NFC scan timed out');
            resolve(null);
          }
        }, 30000);
      });
    } catch (error: any) {
      console.error('Error reading NFC tag:', error);

      if (error?.message?.includes('User canceled') || error?.message?.includes('cancelled')) {
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

    if (!NfcPlugin) {
      toast.error('NFC plugin is not installed');
      return;
    }

    this.isScanning = true;

    try {
      console.log('Starting continuous NFC scan');

      const onTagReadEvent = (event: any) => {
        try {
          console.log('NFC tag scanned:', event);
          
          const records = event?.records || [];
          
          for (const record of records) {
            if (record.recordType === 'text') {
              const dataView = record.data;
              const bytes = new Uint8Array(dataView.buffer);
              const decoder = new TextDecoder();
              const text = decoder.decode(bytes);
              
              try {
                const parsed = JSON.parse(text);
                onTagRead(parsed as NFCData);
                toast.success('NFC tag scanned successfully');
                return;
              } catch (e) {
                console.error('Failed to parse NFC data:', e);
                toast.error('Invalid NFC tag format');
              }
            }
          }
        } catch (err) {
          console.error('Error handling scanned NFC tag:', err);
        }
      };

      // Add listener
      this.listenerHandle = await NfcPlugin.addListener('nfcTagRead', onTagReadEvent);

      // Start scanning
      await NfcPlugin.startScan();
    } catch (error) {
      console.error('Error starting NFC scan:', error);
      this.isScanning = false;
      toast.error('Failed to start NFC scanning');
      throw error;
    }
  }

  async stopScanning(): Promise<void> {
    if (!this.isScanning) {
      return;
    }

    this.isScanning = false;

    try {
      if (this.listenerHandle) {
        await this.listenerHandle.remove();
        this.listenerHandle = null;
      }

      if (NfcPlugin) {
        await NfcPlugin.stopScan();
      }
    } catch (error) {
      console.error('Error stopping NFC scan:', error);
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
