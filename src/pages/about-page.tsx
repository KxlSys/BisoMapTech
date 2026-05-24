import { useEffect, useState } from "react";
import { Users, MapPin, TrendingUp, Code as Code2, ChartBar as BarChart3, Globe, Briefcase, Award } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { MOCK_PROFILES } from "@/lib/mock-data";

interface ComputedStats {
  total: number;
  collabRate: number;
  totalCities: number;
  allTechs: number;
  roles: { label: string; pct: number; color: string }[];
  techs: { label: string; pct: number }[];
  cities: { name: string; pct: number }[];
  growth: { month: string; value: number }[];
}

type RawProfile = { role_type: string; tech_stack: string[] | null; city: string | null; open_to_collaboration: boolean | null; created_at: string };

function computeStats(profiles: RawProfile[]): ComputedStats {
  const total = profiles.length;

  const roleCounts: Record<string, number> = {};
  for (const p of profiles) roleCounts[p.role_type] = (roleCounts[p.role_type] || 0) + 1;
  const webCount = (roleCounts.frontend || 0) + (roleCounts.backend || 0) + (roleCounts.fullstack || 0);
  const roles = [
    { label: "Web / Fullstack", pct: Math.round((webCount / total) * 100), color: "bg-primary" },
    { label: "Data & IA", pct: Math.round(((roleCounts.data || 0) / total) * 100), color: "bg-chart-2" },
    { label: "Mobile", pct: Math.round(((roleCounts.mobile || 0) / total) * 100), color: "bg-chart-3" },
    { label: "DevOps / Cloud", pct: Math.round(((roleCounts.devops || 0) / total) * 100), color: "bg-chart-4" },
  ].filter((r) => r.pct > 0);

  const techCounts: Record<string, number> = {};
  for (const p of profiles) {
    for (const t of p.tech_stack ?? []) techCounts[t] = (techCounts[t] || 0) + 1;
  }
  const techs = Object.entries(techCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, count]) => ({ label, pct: Math.round((count / total) * 100) }));

  const cityCounts: Record<string, number> = {};
  for (const p of profiles) {
    if (p.city) cityCounts[p.city] = (cityCounts[p.city] || 0) + 1;
  }
  const sortedCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]);
  const cities = sortedCities.slice(0, 3).map(([name, count]) => ({ name, pct: Math.round((count / total) * 100) }));
  const otherCount = sortedCities.slice(3).reduce((s, [, c]) => s + c, 0);
  if (otherCount > 0) cities.push({ name: "Autres", pct: Math.round((otherCount / total) * 100) });

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { month: d.toLocaleDateString("fr-FR", { month: "short" }), year: d.getFullYear(), monthNum: d.getMonth(), count: 0 };
  });
  for (const p of profiles) {
    const d = new Date(p.created_at);
    const entry = months.find((m) => m.year === d.getFullYear() && m.monthNum === d.getMonth());
    if (entry) entry.count++;
  }
  const maxCount = Math.max(...months.map((m) => m.count), 1);
  const growth = months.map((m) => ({ month: m.month, value: Math.round((m.count / maxCount) * 100) }));

  const collab = profiles.filter((p) => p.open_to_collaboration).length;
  const totalCities = new Set(profiles.map((p) => p.city).filter(Boolean)).size;
  const allTechs = new Set(profiles.flatMap((p) => p.tech_stack ?? [])).size;

  return { total, collabRate: Math.round((collab / total) * 100), totalCities, allTechs, roles, techs, cities, growth };
}

const MOCK_STATS = computeStats(MOCK_PROFILES);

