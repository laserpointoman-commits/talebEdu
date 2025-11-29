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
    // Native iOS/Android: rely on presence of the native plugin
    if (Capacitor.isNativePlatform()) {
      const nativeNfc = this.getNativeNfcPlugin();

      if (nativeNfc) {
        // Plugin is present – NFC is available on this device
        this.isNFCSupported = true;
        return true;
      }

      // No plugin registered – avoid calling into Capacitor to prevent UNIMPLEMENTED errors
      this.isNFCSupported = false;
      return false;
    }

    // Web NFC API (Chrome Android) – fallback for browser usage
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
      // Web NFC – permissions are requested when scanning starts
      if ('NDEFReader' in window && !Capacitor.isNativePlatform()) {
        return true;
      }

      // Native mobile apps – plugin relies on system UI, no explicit permission call needed
      if (Capacitor.isNativePlatform()) {
        const nativeNfc = this.getNativeNfcPlugin();

        if (!nativeNfc) {
          toast.error('Native NFC plugin is not installed in the app build');
          return false;
        }

        // Capawesome NFC exposes requestPermissions() mainly for Web;
        // on iOS/Android it always resolves to granted, so we call it defensively.
        if (typeof nativeNfc.requestPermissions === 'function') {
          await nativeNfc.requestPermissions();
        }

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
      // Native iOS/Android using Capawesome NFC plugin (CoreNFC under the hood)
      if (Capacitor.isNativePlatform()) {
        const nativeNfc = this.getNativeNfcPlugin();

        if (!nativeNfc) {
          console.error('Native NFC plugin (Capawesome) is not available');
          toast.error('NFC plugin is not available in this app build');
          return false;
        }

        console.log('Writing NFC tag via native plugin with data:', data);

        const json = JSON.stringify(data);
        const record = this.createNdefTextRecord(json);

        return await new Promise<boolean>((resolve) => {
          let listenerHandle: any | null = null;

          const cleanup = async () => {
            try {
              if (listenerHandle && typeof listenerHandle.remove === 'function') {
                await listenerHandle.remove();
              }
              if (typeof nativeNfc.stopScanSession === 'function') {
                await nativeNfc.stopScanSession();
              }
            } catch (err) {
              console.warn('Error during NFC cleanup:', err);
            }
          };

          const onTagScanned = async (_event: any) => {
            try {
              if (typeof nativeNfc.write !== 'function') {
                throw { code: 'UNIMPLEMENTED', message: 'write() not implemented by NFC plugin' };
              }

              await nativeNfc.write({ message: { records: [record] } });
              await cleanup();
              toast.success('NFC tag written successfully');
              resolve(true);
            } catch (error: any) {
              console.error('Error writing NFC tag via native plugin:', error);

              if (error?.code === 'UNIMPLEMENTED') {
                toast.error('NFC write is not implemented in this build (UNIMPLEMENTED)');
              } else if (error?.message?.includes('User canceled')) {
                toast.info('NFC write canceled');
              } else {
                toast.error('Failed to write NFC tag');
              }

              resolve(false);
            }
          };

          // Attach listener and start the scan session
          if (typeof nativeNfc.addListener === 'function') {
            nativeNfc
              .addListener('nfcTagScanned', onTagScanned)
              .then((handle: any) => {
                listenerHandle = handle;
              })
              .catch((err: any) => {
                console.error('Failed to attach NFC listener:', err);
                toast.error('Failed to start NFC write session');
                resolve(false);
              });
          }

          if (typeof nativeNfc.startScanSession === 'function') {
            nativeNfc
              .startScanSession({
                alertMessage: 'Hold the card near the top of your iPhone to write the NFC tag.',
              })
              .catch((err: any) => {
                console.error('Failed to start NFC scan session:', err);
                toast.error('Failed to start NFC write session');
                resolve(false);
              });
          } else {
            console.error('startScanSession() is not implemented on the NFC plugin');
            toast.error('NFC scan session is not available in this build');
            resolve(false);
          }
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
      // Native iOS/Android – use plugin if available
      if (Capacitor.isNativePlatform()) {
        const nativeNfc = this.getNativeNfcPlugin();

        if (!nativeNfc) {
          toast.error('Native NFC plugin is not available in this build');
          return null;
        }

        return await new Promise<NFCData | null>((resolve) => {
          let listenerHandle: any | null = null;

          const cleanup = async () => {
            try {
              if (listenerHandle && typeof listenerHandle.remove === 'function') {
                await listenerHandle.remove();
              }
              if (typeof nativeNfc.stopScanSession === 'function') {
                await nativeNfc.stopScanSession();
              }
            } catch (err) {
              console.warn('Error during NFC cleanup (read):', err);
            }
          };

          const onTagScanned = async (event: any) => {
            try {
              const message = event?.nfcTag?.message;
              const records = message?.records ?? [];

              for (const record of records) {
                // Capawesome provides payload as byte array
                if (Array.isArray(record.payload)) {
                  const bytes = new Uint8Array(record.payload);
                  const decoder = new TextDecoder();

                  // Skip status + language code (very small helper)
                  const status = bytes[0];
                  const langLen = status & 0x3f;
                  const textBytes = bytes.slice(1 + langLen);
                  const text = decoder.decode(textBytes);
                  const parsed = JSON.parse(text);

                  await cleanup();
                  resolve(parsed as NFCData);
                  return;
                }
              }

              await cleanup();
              resolve(null);
            } catch (err) {
              console.error('Error parsing NFC tag via native plugin:', err);
              await cleanup();
              resolve(null);
            }
          };

          if (typeof nativeNfc.addListener === 'function') {
            nativeNfc
              .addListener('nfcTagScanned', onTagScanned)
              .then((handle: any) => {
                listenerHandle = handle;
              })
              .catch((err: any) => {
                console.error('Failed to attach NFC listener (read):', err);
                toast.error('Failed to start NFC read session');
                resolve(null);
              });
          }

          if (typeof nativeNfc.startScanSession === 'function') {
            nativeNfc
              .startScanSession({
                alertMessage: 'Hold the card near the top of your iPhone to read the NFC tag.',
              })
              .catch((err: any) => {
                console.error('Failed to start NFC scan session (read):', err);
                toast.error('Failed to start NFC read session');
                resolve(null);
              });
          } else {
            console.error('startScanSession() is not implemented on the NFC plugin');
            toast.error('NFC scan session is not available in this build');
            resolve(null);
          }
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
        const nativeNfc = this.getNativeNfcPlugin();

        if (!nativeNfc) {
          toast.error('Native NFC plugin is not available in this build');
          this.isScanning = false;
          return;
        }

        console.log('Starting continuous NFC scan via native plugin');

        if (typeof nativeNfc.addListener === 'function') {
          await nativeNfc.addListener('nfcTagScanned', (event: any) => {
            try {
              const message = event?.nfcTag?.message;
              const records = message?.records ?? [];

              for (const record of records) {
                if (Array.isArray(record.payload)) {
                  const bytes = new Uint8Array(record.payload);
                  const decoder = new TextDecoder();

                  const status = bytes[0];
                  const langLen = status & 0x3f;
                  const textBytes = bytes.slice(1 + langLen);
                  const text = decoder.decode(textBytes);
                  const parsed = JSON.parse(text);
                  onTagRead(parsed as NFCData);
                  return;
                }
              }
            } catch (err) {
              console.error('Error handling scanned NFC tag:', err);
            }
          });
        }

        if (typeof nativeNfc.startScanSession === 'function') {
          await nativeNfc.startScanSession({
            alertMessage: 'Hold NFC cards near the top of your iPhone to scan.',
          });
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
