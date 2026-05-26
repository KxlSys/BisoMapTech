import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  MapPin, Phone, Globe, ArrowLeft, BadgeCheck, Clock,
  MessageCircle, Share2, ExternalLink, AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Place } from "@/types";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const CATEGORY_BADGE: Record<string, string> = {
  "Espace Tech": "bg-indigo-500/15 text-indigo-400 border-indigo-500/25",
  "Coworking": "bg-violet-500/15 text-violet-400 border-violet-500/25",
  "Incubateur / Accélérateur": "bg-purple-500/15 text-purple-400 border-purple-500/25",
  "Formation / Bootcamp": "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
  "Fab Lab": "bg-sky-500/15 text-sky-400 border-sky-500/25",
  "Café": "bg-amber-500/15 text-amber-400 border-amber-500/25",
  "Restaurant": "bg-orange-500/15 text-orange-400 border-orange-500/25",
  "Marché": "bg-lime-500/15 text-lime-400 border-lime-500/25",
  "Pharmacie": "bg-green-500/15 text-green-400 border-green-500/25",
  "Hôpital": "bg-red-500/15 text-red-400 border-red-500/25",
  "École / Université": "bg-blue-500/15 text-blue-400 border-blue-500/25",
  "Opérateur Télécoms": "bg-pink-500/15 text-pink-400 border-pink-500/25",
  "Cybercafé / Point Internet": "bg-teal-500/15 text-teal-400 border-teal-500/25",
  "ONG Tech": "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
};

function getCategoryBadge(c: string) {
  return CATEGORY_BADGE[c] ?? "bg-white/10 text-muted-foreground border-white/15";
}

export function PlaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [place, setPlace] = useState<Place | null>(null);
  const [relatedPlaces, setRelatedPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      if (!id) return;
      setIsLoading(true);
      setFetchError(false);
      try {
        const { data, error } = await supabase
          .from("places")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;

        if (!cancelled) {
          const p = data as Place | null;
          // Non-admin users cannot view pending or rejected places
          if (p && p.status !== "approved" && !isAdmin) {
            setPlace(null);
          } else {
            setPlace(p);
            if (p) {
              const { data: related } = await supabase
                .from("places")
                .select("id,name,category,city")
                .eq("status", "approved")
                .or(`category.eq.${p.category},city.eq.${p.city ?? ""}`)
                .neq("id", p.id)
                .limit(4);
              if (!cancelled) setRelatedPlaces((related ?? []) as Place[]);
            }
          }
        }
      } catch {
        if (!cancelled) setFetchError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [id, isAdmin]);

  async function handleShare() {
    const url = window.location.href;
    const title = place?.name ?? "Lieu BisoMapTech";
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled share dialog
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié dans le presse-papiers");
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-6 md:pb-8">
        <Skeleton className="mb-4 h-5 w-40 rounded-xl" />
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="mt-4 h-32 rounded-2xl" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-6 md:pb-8">
        <Link to="/lieux" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Retour à la carte
        </Link>
        <div className="mt-10 flex flex-col items-center gap-3 py-12 text-center">
          <AlertCircle className="h-8 w-8 text-destructive/70" />
          <p className="text-sm text-muted-foreground">Erreur lors du chargement du lieu.</p>
          <Button size="sm" variant="ghost" onClick={() => navigate(0)} className="border border-white/10">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-6 md:pb-8">
        <Link to="/lieux" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Retour à la carte
        </Link>
        <div className="mt-10 flex flex-col items-center gap-3 py-12 text-center">
          <MapPin className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Lieu introuvable ou non disponible.</p>
          <Link to="/lieux">
            <Button size="sm" variant="ghost" className="border border-white/10">
              Voir tous les lieux
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusLabel =
    place.status === "approved" ? "Validé" : place.status === "pending" ? "En attente" : "Refusé";
  const statusStyle =
    place.status === "approved"
      ? "border-primary/40 bg-primary/10 text-primary"
      : place.status === "pending"
        ? "border-chart-3/40 bg-chart-3/10 text-chart-3"
        : "border-destructive/40 bg-destructive/10 text-destructive";

  const whatsappNumber = place.whatsapp ? place.whatsapp.replace(/\D/g, "") : null;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-6 md:pb-8">
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Fil d'Ariane">
        <Link to="/" className="hover:text-foreground transition-colors">Accueil</Link>
        <span>/</span>
        <Link to="/lieux" className="hover:text-foreground transition-colors">Lieux</Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-[160px]">{place.name}</span>
      </nav>

      <div className="glass-panel rounded-2xl border border-white/10 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight">{place.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={`text-[11px] font-medium border ${getCategoryBadge(place.category)}`}
              >
                {place.category}
              </Badge>
              {isAdmin && (
                <Badge variant="outline" className={`text-[10px] ${statusStyle}`}>
                  {statusLabel}
                </Badge>
              )}
            </div>
          </div>
          <button
            onClick={handleShare}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/8 transition-colors"
            aria-label="Partager ce lieu"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>

        {place.description && (
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{place.description}</p>
        )}

        <div className="mt-6 grid gap-3">
          {(place.city || place.address) && (
            <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-tertiary" />
              <div>
                <p className="text-sm font-medium text-foreground">{place.city || "—"}</p>
                {place.address && <p className="text-xs text-muted-foreground mt-0.5">{place.address}</p>}
              </div>
            </div>
          )}

          {place.phone && (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <Phone className="h-4 w-4 shrink-0 text-primary" />
              <a className="text-sm font-medium text-foreground hover:underline" href={`tel:${place.phone}`}>
                {place.phone}
              </a>
            </div>
          )}

          {whatsappNumber && (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <MessageCircle className="h-4 w-4 shrink-0 text-green-500" />
              <a
                className="text-sm font-medium text-foreground hover:underline"
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
              >
                {place.whatsapp}
              </a>
            </div>
          )}

          {place.website && (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <Globe className="h-4 w-4 shrink-0 text-primary" />
              <a
                className="text-sm font-medium text-foreground hover:underline flex items-center gap-1.5"
                href={place.website}
                target="_blank"
                rel="noreferrer"
              >
                Site web
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
            </div>
          )}
        </div>

        {place.created_at && (
          <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground/60">
            <Clock className="h-3 w-3" />
            Ajouté le {formatDate(place.created_at)}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link to="/lieux">
          <Button variant="ghost" className="border border-white/10 bg-white/5 hover:bg-white/8">
            <MapPin className="mr-2 h-4 w-4 text-tertiary" />
            Voir la carte
          </Button>
        </Link>
        <Link to="/contributeurs">
          <Button variant="ghost" className="border border-white/10 bg-white/5 hover:bg-white/8">
            <BadgeCheck className="mr-2 h-4 w-4 text-primary" />
            Contributeurs
          </Button>
        </Link>
        <Link to="/matching">
          <Button variant="ghost" className="border border-white/10 bg-white/5 hover:bg-white/8 text-tertiary">
            Trouver des collaborateurs
          </Button>
        </Link>
      </div>

      {relatedPlaces.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Lieux similaires
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {relatedPlaces.map((rp) => (
              <Link
                key={rp.id}
                to={`/lieux/${rp.id}`}
                className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/5 px-4 py-3 hover:bg-white/8 transition-colors"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-tertiary" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{rp.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {rp.category}{rp.city ? ` · ${rp.city}` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
