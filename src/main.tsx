import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "@/components/theme-provider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="navigator-theme">
      <App />
    </ThemeProvider>
  </StrictMode>
);

// Initialize error/performance monitoring off the critical rendering path.
// Sentry is a sizeable dependency; loading it lazily once the browser is idle
// keeps it out of the initial bundle without disabling monitoring.
function initMonitoring() {
  if (!import.meta.env.PROD) return;

  import("@sentry/react")
    .then((Sentry) => {
      Sentry.init({
        dsn: "https://adf56d9b9b8e9d362fd875cf293217da@o4511463914340352.ingest.de.sentry.io/4511463936229456",
        sendDefaultPii: true,
        tracesSampleRate: 1.0,
      });
    })
    .catch(() => {
      // Monitoring is best-effort; never block the app if it fails to load.
    });
}

if (typeof window !== "undefined") {
  const scheduleSentry = () => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(initMonitoring);
    } else {
      setTimeout(initMonitoring, 100);
    }
  };

  if (document.readyState === "complete") {
    scheduleSentry();
  } else {
    window.addEventListener("load", scheduleSentry);
  }
}
