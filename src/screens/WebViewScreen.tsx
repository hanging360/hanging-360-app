import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

const ALLOWED_ORIGIN = "https://tech.hanging360.com";

export default function WebViewScreen() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const url = params.get("url") || ALLOWED_ORIGIN;

  // Validate URL belongs to allowed domain
  const isAllowed = url.startsWith(ALLOWED_ORIGIN);

  useEffect(() => {
    if (!isAllowed) {
      if (Capacitor.isNativePlatform()) {
        Browser.open({ url });
      } else {
        window.open(url, "_blank");
      }
      navigate("/", { replace: true });
    }
  }, [isAllowed, url, navigate]);

  if (!isAllowed) return null;

  return (
    <div className="webview-screen">
      <button
        className="webview-home-btn"
        onClick={() => {
          localStorage.removeItem("lastRole");
          navigate("/", { replace: true });
        }}
        title="Cambiar rol"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </button>
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