export function AboutPage() {
  const [data, setData] = useState<ComputedStats>(MOCK_STATS);

  useEffect(() => {
    async function fetchData() {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("role_type, tech_stack, city, open_to_collaboration, created_at");

      if (!profiles || profiles.length === 0) return;
      setData(computeStats(profiles as RawProfile[]));
    }
    fetchData();
  }, []);

  const maxGrowth = Math.max(...(data?.growth.map((d) => d.value) ?? [1]));

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 md:pb-8">
      {/* Hero section — 2-column Stitch layout */}
      <section className="relative mb-12 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
        {/* Ambient blobs */}
        <div className="pointer-events-none absolute -top-20 left-1/4 h-[400px] w-[400px] rounded-full bg-primary/8 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-tertiary/6 blur-[80px]" />

        {/* Left — text + stat pills */}
        <div className="relative z-10 col-span-1 space-y-6 lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-xs font-semibold text-primary">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            Navigateur de l'Écosystème Numérique
          </div>

          <h1 className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl lg:text-5xl">
            Cartographier l'Avenir des<br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-primary to-tertiary bg-clip-text text-transparent">
              {" "}Talents Tech Congolais
            </span>
          </h1>

          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Données en temps réel sur la communauté tech congolaise. Basé sur{" "}
            <span className="font-semibold text-foreground">{data.total.toLocaleString()} profils</span>{" "}
            enregistrés — de Brazzaville à Pointe-Noire.
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatPill icon={Users} value={data.total.toLocaleString()} label="Talents" />
            <StatPill icon={MapPin} value={`${data.totalCities}+`} label="Villes" />
            <StatPill icon={Globe} value={`${data.allTechs}+`} label="Technologies" />
            <StatPill icon={Briefcase} value={`${data.collabRate}%`} label="En collab." />
          </div>
        </div>

        {/* Right — animated bar chart panel (desktop only) */}
        <div className="col-span-1 hidden lg:col-span-5 lg:block">
          <div className="glass-panel relative overflow-hidden rounded-2xl border border-white/10 p-6">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/15 blur-2xl" />

            {/* Header row */}
            <div className="relative z-10 mb-6 flex items-start justify-between">
              <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">Données en Direct</span>
              </div>
            </div>

            {/* Role distribution bars */}
            <div className="relative z-10 space-y-5">
              {[
                { label: "Développeurs Web", pct: data.roles[0]?.pct ?? 68, gradient: "from-primary/60 to-primary", text: "text-primary" },
                { label: "Ingénieurs Data & IA", pct: data.roles[1]?.pct ?? 42, gradient: "from-tertiary/60 to-tertiary", text: "text-tertiary" },
                { label: "Spécialistes Cloud", pct: data.roles[2]?.pct ?? 28, gradient: "from-map-accent/60 to-map-accent", text: "text-map-accent" },
              ].map(({ label, pct, gradient, text }) => (
                <div key={label}>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className={`font-bold ${text}`}>{pct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Big count */}
            <div className="relative z-10 mt-8 text-right">
              <p className="text-4xl font-extrabold text-foreground">{data.total.toLocaleString()}+</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Développeurs Actifs Cartographiés</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bento grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

        {/* Monthly growth */}
        <div className="glass-panel col-span-full md:col-span-2 lg:col-span-1 rounded-2xl border border-white/10 p-6">
          <div className="mb-1 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inscriptions</span>
          </div>
          <div className="mb-5 flex items-end gap-3">
            <span className="text-5xl font-extrabold text-primary">{data?.total ?? "..."}</span>
            <span className="mb-1.5 text-sm text-muted-foreground">contributeurs inscrits</span>
          </div>
          <div className="flex items-end gap-1.5 h-16">
            {(data?.growth ?? Array(6).fill({ month: "", value: 20 })).map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-sm bg-primary/50 transition-all"
                  style={{ height: `${((d.value || 1) / (maxGrowth || 1)) * 52}px` }}
                />
                <span className="text-[9px] text-muted-foreground">{d.month}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground/50">Inscriptions par mois — 6 derniers mois</p>
        </div>

        {/* Collaboration rate */}
        <div className="glass-panel rounded-2xl border border-white/10 p-6">
          <div className="mb-1 flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Collaboration</span>
          </div>
          <div className="my-4 flex items-center justify-center">
            <div className="relative h-28 w-28">
              <svg viewBox="0 0 36 36" className="h-28 w-28 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="oklch(1 0 0 / 8%)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke="oklch(0.82 0.16 155)"
                  strokeWidth="3"
                  strokeDasharray={`${data?.collabRate ?? 0} ${100}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-foreground">{data ? `${data.collabRate}%` : "..."}</span>
                <span className="text-[10px] text-muted-foreground">ouverts</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Ouverts collab.
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-white/20" />
              Indisponibles
            </div>
          </div>
        </div>

        {/* Role distribution */}
        <div className="glass-panel rounded-2xl border border-white/10 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Répartition</span>
          </div>
          <div className="space-y-4">
            <div>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-foreground font-medium">Hommes</span>
                <span className="text-muted-foreground">estimation</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/8">
                <div className="h-full w-[78%] rounded-full bg-primary" />
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-foreground font-medium">Femmes</span>
                <span className="text-muted-foreground">estimation</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/8">
                <div className="h-full w-[22%] rounded-full bg-blue-400" />
              </div>
            </div>
          </div>
          <p className="mt-4 text-[11px] text-muted-foreground/60">
            La parité progresse. Données estimées.
          </p>
        </div>

        {/* Role distribution — computed */}
        <div className="glass-panel rounded-2xl border border-white/10 p-6 md:col-span-2 lg:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <Code2 className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Par spécialité</span>
          </div>
          <div className="space-y-3">
            {(data?.roles ?? [
              { label: "Web / Fullstack", pct: 0, color: "bg-primary" },
              { label: "Data & IA", pct: 0, color: "bg-chart-2" },
              { label: "Mobile", pct: 0, color: "bg-chart-3" },
              { label: "DevOps / Cloud", pct: 0, color: "bg-chart-4" },
            ]).map((r) => (
              <div key={r.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-foreground">{r.label}</span>
                  <span className="text-muted-foreground">{r.pct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                  <div className={`h-full rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technologies phares — full width */}
        <div className="glass-panel col-span-full rounded-2xl border border-white/10 p-6">
          <div className="mb-5 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Technologies Phares</h2>
            <span className="ml-auto text-[11px] text-muted-foreground">% de profils utilisant chaque technologie</span>
          </div>
          {data?.techs && data.techs.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.techs.map((tech) => (
                <div key={tech.label}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{tech.label}</span>
                    <span className="text-primary font-semibold">{tech.pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
                      style={{ width: `${tech.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-sm text-muted-foreground">Chargement des données...</p>
          )}
        </div>

        {/* City distribution — computed */}
        <div className="glass-panel col-span-full md:col-span-2 rounded-2xl border border-white/10 p-6">
          <div className="mb-5 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Répartition par Ville</h2>
          </div>
          {data?.cities && data.cities.length > 0 ? (
            <div className="space-y-3">
              {data.cities.map((city) => (
                <div key={city.name} className="flex items-center gap-4">
                  <span className="w-28 shrink-0 text-sm text-foreground">{city.name}</span>
                  <div className="flex-1 h-2 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary/50 to-primary"
                      style={{ width: `${city.pct}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs font-semibold text-muted-foreground">{city.pct}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Chargement des données...</p>
          )}
        </div>

        {/* Mission card */}
        <div className="glass-panel rounded-2xl border border-white/10 p-6">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Notre Mission</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Cartographier, connecter et valoriser les talents tech du Congo-Brazzaville. Nous construisons l'annuaire de référence de l'écosystème numérique congolais.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-xl font-bold text-primary">{data ? `${data.total}+` : "..."}</p>
              <p className="text-[10px] text-muted-foreground">Talents</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-xl font-bold text-primary">{data ? `${data.totalCities}+` : "..."}</p>
              <p className="text-[10px] text-muted-foreground">Villes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatPill({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
}) {
  return (
    <div className="glass-panel rounded-xl border border-white/10 p-3 text-center">
      <Icon className="mx-auto mb-1 h-4 w-4 text-primary" />
      <p className="text-lg font-extrabold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
