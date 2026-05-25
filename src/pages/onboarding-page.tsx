import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";
import { Spinner } from "@/components/ui/spinner";

export function OnboardingPage() {
  const { user, profileLoaded } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect once we know for sure the user is unauthenticated.
    // Without this check we'd briefly redirect during auth bootstrap.
    if (profileLoaded && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, profileLoaded, navigate]);

  if (!profileLoaded) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Spinner className="h-8 w-8" />
        <p className="text-sm text-muted-foreground">Chargement de votre session...</p>
      </div>
    );
  }

  if (!user) return null;

  return <OnboardingStepper />;
}
