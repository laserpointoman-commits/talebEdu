import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { NFC, NDEFWriteOptions, NFCError, NDEFMessagesTransformable } from '@exxili/capacitor-nfc';

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
    if (Capacitor.isNativePlatform()) {
      this.isNFCSupported = true;
    }
  }

  /** Get the native Capawesome NFC plugin instance (if installed). */
  private getNativeNfcPlugin(): any | null {
    try {
      const anyCapacitor = Capacitor as any;
      return anyCapacitor?.Plugins?.Nfc ?? (window as any)?.Capacitor?.Plugins?.Nfc ?? null;
    } catch {
      return null;
    }
  }

  /** Minimal NDEF text record builder (same format Capawesome expects). */
  private createNdefTextRecord(text: string): any {
    const encoder = new TextEncoder();
    const languageCode = 'en';
    const langBytes = Array.from(encoder.encode(languageCode));
    const textBytes = Array.from(encoder.encode(text));

    // Status byte: bit 7 = encoding (0 = UTF‑8), bits 5..0 = language code length
    const statusByte = langBytes.length & 0x3f;
    const payload = [statusByte, ...langBytes, ...textBytes];

    return {
      id: [],
      tnf: 1, // TypeNameFormat.WellKnown
      type: [0x54], // "T" (text record)
      payload,
    };
  }

  private async checkNFCSupport(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        const { supported } = await NFC.isSupported();
        this.isNFCSupported = !!supported;
        return this.isNFCSupported;
      }

      // Web NFC API (Chrome Android) – fallback for browser usage
      if ('NDEFReader' in window) {
        this.isNFCSupported = true;
        return true;
      }

      this.isNFCSupported = false;
      return false;
    } catch (error: any) {
      console.error('NFC support check failed:', error);
      // Treat missing/UNIMPLEMENTED plugin as "not supported" rather than crashing
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

    try {
      // Native mobile apps – system UI is presented automatically on scan
      if (Capacitor.isNativePlatform()) {
        return true;
      }

      // Web NFC – permissions are requested when scanning starts
      if ('NDEFReader' in window) {
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
      // Native iOS/Android using @exxili/capacitor-nfc
      if (Capacitor.isNativePlatform()) {
        console.log('Writing NFC tag via native plugin with data:', data);

        const message: NDEFWriteOptions<string> = {
          records: [
            {
              type: 'T',
              payload: JSON.stringify(data),
            },
          ],
        };

        return await new Promise<boolean>((resolve) => {
          const cleanup = (offWrite?: () => void, offError?: () => void) => {
            try {
              offWrite && offWrite();
              offError && offError();
            } catch (err) {
              console.warn('Error during NFC cleanup (write):', err);
            }
          };

          const offWrite = NFC.onWrite(() => {
            toast.success('NFC tag written successfully');
            cleanup(offWrite, offError);
            resolve(true);
          });

          const offError = NFC.onError((error: NFCError) => {
            console.error('Error writing NFC tag via native plugin:', error);
            toast.error('Failed to write NFC tag');
            cleanup(offWrite, offError);
            resolve(false);
          });

          NFC.writeNDEF(message).catch((error) => {
            console.error('Error starting NFC write:', error);
            toast.error('Failed to start NFC write session');
            cleanup(offWrite, offError);
            resolve(false);
          });
        });
      }

      // Web NFC API (Chrome Android) – fallback
      if ('NDEFReader' in window) {
        const ndef = new (window as any).NDEFReader();

        const records = [
          {
            recordType: 'text',
            data: JSON.stringify(data),
          },
        ];

        await ndef.write({ records });
        toast.success('NFC tag written successfully');
        return true;
      }

      // Simulation mode for development / unsupported environments
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
      // Native iOS/Android – use @exxili/capacitor-nfc
      if (Capacitor.isNativePlatform()) {
        return await new Promise<NFCData | null>((resolve) => {
          const cleanup = (offRead?: () => void, offError?: () => void) => {
            try {
              offRead && offRead();
              offError && offError();
            } catch (err) {
              console.warn('Error during NFC cleanup (read):', err);
            }
          };

          const offRead = NFC.onRead((event: NDEFMessagesTransformable) => {
            try {
              const asString = event.string();
              const firstRecord = asString.messages[0]?.records[0];
              const text = firstRecord?.payload as string | undefined;

              if (text) {
                const parsed = JSON.parse(text);
                cleanup(offRead, offError);
                resolve(parsed as NFCData);
                return;
              }

              cleanup(offRead, offError);
              resolve(null);
            } catch (err) {
              console.error('Error parsing NFC tag via native plugin:', err);
              cleanup(offRead, offError);
              resolve(null);
            }
          });

          const offError = NFC.onError((error: NFCError) => {
            console.error('Failed to read NFC tag via native plugin:', error);
            toast.error('Failed to read NFC tag');
            cleanup(offRead, offError);
            resolve(null);
          });

          NFC.startScan().catch((error) => {
            console.error('Failed to start NFC scan session (read):', error);
            toast.error('Failed to start NFC read session');
            cleanup(offRead, offError);
            resolve(null);
          });
        });
      }

      // Web NFC API
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
      // Native iOS/Android
      if (Capacitor.isNativePlatform()) {
        console.log('Starting continuous NFC scan via native plugin');

        try {
          const offRead = NFC.onRead((event: NDEFMessagesTransformable) => {
            try {
              const asString = event.string();
              const firstRecord = asString.messages[0]?.records[0];
              const text = firstRecord?.payload as string | undefined;

              if (text) {
                const parsed = JSON.parse(text);
                onTagRead(parsed as NFCData);
              }
            } catch (err) {
              console.error('Error handling scanned NFC tag:', err);
            }
          });

          const offError = NFC.onError((error: NFCError) => {
            console.error('NFC reading error:', error);
          });

          await NFC.startScan();

          // Note: we don't store offRead/offError here; stopScanning will simply flip the flag.
          // If you want stricter cleanup, we can extend this service later to track and dispose listeners.
        } catch (error) {
          console.error('Failed to start NFC scan session (continuous):', error);
          toast.error('Failed to start NFC scan session');
          this.isScanning = false;
        }

        return;
      }

      // Web NFC API – fallback
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
