import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth-store";
import { upsertProfile, fetchProfileById } from "@/lib/profile-service";
import { getCityCoordinates, resolveCityId } from "@/lib/cities";
import type { Profile } from "@/types";

function readTokensFromHash() {
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;

  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (!accessToken || !refreshToken) {
    return null;
  }

  return { access_token: accessToken, refresh_token: refreshToken };
}

/** A profile is "complete" once the user filled in the onboarding fields. */
function isOnboardingComplete(profile: Profile | null): boolean {
  if (!profile) return false;
  if (!profile.full_name?.trim()) return false;
  if (!profile.tech_stack || profile.tech_stack.length === 0) return false;
  return true;
}

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { setProfile, setIsNewUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else {
          const tokenPair = readTokensFromHash();
          if (tokenPair) {
            const { error: setError } = await supabase.auth.setSession(tokenPair);
            if (setError) throw setError;
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          if (!cancelled) navigate("/login", { replace: true });
          return;
        }

        const userId = session.user.id;
        const metadata = session.user.user_metadata ?? {};

        // Try to load the existing profile first.
        let profile = await fetchProfileById(userId);

        if (!profile) {
          // Fresh account — seed a row with the GitHub metadata. Using upsert
          // (instead of insert) means we recover gracefully if a previous
          // attempt half-succeeded.
          const username =
            metadata.user_name ||
            metadata.preferred_username ||
            `user_${userId.slice(0, 8)}`;
          const cityCoords = getCityCoordinates("Brazzaville");
          const cityId = await resolveCityId("Brazzaville");

          await upsertProfile(userId, {
            username,
            // `email` is NOT NULL in production — always populate from the
            // OAuth session to avoid the "null value violates NOT NULL" error.
            email: session.user.email ?? metadata.email ?? "",
            full_name: metadata.full_name || metadata.name || username,
            avatar_url: metadata.avatar_url || "",
            bio: metadata.bio || "",
            city: "Brazzaville",
            city_id: cityId,
            latitude: cityCoords?.latitude || -4.2634,
            longitude: cityCoords?.longitude || 15.2429,
            github_url: metadata.user_name
              ? `https://github.com/${metadata.user_name}`
              : "",
            tech_stack: [],
            role_type: "fullstack",
            experience_level: "junior",
            open_to_collaboration: true,
            role: "contributor",
          });

          profile = await fetchProfileById(userId);
        }

        if (cancelled) return;

        if (profile) setProfile(profile);

        if (!isOnboardingComplete(profile)) {
          setIsNewUser(true);
          navigate("/onboarding", { replace: true });
        } else {
          setIsNewUser(false);
          navigate("/", { replace: true });
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erreur lors de la connexion.";
        console.error("Erreur callback OAuth:", err);
        if (!cancelled) setError(message);
      }
    }

    handleCallback();
    return () => {
      cancelled = true;
    };
  }, [navigate, setProfile, setIsNewUser]);

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="glass-panel max-w-md rounded-2xl border border-destructive/30 p-6 text-center">
          <h1 className="text-lg font-bold text-destructive">Connexion impossible</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Vérifiez votre connexion réseau ou réessayez. Si le problème persiste,
            contactez un administrateur.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button asChild variant="ghost" className="border border-white/15 bg-white/5">
              <Link to="/login">Retour à la connexion</Link>
            </Button>
            <Button onClick={() => window.location.reload()} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <Spinner className="mx-auto h-8 w-8" />
        <p className="mt-4 text-sm text-muted-foreground">Connexion en cours...</p>
      </div>
    </div>
  );
}
