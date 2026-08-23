import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  MapPin,
  TrendingUp,
  Code as Code2,
  ChartBar as BarChart3,
  Globe,
  Briefcase,
  Award,
  ArrowRight,
  Star,
  Clock,
  Zap,
  Heart,
  Shield,
  Mail,
  ExternalLink,
  CheckCircle2,
  GitBranch,
  Rocket,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { MOCK_PROFILES } from "@/lib/mock-data";
import type { Profile } from "@/types";

// ── Types ──────────────────────────────────────────────────────────────────

type RawProfile = Pick<
  Profile,
  | "role_type"
  | "experience_level"
  | "tech_stack"
  | "city"
  | "open_to_collaboration"
  | "created_at"
  | "last_seen_at"
>;

type SpotlightProfile = Pick<
  Profile,
  | "id"
  | "username"
  | "full_name"
  | "avatar_url"
  | "role_type"
  | "tech_stack"
  | "city"
  | "github_url"
>;

interface ComputedStats {
  total: number;
  collabRate: number;
  totalCities: number;
  allTechs: number;
  activeLastWeek: number;
  roles: { label: string; pct: number; color: string }[];
  techs: { label: string; pct: number }[];
  cities: { name: string; pct: number }[];
  growth: { month: string; value: number }[];
  experience: { label: string; pct: number; color: string }[];
}

// ── computeStats ───────────────────────────────────────────────────────────

// Smart, non-dev-centric grouping of every role_type in the DB into
// broader categories. Categories without any matching profile are omitted
// at render time, so the panel adapts to the real population mix.
const ROLE_CATEGORY_MAP: Record<string, string> = {
  // Développement (toutes les filières "code")
  frontend: "Développeurs",
  backend: "Développeurs",
  fullstack: "Développeurs",
  mobile: "Développeurs",
  devops: "Développeurs",
  sysadmin: "Développeurs",
  cybersecurite: "Développeurs",
  vibecoder: "Développeurs",
  // Data, hardware et support tech
  data: "Data & Tech",
  hardware: "Data & Tech",
  support: "Data & Tech",
  // Design / Produit
  design: "Design & Produit",
  product: "Design & Produit",
  // Enseignants
  enseignement: "Enseignants",
  // No-code / autres profils (étudiants & rôles non listés tombent ici)
  nocode: "Autres profils",
  autre: "Autres profils",
};

const CATEGORY_COLORS: Record<string, string> = {
  Développeurs: "bg-primary",
  "Data & Tech": "bg-chart-2",
  "Design & Produit": "bg-chart-3",
  Enseignants: "bg-chart-4",
  Administrateurs: "bg-chart-5",
  "Autres profils": "bg-chart-5",
};

