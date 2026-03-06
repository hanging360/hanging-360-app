import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { SplashScreen } from "@capacitor/splash-screen";
import logo from "@/assets/logo.png";

const BASE_URL = "https://tech.hanging360.com";

const roles = [
  {
    label: "Client",
    subtitle: "",
    path: "/my-appointment",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    label: "Technician",
    path: "/login",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
  },
  {
    label: "Promotional",
    path: "/promotional",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 11 18-5v12L3 13v-2z"/>
        <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
      </svg>
    ),
  },
] as const;

export default function HomeScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    SplashScreen.hide().catch(() => {});
  }, []);

  const handleRole = (path: string) => {
    navigate(`/webview?url=${encodeURIComponent(BASE_URL + path)}`);
  };

  return (
    <main className="home-screen">
      <div className="home-card">
        <div className="home-brand">
          <a href="https://wa.me/17863400825" target="_blank" rel="noopener noreferrer">
            <img src={logo} alt="Hanging 360" className="home-logo" style={{ cursor: "pointer" }} />
          </a>
        </div>
        <div className="home-roles">
          {roles.map((r) => (
            <button
              key={r.label}
              className="role-btn"
              onClick={() => handleRole(r.path)}
            >
              <span className="role-icon">{r.icon}</span>
              <span className="role-label">{r.label}</span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
