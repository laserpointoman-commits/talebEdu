import Foundation
import Capacitor
import CoreNFC

@objc(NfcPlugin)
public class NfcPlugin: CAPPlugin, CAPBridgedPlugin, NFCNDEFReaderSessionDelegate {
    public let identifier = "NfcPlugin"
    public let jsName = "NfcPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isSupported", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "readOnce", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startScanning", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopScanning", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "write", returnType: CAPPluginReturnPromise)
    ]

    private var session: NFCNDEFReaderSession?

    // Single-shot read (used by JS readTag for fast scan + immediate dismissal)
    private var readCall: CAPPluginCall?
    private var isSingleReadMode: Bool = false

    // Only used for write() calls (read/scanning relies on notifyListeners)
    private var writeCall: CAPPluginCall?
    private var isWriteMode: Bool = false
    private var messageToWrite: String?

    @objc func isSupported(_ call: CAPPluginCall) {
        call.resolve(["supported": NFCNDEFReaderSession.readingAvailable])
    }

    @objc func readOnce(_ call: CAPPluginCall) {
        guard NFCNDEFReaderSession.readingAvailable else {
            call.reject("NFC is not available on this device")
            return
        }

        self.cleanupReadState()
        self.isWriteMode = false
        self.messageToWrite = nil

        self.readCall = call
        self.isSingleReadMode = true

        DispatchQueue.main.async {
            self.session?.invalidate()
            self.session = NFCNDEFReaderSession(delegate: self, queue: nil, invalidateAfterFirstRead: false)
            self.session?.alertMessage = "Hold your iPhone near the NFC tag"
            self.session?.begin()
        }
    }

    @objc func startScanning(_ call: CAPPluginCall) {
        guard NFCNDEFReaderSession.readingAvailable else {
            call.reject("NFC is not available on this device")
            return
        }

        self.cleanupReadState()
        self.isWriteMode = false
        self.messageToWrite = nil

        DispatchQueue.main.async {
            self.session?.invalidate()
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

        if let readCall = self.readCall {
            readCall.reject("NFC session stopped")
        }
        if let writeCall = self.writeCall {
            writeCall.reject("NFC session stopped")
        }

        self.cleanupReadState()
        self.cleanupWriteState()

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

        self.cleanupReadState()

        self.writeCall = call
        self.isWriteMode = true
        self.messageToWrite = message

        DispatchQueue.main.async {
            self.session?.invalidate()
            self.session = NFCNDEFReaderSession(delegate: self, queue: nil, invalidateAfterFirstRead: false)
            self.session?.alertMessage = "Hold your iPhone near the NFC tag to write"
            self.session?.begin()
        }
    }

    // MARK: - NFCNDEFReaderSessionDelegate

    public func readerSession(_ session: NFCNDEFReaderSession, didInvalidateWithError error: Error) {
        // Single-shot read: surface errors
        if let call = self.readCall {
            if let readerError = error as? NFCReaderError {
                switch readerError.code {
                case .readerSessionInvalidationErrorUserCanceled:
                    call.reject("User canceled")
                case .readerSessionInvalidationErrorFirstNDEFTagRead:
                    // Often emitted after a successful read/invalidate; ignore if already resolved.
                    // If still pending, treat as ended.
                    call.reject("NFC session ended")
                default:
                    call.reject("NFC session error: \(error.localizedDescription)")
                }
            } else {
                call.reject("NFC session error: \(error.localizedDescription)")
            }
        }

        // Write: surface errors
        if let call = self.writeCall {
            if let readerError = error as? NFCReaderError {
                switch readerError.code {
                case .readerSessionInvalidationErrorUserCanceled:
                    call.reject("User canceled")
                case .readerSessionInvalidationErrorFirstNDEFTagRead:
                    call.reject("NFC session ended")
                default:
                    call.reject("NFC session error: \(error.localizedDescription)")
                }
            } else {
                call.reject("NFC session error: \(error.localizedDescription)")
            }
        }

        self.cleanupSession()
        self.cleanupReadState()
        self.cleanupWriteState()
    }

    public func readerSession(_ session: NFCNDEFReaderSession, didDetectNDEFs messages: [NFCNDEFMessage]) {
        if self.isSingleReadMode, let call = self.readCall {
            if let first = messages.first, let text = extractFirstText(from: first) {
                notifyTagRead(text)
                session.alertMessage = "Tag read successfully!"
                session.invalidate()
                call.resolve(["message": text])
            } else {
                session.invalidate(errorMessage: "Unsupported tag format")
                call.reject("Unsupported tag format")
            }
            self.cleanupReadState()
            return
        }

        for message in messages {
            self.processMessage(message)
        }
    }

    public func readerSession(_ session: NFCNDEFReaderSession, didDetect tags: [NFCNDEFTag]) {
        guard let tag = tags.first else { return }

        session.connect(to: tag) { error in
            if let error = error {
                session.invalidate(errorMessage: "Connection failed: \(error.localizedDescription)")

                if self.isSingleReadMode, let call = self.readCall {
                    call.reject("Connection failed: \(error.localizedDescription)")
                    self.cleanupReadState()
                }

                if self.isWriteMode, let call = self.writeCall {
                    call.reject("Connection failed: \(error.localizedDescription)")
                    self.cleanupWriteState()
                }
                return
            }

            tag.queryNDEFStatus { status, _, error in
                if let error = error {
                    session.invalidate(errorMessage: "Query failed: \(error.localizedDescription)")

                    if self.isSingleReadMode, let call = self.readCall {
                        call.reject("Query failed: \(error.localizedDescription)")
                        self.cleanupReadState()
                    }

                    if self.isWriteMode, let call = self.writeCall {
                        call.reject("Query failed: \(error.localizedDescription)")
                        self.cleanupWriteState()
                    }
                    return
                }

                if self.isWriteMode {
                    guard status == .readWrite else {
                        session.invalidate(errorMessage: "Tag is not writable")
                        self.writeCall?.reject("Tag is not writable")
                        self.cleanupWriteState()
                        return
                    }

                    guard let messageString = self.messageToWrite,
                          let payload = NFCNDEFPayload.wellKnownTypeTextPayload(string: messageString, locale: Locale(identifier: "en")) else {
                        session.invalidate(errorMessage: "Failed to create payload")
                        self.writeCall?.reject("Failed to create payload")
                        self.cleanupWriteState()
                        return
                    }

                    let ndefMessage = NFCNDEFMessage(records: [payload])

                    tag.writeNDEF(ndefMessage) { error in
                        if let error = error {
                            session.invalidate(errorMessage: "Write failed: \(error.localizedDescription)")
                            self.writeCall?.reject("Write failed: \(error.localizedDescription)")
                            self.cleanupWriteState()
                            return
                        }

                        session.alertMessage = "Successfully written to tag!"
                        session.invalidate()
                        self.writeCall?.resolve(["success": true])
                        self.cleanupWriteState()
                    }
                } else {
                    // Read mode
                    tag.readNDEF { message, error in
                        if let error = error {
                            session.invalidate(errorMessage: "Read failed: \(error.localizedDescription)")

                            if self.isSingleReadMode, let call = self.readCall {
                                call.reject("Read failed: \(error.localizedDescription)")
                                self.cleanupReadState()
                            }
                            return
                        }

                        guard let message = message else {
                            session.invalidate(errorMessage: "No NDEF message")

                            if self.isSingleReadMode, let call = self.readCall {
                                call.reject("No NDEF message")
                                self.cleanupReadState()
                            }
                            return
                        }

                        if self.isSingleReadMode, let call = self.readCall {
                            if let text = self.extractFirstText(from: message) {
                                self.notifyTagRead(text)
                                session.alertMessage = "Tag read successfully!"
                                session.invalidate()
                                call.resolve(["message": text])
                            } else {
                                session.invalidate(errorMessage: "Unsupported tag format")
                                call.reject("Unsupported tag format")
                            }
                            self.cleanupReadState()
                            return
                        }

                        self.processMessage(message)
                        session.alertMessage = "Tag read successfully!"
                        // Keep the session open for continuous reads
                    }
                }
            }
        }
    }

    // MARK: - Helpers

    private func cleanupSession() {
        self.session = nil
    }

    private func cleanupReadState() {
        self.isSingleReadMode = false
        self.readCall = nil
    }

    private func cleanupWriteState() {
        self.isWriteMode = false
        self.messageToWrite = nil
        self.writeCall = nil
    }

    private func notifyTagRead(_ text: String) {
        DispatchQueue.main.async {
            self.notifyListeners("nfcTagRead", data: ["message": text])
        }
    }

    private func processMessage(_ message: NFCNDEFMessage) {
        for record in message.records {
            if let text = extractText(from: record) {
                notifyTagRead(text)
            }
        }
    }

    private func extractFirstText(from message: NFCNDEFMessage) -> String? {
        for record in message.records {
            if let text = extractText(from: record) {
                return text
            }
        }
        return nil
    }

    private func extractText(from record: NFCNDEFPayload) -> String? {
        guard record.typeNameFormat == .nfcWellKnown,
              let type = String(data: record.type, encoding: .utf8),
              type == "T" else {
            return nil
        }

        let payload = record.payload
        guard payload.count > 1 else { return nil }

        let statusByte = payload[0]
        let isUTF16 = (statusByte & 0x80) != 0
        let languageCodeLength = Int(statusByte & 0x3F)
        guard payload.count > languageCodeLength + 1 else { return nil }

        let textData = payload.subdata(in: (languageCodeLength + 1)..<payload.count)
        return isUTF16 ? String(data: textData, encoding: .utf16) : String(data: textData, encoding: .utf8)
    }
}