// ⚡ Bolt: Consolidated multiple iterations into a single O(n) pass over profiles.
function computeStats(profiles: RawProfile[]): ComputedStats {
  const total = profiles.length;
  if (total === 0) {
    return {
      total: 0,
      collabRate: 0,
      totalCities: 0,
      allTechs: 0,
      activeLastWeek: 0,
      roles: [],
      techs: [],
      cities: [],
      growth: [],
      experience: [],
    };
  }

  const roleCounts: Record<string, number> = {};
  const expCounts: Record<string, number> = {};
  const techCounts: Record<string, number> = {};
  const cityCounts: Record<string, number> = {};

  let collab = 0;
  let activeLastWeek = 0;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return {
      month: d.toLocaleDateString("fr-FR", { month: "short" }),
      year: d.getFullYear(),
      monthNum: d.getMonth(),
      count: 0,
    };
  });

  // ⚡ Bolt: Single pass loop for all aggregations
  for (const p of profiles) {
    // Roles
    roleCounts[p.role_type] = (roleCounts[p.role_type] || 0) + 1;

    // Experience
    expCounts[p.experience_level] = (expCounts[p.experience_level] || 0) + 1;

    // Techs
    if (p.tech_stack) {
      for (const t of p.tech_stack) {
        techCounts[t] = (techCounts[t] || 0) + 1;
      }
    }

    // Cities
    if (p.city) {
      cityCounts[p.city] = (cityCounts[p.city] || 0) + 1;
    }

    // Growth
    const d = new Date(p.created_at);
    const entry = months.find(
      (m) => m.year === d.getFullYear() && m.monthNum === d.getMonth()
    );
    if (entry) entry.count++;

    // Collaboration
    if (p.open_to_collaboration) {
      collab++;
    }

    // Active last week
    if (p.last_seen_at && new Date(p.last_seen_at) >= weekAgo) {
      activeLastWeek++;
    }
  }

  // Regroupement dynamique : agrège tous les role_type connus dans des
  // catégories plus larges, n'affiche que celles ayant au moins 1 profil
  // et trie par population décroissante.
  const categoryCounts: Record<string, number> = {};
  for (const [rt, count] of Object.entries(roleCounts)) {
    const category = ROLE_CATEGORY_MAP[rt] ?? "Autres profils";
    categoryCounts[category] = (categoryCounts[category] || 0) + count;
  }
  const roles = Object.entries(categoryCounts)
    .map(([label, count]) => ({
      label,
      pct: Math.round((count / total) * 100),
      color: CATEGORY_COLORS[label] ?? "bg-chart-5",
    }))
    .filter((r) => r.pct > 0)
    .sort((a, b) => b.pct - a.pct);

  const experience = [
    {
      label: "Junior",
      pct: Math.round(((expCounts.junior || 0) / total) * 100),
      color: "bg-chart-3",
    },
    {
      label: "Intermédiaire",
      pct: Math.round(((expCounts.mid || 0) / total) * 100),
      color: "bg-chart-2",
    },
    {
      label: "Senior",
      pct: Math.round(((expCounts.senior || 0) / total) * 100),
      color: "bg-primary",
    },
  ];

  const techs = Object.entries(techCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, count]) => ({
      label,
      pct: Math.round((count / total) * 100),
    }));

  const sortedCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]);
  const cities = sortedCities
    .slice(0, 3)
    .map(([name, count]) => ({ name, pct: Math.round((count / total) * 100) }));
  const otherCount = sortedCities.slice(3).reduce((s, [, c]) => s + c, 0);
  if (otherCount > 0)
    cities.push({ name: "Autres", pct: Math.round((otherCount / total) * 100) });

  const maxCount = Math.max(...months.map((m) => m.count), 1);
  const growth = months.map((m) => ({
    month: m.month,
    value: Math.round((m.count / maxCount) * 100),
  }));

  return {
    total,
    collabRate: Math.round((collab / total) * 100),
    totalCities: Object.keys(cityCounts).length,
    allTechs: Object.keys(techCounts).length,
    activeLastWeek,
    roles,
    techs,
    cities,
    growth,
    experience,
  };
}

const MOCK_STATS = computeStats(MOCK_PROFILES as unknown as RawProfile[]);

const MOCK_SPOTLIGHT: SpotlightProfile[] = MOCK_PROFILES.slice(0, 3).map(
  (p) => ({
    id: p.id,
    username: p.username,
    full_name: p.full_name,
    avatar_url: p.avatar_url,
    role_type: p.role_type,
    tech_stack: p.tech_stack.slice(0, 3),
    city: p.city,
    github_url: p.github_url,
  })
);

// ── Static data ────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  frontend: "Frontend",
  backend: "Backend",
  fullstack: "Fullstack",
  mobile: "Mobile",
  data: "Data / IA",
  devops: "DevOps",
  sysadmin: "Sysadmin",
  cybersecurite: "Cybersécurité",
  design: "Design",
  product: "Product",
  enseignement: "Enseignement",
  nocode: "No-Code",
  vibecoder: "Vibe Coder",
  autre: "Autre",
};

