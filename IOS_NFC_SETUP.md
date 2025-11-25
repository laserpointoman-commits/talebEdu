# iOS NFC Native Integration Guide

## Overview
This guide provides instructions for implementing native NFC functionality in the TalebEdu iOS app using CoreNFC framework.

## Prerequisites
- Xcode 14 or later
- iOS 13.0+ target device (NFC is not available on simulator)
- Apple Developer Account with NFC capability enabled
- Physical iPhone with NFC support (iPhone 7 and later)

## Project Configuration

### 1. Entitlements Setup
The project includes `App.entitlements` file with NFC capabilities:
```xml
<key>com.apple.developer.nfc.readersession.formats</key>
<array>
    <string>NDEF</string>
    <string>TAG</string>
</array>
```

### 2. Info.plist Configuration
Already configured with NFC usage description:
```xml
<key>NFCReaderUsageDescription</key>
<string>TalebEdu uses NFC to scan student wristbands for attendance tracking and access control</string>
```

### 3. Xcode Project Settings
In Xcode:
1. Select your project target
2. Go to "Signing & Capabilities"
3. Click "+ Capability"
4. Add "Near Field Communication Tag Reading"
5. Ensure the entitlements file is linked

## Native Implementation

### Swift Bridge Setup
Create a new Swift file `NFCBridge.swift` in your iOS project:

```swift
import Foundation
import CoreNFC
import Capacitor

@objc(NFCBridge)
public class NFCBridge: NSObject, NFCNDEFReaderSessionDelegate {
    private var nfcSession: NFCNDEFReaderSession?
    private var writeData: NFCNDEFMessage?
    
    // Read NFC Tag
    @objc func readTag() {
        guard NFCNDEFReaderSession.readingAvailable else {
            sendEvent(action: "readComplete", success: false, error: "NFC not available")
            return
        }
        
        nfcSession = NFCNDEFReaderSession(delegate: self, queue: nil, invalidateAfterFirstRead: true)
        nfcSession?.alertMessage = "Hold your iPhone near the NFC tag"
        nfcSession?.begin()
    }
    
    // Write NFC Tag
    @objc func writeTag(data: [String: Any]) {
        guard NFCNDEFReaderSession.readingAvailable else {
            sendEvent(action: "writeComplete", success: false, error: "NFC not available")
            return
        }
        
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: data)
            let jsonString = String(data: jsonData, encoding: .utf8) ?? ""
            
            let payload = NFCNDEFPayload(
                format: .nfcWellKnown,
                type: "T".data(using: .utf8)!,
                identifier: Data(),
                payload: jsonString.data(using: .utf8)!
            )
            
            writeData = NFCNDEFMessage(records: [payload])
            
            nfcSession = NFCNDEFReaderSession(delegate: self, queue: nil, invalidateAfterFirstRead: false)
            nfcSession?.alertMessage = "Hold your iPhone near the NFC tag to write"
            nfcSession?.begin()
        } catch {
            sendEvent(action: "writeComplete", success: false, error: error.localizedDescription)
        }
    }
    
    // NDEF Reader Session Delegate Methods
    public func readerSession(_ session: NFCNDEFReaderSession, didDetectNDEFs messages: [NFCNDEFMessage]) {
        for message in messages {
            for record in message.records {
                if let string = String(data: record.payload, encoding: .utf8) {
                    do {
                        let json = try JSONSerialization.jsonObject(with: Data(string.utf8))
                        sendEvent(action: "readComplete", success: true, data: json)
                    } catch {
                        print("Failed to parse NFC data")
                    }
                }
            }
        }
    }
    
    public func readerSession(_ session: NFCNDEFReaderSession, didDetect tags: [NFCNDEFTag]) {
        guard let tag = tags.first else { return }
        
        session.connect(to: tag) { error in
            if error != nil {
                session.invalidate(errorMessage: "Connection failed")
                return
            }
            
            tag.queryNDEFStatus { status, capacity, error in
                guard error == nil else {
                    session.invalidate(errorMessage: "Query failed")
                    return
                }
                
                if self.writeData != nil {
                    // Writing mode
                    tag.writeNDEF(self.writeData!) { error in
                        if error != nil {
                            session.invalidate(errorMessage: "Write failed")
                            self.sendEvent(action: "writeComplete", success: false, error: "Write failed")
                        } else {
                            session.alertMessage = "Write successful!"
                            session.invalidate()
                            self.sendEvent(action: "writeComplete", success: true, data: nil)
                        }
                        self.writeData = nil
                    }
                } else {
                    // Reading mode
                    tag.readNDEF { message, error in
                        guard error == nil, let message = message else {
                            session.invalidate(errorMessage: "Read failed")
                            return
                        }
                        
                        for record in message.records {
                            if let string = String(data: record.payload, encoding: .utf8) {
                                do {
                                    let json = try JSONSerialization.jsonObject(with: Data(string.utf8))
                                    self.sendEvent(action: "readComplete", success: true, data: json)
                                    session.alertMessage = "Read successful!"
                                    session.invalidate()
                                } catch {
                                    print("Failed to parse NFC data")
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    public func readerSession(_ session: NFCNDEFReaderSession, didInvalidateWithError error: Error) {
        print("NFC Session invalidated: \\(error.localizedDescription)")
    }
    
    // Send event to JavaScript
    private func sendEvent(action: String, success: Bool, data: Any? = nil, error: String? = nil) {
        var eventData: [String: Any] = [
            "action": action,
            "success": success
        ]
        
        if let data = data {
            eventData["data"] = data
        }
        
        if let error = error {
            eventData["error"] = error
        }
        
        DispatchQueue.main.async {
            if let jsonData = try? JSONSerialization.data(withJSONObject: eventData),
               let jsonString = String(data: jsonData, encoding: .utf8) {
                NotificationCenter.default.post(
                    name: NSNotification.Name("nfcResponse"),
                    object: nil,
                    userInfo: ["data": jsonString]
                )
            }
        }
    }
}
```

