import Capacitor

@objc(NFCBridgePlugin)
public class NFCBridgePlugin: CAPPlugin {
    @objc func echo(_ call: CAPPluginCall) {
        call.resolve()
    }
}
