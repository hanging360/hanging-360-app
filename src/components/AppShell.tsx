import { useEffect, useRef, useState, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import HomeScreen from "@/screens/HomeScreen";
import { initPushNotifications } from "@/services/pushNotifications";

const ALLOWED_ORIGIN = "https://tech.hanging360.com";

export default function AppShell() {
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const retryCount = useRef(0);
  const MAX_RETRIES = 3;
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (isNative) {
      initPushNotifications();
    }
  }, [isNative]);

  const handleIframeError = useCallback(() => {
    if (retryCount.current < MAX_RETRIES) {
      retryCount.current += 1;
      setTimeout(() => setIframeKey((k) => k + 1), 1000);
    }
  }, []);

  const handleSelectRole = useCallback((url: string) => {
    if (!url.startsWith(ALLOWED_ORIGIN)) return;
    retryCount.current = 0;
    setActiveUrl(url);
    setIframeKey((k) => k + 1);
  }, []);

  const handleBackToMenu = useCallback(() => {
    setActiveUrl(null);
  }, []);

  return (
    <>
      {/* Home screen: visible when no activeUrl */}
      <div style={{ display: activeUrl ? "none" : "block", height: "100dvh" }}>
        <HomeScreen onSelectRole={handleSelectRole} />
      </div>

      {/* Iframe: always mounted once a URL is set, hidden when on menu */}
      {activeUrl && (
        <div
          className="webview-screen"
          style={{ display: activeUrl ? "flex" : "none" }}
        >
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={activeUrl}
            className="webview-iframe"
            title="Hanging 360"
            allow="camera; microphone; geolocation"
            onLoad={() => { retryCount.current = 0; }}
            onError={handleIframeError}
          />
        </div>
      )}
    </>
  );
}
