import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GitBranch, MapPin, Users, Code, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { usePlatformStats } from "@/hooks/use-platform-stats";

export function LoginPage() {
  const { signInWithGitHub, user } = useAuthStore();
  const navigate = useNavigate();
  const platformStats = usePlatformStats();

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  if (user) return null;

  return (
    <div className="flex flex-1">
      {/* ── Branding panel (desktop only) ── */}
      <div className="relative hidden lg:flex lg:w-5/12 flex-col justify-between overflow-hidden border-r border-white/8 p-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-80 w-80 -translate-y-1/3 translate-x-1/3 rounded-full bg-primary/10 blur-[80px]" />
          <div className="absolute bottom-0 left-0 h-64 w-64 translate-y-1/3 -translate-x-1/3 rounded-full bg-primary/5 blur-[80px]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "radial-gradient(oklch(0.82 0.16 155) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
          />
        </div>

        <div className="relative z-10">
          <Link to="/" className="mb-16 flex items-center gap-2 text-primary">
            <MapPin className="h-5 w-5" />
            <span className="text-lg font-bold tracking-tight text-foreground">BisoMapTech</span>
          </Link>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            La carte des talents<br />
            <span className="text-primary">tech congolais.</span>
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Rejoignez l'annuaire de référence des informaticiens de la République du Congo. Collaborez, construisez et grandissez ensemble.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3">
            {[
              { icon: Users, value: platformStats ? `${platformStats.totalUsers.toLocaleString()}` : "...", label: "Talents" },
              { icon: Code, value: platformStats ? `${platformStats.techCount}+` : "...", label: "Technologies" },
              { icon: MapPin, value: platformStats ? `${platformStats.totalCities}+` : "...", label: "Villes" },
              { icon: Handshake, value: platformStats ? `${platformStats.collaborationRate}%` : "...", label: "En collab." },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="rounded-xl border border-white/8 bg-white/3 p-3">
                <Icon className="mb-1.5 h-4 w-4 text-primary" />
                <p className="text-lg font-bold text-foreground">{value}</p>
                <p className="text-[11px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex -space-x-3">
            {["JM", "GM", "PN"].map((initials, i) => (
              <div
                key={i}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-primary/20 text-xs font-bold text-primary"
              >
                {initials}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Rejoignez {platformStats ? `${platformStats.totalUsers.toLocaleString()}+` : "des"} développeurs
          </p>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="pointer-events-none fixed left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[100px]" />

        <div className="relative z-10 w-full max-w-sm">
          {/* Mobile logo */}
          <Link to="/" className="mb-8 flex items-center gap-2 text-primary lg:hidden">
            <MapPin className="h-5 w-5" />
            <span className="text-base font-bold tracking-tight text-foreground">BisoMapTech</span>
          </Link>

          <div className="mb-7">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Rejoindre <span className="text-primary">l'écosystème</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Connectez-vous pour apparaître sur la carte.
            </p>
          </div>

          <div className="glass-panel space-y-5 rounded-2xl border border-white/10 p-6">
            {/* GitHub CTA */}
            <Button
              onClick={signInWithGitHub}
              size="lg"
              className="w-full gap-2.5 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-[0_4px_20px_oklch(0.82_0.16_155/30%)]"
            >
              <GitBranch className="h-4 w-4" />
              Continuer avec GitHub
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              Recommandé — synchronise vos repositories automatiquement
            </p>

            <p className="text-center text-[11px] text-muted-foreground/70">
              Un compte GitHub est requis pour rejoindre la carte.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
