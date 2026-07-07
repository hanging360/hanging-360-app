import { useEffect, useRef, useState, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { initPushNotifications } from "@/services/pushNotifications";

const CLIENT_URL = "https://tech.hanging360.com/my-appointment";

export default function AppShell() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
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

  useEffect(() => {
    if (!isNative) return;

    let frame = 0;

    const syncViewportSize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const viewport = window.visualViewport;
        const width = Math.floor(viewport?.width || window.innerWidth);
        const height = Math.floor(viewport?.height || window.innerHeight);

        document.documentElement.style.setProperty("--app-width", `${width}px`);
        document.documentElement.style.setProperty("--app-height", `${height}px`);
      });
    };

    syncViewportSize();
    window.addEventListener("resize", syncViewportSize);
    window.addEventListener("orientationchange", syncViewportSize);
    window.visualViewport?.addEventListener("resize", syncViewportSize);
    window.visualViewport?.addEventListener("scroll", syncViewportSize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", syncViewportSize);
      window.removeEventListener("orientationchange", syncViewportSize);
      window.visualViewport?.removeEventListener("resize", syncViewportSize);
      window.visualViewport?.removeEventListener("scroll", syncViewportSize);
    };
  }, [isNative]);

  const handleIframeError = useCallback(() => {
    if (retryCount.current < MAX_RETRIES) {
      retryCount.current += 1;
      setTimeout(() => setIframeKey((k) => k + 1), 1000);
    }
  }, []);

  const handleIframeLoad = useCallback(() => {
    retryCount.current = 0;
    setIsLoaded(true);
    if (isNative) {
      SplashScreen.hide().catch(() => {});
    }
  }, [isNative]);

  if (!isNative) return null;

  return (
    <div className="webview-screen">
      <iframe
        key={iframeKey}
        ref={iframeRef}
        src={CLIENT_URL}
        className="webview-iframe"
        title="Hanging 360"
        allow="camera; microphone; geolocation"
        scrolling="yes"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
      <div className={`webview-loading${isLoaded ? " is-hidden" : ""}`}>
        <div className="webview-spinner" />
      </div>
    </div>
  );
}