const TIMELINE = [
  {
    period: "Déc. 2024",
    title: "L'idée naît",
    desc: "Une question sans réponse : où sont les développeurs congolais ? BisoMapTech commence comme une obsession.",
    Icon: Star,
  },
  {
    period: "Janv. 2025",
    title: "Première ligne de code",
    desc: "Prototype d'une carte interactive. Le Congo numérique prend forme sur un écran.",
    Icon: Code2,
  },
  {
    period: "Mars 2025",
    title: "Bêta publique",
    desc: "Ouverture aux premiers contributeurs. La communauté commence à se cartographier d'elle-même.",
    Icon: Users,
  },
  {
    period: "Avr. 2025",
    title: "Matching & Projets",
    desc: "Algorithme de mise en relation et espace projets pour connecter talents et porteurs d'idées.",
    Icon: Zap,
  },
  {
    period: "Aujourd'hui",
    title: "Communauté active",
    desc: "Une infrastructure tech en croissance continue, portée par la communauté.",
    Icon: Rocket,
  },
];

const ROADMAP_DONE = [
  "Carte interactive des talents",
  "Système de profils vérifiés",
  "Algorithme de matching",
  "Messagerie sécurisée E2EE",
  "Carte des lieux tech",
  "Espace projets",
];

const ROADMAP_IN_PROGRESS = [
  "Notifications temps réel",
  "Filtres avancés de recherche",
  "Tableau de bord analytics",
  "Système de réputation",
];

const ROADMAP_PLANNED = [
  "Application mobile native",
  "API publique BisoMapTech",
  "Programme d'ambassadeurs",
  "Partenariats universitaires",
  "Mode offline (PWA)",
];

const TEAM = [
  {
    name: "Kxl Sys",
    role: "Fondateur & Lead Dev",
    avatar:
      "https://api.dicebear.com/9.x/initials/svg?seed=KS&backgroundColor=0d9488",
    github: "https://github.com/KxlSys",
    bio: "Ingénieur fullstack, architecte de l'écosystème BisoMapTech.",
  },
  {
    name: "Dr Smoke",
    role: "Co Fondateur & Lead Dev",
    avatar:
      "https://api.dicebear.com/9.x/initials/svg?seed=DS&backgroundColor=2563eb",
    github: "https://github.com/BlackAngel242",
    bio: "Architecte de l'écosystème BisoMapTech.",
  },
  {
    name: "Contributeurs Core",
    role: "Développeurs Actifs",
    avatar:
      "https://api.dicebear.com/9.x/initials/svg?seed=CC&backgroundColor=7c3aed",
    github: "https://github.com/kaleldamba/bisomaptech/graphs/contributors",
    bio: "La communauté qui construit BisoMapTech au quotidien.",
  },
];

const ROLE_PANEL_STYLES = [
  { gradient: "from-primary/60 to-primary", text: "text-primary" },
  { gradient: "from-tertiary/60 to-tertiary", text: "text-tertiary" },
  { gradient: "from-map-accent/60 to-map-accent", text: "text-map-accent" },
  { gradient: "from-chart-4/60 to-chart-4", text: "text-chart-4" },
];

// ── Hooks ──────────────────────────────────────────────────────────────────

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function useCountUp(
  target: number,
  enabled: boolean,
  reduced: boolean
): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!enabled) {
      setValue(0);
      return;
    }
    if (reduced) {
      setValue(target);
      return;
    }
    const steps = 40;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setValue(Math.round(easeOut(step / steps) * target));
      if (step >= steps) clearInterval(timer);
    }, 25);
    return () => clearInterval(timer);
  }, [target, enabled, reduced]);
  return value;
}

// ── AboutPage ──────────────────────────────────────────────────────────────

