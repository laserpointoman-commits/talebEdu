#import <Capacitor/Capacitor.h>
#import "App-Swift.h"

CAP_PLUGIN(NfcPlugin, "NfcPlugin",
    CAP_PLUGIN_METHOD(isSupported, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(startScanning, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(stopScanning, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(write, CAPPluginReturnPromise);
)
