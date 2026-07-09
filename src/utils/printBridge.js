/**
 * Universal print bridge for the Windows WebView2 wrapper.
 *
 * Browser and Android behavior stays unchanged because this bridge only
 * activates when the app is running inside WebView2.
 */
export function isWindowsApp() {
  return !!(
    typeof window !== 'undefined' &&
    window.chrome &&
    window.chrome.webview &&
    typeof window.chrome.webview.postMessage === 'function'
  );
}

export function sendPrintCommand(action, data) {
  if (!isWindowsApp()) {
    return false;
  }

  try {
    const uint8 = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      uint8[i] = data.charCodeAt(i) & 0xFF;
    }
    const base64Data = btoa(String.fromCharCode(...uint8));
    window.chrome.webview.postMessage(JSON.stringify({ action, data: base64Data }));
    return true;
  } catch (err) {
    console.error('[VMS Print] Windows print bridge error:', err);
    return false;
  }
}
