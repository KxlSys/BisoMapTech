import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin, Phone, Globe, ArrowLeft, BadgeCheck, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Place } from "@/types";
import { useAuthStore } from "@/store/auth-store";

export function PlaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuthStore();
  const [place, setPlace] = useState<Place | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      if (!id) return;
      setIsLoading(true);
      const { data } = await supabase.from("places").select("*").eq("id", id).maybeSingle();
      if (!cancelled) {
        setPlace((data ?? null) as Place | null);
        setIsLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-6 md:pb-8">
        <Skeleton className="mb-4 h-8 w-48 rounded-xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  if (!place) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-6 md:pb-8">
        <Link to="/lieux" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
        <p className="mt-6 text-sm text-muted-foreground">Lieu introuvable</p>
      </div>
    );
  }

  const isAdmin = profile?.role === "admin";
  const statusLabel =
    place.status === "approved" ? "Validé" : place.status === "pending" ? "En attente" : "Refusé";
  const statusStyle =
    place.status === "approved"
      ? "border-primary/40 bg-primary/10 text-primary"
      : place.status === "pending"
        ? "border-chart-3/40 bg-chart-3/10 text-chart-3"
        : "border-destructive/40 bg-destructive/10 text-destructive";

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-6 md:pb-8">
      <Link to="/lieux" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Retour à la carte
      </Link>

      <div className="mt-4 glass-panel rounded-2xl border border-white/10 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{place.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{place.category}</p>
          </div>
          {isAdmin && (
            <Badge variant="outline" className={`text-[10px] ${statusStyle}`}>
              {statusLabel}
            </Badge>
          )}
        </div>

        {place.description && (
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{place.description}</p>
        )}

        <div className="mt-6 grid gap-3">
          {(place.city || place.address) && (
            <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <MapPin className="mt-0.5 h-4 w-4 text-tertiary" />
              <div>
                <p className="text-sm font-medium text-foreground">{place.city || "—"}</p>
                {place.address && <p className="text-xs text-muted-foreground">{place.address}</p>}
              </div>
            </div>
          )}

          {place.phone && (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <Phone className="h-4 w-4 text-primary" />
              <a className="text-sm font-medium text-foreground hover:underline" href={`tel:${place.phone}`}>
                {place.phone}
              </a>
            </div>
          )}

          {place.website && (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <Globe className="h-4 w-4 text-primary" />
              <a className="text-sm font-medium text-foreground hover:underline" href={place.website} target="_blank" rel="noreferrer">
                Site web
              </a>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/lieux">
            <Button variant="ghost" className="border border-white/10 bg-white/5 hover:bg-white/8">
              <BadgeCheck className="mr-2 h-4 w-4 text-tertiary" />
              Voir d'autres lieux
            </Button>
          </Link>
          {place.status === "pending" && !isAdmin && (
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-muted-foreground">
              <Clock className="h-4 w-4" />
              En attente de validation
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
