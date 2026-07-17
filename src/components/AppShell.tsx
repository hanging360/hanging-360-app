import { useEffect, useRef, useState, useCallback } from "react";
import { SplashScreen, StatusBar, isNativePlatform, getPlatform } from "../lib/capacitorPlugins";
import { initPushNotifications, postStoredPushTokenToWebApp, clearBadge, setBadgeCount } from "../services/pushNotifications";
import { installWebBridge, setBridgeTarget } from "../services/webBridge";

const CLIENT_URL = "https://tech.hanging360.com/my-appointment";

export default function AppShell() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const retryCount = useRef(0);
  const MAX_RETRIES = 3;
  const isNative = isNativePlatform();
  const platform = getPlatform();
  const isIOS = platform === "ios";
  const isAndroid = platform === "android";

  useEffect(() => {
    if (isNative) {
      SplashScreen.hide().catch(() => {});
      initPushNotifications(iframeRef.current?.contentWindow);
      installWebBridge(iframeRef.current?.contentWindow);
      clearBadge();
      if (isAndroid) {
        // Android: modo inmersivo (ocultar status/nav bar)
        StatusBar.hide().catch(() => {});
        StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
        const anyWin = window as any;
        if (anyWin.AndroidFullScreen?.immersiveMode) {
          anyWin.AndroidFullScreen.immersiveMode();
        }
      }
      // iOS: NO ocultar status bar (Apple Guideline 4). El safe-area del CSS
      // se encarga de que el iframe no quede debajo del Dynamic Island / notch.
    } else {
      window.location.assign(CLIENT_URL);
    }
  }, [isNative, isAndroid]);

  // Limpiar badge al volver a foreground y escuchar mensajes del portal
  useEffect(() => {
    if (!isNative) return;
    const onVisibility = () => {
      if (document.visibilityState === "visible") clearBadge();
    };
    const onMessage = (e: MessageEvent) => {
      const data = e.data;
      if (!data || typeof data !== "object") return;
      if (data.type === "HANGING360_SET_BADGE" && typeof data.count === "number") {
        setBadgeCount(data.count);
      } else if (data.type === "HANGING360_CLEAR_BADGE") {
        clearBadge();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("message", onMessage);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("message", onMessage);
    };
  }, [isNative]);

  useEffect(() => {
    if (!isNative) return;

    let frame = 0;

    const syncViewportSize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const width = Math.floor(window.innerWidth);
        const height = Math.floor(window.innerHeight);

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
      setBridgeTarget(iframeRef.current?.contentWindow);
      postStoredPushTokenToWebApp(iframeRef.current?.contentWindow);
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
