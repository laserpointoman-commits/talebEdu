import UIKit
import Capacitor

class AppBridgeViewController: CAPBridgeViewController {
    
    override func capacitorDidLoad() {
        super.capacitorDidLoad()

        // Prevent iOS "rubber-band" bounce which makes fixed headers/footers appear to move.
        if let scrollView = webView?.scrollView {
            scrollView.bounces = false
            scrollView.alwaysBounceVertical = false
            scrollView.alwaysBounceHorizontal = false
        }

        // Register the custom NFC plugin (must match jsName used in registerPlugin())
        bridge?.registerPluginInstance(NfcPlugin())
    }
}
