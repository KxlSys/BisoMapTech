import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Handshake, LogIn, MapPin, Zap, ArrowRight, Briefcase,
  TrendingUp, DollarSign, Users, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/lib/supabase";
import { calculateMatches, type MatchResult } from "@/lib/matching";
import { MOCK_PROFILES } from "@/lib/mock-data";
import type { Profile } from "@/types";
import { ROLE_TYPE_LABELS, EXPERIENCE_LABELS } from "@/lib/constants";

const FEATURED_PROJECTS = [
  {
    id: "1",
    title: "Portefeuille Mobile Fintech",
    location: "Brazzaville (Télétravail Optionnel)",
    type: "Startup",
    priority: "Priorité Haute",
    priorityClass: "border-primary/40 bg-primary/10 text-primary",
    dotClass: "bg-primary shadow-[0_0_8px_rgba(78,222,163,0.7)]",
    description: "Recherche d'un Développeur Flutter Senior pour l'architecture front-end d'une application de mobile money ciblant le secteur non bancarisé.",
    techs: ["Flutter", "Dart", "Firebase", "Mobile"],
    budget: "3k$ – 5k$ / mois",
    openToCollab: true,
  },
  {
    id: "2",
    title: "Portail de Données E-Gov",
    location: "Brazzaville • Secteur Public",
    type: "Public",
    priority: "Long Terme",
    priorityClass: "border-tertiary/40 bg-tertiary/10 text-tertiary",
    dotClass: "bg-tertiary",
    description: "Recherche d'un Ingénieur Backend en Python/Django et PostGIS pour une plateforme sécurisée de partage de données municipales.",
    techs: ["Python", "Django", "PostgreSQL"],
    budget: "Contrat",
    openToCollab: false,
  },
  {
    id: "3",
    title: "Réseau Social Pro CG",
    location: "Remote",
    type: "Startup",
    priority: "Actif",
    priorityClass: "border-orange-400/40 bg-orange-400/10 text-orange-300",
    dotClass: "bg-orange-400",
    description: "LinkedIn congolais pour les professionnels de la tech. Recherche un fullstack TypeScript pour le développement produit.",
    techs: ["Next.js", "Supabase", "TypeScript"],
    budget: "Equity + Salaire",
    openToCollab: true,
  },
];

