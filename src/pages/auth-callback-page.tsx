import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth-store";
import { getCityCoordinates } from "@/lib/cities";

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

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { fetchProfile, setIsNewUser } = useAuthStore();

  useEffect(() => {
    async function handleCallback() {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        } else {
          const tokenPair = readTokensFromHash();
          if (tokenPair) {
            await supabase.auth.setSession(tokenPair);
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          navigate("/login", { replace: true });
          return;
        }

        const userId = session.user.id;
        const metadata = session.user.user_metadata;

        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", userId)
          .maybeSingle();

        if (!existing) {
          const username = metadata.user_name || metadata.preferred_username || `user_${userId.slice(0, 8)}`;
          const cityCoords = getCityCoordinates("Brazzaville");

          await supabase.from("profiles").insert({
            id: userId,
            username,
            full_name: metadata.full_name || metadata.name || username,
            avatar_url: metadata.avatar_url || "",
            bio: metadata.bio || "",
            city: "Brazzaville",
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

          setIsNewUser(true);
          await fetchProfile(userId);
          navigate("/onboarding", { replace: true });
          return;
        }

        await fetchProfile(userId);
        navigate("/", { replace: true });
      } catch (error) {
        console.error("Erreur callback OAuth:", error);
        navigate("/login", { replace: true });
      }
    }

    handleCallback();
  }, [navigate, fetchProfile, setIsNewUser]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <Spinner className="mx-auto h-8 w-8" />
        <p className="mt-4 text-sm text-muted-foreground">Connexion en cours...</p>
      </div>
    </div>
  );
}
