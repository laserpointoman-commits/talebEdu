import UIKit
import Capacitor

class AppBridgeViewController: CAPBridgeViewController {
    
    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        
        // Register the custom NFC plugin
        bridge?.registerPluginType(NfcPlugin.self)
    }
}
