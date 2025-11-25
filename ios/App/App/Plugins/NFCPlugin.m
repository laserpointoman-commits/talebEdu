#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(NFCPlugin, "NFCPlugin",
    CAP_PLUGIN_METHOD(isAvailable, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(write, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(read, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(stopScan, CAPPluginReturnPromise);
)
