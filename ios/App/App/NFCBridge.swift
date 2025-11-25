import Foundation
import CoreNFC
import Capacitor

@objc(NFCBridgePlugin)
public class NFCBridgePlugin: CAPPlugin, NFCNDEFReaderSessionDelegate {
    private var nfcSession: NFCNDEFReaderSession?
    private var writeData: NFCNDEFMessage?
    private var currentCall: CAPPluginCall?
    
    @objc func checkAvailability(_ call: CAPPluginCall) {
        let available = NFCNDEFReaderSession.readingAvailable
        call.resolve([
            "available": available
        ])
    }
    
    @objc func readTag(_ call: CAPPluginCall) {
        guard NFCNDEFReaderSession.readingAvailable else {
            call.reject("NFC not available on this device")
            return
        }
        
        currentCall = call
        nfcSession = NFCNDEFReaderSession(delegate: self, queue: nil, invalidateAfterFirstRead: true)
        nfcSession?.alertMessage = "Hold your iPhone near the NFC tag"
        nfcSession?.begin()
    }
    
    @objc func writeTag(_ call: CAPPluginCall) {
        guard NFCNDEFReaderSession.readingAvailable else {
            call.reject("NFC not available on this device")
            return
        }
        
        guard let dataDict = call.getObject("data") else {
            call.reject("No data provided")
            return
        }
        
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: dataDict)
            let jsonString = String(data: jsonData, encoding: .utf8) ?? ""
            
            let payload = NFCNDEFPayload(
                format: .nfcWellKnown,
                type: "T".data(using: .utf8)!,
                identifier: Data(),
                payload: jsonString.data(using: .utf8)!
            )
            
            writeData = NFCNDEFMessage(records: [payload])
            currentCall = call
            
            nfcSession = NFCNDEFReaderSession(delegate: self, queue: nil, invalidateAfterFirstRead: false)
            nfcSession?.alertMessage = "Hold your iPhone near the NFC tag to write"
            nfcSession?.begin()
        } catch {
            call.reject("Failed to prepare NFC data: \(error.localizedDescription)")
        }
    }
    
    @objc func stopScan(_ call: CAPPluginCall) {
        nfcSession?.invalidate()
        call.resolve()
    }
    
    // MARK: - NFCNDEFReaderSessionDelegate
    
    public func readerSession(_ session: NFCNDEFReaderSession, didDetectNDEFs messages: [NFCNDEFMessage]) {
        for message in messages {
            for record in message.records {
                if let string = String(data: record.payload, encoding: .utf8) {
                    do {
                        if let json = try JSONSerialization.jsonObject(with: Data(string.utf8)) as? [String: Any] {
                            currentCall?.resolve(json)
                            return
                        }
                    } catch {
                        print("Failed to parse NFC data")
                    }
                }
            }
        }
        currentCall?.reject("Failed to read NFC data")
    }
    
    public func readerSession(_ session: NFCNDEFReaderSession, didDetect tags: [NFCNDEFTag]) {
        guard let tag = tags.first else {
            currentCall?.reject("No tag detected")
            return
        }
        
        session.connect(to: tag) { error in
            if let error = error {
                session.invalidate(errorMessage: "Connection failed: \(error.localizedDescription)")
                self.currentCall?.reject("Connection failed")
                return
            }
            
            tag.queryNDEFStatus { status, capacity, error in
                if let error = error {
                    session.invalidate(errorMessage: "Query failed: \(error.localizedDescription)")
                    self.currentCall?.reject("Query failed")
                    return
                }
                
                if let writeData = self.writeData {
                    // Writing mode
                    tag.writeNDEF(writeData) { error in
                        if let error = error {
                            session.invalidate(errorMessage: "Write failed: \(error.localizedDescription)")
                            self.currentCall?.reject("Write failed")
                        } else {
                            session.alertMessage = "Write successful!"
                            session.invalidate()
                            self.currentCall?.resolve(["success": true])
                        }
                        self.writeData = nil
                    }
                } else {
                    // Reading mode
                    tag.readNDEF { message, error in
                        if let error = error {
                            session.invalidate(errorMessage: "Read failed: \(error.localizedDescription)")
                            self.currentCall?.reject("Read failed")
                            return
                        }
                        
                        guard let message = message else {
                            session.invalidate(errorMessage: "No data found")
                            self.currentCall?.reject("No data found")
                            return
                        }
                        
                        for record in message.records {
                            if let string = String(data: record.payload, encoding: .utf8) {
                                do {
                                    if let json = try JSONSerialization.jsonObject(with: Data(string.utf8)) as? [String: Any] {
                                        session.alertMessage = "Read successful!"
                                        session.invalidate()
                                        self.currentCall?.resolve(json)
                                        return
                                    }
                                } catch {
                                    print("Failed to parse NFC data")
                                }
                            }
                        }
                        
                        session.invalidate(errorMessage: "Failed to parse data")
                        self.currentCall?.reject("Failed to parse data")
                    }
                }
            }
        }
    }
    
    public func readerSession(_ session: NFCNDEFReaderSession, didInvalidateWithError error: Error) {
        let nfcError = error as! NFCReaderError
        if nfcError.code != .readerSessionInvalidationErrorFirstNDEFTagRead &&
           nfcError.code != .readerSessionInvalidationErrorUserCanceled {
            currentCall?.reject("NFC session invalidated: \(error.localizedDescription)")
        }
        currentCall = nil
    }
}
