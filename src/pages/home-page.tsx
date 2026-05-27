import { Link } from "react-router-dom";
import { Users, MapPin, ArrowRight, ShieldCheck, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-10 md:pb-8">
      <div className="pointer-events-none absolute left-1/2 top-24 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/6 blur-[120px]" />

      <div className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          BisoMapTech
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
          L'annuaire vivant des talents tech congolais — trouvez les bonnes personnes, les bons espaces, les bons projets.
        </p>
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="leading-relaxed">
            Pour limiter le spam, les messages privés sont possibles uniquement après acceptation d'une demande de connexion.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-panel rounded-2xl border border-white/10 p-6">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold">Talents</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Carte interactive des développeurs, designers et profils tech en République du Congo.
          </p>
          <div className="mt-5">
            <Link to="/talents">
              <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                Ouvrir la carte
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="glass-panel rounded-2xl border border-white/10 p-6">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-foreground">
            <MapPin className="h-5 w-5 text-tertiary" />
          </div>
          <h2 className="text-xl font-bold">Lieux</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Hubs tech, coworkings, incubateurs et espaces utiles à la communauté.
          </p>
          <div className="mt-5">
            <Link to="/lieux">
              <Button className="gap-2 border border-white/15 bg-white/5 hover:bg-white/8 text-foreground font-semibold">
                Ouvrir la carte
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="glass-panel rounded-2xl border border-white/10 p-6">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-foreground">
            <Handshake className="h-5 w-5 text-violet-400" />
          </div>
          <h2 className="text-xl font-bold">Matching</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Trouvez des collaborateurs, rejoignez des projets ou déposez le vôtre.
          </p>
          <div className="mt-5">
            <Link to="/matching">
              <Button className="gap-2 border border-white/15 bg-white/5 hover:bg-white/8 text-foreground font-semibold">
                Explorer
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
