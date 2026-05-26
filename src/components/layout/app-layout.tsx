import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./navbar";
import { Toaster } from "@/components/ui/sonner";

export function AppLayout() {
  const location = useLocation();
  const isMapPage = location.pathname === "/talents" || location.pathname === "/lieux";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {/* Map page: no extra padding/footer, overflow hidden for full viewport layout */}
      <main
        className={isMapPage ? "flex-1" : "flex-1 md:pb-0"}
        style={!isMapPage ? { paddingBottom: "calc(4rem + env(safe-area-inset-bottom, 0px))" } : undefined}
      >
        <Outlet />
      </main>
      {!isMapPage && (
        <footer className="hidden border-t border-white/10 py-3 md:block"
          style={{ background: "oklch(0.10 0.025 240 / 80%)" }}>
          <div className="mx-auto max-w-7xl px-4 text-center text-xs text-muted-foreground">
            BisoMapTech Map &mdash; Cartographie de la communaute tech congolaise
          </div>
        </footer>
      )}
      <Toaster position="bottom-right" />
    </div>
  );
}
