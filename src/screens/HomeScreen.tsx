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
    const lastRole = localStorage.getItem("lastRole");
    if (lastRole) {
      navigate("/v", { replace: true, state: { url: BASE_URL + lastRole } });
    }
  }, [navigate]);

  const handleRole = (path: string) => {
    localStorage.setItem("lastRole", path);
    navigate("/v", { state: { url: BASE_URL + path } });
  };

  return (
    <main className="home-screen">
      <div className="home-card">
        {/* Clavo en la pared */}
        <div className="wall-nail" />
        {/* Soga que conecta clavo al logo */}
        <svg className="hanging-rope" width="40" height="110" viewBox="0 0 40 110" fill="none">
          <path d="M20 0 Q17 50 10 108" stroke="#8B7355" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        </svg>

        <div className="hanging-frame">
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

        {/* Herramientas tiradas */}
        <div className="scattered-tools">
          <svg className="tool tool-hammer" width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect x="20" y="18" width="6" height="26" rx="2" fill="#8B7355" />
            <rect x="10" y="10" width="26" height="10" rx="3" fill="#666" stroke="#555" strokeWidth="1"/>
          </svg>
          <svg className="tool tool-drill" width="56" height="40" viewBox="0 0 56 40" fill="none">
            <rect x="16" y="10" width="24" height="18" rx="4" fill="#555" stroke="#444" strokeWidth="1"/>
            <rect x="40" y="16" width="14" height="6" rx="1" fill="#888"/>
            <rect x="6" y="14" width="10" height="10" rx="5" fill="#666" stroke="#555" strokeWidth="1"/>
            <rect x="20" y="28" width="8" height="8" rx="2" fill="#444"/>
          </svg>
          <svg className="tool tool-wrench" width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect x="8" y="16" width="24" height="6" rx="2" fill="#999" stroke="#777" strokeWidth="1"/>
            <circle cx="6" cy="19" r="5" fill="none" stroke="#888" strokeWidth="2"/>
            <path d="M32 14 L38 10 L38 28 L32 24 Z" fill="#999" stroke="#777" strokeWidth="1"/>
          </svg>
          <svg className="tool tool-screw1" width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="8" r="6" fill="#999" stroke="#777" strokeWidth="1"/>
            <line x1="10" y1="8" x2="18" y2="8" stroke="#666" strokeWidth="1.5"/>
            <rect x="12" y="14" width="4" height="14" rx="1" fill="#aaa" stroke="#888" strokeWidth="0.5"/>
            <line x1="12" y1="18" x2="16" y2="18" stroke="#888" strokeWidth="0.5"/>
            <line x1="12" y1="22" x2="16" y2="22" stroke="#888" strokeWidth="0.5"/>
          </svg>
          <svg className="tool tool-screw2" width="24" height="24" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="8" r="6" fill="#999" stroke="#777" strokeWidth="1"/>
            <line x1="8" y1="8" x2="14" y2="8" stroke="#666" strokeWidth="1.5" transform="rotate(90 14 8)"/>
            <rect x="12" y="14" width="4" height="14" rx="1" fill="#aaa" stroke="#888" strokeWidth="0.5"/>
          </svg>
          <svg className="tool tool-screw3" width="20" height="20" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="8" r="6" fill="#999" stroke="#777" strokeWidth="1"/>
            <line x1="10" y1="8" x2="18" y2="8" stroke="#666" strokeWidth="1.5"/>
            <rect x="12" y="14" width="4" height="12" rx="1" fill="#aaa"/>
          </svg>
          <svg className="tool tool-screwdriver" width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect x="15" y="0" width="6" height="16" rx="2" fill="#e8a735" stroke="#c48a20" strokeWidth="0.5"/>
            <rect x="16" y="16" width="4" height="18" rx="0.5" fill="#bbb" stroke="#999" strokeWidth="0.5"/>
          </svg>
          <svg className="tool tool-nail1" width="16" height="16" viewBox="0 0 16 30" fill="none">
            <circle cx="8" cy="4" r="3.5" fill="#aaa" stroke="#888" strokeWidth="1"/>
            <rect x="6.5" y="7" width="3" height="22" rx="0.5" fill="#bbb"/>
          </svg>
          <svg className="tool tool-nail2" width="14" height="14" viewBox="0 0 16 30" fill="none">
            <circle cx="8" cy="4" r="3.5" fill="#aaa" stroke="#888" strokeWidth="1"/>
            <rect x="6.5" y="7" width="3" height="22" rx="0.5" fill="#bbb"/>
          </svg>
        </div>
      </div>
    </main>
  );
}
