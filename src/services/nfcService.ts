import { toast } from 'sonner';
import { Capacitor, registerPlugin } from '@capacitor/core';

export interface NFCData {
  id: string;
  type: 'student' | 'teacher' | 'driver' | 'employee';
  name: string;
  additionalData?: Record<string, any>;
}

interface NFCPluginInterface {
  isSupported(): Promise<{ supported: boolean }>;
  read(): Promise<void>;
  write(options: { text: string }): Promise<void>;
  addListener(eventName: string, callback: (data: any) => void): Promise<any>;
  removeAllListeners(): Promise<void>;
}

const NFCPlugin = registerPlugin<NFCPluginInterface>('NFCPlugin');

class NFCService {
  private isNFCSupported: boolean = false;
  private isScanning: boolean = false;
  private supportCheckPromise: Promise<boolean> | null = null;

  constructor() {
    this.supportCheckPromise = this.checkNFCSupport();
    
    if (Capacitor.isNativePlatform()) {
      this.isNFCSupported = true;
    }
  }

  private async checkNFCSupport(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await NFCPlugin.isSupported();
        this.isNFCSupported = result.supported === true;
        return this.isNFCSupported;
      }

      if ('NDEFReader' in window) {
        this.isNFCSupported = true;
        return true;
      }

      this.isNFCSupported = false;
      return false;
    } catch (error: any) {
      console.error('NFC support check failed:', error);
      this.isNFCSupported = false;
      return false;
    }
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

    if (Capacitor.isNativePlatform() || 'NDEFReader' in window) {
      return true;
    }

    return false;
  }

  async writeTag(data: NFCData): Promise<boolean> {
    await this.ensureSupportChecked();

    if (!this.isNFCSupported) {
      toast.error('NFC is not supported on this device');
      return false;
    }

    try {
      if (Capacitor.isNativePlatform()) {
        console.log('Writing NFC tag via native plugin with data:', data);
        
        return await new Promise<boolean>((resolve) => {
          let resolved = false;
          
          const cleanup = async () => {
            if (!resolved) {
              resolved = true;
              await NFCPlugin.removeAllListeners();
            }
          };
          
          NFCPlugin.addListener('nfcWriteSuccess', async () => {
            toast.success('NFC tag written successfully');
            await cleanup();
            resolve(true);
          });

          NFCPlugin.addListener('nfcError', async (event: any) => {
            console.error('Error writing NFC tag:', event.error);
            toast.error('Failed to write NFC tag');
            await cleanup();
            resolve(false);
          });

          NFCPlugin.write({ text: JSON.stringify(data) }).catch(async (error) => {
            console.error('Error starting NFC write:', error);
            toast.error('Failed to start NFC write session');
            await cleanup();
            resolve(false);
          });
        });
      }

      if ('NDEFReader' in window) {
        const ndef = new (window as any).NDEFReader();
        const records = [{ recordType: 'text', data: JSON.stringify(data) }];
        await ndef.write({ records });
        toast.success('NFC tag written successfully');
        return true;
      }

      console.log('Writing NFC tag (simulation):', data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('NFC tag written successfully (Simulation Mode)');
      return true;
    } catch (error: any) {
      console.error('Error writing NFC tag:', error);

      if (error?.message?.includes('User canceled')) {
        toast.info('NFC write canceled');
      } else if (error?.message?.includes('not available')) {
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
      if (Capacitor.isNativePlatform()) {
        return await new Promise<NFCData | null>((resolve) => {
          let resolved = false;
          
          const cleanup = async () => {
            if (!resolved) {
              resolved = true;
              await NFCPlugin.removeAllListeners();
            }
          };
          
          NFCPlugin.addListener('nfcTagScanned', async (event: any) => {
            try {
              const parsed = JSON.parse(event.message);
              await cleanup();
              resolve(parsed as NFCData);
            } catch (err) {
              console.error('Error parsing NFC tag:', err);
              await cleanup();
              resolve(null);
            }
          });

          NFCPlugin.addListener('nfcError', async (event: any) => {
            console.error('Failed to read NFC tag:', event.error);
            toast.error('Failed to read NFC tag');
            await cleanup();
            resolve(null);
          });

          NFCPlugin.read().catch(async (error) => {
            console.error('Failed to start NFC read session:', error);
            toast.error('Failed to start NFC read session');
            await cleanup();
            resolve(null);
          });
        });
      }

      if ('NDEFReader' in window) {
        const ndef = new (window as any).NDEFReader();
        await ndef.scan();

        return await new Promise<NFCData | null>((resolve) => {
          ndef.addEventListener('reading', ({ message }: any) => {
            for (const record of message.records) {
              if (record.recordType === 'text') {
                const textDecoder = new TextDecoder(record.encoding || 'utf-8');
                const text = textDecoder.decode(record.data);
                const parsed = JSON.parse(text);
                resolve(parsed as NFCData);
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

      if (error?.message?.includes('User canceled')) {
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
      if (Capacitor.isNativePlatform()) {
        console.log('Starting continuous NFC scan via native plugin');
        
        NFCPlugin.addListener('nfcTagScanned', (event: any) => {
          if (!this.isScanning) return;
          
          try {
            const parsed = JSON.parse(event.message);
            onTagRead(parsed as NFCData);
            
            // Automatically start next scan
            if (this.isScanning) {
              setTimeout(() => {
                if (this.isScanning) {
                  NFCPlugin.read().catch(console.error);
                }
              }, 500);
            }
          } catch (err) {
            console.error('Error handling scanned NFC tag:', err);
          }
        });

        NFCPlugin.addListener('nfcError', (event: any) => {
          if (!this.isScanning) return;
          console.error('NFC reading error:', event.error);
          
          // Continue scanning on error
          if (this.isScanning) {
            setTimeout(() => {
              if (this.isScanning) {
                NFCPlugin.read().catch(console.error);
              }
            }, 1000);
          }
        });
        
        // Start first scan
        await NFCPlugin.read();
        return;
      }

      if ('NDEFReader' in window) {
        const ndef = new (window as any).NDEFReader();
        await ndef.scan();

        ndef.addEventListener('reading', ({ message }: any) => {
          for (const record of message.records) {
            if (record.recordType === 'text') {
              const textDecoder = new TextDecoder(record.encoding || 'utf-8');
              const text = textDecoder.decode(record.data);
              const parsed = JSON.parse(text);
              onTagRead(parsed as NFCData);
            }
          }
        });

        ndef.addEventListener('readingerror', () => {
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
    
    if (Capacitor.isNativePlatform()) {
      await NFCPlugin.removeAllListeners();
    }
  }

  isSupported(): boolean {
    return this.isNFCSupported;
  }

  isScanningActive(): boolean {
    return this.isScanning;
  }
}

export const nfcService = new NFCService();