export function MatchingPage() {
  const { user, profile, signInWithGitHub } = useAuthStore();
  const [matches, setMatches] = useState<MatchResult[]>([]);

  // Matches calculés depuis les profils mock quand pas connecté
  const mockMatches = useMemo(
    () => calculateMatches(MOCK_PROFILES[0], MOCK_PROFILES.slice(1) as Profile[]),
    []
  );

  useEffect(() => {
    if (!profile) return;
    async function fetchMatches() {
      const { data } = await supabase.from("profiles").select("*");
      const pool = data && data.length > 0 ? (data as Profile[]) : (MOCK_PROFILES as Profile[]);
      setMatches(calculateMatches(profile!, pool.filter((p) => p.id !== profile!.id)));
    }
    fetchMatches();
  }, [profile]);

  const displayMatches = user && matches.length > 0 ? matches : mockMatches;
  const topMatches = displayMatches.slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 md:pb-8">

      {/* Banner CTA si non connecté */}
      {!user && (
        <div className="mb-6 flex flex-col items-start gap-3 rounded-2xl border border-primary/30 bg-primary/8 px-5 py-4 sm:flex-row sm:items-center">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Aperçu — données fictives</p>
            <p className="text-xs text-muted-foreground">
              Connectez-vous avec GitHub pour voir vos correspondances personnalisées.
            </p>
          </div>
          <Button
            onClick={signInWithGitHub}
            size="sm"
            className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-semibold"
          >
            <LogIn className="h-3.5 w-3.5" />
            Se connecter
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Moteur de Mise en Relation
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground md:text-base">
            Connectez-vous avec les meilleurs talents tech congolais ou trouvez votre prochain projet à fort impact.
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-primary/40 bg-primary/8 text-primary hover:bg-primary/15"
            asChild
          >
            <Link to="/projet/nouveau">
              <Briefcase className="h-4 w-4" />
              Déposer un Projet
            </Link>
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-[0_4px_16px_rgba(78,222,163,0.25)]"
            asChild
          >
            <Link to="/contributeurs">
              <Zap className="h-4 w-4" />
              Trouver un Match
            </Link>
          </Button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-8 lg:grid-cols-2">

        {/* ── Colonne gauche : Projets Actifs ── */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="flex items-center gap-3 text-lg font-semibold text-foreground">
              <Briefcase className="h-5 w-5 text-tertiary" />
              Projets Actifs
            </h2>
            <span className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[11px] font-semibold text-muted-foreground">
              {FEATURED_PROJECTS.length} opportunités
            </span>
          </div>

          {FEATURED_PROJECTS.map((project) => (
            <div
              key={project.id}
              className="glass-panel group relative overflow-hidden rounded-xl border border-white/10 p-6 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_12px_40px_rgba(78,222,163,0.1)]"
            >
              <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-primary/5 transition-transform duration-500 group-hover:scale-110" />

              <div className="relative flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{project.title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{project.location} · {project.type}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${project.priorityClass}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${project.dotClass} animate-pulse`} />
                      {project.priority}
                    </div>
                    {project.openToCollab && (
                      <div className="flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
                        <Handshake className="h-3 w-3" />
                        Ouvert collab.
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="line-clamp-2 text-sm text-muted-foreground">{project.description}</p>

                {/* Tech tags */}
                <div className="flex flex-wrap gap-1.5">
                  {project.techs.map((t) => (
                    <span key={t} className="rounded border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-muted-foreground">
                      {t}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <DollarSign className="h-3.5 w-3.5" />
                    {project.budget}
                  </div>
                  <button className="flex items-center gap-1 text-xs font-medium text-primary transition-transform group-hover:translate-x-0.5">
                    Voir les Détails
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* ── Colonne droite : Recommandations ── */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="flex items-center gap-3 text-lg font-semibold text-foreground">
              <Zap className="h-5 w-5 text-map-accent" />
              Recommandations Intelligentes
            </h2>
            <div className="flex items-center gap-1.5 cursor-pointer text-[11px] text-muted-foreground hover:text-primary transition-colors">
              <TrendingUp className="h-3.5 w-3.5" />
              Filtrer
            </div>
          </div>

          {topMatches.map((match) => (
            <TalentCard key={match.profile.id} match={match} isLoggedIn={!!user} />
          ))}

          {!user && (
            <div className="rounded-xl border border-white/10 bg-white/3 px-5 py-4 text-center">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{mockMatches.length - 6}</span> autres talents visibles après connexion
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function TalentCard({ match, isLoggedIn }: { match: MatchResult; isLoggedIn: boolean }) {
  const { profile, score } = match;

  return (
    <div className="glass-panel group relative overflow-hidden rounded-xl border border-white/10 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_8px_32px_rgba(78,222,163,0.08)]">
      {/* Accent bar on hover */}
      <div className="absolute left-0 top-0 h-full w-0.5 bg-gradient-to-b from-map-accent to-primary opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <Avatar className="h-14 w-14 border-2 border-white/10 transition-colors group-hover:border-primary/40">
            <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
            <AvatarFallback className="bg-primary/20 text-primary font-semibold text-lg">
              {profile.full_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-start justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
              {profile.full_name}
            </h3>
            <div className="flex shrink-0 items-center gap-1 rounded border border-map-accent/30 bg-map-accent/10 px-2 py-0.5 text-[11px] font-bold text-map-accent">
              <Zap className="h-2.5 w-2.5" />
              {score}%
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {ROLE_TYPE_LABELS[profile.role_type]} · {EXPERIENCE_LABELS[profile.experience_level]}
          </p>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {profile.city}
          </div>

          {/* Tech tags */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.tech_stack.slice(0, 3).map((tech) => (
              <span key={tech} className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
        <Badge variant="outline" className={`border-0 text-[10px] px-2 py-0.5 ${profile.open_to_collaboration ? "bg-primary/10 text-primary" : "bg-white/5 text-muted-foreground"}`}>
          {profile.open_to_collaboration ? "Disponible collab." : "Non disponible"}
        </Badge>
        {isLoggedIn ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 border border-white/15 bg-white/5 px-3 text-xs hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
            asChild
          >
            <Link to={`/contributeurs/${profile.username}`}>
              <Users className="h-3 w-3" />
              Se connecter
            </Link>
          </Button>
        ) : (
          <Link to={`/contributeurs/${profile.username}`}>
            <Button size="sm" variant="ghost" className="h-7 gap-1 border border-white/15 bg-white/5 px-3 text-xs hover:border-primary/40 hover:bg-primary/10 hover:text-primary">
              Voir profil
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
