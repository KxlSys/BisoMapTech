import { MapPin, Users, Code, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import type { Profile } from "@/types";

interface HeroSectionProps {
  totalContributors: number;
  profiles: Profile[];
}

export function HeroSection({ totalContributors, profiles }: HeroSectionProps) {
  const { user } = useAuthStore();

  const uniqueCities = new Set(profiles.map((p) => p.city).filter(Boolean)).size;
  const uniqueTechs = new Set(profiles.flatMap((p) => p.tech_stack)).size;
  const openToCollab = profiles.filter((p) => p.open_to_collaboration).length;

  return (
    <section className="ambient-bg relative overflow-hidden border-b border-white/10">
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 md:py-12">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            République du Congo
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            La carte des
            <span className="text-primary"> talents tech</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            Découvrez les talents tech en République du Congo,
            trouvez des collaborateurs et construisez l'écosystème de demain.
          </p>

          {!user && (
            <div className="mt-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
              <Button
                size="sm"
                asChild
                className="bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 gap-2"
              >
                <a href="/login">
                  <Users className="h-3.5 w-3.5" />
                  Rejoindre la communaute
                </a>
              </Button>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <StatCard icon={Users} value={totalContributors} label="Contributeurs" />
          <StatCard icon={MapPin} value={uniqueCities} label="Villes" />
          <StatCard icon={Code} value={uniqueTechs} label="Technologies" />
          <StatCard icon={Handshake} value={openToCollab} label="En collab." />
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
}) {
  return (
    <div className="glass-panel rounded-xl border border-white/10 p-4 text-center">
      <Icon className="mx-auto h-4 w-4 text-primary mb-1.5" />
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
