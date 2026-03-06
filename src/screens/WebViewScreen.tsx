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
      <button className="webview-back" onClick={() => navigate("/")}>
        ← Back
      </button>
      <iframe
        ref={iframeRef}
        src={url}
        className="webview-iframe"
        title="Hanging 360"
        allow="camera; microphone; geolocation"
      />
    </div>
  );
}
