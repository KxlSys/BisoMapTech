import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./navbar";
import { Toaster } from "@/components/ui/sonner";

export function AppLayout() {
  const location = useLocation();
  const isMapPage = location.pathname === "/talents" || location.pathname === "/lieux";

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Navbar />
      {/*
        Always use flex-1 flex flex-col so that children can use height 100% naturally.
        Also ALWAYS add pb-16 on mobile (md:pb-0) so that the content never gets hidden behind
        the fixed bottom-nav, even for map pages. The map page will just use the remaining space.
      */}
      <main className="flex flex-1 flex-col pb-16 md:pb-0 relative min-h-0">
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
