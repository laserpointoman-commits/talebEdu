import Foundation
import Capacitor
import CoreNFC

@objc(NFCPlugin)
public class NFCPlugin: CAPPlugin, NFCNDEFReaderSessionDelegate {
    private var nfcSession: NFCNDEFReaderSession?
    private var writeMessage: NFCNDEFMessage?
    
    @objc func isSupported(_ call: CAPPluginCall) {
        if NFCNDEFReaderSession.readingAvailable {
            call.resolve(["supported": true])
        } else {
            call.resolve(["supported": false])
        }
    }
    
    @objc func write(_ call: CAPPluginCall) {
        guard NFCNDEFReaderSession.readingAvailable else {
            call.reject("NFC not available")
            return
        }
        
        guard let text = call.getString("text") else {
            call.reject("Text is required")
            return
        }
        
        // Create NDEF text record
        let payload = NFCNDEFPayload.wellKnownTypeTextPayload(
            string: text,
            locale: Locale(identifier: "en")
        )
        
        guard let payload = payload else {
            call.reject("Failed to create payload")
            return
        }
        
        self.writeMessage = NFCNDEFMessage(records: [payload])
        
        nfcSession = NFCNDEFReaderSession(
            delegate: self,
            queue: nil,
            invalidateAfterFirstRead: false
        )
        nfcSession?.alertMessage = "Hold your iPhone near an NFC tag to write"
        nfcSession?.begin()
        
        call.resolve()
    }
    
    @objc func read(_ call: CAPPluginCall) {
        guard NFCNDEFReaderSession.readingAvailable else {
            call.reject("NFC not available")
            return
        }
        
        nfcSession = NFCNDEFReaderSession(
            delegate: self,
            queue: nil,
            invalidateAfterFirstRead: true
        )
        nfcSession?.alertMessage = "Hold your iPhone near an NFC tag to read"
        nfcSession?.begin()
        
        call.resolve()
    }
    
    // MARK: - NFCNDEFReaderSessionDelegate
    
    public func readerSession(_ session: NFCNDEFReaderSession, didDetectNDEFs messages: [NFCNDEFMessage]) {
        guard let message = messages.first,
              let record = message.records.first else {
            return
        }
        
        var text = ""
        if let payload = String(data: record.payload, encoding: .utf8) {
            // Remove language code prefix (first 3 bytes for text records)
            let startIndex = payload.index(payload.startIndex, offsetBy: min(3, payload.count))
            text = String(payload[startIndex...])
        }
        
        notifyListeners("nfcTagScanned", data: [
            "message": text,
            "type": "text"
        ])
        
        session.alertMessage = "Tag read successfully"
        session.invalidate()
    }
    
    public func readerSession(_ session: NFCNDEFReaderSession, didDetect tags: [NFCNDEFTag]) {
        guard let tag = tags.first else {
            session.invalidate(errorMessage: "No tag detected")
            return
        }
        
        session.connect(to: tag) { error in
            if let error = error {
                session.invalidate(errorMessage: "Connection error: \(error.localizedDescription)")
                return
            }
            
            // Check if we're writing
            if let writeMessage = self.writeMessage {
                tag.writeNDEF(writeMessage) { error in
                    if let error = error {
                        session.invalidate(errorMessage: "Write error: \(error.localizedDescription)")
                        self.notifyListeners("nfcError", data: ["error": error.localizedDescription])
                    } else {
                        session.alertMessage = "Write successful!"
                        session.invalidate()
                        self.notifyListeners("nfcWriteSuccess", data: [:])
                    }
                    self.writeMessage = nil
                }
            } else {
                // Reading
                tag.readNDEF { message, error in
                    if let error = error {
                        session.invalidate(errorMessage: "Read error: \(error.localizedDescription)")
                        self.notifyListeners("nfcError", data: ["error": error.localizedDescription])
                        return
                    }
                    
                    guard let message = message,
                          let record = message.records.first else {
                        session.invalidate(errorMessage: "No data found")
                        return
                    }
                    
                    var text = ""
                    if let payload = String(data: record.payload, encoding: .utf8) {
                        let startIndex = payload.index(payload.startIndex, offsetBy: min(3, payload.count))
                        text = String(payload[startIndex...])
                    }
                    
                    self.notifyListeners("nfcTagScanned", data: [
                        "message": text,
                        "type": "text"
                    ])
                    
                    session.alertMessage = "Tag read successfully"
                    session.invalidate()
                }
            }
        }
    }
    
    public func readerSession(_ session: NFCNDEFReaderSession, didInvalidateWithError error: Error) {
        if let nfcError = error as? NFCReaderError {
            if nfcError.code != .readerSessionInvalidationErrorFirstNDEFTagRead &&
               nfcError.code != .readerSessionInvalidationErrorUserCanceled {
                notifyListeners("nfcError", data: ["error": error.localizedDescription])
            }
        }
    }
}
