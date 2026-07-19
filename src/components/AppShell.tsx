import { useEffect } from "react";
import { isNativePlatform } from "../lib/capacitorPlugins";

const CLIENT_URL = "https://tech.hanging360.com/my-appointment";

// Con `server.url` configurado en capacitor.config, la app instalada carga
// directamente la PWA remota y este componente no se ejecuta. Solo sirve
// como fallback cuando el bundle se abre en un navegador web.
export default function AppShell() {
  const isNative = isNativePlatform();
  useEffect(() => {
    if (!isNative) window.location.assign(CLIENT_URL);
  }, [isNative]);
  return null;
}
