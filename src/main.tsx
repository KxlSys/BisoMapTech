import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "@/components/theme-provider.tsx";
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://adf56d9b9b8e9d362fd875cf293217da@o4511463914340352.ingest.de.sentry.io/4511463936229456",
  sendDefaultPii: true,
  tracesSampleRate: 1.0,
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="navigator-theme">
      <App />
    </ThemeProvider>
  </StrictMode>
);