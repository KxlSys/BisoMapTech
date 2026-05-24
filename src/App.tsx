import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/store/auth-store";

const HomePage = lazy(() =>
  import("@/pages/home-page").then((m) => ({ default: m.HomePage }))
);
const MapPage = lazy(() =>
  import("@/pages/map-page").then((m) => ({ default: m.MapPage }))
);
const PlacesPage = lazy(() =>
  import("@/pages/places-page").then((m) => ({ default: m.PlacesPage }))
);
const PlaceCreatePage = lazy(() =>
  import("@/pages/place-create-page").then((m) => ({ default: m.PlaceCreatePage }))
);
const PlaceDetailPage = lazy(() =>
  import("@/pages/place-detail-page").then((m) => ({ default: m.PlaceDetailPage }))
);
const ContributorsPage = lazy(() =>
  import("@/pages/contributors-page").then((m) => ({ default: m.ContributorsPage }))
);
const ProfileDetailPage = lazy(() =>
  import("@/pages/profile-detail-page").then((m) => ({ default: m.ProfileDetailPage }))
);
const ProfileEditPage = lazy(() =>
  import("@/pages/profile-edit-page").then((m) => ({ default: m.ProfileEditPage }))
);
const MatchingPage = lazy(() =>
  import("@/pages/matching-page").then((m) => ({ default: m.MatchingPage }))
);
const AdminPage = lazy(() =>
  import("@/pages/admin-page").then((m) => ({ default: m.AdminPage }))
);
const AuthCallbackPage = lazy(() =>
  import("@/pages/auth-callback-page").then((m) => ({ default: m.AuthCallbackPage }))
);
const LoginPage = lazy(() =>
  import("@/pages/login-page").then((m) => ({ default: m.LoginPage }))
);
const OnboardingPage = lazy(() =>
  import("@/pages/onboarding-page").then((m) => ({ default: m.OnboardingPage }))
);
const MessagesPage = lazy(() =>
  import("@/pages/messages-page").then((m) => ({ default: m.MessagesPage }))
);
const AboutPage = lazy(() =>
  import("@/pages/about-page").then((m) => ({ default: m.AboutPage }))
);
const ProjectNewPage = lazy(() =>
  import("@/pages/project-new-page").then((m) => ({ default: m.ProjectNewPage }))
);

function LoadingFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

export default function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="/talents" element={<MapPage />} />
            <Route path="/lieux" element={<PlacesPage />} />
            <Route path="/lieux/nouveau" element={<PlaceCreatePage />} />
            <Route path="/lieux/:id" element={<PlaceDetailPage />} />
            <Route path="/contributeurs" element={<ContributorsPage />} />
            <Route path="/contributeurs/:username" element={<ProfileDetailPage />} />
            <Route path="/profil/edit" element={<ProfileEditPage />} />
            <Route path="/matching" element={<MatchingPage />} />
            <Route path="/projet/nouveau" element={<ProjectNewPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/a-propos" element={<AboutPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
