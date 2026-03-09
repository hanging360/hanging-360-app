import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

const ALLOWED_ORIGIN = "https://tech.hanging360.com";

export default function WebViewScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const url = (location.state as { url?: string })?.url;

  // If no URL in state (direct access), redirect to home
  useEffect(() => {
    if (!url) {
      navigate("/", { replace: true });
    }
  }, [url, navigate]);

  if (!url) return null;

  // Validate URL belongs to allowed domain
  const isAllowed = url.startsWith(ALLOWED_ORIGIN);

  if (!isAllowed) {
    // Open external URLs in system browser
    if (Capacitor.isNativePlatform()) {
      Browser.open({ url });
    } else {
      window.open(url, "_blank");
    }
    navigate("/", { replace: true });
    return null;
  }

  // Block access from web browsers (only allow native app)
  if (!Capacitor.isNativePlatform()) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100dvh",
        padding: "2rem",
        textAlign: "center",
        background: "#1a1a1a",
        color: "#fff",
        fontFamily: "inherit",
      }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Hanging360</h2>
        <p style={{ color: "#999", maxWidth: "300px" }}>
          Para acceder, descarga la app desde tu tienda de aplicaciones.
        </p>
      </div>
    );
  }

  return (
    <div className="webview-screen">
      <iframe
        ref={iframeRef}
        src={url}
        className="webview-iframe"
        title="Hanging 360"
        allow="camera; microphone; geolocation"
        onLoad={() => {}}
      />
    </div>
  );
}