### Update AppDelegate
Add the NFC bridge initialization in `AppDelegate.swift`:

```swift
import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
    var nfcBridge: NFCBridge?
    
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Initialize NFC Bridge
        nfcBridge = NFCBridge()
        
        // Setup message handler
        setupNFCMessageHandler()
        
        return true
    }
    
    private func setupNFCMessageHandler() {
        // Register for NFC messages from JavaScript
        NotificationCenter.default.addObserver(
            forName: NSNotification.Name("nfcMessage"),
            object: nil,
            queue: .main
        ) { [weak self] notification in
            guard let data = notification.userInfo?["data"] as? [String: Any],
                  let action = data["action"] as? String else { return }
            
            switch action {
            case "readTag":
                self?.nfcBridge?.readTag()
            case "writeTag":
                if let tagData = data["data"] as? [String: Any] {
                    self?.nfcBridge?.writeTag(data: tagData)
                }
            default:
                break
            }
        }
    }
}
```

## JavaScript Integration

The JavaScript side is already configured in `src/services/nativeNFC.ts` and will communicate with the native bridge through `window.webkit.messageHandlers`.

## Testing

### On Physical Device:
1. Build and run on a physical iPhone (NFC doesn't work on simulator)
2. Navigate to a feature that uses NFC (e.g., student attendance)
3. Tap the NFC scan/write button
4. Hold the iPhone near an NFC tag
5. The app should read or write data to the tag

### Required NFC Tags:
- Use NDEF-formatted NFC tags
- Recommended: NTAG213/215/216 tags
- Ensure tags are writable and have sufficient capacity

## Troubleshooting

### NFC Not Working:
1. Verify device has NFC (iPhone 7 and later)
2. Check that NFC capability is enabled in Xcode
3. Ensure entitlements file is properly configured
4. Verify Info.plist has NFCReaderUsageDescription
5. Make sure you're testing on a physical device, not simulator

### Build Errors:
1. Clean build folder (Cmd + Shift + K)
2. Delete DerivedData folder
3. Run `pod install` in ios/App directory
4. Rebuild project

### Permission Issues:
1. Check that the app has been granted NFC permissions
2. Reset privacy settings on device if needed
3. Verify signing certificate has NFC entitlement

## Additional Resources

- [Apple CoreNFC Documentation](https://developer.apple.com/documentation/corenfc)
- [NFC Tag Types](https://developer.apple.com/documentation/corenfc/nfcndeftag)
- [NDEF Message Format](https://developer.apple.com/documentation/corenfc/nfcndefmessage)

## Security Considerations

- NFC data should be encrypted for sensitive information
- Implement proper authentication before writing tags
- Validate NFC data on the server side
- Use secure unique identifiers for student wristbands
