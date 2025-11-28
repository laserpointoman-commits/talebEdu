import Foundation
import Capacitor
import CoreNFC

@objc(NFCPlugin)
public class NFCPlugin: CAPPlugin, NFCNDEFReaderSessionDelegate {
    private var nfcSession: NFCNDEFReaderSession?
    private var writeCall: CAPPluginCall?
    private var readCall: CAPPluginCall?
    private var messageToWrite: NFCNDEFMessage?
    
    @objc func isAvailable(_ call: CAPPluginCall) {
        let available = NFCNDEFReaderSession.readingAvailable
        call.resolve(["available": available])
    }
    
    @objc func write(_ call: CAPPluginCall) {
        guard NFCNDEFReaderSession.readingAvailable else {
            call.reject("NFC not available on this device")
            return
        }
        
        // Accept either a JSON object or a JSON string
        let jsonString: String
        if let dataString = call.getString("data") {
            jsonString = dataString
        } else if let dataObject = call.getObject("data"),
                  let jsonData = try? JSONSerialization.data(withJSONObject: dataObject),
                  let jsonStr = String(data: jsonData, encoding: .utf8) {
            jsonString = jsonStr
        } else {
            call.reject("No data provided or invalid format")
            return
        }
        
        let payload = NFCNDEFPayload(
            format: .nfcWellKnown,
            type: "T".data(using: .utf8)!,
            identifier: Data(),
            payload: jsonString.data(using: .utf8)!
        )
        
        self.messageToWrite = NFCNDEFMessage(records: [payload])
        self.writeCall = call
        
        nfcSession = NFCNDEFReaderSession(delegate: self, queue: nil, invalidateAfterFirstRead: false)
        nfcSession?.alertMessage = "Hold your iPhone near the NFC tag to write"
        nfcSession?.begin()
    }
    
    @objc func read(_ call: CAPPluginCall) {
        guard NFCNDEFReaderSession.readingAvailable else {
            call.reject("NFC not available on this device")
            return
        }
        
        self.readCall = call
        
        nfcSession = NFCNDEFReaderSession(delegate: self, queue: nil, invalidateAfterFirstRead: true)
        nfcSession?.alertMessage = "Hold your iPhone near the NFC tag to read"
        nfcSession?.begin()
    }
    
    @objc func stopScan(_ call: CAPPluginCall) {
        nfcSession?.invalidate()
        nfcSession = nil
        call.resolve()
    }
    
    // MARK: - NFCNDEFReaderSessionDelegate
    
    public func readerSession(_ session: NFCNDEFReaderSession, didDetectNDEFs messages: [NFCNDEFMessage]) {
        guard let message = messages.first,
              let record = message.records.first else {
            readCall?.reject("No NDEF messages found")
            return
        }
        
        if let jsonString = String(data: record.payload, encoding: .utf8),
           let jsonData = jsonString.data(using: .utf8),
           let data = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any] {
            readCall?.resolve(["data": data])
        } else {
            readCall?.reject("Failed to parse NFC data")
        }
    }
    
    public func readerSession(_ session: NFCNDEFReaderSession, didDetect tags: [NFCNDEFTag]) {
        guard tags.count == 1 else {
            session.alertMessage = "Please scan only one tag"
            session.invalidate()
            return
        }
        
        let tag = tags.first!
        
        session.connect(to: tag) { error in
            if let error = error {
                session.invalidate(errorMessage: "Connection failed: \(error.localizedDescription)")
                self.writeCall?.reject("Connection failed")
                return
            }
            
            tag.queryNDEFStatus { status, capacity, error in
                if let error = error {
                    session.invalidate(errorMessage: "Query failed: \(error.localizedDescription)")
                    self.writeCall?.reject("Query failed")
                    return
                }
                
                switch status {
                case .notSupported:
                    session.invalidate(errorMessage: "Tag is not NDEF compatible")
                    self.writeCall?.reject("Tag not supported")
                    
                case .readOnly:
                    session.invalidate(errorMessage: "Tag is read-only")
                    self.writeCall?.reject("Tag is read-only")
                    
                case .readWrite:
                    if let message = self.messageToWrite {
                        tag.writeNDEF(message) { error in
                            if let error = error {
                                session.invalidate(errorMessage: "Write failed: \(error.localizedDescription)")
                                self.writeCall?.reject("Write failed")
                            } else {
                                session.alertMessage = "Successfully written to NFC tag!"
                                session.invalidate()
                                self.writeCall?.resolve(["success": true])
                            }
                        }
                    } else {
                        // Reading mode
                        tag.readNDEF { message, error in
                            if let error = error {
                                session.invalidate(errorMessage: "Read failed: \(error.localizedDescription)")
                                self.readCall?.reject("Read failed")
                                return
                            }
                            
                            guard let message = message,
                                  let record = message.records.first else {
                                session.invalidate(errorMessage: "No data found on tag")
                                self.readCall?.reject("No data found")
                                return
                            }
                            
                            if let jsonString = String(data: record.payload, encoding: .utf8),
                               let jsonData = jsonString.data(using: .utf8),
                               let data = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any] {
                                session.alertMessage = "Successfully read NFC tag!"
                                session.invalidate()
                                self.readCall?.resolve(["data": data])
                            } else {
                                session.invalidate(errorMessage: "Failed to parse data")
                                self.readCall?.reject("Failed to parse data")
                            }
                        }
                    }
                    
                @unknown default:
                    session.invalidate(errorMessage: "Unknown tag status")
                    self.writeCall?.reject("Unknown status")
                }
            }
        }
    }
    
    public func readerSessionDidBecomeActive(_ session: NFCNDEFReaderSession) {
        // Session became active
    }
    
    public func readerSession(_ session: NFCNDEFReaderSession, didInvalidateWithError error: Error) {
        nfcSession = nil
        
        if let readerError = error as? NFCReaderError {
            if readerError.code != .readerSessionInvalidationErrorUserCanceled {
                writeCall?.reject("Session invalidated: \(error.localizedDescription)")
                readCall?.reject("Session invalidated: \(error.localizedDescription)")
            }
        }
        
        writeCall = nil
        readCall = nil
    }
}
