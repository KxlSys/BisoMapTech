import { Link } from "react-router-dom";
import {
  UserPlus,
  Clock,
  Check,
  X,
  MessageSquare,
  UserMinus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConnection } from "@/hooks/use-connection";
import { toast } from "sonner";

interface ConnectionActionsProps {
  targetId: string;
  targetUsername: string;
  isLoggedIn: boolean;
  /** Compact = mobile layout (smaller, no secondary disconnect button). */
  compact?: boolean;
}

export function ConnectionActions({
  targetId,
  targetUsername,
  isLoggedIn,
  compact = false,
}: ConnectionActionsProps) {
  const { state, loading, busy, request, accept, remove } = useConnection(
    isLoggedIn ? targetId : undefined
  );

  if (!isLoggedIn) {
    return (
      <Button
        size="sm"
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        asChild
      >
        <Link to="/login">Se connecter pour contacter</Link>
      </Button>
    );
  }

  if (state === "self") return null;

  const size = compact ? "h-9 text-xs" : "text-xs";

  if (loading) {
    return (
      <Button size="sm" disabled className={`flex-1 gap-1.5 ${size}`}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Chargement…
      </Button>
    );
  }

  async function handle(action: () => Promise<void>, success: string) {
    try {
      await action();
      toast.success(success);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  }

  switch (state) {
    case "none":
      return (
        <Button
          size="sm"
          disabled={busy}
          onClick={() => handle(request, "Demande de connexion envoyée")}
          className={`w-full gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold ${size}`}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
          Se connecter
        </Button>
      );

    case "pending_outgoing":
      return (
        <div className="flex w-full gap-2">
          <Button
            size="sm"
            variant="ghost"
            disabled
            className={`flex-1 gap-1.5 border border-white/15 bg-white/5 ${size}`}
          >
            <Clock className="h-3.5 w-3.5" />
            Demande envoyée
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => handle(remove, "Demande annulée")}
            className={`gap-1.5 text-muted-foreground hover:text-destructive ${size}`}
          >
            Annuler
          </Button>
        </div>
      );

    case "pending_incoming":
      return (
        <div className="flex w-full gap-2">
          <Button
            size="sm"
            disabled={busy}
            onClick={() => handle(accept, "Connexion acceptée")}
            className={`flex-1 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold ${size}`}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Accepter
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => handle(remove, "Demande refusée")}
            className={`gap-1.5 border border-white/15 bg-white/5 hover:text-destructive ${size}`}
          >
            <X className="h-3.5 w-3.5" />
            Refuser
          </Button>
        </div>
      );

    case "connected":
      return (
        <div className="flex w-full gap-2">
          <Button
            size="sm"
            className={`flex-1 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold ${size}`}
            asChild
          >
            <Link to={`/messages?to=${targetUsername}`}>
              <MessageSquare className="h-3.5 w-3.5" />
              Envoyer un message
            </Link>
          </Button>
          {!compact && (
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => handle(remove, "Vous êtes déconnecté de ce membre")}
              title="Se déconnecter"
              className={`gap-1.5 border border-white/15 bg-white/5 hover:text-destructive ${size}`}
            >
              <UserMinus className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      );

    default:
      return null;
  }
}
