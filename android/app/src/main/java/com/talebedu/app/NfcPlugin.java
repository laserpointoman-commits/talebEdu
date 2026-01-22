package com.talebedu.app;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.IntentFilter;
import android.nfc.NdefMessage;
import android.nfc.NdefRecord;
import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.nfc.tech.Ndef;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "NfcPlugin")
public class NfcPlugin extends Plugin {

  private NfcAdapter nfcAdapter;
  private PendingIntent pendingIntent;
  private IntentFilter[] intentFiltersArray;
  private String[][] techListsArray;

  private boolean scanning = false;
  private PluginCall pendingReadOnceCall = null;

  @Override
  public void load() {
    super.load();

    Activity activity = getActivity();
    if (activity == null) return;

    nfcAdapter = NfcAdapter.getDefaultAdapter(activity);

    Intent intent = new Intent(activity, activity.getClass());
    intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);

    int flags = 0;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      flags = PendingIntent.FLAG_MUTABLE;
    }
    pendingIntent = PendingIntent.getActivity(activity, 0, intent, flags);

    // Capture standard NFC discovery intents
    IntentFilter ndef = new IntentFilter(NfcAdapter.ACTION_NDEF_DISCOVERED);
    IntentFilter tech = new IntentFilter(NfcAdapter.ACTION_TECH_DISCOVERED);
    IntentFilter tag = new IntentFilter(NfcAdapter.ACTION_TAG_DISCOVERED);
    intentFiltersArray = new IntentFilter[] { ndef, tech, tag };
    techListsArray = new String[][] { new String[] { Ndef.class.getName() } };
  }

  @PluginMethod
  public void isSupported(PluginCall call) {
    JSObject ret = new JSObject();
    ret.put("supported", nfcAdapter != null);
    call.resolve(ret);
  }

  @PluginMethod
  public void startScanning(PluginCall call) {
    if (nfcAdapter == null) {
      JSObject ret = new JSObject();
      ret.put("success", false);
      call.resolve(ret);
      return;
    }

    scanning = true;
    enableForegroundDispatch();
    JSObject ret = new JSObject();
    ret.put("success", true);
    call.resolve(ret);
  }

  @PluginMethod
  public void stopScanning(PluginCall call) {
    scanning = false;
    
    // Clear any pending readOnce to prevent blocking on next login
    if (pendingReadOnceCall != null) {
      try {
        JSObject cancelResult = new JSObject();
        cancelResult.put("message", "");
        pendingReadOnceCall.resolve(cancelResult);
      } catch (Exception ignored) {}
      pendingReadOnceCall = null;
    }
    
    // Also clear any pending write
    if (lastWriteCall != null) {
      try {
        JSObject cancelResult = new JSObject();
        cancelResult.put("success", false);
        lastWriteCall.resolve(cancelResult);
      } catch (Exception ignored) {}
      lastWriteCall = null;
      lastWriteMessage = null;
    }
    
    disableForegroundDispatch();
    JSObject ret = new JSObject();
    ret.put("success", true);
    call.resolve(ret);
  }

  @PluginMethod
  public void readOnce(PluginCall call) {
    if (nfcAdapter == null) {
      call.reject("NFC not supported");
      return;
    }
    
    // If a previous readOnce is still pending, cancel it gracefully
    // This prevents "readOnce already pending" blocking forever after logout
    if (pendingReadOnceCall != null) {
      try {
        JSObject cancelResult = new JSObject();
        cancelResult.put("message", "");
        pendingReadOnceCall.resolve(cancelResult);
      } catch (Exception ignored) {}
      pendingReadOnceCall = null;
    }

    pendingReadOnceCall = call;
    scanning = true;
    enableForegroundDispatch();
    // Resolve will happen in handleOnNewIntent
  }

  @PluginMethod
  public void write(PluginCall call) {
    // Writing requires an Android tag present; simplest UX is:
    // 1) JS calls write(message)
    // 2) user taps tag
    // 3) we write NDEF text record
    // To keep behavior predictable and avoid hanging calls, we store call and write on next tag.
    // For now, we implement a safe error if no tag is presented.
    String message = call.getString("message", null);
    if (message == null) {
      call.reject("Missing message");
      return;
    }
    if (nfcAdapter == null) {
      call.reject("NFC not supported");
      return;
    }

    // Reuse the one-shot mechanism: write occurs on next tag.
    // We encode as a single text record.
    pendingReadOnceCall = null; // ensure no pending readOnce
    scanning = true;
    enableForegroundDispatch();

    // Store write request temporarily on the bridge plugin instance via call options.
    // We'll attempt to write in handleOnNewIntent.
    // NOTE: Capacitor calls are not intended to be stored long-term; but this is short-lived.
    this.lastWriteCall = call;
    this.lastWriteMessage = message;
  }

  private PluginCall lastWriteCall = null;
  private String lastWriteMessage = null;

  @Override
  protected void handleOnNewIntent(Intent intent) {
    super.handleOnNewIntent(intent);

    if (!scanning) return;
    if (intent == null) return;

    String action = intent.getAction();
    if (action == null) return;

    if (!action.equals(NfcAdapter.ACTION_TAG_DISCOVERED)
      && !action.equals(NfcAdapter.ACTION_TECH_DISCOVERED)
      && !action.equals(NfcAdapter.ACTION_NDEF_DISCOVERED)) {
      return;
    }

    Tag tag = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG);
    if (tag == null) return;

    // 1) If we have a pending write request, do it and resolve.
    if (lastWriteCall != null && lastWriteMessage != null) {
      try {
        boolean ok = writeTextToTag(tag, lastWriteMessage);
        JSObject ret = new JSObject();
        ret.put("success", ok);
        lastWriteCall.resolve(ret);
      } catch (Exception e) {
        lastWriteCall.reject("Failed to write NFC tag: " + e.getMessage());
      } finally {
        lastWriteCall = null;
        lastWriteMessage = null;
        scanning = false;
        disableForegroundDispatch();
      }
      return;
    }

    // 2) Otherwise read and emit
    String message = readTextFromIntent(intent);
    if (message == null || message.trim().isEmpty()) {
      // Fallback: use tag ID as hex string
      byte[] id = tag.getId();
      message = bytesToHex(id);
    }

    JSObject payload = new JSObject();
    payload.put("message", message);
    notifyListeners("nfcTagRead", payload);

    if (pendingReadOnceCall != null) {
      JSObject ret = new JSObject();
      ret.put("message", message);
      pendingReadOnceCall.resolve(ret);
      pendingReadOnceCall = null;
      scanning = false;
      disableForegroundDispatch();
    }
  }

  private void enableForegroundDispatch() {
    Activity activity = getActivity();
    if (activity == null) return;
    if (nfcAdapter == null) return;
    try {
      nfcAdapter.enableForegroundDispatch(activity, pendingIntent, intentFiltersArray, techListsArray);
    } catch (Exception ignored) {}
  }

  private void disableForegroundDispatch() {
    Activity activity = getActivity();
    if (activity == null) return;
    if (nfcAdapter == null) return;
    try {
      nfcAdapter.disableForegroundDispatch(activity);
    } catch (Exception ignored) {}
  }

  private String readTextFromIntent(Intent intent) {
    try {
      android.os.Parcelable[] rawMsgs = intent.getParcelableArrayExtra(NfcAdapter.EXTRA_NDEF_MESSAGES);
      if (rawMsgs == null || rawMsgs.length == 0) return null;
      NdefMessage msg = (NdefMessage) rawMsgs[0];
      if (msg == null) return null;
      NdefRecord[] records = msg.getRecords();
      if (records == null || records.length == 0) return null;

      NdefRecord record = records[0];
      short tnf = record.getTnf();
      byte[] type = record.getType();
      if (tnf != NdefRecord.TNF_WELL_KNOWN) return null;
      if (type == null || type.length == 0) return null;
      // RTD_TEXT = "T"
      if (type[0] != 'T') return null;

      byte[] payload = record.getPayload();
      if (payload == null || payload.length == 0) return null;

      // NFC Forum Text Record:
      // [status byte][language code][text]
      int status = payload[0] & 0xFF;
      int langLength = status & 0x3F;
      int textStart = 1 + langLength;
      if (textStart >= payload.length) return null;
      return new String(payload, textStart, payload.length - textStart, StandardCharsets.UTF_8);
    } catch (Exception e) {
      return null;
    }
  }

  private boolean writeTextToTag(Tag tag, String text) throws Exception {
    Ndef ndef = Ndef.get(tag);
    if (ndef == null) {
      throw new Exception("Tag does not support NDEF");
    }

    ndef.connect();
    try {
      if (!ndef.isWritable()) {
        throw new Exception("Tag is read-only");
      }

      NdefRecord record = createTextRecord(text);
      NdefMessage message = new NdefMessage(new NdefRecord[] { record });
      int size = message.toByteArray().length;
      if (ndef.getMaxSize() < size) {
        throw new Exception("Tag capacity is too small");
      }
      ndef.writeNdefMessage(message);
      return true;
    } finally {
      try { ndef.close(); } catch (Exception ignored) {}
    }
  }

  private NdefRecord createTextRecord(String text) {
    byte[] lang = "en".getBytes(StandardCharsets.US_ASCII);
    byte[] data = text.getBytes(StandardCharsets.UTF_8);
    int langLength = lang.length;
    int textLength = data.length;
    byte[] payload = new byte[1 + langLength + textLength];

    payload[0] = (byte) (langLength & 0x3F);
    System.arraycopy(lang, 0, payload, 1, langLength);
    System.arraycopy(data, 0, payload, 1 + langLength, textLength);

    return new NdefRecord(NdefRecord.TNF_WELL_KNOWN, NdefRecord.RTD_TEXT, new byte[0], payload);
  }

  private static String bytesToHex(byte[] bytes) {
    if (bytes == null) return "";
    final char[] hexArray = "0123456789ABCDEF".toCharArray();
    char[] hexChars = new char[bytes.length * 2];
    for (int j = 0; j < bytes.length; j++) {
      int v = bytes[j] & 0xFF;
      hexChars[j * 2] = hexArray[v >>> 4];
      hexChars[j * 2 + 1] = hexArray[v & 0x0F];
    }
    return new String(hexChars);
  }
}