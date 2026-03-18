import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import compLogo from "@/assets/comp-logo.png";

const ALLOWED_ORIGIN = "https://tech.hanging360.com";

export default function WebViewScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const url = (location.state as { url?: string })?.url;

  useEffect(() => {
    if (!url) {
      navigate("/", { replace: true });
    }
  }, [url, navigate]);

  if (!url) return null;

  const isAllowed = url.startsWith(ALLOWED_ORIGIN);

  if (!isAllowed) {
    if (Capacitor.isNativePlatform()) {
      Browser.open({ url });
    } else {
      window.open(url, "_blank");
    }
    navigate("/", { replace: true });
    return null;
  }

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
        gap: "1.5rem",
      }}>
        <img
          src={compLogo}
          alt="Hanging360"
          style={{ width: 120, height: 120, borderRadius: 24, boxShadow: "0 6px 18px rgba(0,0,0,0.4)" }}
        />
        <h2 style={{ fontSize: "1.5rem", margin: 0 }}>Hanging360</h2>
        <p style={{ color: "#999", maxWidth: 300, margin: 0 }}>
          Para acceder, descarga la app desde tu tienda de aplicaciones.
        </p>
        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 28px",
              background: "#fff",
              color: "#000",
              borderRadius: 12,
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "1rem",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 384 512" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-62.6 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
            App Store
          </a>
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 28px",
              background: "#fff",
              color: "#000",
              borderRadius: 12,
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "1rem",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 512 512" fill="currentColor"><path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/></svg>
            Google Play
          </a>
        </div>
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