import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { SplashScreen } from "@capacitor/splash-screen";

const BASE_URL = "https://tech.hanging360.com";

const roles = [
  { label: "Client", path: "/my-appointment", icon: "👤" },
  { label: "Technician", path: "/login", icon: "🔧" },
  { label: "Promotional", path: "/promotional", icon: "📣" },
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
      <div className="home-brand">
        <h1>Hanging 360</h1>
        <p>Select your role to continue</p>
      </div>
      <div className="home-roles">
        {roles.map((r) => (
          <button key={r.label} className="role-btn" onClick={() => handleRole(r.path)}>
            <span className="role-icon">{r.icon}</span>
            <span className="role-label">{r.label}</span>
          </button>
        ))}
      </div>
    </main>
  );
}