export function AboutPage() {
  const [data, setData] = useState<ComputedStats>(MOCK_STATS);
  const [spotlight, setSpotlight] =
    useState<SpotlightProfile[]>(MOCK_SPOTLIGHT);
  const [isLoading, setIsLoading] = useState(true);
  const [isRealData, setIsRealData] = useState(false);
  const [animReady, setAnimReady] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    async function fetchData() {
      try {
        const [profilesRes, spotlightRes] = await Promise.all([
          supabase
            .from("profiles")
            .select(
              "role_type, experience_level, tech_stack, city, open_to_collaboration, created_at, last_seen_at"
            ),
          supabase
            .from("profiles")
            .select(
              "id, username, full_name, avatar_url, role_type, tech_stack, city, github_url"
            )
            .eq("open_to_collaboration", true)
            .order("last_seen_at", { ascending: false, nullsFirst: false })
            .limit(6),
        ]);

        if (
          !profilesRes.error &&
          profilesRes.data &&
          profilesRes.data.length > 0
        ) {
          setData(computeStats(profilesRes.data as RawProfile[]));
          setIsRealData(true);
        }
        if (
          !spotlightRes.error &&
          spotlightRes.data &&
          spotlightRes.data.length > 0
        ) {
          setSpotlight(spotlightRes.data as SpotlightProfile[]);
        }
      } catch {
        /* ignore — fallback to mock data */
      }
      setIsLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const t = setTimeout(() => setAnimReady(true), 50);
      return () => clearTimeout(t);
    }
  }, [isLoading]);

  const maxGrowth = useMemo(
    () => Math.max(...data.growth.map((d) => d.value), 1),
    [data.growth]
  );

  const circumference = 2 * Math.PI * 15.9;
  const dashFill = (data.collabRate / 100) * circumference;
  const dashGap = circumference - dashFill;

  const countTotal = useCountUp(data.total, animReady, reduced);
  const countCities = useCountUp(data.totalCities, animReady, reduced);
  const countTechs = useCountUp(data.allTechs, animReady, reduced);
  const countActive = useCountUp(data.activeLastWeek, animReady, reduced);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 md:pb-8">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative mb-12 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
        <div className="pointer-events-none absolute -top-20 left-1/4 h-[400px] w-[400px] rounded-full bg-primary/8 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-tertiary/6 blur-[80px]" />

        {/* Left col */}
        <div className="relative z-10 col-span-1 space-y-6 lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-xs font-semibold text-primary">
            <span className="relative flex h-1.5 w-1.5">
              {!reduced && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              )}
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            Navigateur de l'Écosystème Numérique
          </div>

          <h1 className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl lg:text-5xl">
            Cartographier l'Avenir des
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-primary to-tertiary bg-clip-text text-transparent">
              {" "}
              Talents Tech Congolais
            </span>
          </h1>

          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            BisoMapTech est né d'une conviction : les développeurs congolais
            méritent un annuaire digne d'eux. Depuis Brazzaville jusqu'à la
            diaspora mondiale, nous cartographions, connectons et valorisons ceux
            qui construisent le numérique du Congo — sans frontières, sans
            intermédiaires.
          </p>

          <p className="max-w-xl text-sm text-muted-foreground">
            Basé sur{" "}
            <span className="font-semibold text-foreground">
              {isLoading ? "..." : data.total.toLocaleString()} profils
            </span>{" "}
            enregistrés — de Brazzaville à Pointe-Noire.
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatPill
              icon={Users}
              value={isLoading ? "..." : countTotal.toLocaleString()}
              label="Talents"
            />
            <StatPill
              icon={MapPin}
              value={isLoading ? "..." : `${countCities}+`}
              label="Villes"
            />
            <StatPill
              icon={Globe}
              value={isLoading ? "..." : `${countTechs}+`}
              label="Technologies"
            />
            <StatPill
              icon={TrendingUp}
              value={isLoading ? "..." : `${countActive}`}
              label="Actifs / 7j"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/profil/edit">
              <Button className="gap-2 bg-primary font-semibold text-primary-foreground shadow-[0_4px_16px_rgba(78,222,163,0.25)] hover:bg-primary/90">
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Rejoindre la carte
              </Button>
            </Link>
            <Link to="/contributeurs">
              <Button
                variant="ghost"
                className="gap-2 border border-white/10 bg-white/5 hover:bg-white/8"
              >
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                Explorer les talents
              </Button>
            </Link>
          </div>
        </div>

        {/* Right panel — desktop */}
        <div className="col-span-1 hidden lg:col-span-5 lg:block">
          <div className="glass-panel relative overflow-hidden rounded-2xl border border-white/10 p-6">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/15 blur-2xl" />

            <div className="relative z-10 mb-6 flex items-start justify-between">
              <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              {isRealData && (
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  <span className="relative flex h-2 w-2">
                    {!reduced && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    )}
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Données en Direct
                  </span>
                </div>
              )}
            </div>

            <div className="relative z-10 space-y-5">
              {(data.roles.length > 0
                ? data.roles.slice(0, 3)
                : [
                    { label: "Développeurs", pct: 0, color: "bg-primary" },
                    { label: "Enseignants", pct: 0, color: "bg-chart-4" },
                    { label: "Autres profils", pct: 0, color: "bg-chart-5" },
                  ]
              ).map(({ label, pct }, i) => {
                const style = ROLE_PANEL_STYLES[i] ?? ROLE_PANEL_STYLES[0];
                return (
                  <div key={label}>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="text-muted-foreground">{label}</span>
                      <span className={cn("font-bold", style.text)}>{pct}%</span>
                    </div>
                    <div
                      className="h-1.5 overflow-hidden rounded-full bg-white/8"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={label}
                    >
                      <div
                        className={cn(
                          "h-full rounded-full bg-gradient-to-r transition-all duration-700",
                          style.gradient
                        )}
                        style={{
                          width: animReady ? `${pct}%` : "0%",
                          transitionDelay: `${i * 120}ms`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="relative z-10 mt-8 text-right">
              <p className="text-4xl font-extrabold text-foreground">
                {isLoading ? "..." : `${data.total.toLocaleString()}+`}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Membres Actifs Cartographiés
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bento stats ───────────────────────────────────────────────── */}
      <div className="mb-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">

        {/* Monthly growth chart */}
        <div className="glass-panel col-span-full rounded-2xl border border-white/10 p-6 md:col-span-2 lg:col-span-1">
          <div className="mb-1 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Inscriptions
            </span>
          </div>
          {isLoading ? (
            <>
              <Skeleton className="mb-4 h-12 w-28" />
              <Skeleton className="h-16 w-full" />
            </>
          ) : (
            <>
              <div className="mb-5 flex items-end gap-3">
                <span className="text-5xl font-extrabold text-primary">
                  {data.total}
                </span>
                <span className="mb-1.5 text-sm text-muted-foreground">
                  contributeurs inscrits
                </span>
              </div>
              <div className="flex h-16 items-end gap-1.5">
                {data.growth.map((d, i) => (
                  <div
                    key={i}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <div
                      className="w-full rounded-t-sm bg-primary/50 transition-all"
                      style={{
                        height: animReady
                          ? `${((d.value || 1) / maxGrowth) * 52}px`
                          : "0px",
                        transitionDuration: "700ms",
                        transitionDelay: `${i * 80}ms`,
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {d.month}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
          <p className="mt-2 text-[10px] text-muted-foreground/50">
            Inscriptions par mois — 6 derniers mois
          </p>
        </div>

        {/* Collab rate donut */}
        <div className="glass-panel rounded-2xl border border-white/10 p-6">
          <div className="mb-1 flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Collaboration
            </span>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Skeleton className="h-28 w-28 rounded-full" />
            </div>
          ) : (
            <div className="my-4 flex items-center justify-center">
              <div className="relative h-28 w-28">
                <svg
                  viewBox="0 0 36 36"
                  className="h-28 w-28 -rotate-90"
                  role="img"
                  aria-label={`${data.collabRate}% des talents sont ouverts à la collaboration`}
                >
                  <title>Taux de collaboration</title>
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-white/8"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={
                      animReady ? `${dashFill} ${dashGap}` : `0 ${circumference}`
                    }
                    strokeLinecap="round"
                    className="text-primary transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-foreground">
                    {data.collabRate}%
                  </span>
                  <span className="text-xs text-muted-foreground">ouverts</span>
                </div>
              </div>
            </div>
          )}
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

        {/* Experience level distribution */}
        <div className="glass-panel rounded-2xl border border-white/10 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Expérience
            </span>
          </div>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {data.experience.map((exp, i) => (
                <div key={exp.label}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">
                      {exp.label}
                    </span>
                    <span className="text-muted-foreground">{exp.pct}%</span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-white/8"
                    role="progressbar"
                    aria-valuenow={exp.pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={exp.label}
                  >
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        exp.color
                      )}
                      style={{
                        width: animReady ? `${exp.pct}%` : "0%",
                        transitionDelay: `${i * 100}ms`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Role distribution by specialty */}
        <div className="glass-panel rounded-2xl border border-white/10 p-6 md:col-span-2 lg:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <Code2 className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Par spécialité
            </span>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {data.roles.map((r, i) => (
                <div key={r.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-foreground">{r.label}</span>
                    <span className="text-muted-foreground">{r.pct}%</span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full bg-white/8"
                    role="progressbar"
                    aria-valuenow={r.pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={r.label}
                  >
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        r.color
                      )}
                      style={{
                        width: animReady ? `${r.pct}%` : "0%",
                        transitionDelay: `${i * 100}ms`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Technologies phares — clickable chips */}
        <div className="glass-panel col-span-full rounded-2xl border border-white/10 p-6">
          <div className="mb-5 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-semibold">Technologies Phares</h2>
            <span className="ml-auto text-[11px] text-muted-foreground">
              % de profils utilisant chaque technologie
            </span>
          </div>
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : data.techs.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.techs.map((tech, i) => (
                <Link
                  key={tech.label}
                  to={`/contributeurs?tech=${encodeURIComponent(tech.label)}`}
                  className="group block rounded-lg p-1.5 transition-colors hover:bg-white/5"
                >
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground transition-colors group-hover:text-primary">
                      {tech.label}
                    </span>
                    <span className="font-semibold text-primary">
                      {tech.pct}%
                    </span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-white/8"
                    role="progressbar"
                    aria-valuenow={tech.pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${tech.label}: ${tech.pct}%`}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-700"
                      style={{
                        width: animReady ? `${tech.pct}%` : "0%",
                        transitionDelay: `${i * 80}ms`,
                      }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {/* City distribution — clickable rows */}
        <div className="glass-panel col-span-full rounded-2xl border border-white/10 p-6 md:col-span-2">
          <div className="mb-5 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-semibold">Répartition par Ville</h2>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : data.cities.length > 0 ? (
            <div className="space-y-3">
              {data.cities.map((city, i) => (
                <Link
                  key={city.name}
                  to={
                    city.name !== "Autres"
                      ? `/contributeurs?city=${encodeURIComponent(city.name)}`
                      : "/contributeurs"
                  }
                  className="group flex items-center gap-4 rounded-lg p-1 transition-colors hover:bg-white/5"
                >
                  <span className="w-28 shrink-0 text-sm text-foreground transition-colors group-hover:text-primary">
                    {city.name}
                  </span>
                  <div
                    className="h-2 flex-1 overflow-hidden rounded-full bg-white/8"
                    role="progressbar"
                    aria-valuenow={city.pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={city.name}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary/50 to-primary transition-all duration-700"
                      style={{
                        width: animReady ? `${city.pct}%` : "0%",
                        transitionDelay: `${i * 100}ms`,
                      }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs font-semibold text-muted-foreground">
                    {city.pct}%
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {/* Mission card */}
        <div className="glass-panel rounded-2xl border border-white/10 p-6">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Notre Mission
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Cartographier, connecter et valoriser les talents tech du
            Congo-Brazzaville. Nous construisons l'annuaire de référence de
            l'écosystème numérique congolais.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-xl font-bold text-primary">{data.total}+</p>
              <p className="text-xs text-muted-foreground">Talents</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-xl font-bold text-primary">
                {data.totalCities}+
              </p>
              <p className="text-xs text-muted-foreground">Villes</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/contributeurs">
              <Button
                variant="ghost"
                size="sm"
                className="w-full gap-2 border border-white/10 bg-white/5 text-xs hover:bg-white/8"
              >
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                Voir les contributeurs
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Histoire / Timeline ────────────────────────────────────────── */}
      <section className="mb-12">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Notre Histoire
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            De l'idée au produit — les étapes qui ont façonné BisoMapTech
          </p>
        </div>

        <div className="relative pl-8 md:pl-10">
          <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent md:left-2" />
          <div className="space-y-6">
            {TIMELINE.map(({ period, title, desc, Icon }) => (
              <div key={period} className="relative">
                <div className="absolute -left-8 top-3 flex h-5 w-5 items-center justify-center rounded-full border-2 border-primary bg-background md:-left-10 md:h-6 md:w-6">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                </div>
                <div className="glass-panel rounded-xl border border-white/10 p-4 md:p-5">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-primary">
                        {period}
                      </p>
                      <p className="text-sm font-bold text-foreground">{title}</p>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Spotlight membres ─────────────────────────────────────────── */}
      <section className="mb-12">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              La Communauté
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Quelques-uns des talents qui font vivre l'écosystème
            </p>
          </div>
          <Link to="/contributeurs" className="hidden sm:block">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 border border-white/10 bg-white/5 hover:bg-white/8"
            >
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              Tous les contributeurs
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spotlight.map((profile) => {
            const githubUsername = profile.github_url
              ? profile.github_url
                  .replace("https://github.com/", "")
                  .replace(/\/$/, "")
              : null;
            return (
              <Link
                key={profile.id}
                to={`/contributeurs/${profile.username}`}
                className="group"
              >
                <div className="glass-panel h-full rounded-xl border border-white/10 p-5 transition-all group-hover:border-primary/30 group-hover:bg-primary/5">
                  <div className="mb-3 flex items-center gap-3">
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      className="h-10 w-10 rounded-full border border-white/10"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                        {profile.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {githubUsername
                          ? `@${githubUsername}`
                          : `@${profile.username}`}
                      </p>
                    </div>
                  </div>
                  <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {profile.city}
                    <span className="ml-auto rounded-full border border-white/10 bg-white/5 px-2 py-0.5 capitalize">
                      {ROLE_LABELS[profile.role_type] ?? profile.role_type}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {profile.tech_stack.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Roadmap publique ──────────────────────────────────────────── */}
      <section className="mb-12">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Feuille de Route
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ce qu'on a livré, ce sur quoi on travaille, ce qui arrive
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="glass-panel rounded-xl border border-white/10 p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
                <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold text-primary">Livré</h3>
            </div>
            <ul className="space-y-2.5">
              {ROADMAP_DONE.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <CheckCircle2
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-panel rounded-xl border border-primary/20 bg-primary/3 p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
                <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold text-primary">En cours</h3>
            </div>
            <ul className="space-y-2.5">
              {ROADMAP_IN_PROGRESS.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <Clock
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-panel rounded-xl border border-white/10 p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/8">
                <Zap className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold text-muted-foreground">
                Prévu
              </h3>
            </div>
            <ul className="space-y-2.5">
              {ROADMAP_PLANNED.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-xs text-muted-foreground/70"
                >
                  <Zap
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Backlinks éditoriaux ──────────────────────────────────────── */}
      <section className="mb-12 grid gap-4 sm:grid-cols-2">
        <Link to="/matching" className="group">
          <div className="glass-panel relative h-full overflow-hidden rounded-2xl border border-white/10 p-6 transition-all group-hover:border-primary/30">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
            <div className="relative z-10">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-foreground">
                  Moteur de Matching
                </h3>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                Trouvez les talents ou projets qui correspondent exactement à
                votre profil. Notre algorithme analyse stack, expérience et
                disponibilité.
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-all group-hover:gap-2.5">
                Essayer le matching{" "}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </div>
          </div>
        </Link>

        <Link to="/lieux" className="group">
          <div className="glass-panel relative h-full overflow-hidden rounded-2xl border border-white/10 p-6 transition-all group-hover:border-tertiary/30">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-tertiary/10 blur-2xl" />
            <div className="relative z-10">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-tertiary/20 bg-tertiary/10">
                  <MapPin className="h-5 w-5 text-tertiary" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-foreground">
                  Carte des Lieux Tech
                </h3>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                Découvrez les espaces de coworking, labs, incubateurs et hubs
                tech du Congo-Brazzaville. Trouvez votre communauté locale.
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-tertiary transition-all group-hover:gap-2.5">
                Explorer les lieux{" "}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </div>
          </div>
        </Link>
      </section>

      {/* ── Contribuer ────────────────────────────────────────────────── */}
      <section className="mb-12">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Contribuer au Projet
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            BisoMapTech est un projet communautaire. Il y a une place pour toi.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="glass-panel rounded-xl border border-white/10 p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
              <UserPlus className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <h3 className="mb-2 text-sm font-bold text-foreground">
              Créer ton Profil
            </h3>
            <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
              Rejoins la carte en 5 minutes. Ton profil te rend visible auprès
              des recruteurs et collaborateurs de l'écosystème.
            </p>
            <Link to="/profil/edit">
              <Button
                size="sm"
                className="w-full gap-2 bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                Rejoindre
              </Button>
            </Link>
          </div>

          <div className="glass-panel rounded-xl border border-white/10 p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <GitBranch className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            </div>
            <h3 className="mb-2 text-sm font-bold text-foreground">
              Contribuer au Code
            </h3>
            <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
              Le projet est open-source. Signale un bug, propose une feature ou
              soumets une PR directement sur GitHub.
            </p>
            <a
              href="https://github.com/kaleldamba/bisomaptech"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="ghost"
                size="sm"
                className="w-full gap-2 border border-white/10 bg-white/5 hover:bg-white/8"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                Voir sur GitHub
              </Button>
            </a>
          </div>

          <div className="glass-panel rounded-xl border border-white/10 p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <Heart className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            </div>
            <h3 className="mb-2 text-sm font-bold text-foreground">
              Devenir Ambassadeur
            </h3>
            <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
              Partage BisoMapTech dans ton réseau, organise des sessions de
              découverte, aide la communauté à grandir.
            </p>
            <a
              href="https://github.com/KxlSys/BisoMapTech/discussions"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="ghost"
                size="sm"
                className="w-full gap-2 border border-white/10 bg-white/5 hover:bg-white/8"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                Rejoindre les discussions
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── Équipe ────────────────────────────────────────────────────── */}
      <section className="mb-12">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            L'Équipe
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Les gens qui construisent et maintiennent BisoMapTech
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {TEAM.map((member) => (
            <a
              key={member.name}
              href={member.github}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <div className="glass-panel flex w-56 flex-col items-center rounded-xl border border-white/10 p-5 text-center transition-all group-hover:border-primary/30">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="mb-3 h-16 w-16 rounded-full border border-white/10"
                />
                <p className="text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                  {member.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {member.role}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground/70">
                  {member.bio}
                </p>
                <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                  <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>GitHub</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ── Contact & Transparence ────────────────────────────────────── */}
      <section className="mb-12 grid gap-4 md:grid-cols-2">
        <div className="glass-panel rounded-2xl border border-white/10 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-semibold">Contact & Réseaux</h2>
          </div>
          <div className="space-y-3">
            <a
              href="https://github.com/KxlSys/BisoMapTech"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
            >
              <GitBranch
                className="h-4 w-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              github.com/KxlSys/BisoMapTech
              <ExternalLink className="ml-auto h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="glass-panel rounded-2xl border border-white/10 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-semibold">Transparence</h2>
          </div>
          <ul className="space-y-2">
            {[
              "Aucune monétisation des données personnelles",
              "Données hébergées en Europe (Supabase / Frankfurt)",
              "Profil supprimable à tout moment",
              "Messagerie chiffrée de bout en bout (E2EE)",
              "Code source ouvert sur GitHub",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-xs text-muted-foreground"
              >
                <CheckCircle2
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Footer CTA ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(78,222,163,0.12),transparent_70%)]" />
        <div className="relative z-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
            <Rocket className="h-7 w-7 text-primary" aria-hidden="true" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-foreground md:text-2xl">
            Rejoins l'Écosystème Tech Congolais
          </h2>
          <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">
            Que tu sois développeur, designer, data scientist ou porteur de
            projet — ta place est ici. BisoMapTech grandit avec chaque nouveau
            profil.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/profil/edit">
              <Button className="gap-2 bg-primary font-bold text-primary-foreground shadow-[0_4px_16px_rgba(78,222,163,0.25)] hover:bg-primary/90">
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Créer mon profil
              </Button>
            </Link>
            <Link to="/contributeurs">
              <Button
                variant="ghost"
                className="gap-2 border border-white/10 bg-white/5 hover:bg-white/8"
              >
                <Users className="h-4 w-4" aria-hidden="true" />
                Explorer la communauté
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

// ── StatPill ───────────────────────────────────────────────────────────────

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
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
