package com.talebedu.app;

import android.app.Activity;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.PluginMethod;

@CapacitorPlugin(name = "Kiosk")
public class KioskPlugin extends Plugin {

  @PluginMethod
  public void start(PluginCall call) {
    JSObject ret = new JSObject();
    Activity activity = getActivity();

    try {
      if (activity == null) {
        ret.put("locked", false);
        ret.put("reason", "No activity");
        call.resolve(ret);
        return;
      }

      activity.runOnUiThread(() -> {
        try {
          activity.startLockTask();
          ret.put("locked", true);
          call.resolve(ret);
        } catch (Exception e) {
          ret.put("locked", false);
          ret.put("reason", e.getMessage());
          call.resolve(ret);
        }
      });
    } catch (Exception e) {
      ret.put("locked", false);
      ret.put("reason", e.getMessage());
      call.resolve(ret);
    }
  }

  @PluginMethod
  public void stop(PluginCall call) {
    JSObject ret = new JSObject();
    Activity activity = getActivity();

    try {
      if (activity == null) {
        ret.put("locked", false);
        ret.put("reason", "No activity");
        call.resolve(ret);
        return;
      }

      activity.runOnUiThread(() -> {
        try {
          activity.stopLockTask();
          ret.put("locked", false);
          call.resolve(ret);
        } catch (Exception e) {
          ret.put("locked", true);
          ret.put("reason", e.getMessage());
          call.resolve(ret);
        }
      });
    } catch (Exception e) {
      ret.put("locked", true);
      ret.put("reason", e.getMessage());
      call.resolve(ret);
    }
  }

  @PluginMethod
  public void isLocked(PluginCall call) {
    JSObject ret = new JSObject();

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      Activity activity = getActivity();
      boolean locked = activity != null && activity.isInLockTaskMode();
      ret.put("locked", locked);
    } else {
      ret.put("locked", false);
    }
    call.resolve(ret);
  }
}
