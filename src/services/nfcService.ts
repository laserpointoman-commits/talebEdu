import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { Nfc } from "@trentrand/capacitor-nfc";

export interface NFCData {
  id: string;
  type: "student" | "teacher" | "driver" | "employee";
  name: string;
  additionalData?: Record<string, any>;
}

class NFCService {
  private isNFCSupported = false;
  private isScanning = false;
  private listenerHandle: { remove: () => Promise<void> } | null = null;
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.checkNFCSupport();
  }

  private async checkNFCSupport(): Promise<void> {
    try {
      // The plugin also has a Web NFC implementation; use it when not native.
      const result = await Nfc.isEnabled();
      this.isNFCSupported = !!result?.enabled;
    } catch (error) {
      // If not supported (e.g., iOS simulator / unsupported browser), this will throw.
      this.isNFCSupported = false;
      console.warn("NFC support check failed:", error);
    }
  }

  private async ensureReady(): Promise<void> {
    try {
      await this.initPromise;
    } catch {
      // ignore
    }
  }

  async isSupportedAsync(): Promise<boolean> {
    await this.ensureReady();
    return this.isNFCSupported;
  }

  isSupported(): boolean {
    return this.isNFCSupported;
  }

  async requestPermission(): Promise<boolean> {
    await this.ensureReady();

    if (!this.isNFCSupported) {
      toast.error("NFC is not supported on this device");
      return false;
    }

    // iOS prompts automatically when scan/write session begins; no explicit permission API.
    return true;
  }

  private createNFCRecord(data: NFCData): any {
    // Store JSON payload as raw bytes.
    const jsonString = JSON.stringify(data);
    const bytes = new TextEncoder().encode(jsonString);

    const buffer = new ArrayBuffer(bytes.length);
    const view = new DataView(buffer);
    bytes.forEach((byte, index) => view.setUint8(index, byte));

    return {
      // Keep stable so our parser knows what to decode.
      recordType: "text",
      mediaType: "text/plain",
      data: view,
    };
  }

  private parseTagEvent(event: any): NFCData | null {
    // Plugin shape: { serialNumber, message: { records: [...] } }
    const records = event?.message?.records ?? event?.records ?? [];

    for (const record of records) {
      if (record?.recordType !== "text") continue;

      const dataView: DataView | undefined = record?.data;
      if (!dataView) continue;

      const bytes = new Uint8Array(dataView.buffer);
      const text = new TextDecoder().decode(bytes);

      try {
        return JSON.parse(text) as NFCData;
      } catch (e) {
        console.error("Failed to parse NFC JSON payload:", e);
      }
    }

    return null;
  }

  async writeTag(data: NFCData): Promise<boolean> {
    await this.ensureReady();

    if (!this.isNFCSupported) {
      toast.error("NFC is not supported on this device");
      return false;
    }

    try {
      console.log("Writing NFC tag:", data);

      const record = this.createNFCRecord(data);
      await Nfc.write({
        records: [record],
        timeout: 30000,
      });

      toast.success("NFC tag written successfully");
      return true;
    } catch (error: any) {
      console.error("Error writing NFC tag:", error);

      if (error?.message?.toLowerCase?.().includes("cancel")) {
        toast.info("NFC write canceled");
      } else {
        toast.error("Failed to write NFC tag");
      }

      return false;
    }
  }

  async readTag(): Promise<NFCData | null> {
    await this.ensureReady();

    if (!this.isNFCSupported) {
      toast.error("NFC is not supported on this device");
      return null;
    }

    try {
      return await new Promise<NFCData | null>((resolve) => {
        let resolved = false;

        const onTagRead = async (event: any) => {
          if (resolved) return;

          try {
            console.log("NFC tag read event:", event);
            const parsed = this.parseTagEvent(event);

            resolved = true;
            this.stopScanning();

            if (!parsed) {
              toast.error("Invalid NFC tag format");
              resolve(null);
              return;
            }

            resolve(parsed);
          } catch (err) {
            console.error("Error handling NFC tag:", err);
            if (!resolved) {
              resolved = true;
              this.stopScanning();
              resolve(null);
            }
          }
        };

        // Add listener for NFC tag reads
        Nfc.addListener("nfcTagRead", onTagRead).then((handle: any) => {
          this.listenerHandle = handle;
        });

        // Start scanning
        Nfc.startScan({ timeout: 30000 }).catch((err: any) => {
          console.error("Failed to start NFC scan:", err);
          if (!resolved) {
            resolved = true;
            toast.error("Failed to start NFC scan");
            resolve(null);
          }
        });

        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            this.stopScanning();
            toast.info("NFC scan timed out");
            resolve(null);
          }
        }, 30000);
      });
    } catch (error: any) {
      console.error("Error reading NFC tag:", error);

      if (error?.message?.toLowerCase?.().includes("cancel")) {
        toast.info("NFC read canceled");
      } else {
        toast.error("Failed to read NFC tag");
      }

      return null;
    }
  }

  async startScanning(onTagRead: (data: NFCData) => void): Promise<void> {
    await this.ensureReady();

    if (this.isScanning) return;

    if (!this.isNFCSupported) {
      toast.error("NFC is not supported on this device");
      return;
    }

    this.isScanning = true;

    try {
      console.log("Starting continuous NFC scan");

      const onTagReadEvent = (event: any) => {
        try {
          console.log("NFC tag scanned:", event);
          const parsed = this.parseTagEvent(event);
          if (!parsed) {
            toast.error("Invalid NFC tag format");
            return;
          }

          onTagRead(parsed);
          toast.success("NFC tag scanned successfully");
        } catch (err) {
          console.error("Error handling scanned NFC tag:", err);
        }
      };

      this.listenerHandle = await Nfc.addListener("nfcTagRead", onTagReadEvent);
      await Nfc.startScan();
    } catch (error) {
      console.error("Error starting NFC scan:", error);
      this.isScanning = false;
      toast.error("Failed to start NFC scanning");
      throw error;
    }
  }

  async stopScanning(): Promise<void> {
    if (!this.isScanning) return;

    this.isScanning = false;

    try {
      if (this.listenerHandle) {
        await this.listenerHandle.remove();
        this.listenerHandle = null;
      }

      await Nfc.stopScan();
    } catch (error) {
      console.error("Error stopping NFC scan:", error);
    }
  }

  isScanningActive(): boolean {
    return this.isScanning;
  }
}

export const nfcService = new NFCService();

