import { useEffect, useRef, useState, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { initPushNotifications } from "@/services/pushNotifications";

const CLIENT_URL = "https://tech.hanging360.com/my-appointment";

export default function AppShell() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const retryCount = useRef(0);
  const MAX_RETRIES = 3;
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (isNative) {
      initPushNotifications();
    } else {
      window.location.assign(CLIENT_URL);
    }
  }, [isNative]);

  const handleIframeError = useCallback(() => {
    if (retryCount.current < MAX_RETRIES) {
      retryCount.current += 1;
      setTimeout(() => setIframeKey((k) => k + 1), 1000);
    }
  }, []);

  if (!isNative) return null;

  return (
    <div className="webview-screen" style={{ display: "flex" }}>
      <iframe
        key={iframeKey}
        ref={iframeRef}
        src={CLIENT_URL}
        className="webview-iframe"
        title="Hanging 360"
        allow="camera; microphone; geolocation"
        onLoad={() => { retryCount.current = 0; }}
        onError={handleIframeError}
      />
    </div>
  );
}
