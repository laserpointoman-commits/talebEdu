import Foundation
import Capacitor
import CoreNFC

@objc(NFCPlugin)
public class NFCPlugin: CAPPlugin, NFCNDEFReaderSessionDelegate {
    private var nfcSession: NFCNDEFReaderSession?
    private var writeCall: CAPPluginCall?
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
        
        guard let data = call.getObject("data"),
              let id = data["id"] as? String,
              let type = data["type"] as? String,
              let name = data["name"] as? String else {
            call.reject("Invalid data format")
            return
        }
        
        let jsonData: [String: Any] = [
            "id": id,
            "type": type,
            "name": name
        ]
        
        guard let jsonString = try? JSONSerialization.data(withJSONObject: jsonData),
              let payload = NFCNDEFPayload(
                format: .nfcWellKnown,
                type: "T".data(using: .utf8)!,
                identifier: Data(),
                payload: jsonString
              ) else {
            call.reject("Failed to create NFC payload")
            return
        }
        
        self.messageToWrite = NFCNDEFMessage(records: [payload])
        self.writeCall = call
        
        DispatchQueue.main.async {
            self.nfcSession = NFCNDEFReaderSession(
                delegate: self,
                queue: nil,
                invalidateAfterFirstRead: false
            )
            self.nfcSession?.alertMessage = "Hold your iPhone near the NFC tag to write"
            self.nfcSession?.begin()
        }
    }
    
    @objc func read(_ call: CAPPluginCall) {
        guard NFCNDEFReaderSession.readingAvailable else {
            call.reject("NFC not available on this device")
            return
        }
        
        self.writeCall = call
        
        DispatchQueue.main.async {
            self.nfcSession = NFCNDEFReaderSession(
                delegate: self,
                queue: nil,
                invalidateAfterFirstRead: true
            )
            self.nfcSession?.alertMessage = "Hold your iPhone near the NFC tag to read"
            self.nfcSession?.begin()
        }
    }
    
    @objc func startScanning(_ call: CAPPluginCall) {
        guard NFCNDEFReaderSession.readingAvailable else {
            call.reject("NFC not available on this device")
            return
        }
        
        self.writeCall = call
        
        DispatchQueue.main.async {
            self.nfcSession = NFCNDEFReaderSession(
                delegate: self,
                queue: nil,
                invalidateAfterFirstRead: false
            )
            self.nfcSession?.alertMessage = "Hold your iPhone near NFC tags"
            self.nfcSession?.begin()
        }
    }
    
    @objc func stopScanning(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.nfcSession?.invalidate()
            self.nfcSession = nil
            call.resolve()
        }
    }
    
    // MARK: - NFCNDEFReaderSessionDelegate
    
    public func readerSession(_ session: NFCNDEFReaderSession, didDetectNDEFs messages: [NFCNDEFMessage]) {
        guard let message = messages.first,
              let record = message.records.first,
              let payload = String(data: record.payload, encoding: .utf8) else {
            return
        }
        
        if let jsonData = payload.data(using: .utf8),
           let json = try? JSONSerialization.jsonObject(with: jsonData, options: []) as? [String: Any] {
            
            DispatchQueue.main.async {
                self.writeCall?.resolve(json)
                self.notifyListeners("nfcTagRead", data: json)
            }
        }
    }
    
    public func readerSession(_ session: NFCNDEFReaderSession, didDetect tags: [NFCNDEFTag]) {
        guard tags.count == 1, let tag = tags.first else {
            session.alertMessage = "Please scan only one tag at a time"
            session.invalidate()
            return
        }
        
        session.connect(to: tag) { error in
            if let error = error {
                session.alertMessage = "Connection error: \(error.localizedDescription)"
                session.invalidate()
                self.writeCall?.reject("Connection error: \(error.localizedDescription)")
                return
            }
            
            tag.queryNDEFStatus { status, capacity, error in
                if let error = error {
                    session.alertMessage = "Query error: \(error.localizedDescription)"
                    session.invalidate()
                    self.writeCall?.reject("Query error: \(error.localizedDescription)")
                    return
                }
                
                if let message = self.messageToWrite {
                    // Write mode
                    guard status != .readOnly else {
                        session.alertMessage = "Tag is read-only"
                        session.invalidate()
                        self.writeCall?.reject("Tag is read-only")
                        return
                    }
                    
                    tag.writeNDEF(message) { error in
                        if let error = error {
                            session.alertMessage = "Write error: \(error.localizedDescription)"
                            session.invalidate()
                            self.writeCall?.reject("Write error: \(error.localizedDescription)")
                        } else {
                            session.alertMessage = "Successfully written to NFC tag"
                            session.invalidate()
                            self.writeCall?.resolve(["success": true])
                        }
                        self.messageToWrite = nil
                    }
                } else {
                    // Read mode
                    tag.readNDEF { message, error in
                        if let error = error {
                            session.alertMessage = "Read error: \(error.localizedDescription)"
                            session.invalidate()
                            self.writeCall?.reject("Read error: \(error.localizedDescription)")
                            return
                        }
                        
                        guard let message = message,
                              let record = message.records.first else {
                            session.alertMessage = "Empty tag"
                            session.invalidate()
                            self.writeCall?.reject("Empty tag")
                            return
                        }
                        
                        if let payload = String(data: record.payload, encoding: .utf8),
                           let jsonData = payload.data(using: .utf8),
                           let json = try? JSONSerialization.jsonObject(with: jsonData, options: []) as? [String: Any] {
                            
                            session.alertMessage = "Successfully read NFC tag"
                            session.invalidate()
                            
                            DispatchQueue.main.async {
                                self.writeCall?.resolve(json)
                                self.notifyListeners("nfcTagRead", data: json)
                            }
                        } else {
                            session.alertMessage = "Could not parse tag data"
                            session.invalidate()
                            self.writeCall?.reject("Could not parse tag data")
                        }
                    }
                }
            }
        }
    }
    
    public func readerSession(_ session: NFCNDEFReaderSession, didInvalidateWithError error: Error) {
        if let readerError = error as? NFCReaderError {
            if readerError.code != .readerSessionInvalidationErrorUserCanceled {
                DispatchQueue.main.async {
                    self.writeCall?.reject("Session error: \(error.localizedDescription)")
                }
            }
        }
        
        self.nfcSession = nil
        self.writeCall = nil
        self.messageToWrite = nil
    }
}
