package com.talebedu.app;

import com.getcapacitor.BridgeActivity;

// Register local Capacitor plugins implemented in this app module.
import com.talebedu.app.KioskPlugin;
import com.talebedu.app.NfcPlugin;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(android.os.Bundle savedInstanceState) {
    registerPlugin(KioskPlugin.class);
    registerPlugin(NfcPlugin.class);
    super.onCreate(savedInstanceState);
  }
}
