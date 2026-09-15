import { Link } from "react-router-dom";
import { ArrowRight, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProfileCompletion, type CompletionInput } from "@/lib/profile-completion";

/**
 * Bandeau de complétion du profil, affiché à son propriétaire.
 *
 * Il annonce ce que le manque coûte, pas un pourcentage abstrait : on complète
 * quand on comprend qu'on est invisible, pas quand on lit « 60 % ».
 */
export function ProfileCompletionBanner({ profile }: { profile: CompletionInput }) {
  const { missing, percent, isComplete } = getProfileCompletion(profile);

  if (isComplete) return null;

  const first = missing[0];
  const others = missing.slice(1);

  return (
    <section
      aria-label="Complétion de votre profil"
      className="mb-6 overflow-hidden rounded-2xl border border-primary/25 bg-primary/8"
    >
      <div
        className="h-1 bg-primary transition-all duration-500"
        style={{ width: `${percent}%` }}
        role="presentation"
      />

      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {first.label} {missing.length > 1 ? "et d'autres éléments manquent" : "manque"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {first.consequence}
          </p>

          {others.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {others.map((item) => (
                <li
                  key={item.id}
                  className="rounded-full border border-white/12 bg-white/5 px-2.5 py-0.5 text-[11px] text-muted-foreground"
                >
                  {item.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {percent}%
          </span>
          <Link to="/profil/edit">
            <Button
              size="sm"
              className="gap-2 bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Compléter
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
