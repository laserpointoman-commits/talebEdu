import UIKit
import Capacitor

class AppBridgeViewController: CAPBridgeViewController {
    
    override func capacitorDidLoad() {
        super.capacitorDidLoad()

        // Register the custom NFC plugin (must match jsName used in registerPlugin())
        bridge?.registerPluginInstance(NfcPlugin())
    }
}
