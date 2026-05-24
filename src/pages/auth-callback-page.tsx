import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth-store";
import { getCityCoordinates } from "@/lib/cities";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { fetchProfile, setIsNewUser } = useAuthStore();

  useEffect(() => {
    async function handleCallback() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate("/");
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
        navigate("/onboarding");
        return;
      }

      await fetchProfile(userId);
      navigate("/");
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
