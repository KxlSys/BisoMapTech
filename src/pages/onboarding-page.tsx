import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";
import { useEffect } from "react";

export function OnboardingPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) return null;

  return <OnboardingStepper />;
}
