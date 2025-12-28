import Foundation
import Capacitor
import CoreNFC

@objc(NfcPlugin)
public class NfcPlugin: CAPPlugin, NFCNDEFReaderSessionDelegate {
    private var session: NFCNDEFReaderSession?
    private var pendingCall: CAPPluginCall?
    private var isWriteMode: Bool = false
    private var messageToWrite: String?
    
    @objc func isSupported(_ call: CAPPluginCall) {
        let supported = NFCNDEFReaderSession.readingAvailable
        call.resolve(["supported": supported])
    }
    
    @objc func startScanning(_ call: CAPPluginCall) {
        guard NFCNDEFReaderSession.readingAvailable else {
            call.reject("NFC is not available on this device")
            return
        }
        
        self.pendingCall = call
        self.isWriteMode = false
        
        DispatchQueue.main.async {
            self.session = NFCNDEFReaderSession(delegate: self, queue: nil, invalidateAfterFirstRead: false)
            self.session?.alertMessage = "Hold your iPhone near the NFC tag"
            self.session?.begin()
        }
        
        call.resolve(["success": true])
    }
    
    @objc func stopScanning(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.session?.invalidate()
            self.session = nil
        }
        call.resolve(["success": true])
    }
    
    @objc func write(_ call: CAPPluginCall) {
        guard NFCNDEFReaderSession.readingAvailable else {
            call.reject("NFC is not available on this device")
            return
        }
        
        guard let message = call.getString("message") else {
            call.reject("Message is required")
            return
        }
        
        self.pendingCall = call
        self.isWriteMode = true
        self.messageToWrite = message
        
        DispatchQueue.main.async {
            self.session = NFCNDEFReaderSession(delegate: self, queue: nil, invalidateAfterFirstRead: false)
            self.session?.alertMessage = "Hold your iPhone near the NFC tag to write"
            self.session?.begin()
        }
    }
    
    // MARK: - NFCNDEFReaderSessionDelegate
    
    public func readerSession(_ session: NFCNDEFReaderSession, didInvalidateWithError error: Error) {
        let readerError = error as! NFCReaderError
        if readerError.code != .readerSessionInvalidationErrorFirstNDEFTagRead &&
           readerError.code != .readerSessionInvalidationErrorUserCanceled {
            self.pendingCall?.reject("NFC session error: \(error.localizedDescription)")
        }
        self.session = nil
    }
    
    public func readerSession(_ session: NFCNDEFReaderSession, didDetectNDEFs messages: [NFCNDEFMessage]) {
        // This is called when reading in background
        for message in messages {
            processMessage(message)
        }
    }
    
    public func readerSession(_ session: NFCNDEFReaderSession, didDetect tags: [NFCNDEFTag]) {
        guard let tag = tags.first else { return }
        
        session.connect(to: tag) { error in
            if let error = error {
                session.invalidate(errorMessage: "Connection failed: \(error.localizedDescription)")
                return
            }
            
            tag.queryNDEFStatus { status, capacity, error in
                if let error = error {
                    session.invalidate(errorMessage: "Query failed: \(error.localizedDescription)")
                    return
                }
                
                if self.isWriteMode {
                    // Write mode
                    guard status == .readWrite else {
                        session.invalidate(errorMessage: "Tag is not writable")
                        return
                    }
                    
                    guard let messageString = self.messageToWrite,
                          let payload = NFCNDEFPayload.wellKnownTypeTextPayload(string: messageString, locale: Locale(identifier: "en")) else {
                        session.invalidate(errorMessage: "Failed to create payload")
                        return
                    }
                    
                    let ndefMessage = NFCNDEFMessage(records: [payload])
                    
                    tag.writeNDEF(ndefMessage) { error in
                        if let error = error {
                            session.invalidate(errorMessage: "Write failed: \(error.localizedDescription)")
                            self.pendingCall?.reject("Write failed: \(error.localizedDescription)")
                        } else {
                            session.alertMessage = "Successfully written to tag!"
                            session.invalidate()
                            self.pendingCall?.resolve(["success": true])
                        }
                    }
                } else {
                    // Read mode
                    tag.readNDEF { message, error in
                        if let error = error {
                            session.invalidate(errorMessage: "Read failed: \(error.localizedDescription)")
                            return
                        }
                        
                        if let message = message {
                            self.processMessage(message)
                            session.alertMessage = "Tag read successfully!"
                        }
                        
                        // Don't invalidate to allow continuous reading
                    }
                }
            }
        }
    }
    
    private func processMessage(_ message: NFCNDEFMessage) {
        for record in message.records {
            if let text = extractText(from: record) {
                self.notifyListeners("nfcTagRead", data: ["message": text])
            }
        }
    }
    
    private func extractText(from record: NFCNDEFPayload) -> String? {
        if record.typeNameFormat == .nfcWellKnown {
            if let type = String(data: record.type, encoding: .utf8), type == "T" {
                // Text record
                let payload = record.payload
                if payload.count > 1 {
                    let statusByte = payload[0]
                    let languageCodeLength = Int(statusByte & 0x3F)
                    if payload.count > languageCodeLength + 1 {
                        let textData = payload.subdata(in: (languageCodeLength + 1)..<payload.count)
                        return String(data: textData, encoding: .utf8)
                    }
                }
            }
        }
        return nil
    }
}
