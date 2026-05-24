import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { Spinner } from "@/components/ui/spinner";
import { AppErrorBoundary } from "@/components/error/app-error-boundary";
import { useAuthStore } from "@/store/auth-store";

function lazyWithRetry<T>(
  importer: () => Promise<T>
) {
  return async () => {
    try {
      return await importer();
    } catch (error) {
      const isChunkError =
        error instanceof Error &&
        /loading chunk|failed to fetch dynamically imported module/i.test(
          error.message
        );

      const alreadyRefreshed =
        sessionStorage.getItem(
          "lazy-retry-refreshed"
        ) === "1";

      if (isChunkError && !alreadyRefreshed) {
        sessionStorage.setItem(
          "lazy-retry-refreshed",
          "1"
        );
        window.location.reload();
      }

      throw error;
    }
  };
}

const HomePage = lazy(
  lazyWithRetry(() =>
    import("@/pages/home-page").then((m) => ({ default: m.HomePage }))
  )
);
const MapPage = lazy(
  lazyWithRetry(() =>
    import("@/pages/map-page").then((m) => ({ default: m.MapPage }))
  )
);
const PlacesPage = lazy(
  lazyWithRetry(() =>
    import("@/pages/places-page").then((m) => ({ default: m.PlacesPage }))
  )
);
const PlaceCreatePage = lazy(
  lazyWithRetry(() =>
    import("@/pages/place-create-page").then((m) => ({ default: m.PlaceCreatePage }))
  )
);
const PlaceDetailPage = lazy(
  lazyWithRetry(() =>
    import("@/pages/place-detail-page").then((m) => ({ default: m.PlaceDetailPage }))
  )
);
const ContributorsPage = lazy(
  lazyWithRetry(() =>
    import("@/pages/contributors-page").then((m) => ({ default: m.ContributorsPage }))
  )
);
const ProfileDetailPage = lazy(
  lazyWithRetry(() =>
    import("@/pages/profile-detail-page").then((m) => ({ default: m.ProfileDetailPage }))
  )
);
const ProfileEditPage = lazy(
  lazyWithRetry(() =>
    import("@/pages/profile-edit-page").then((m) => ({ default: m.ProfileEditPage }))
  )
);
const MatchingPage = lazy(
  lazyWithRetry(() =>
    import("@/pages/matching-page").then((m) => ({ default: m.MatchingPage }))
  )
);
const AdminPage = lazy(
  lazyWithRetry(() =>
    import("@/pages/admin-page").then((m) => ({ default: m.AdminPage }))
  )
);
const AuthCallbackPage = lazy(
  lazyWithRetry(() =>
    import("@/pages/auth-callback-page").then((m) => ({ default: m.AuthCallbackPage }))
  )
);
const LoginPage = lazy(
  lazyWithRetry(() =>
    import("@/pages/login-page").then((m) => ({ default: m.LoginPage }))
  )
);
const OnboardingPage = lazy(
  lazyWithRetry(() =>
    import("@/pages/onboarding-page").then((m) => ({ default: m.OnboardingPage }))
  )
);
const MessagesPage = lazy(
  lazyWithRetry(() =>
    import("@/pages/messages-page").then((m) => ({ default: m.MessagesPage }))
  )
);
const AboutPage = lazy(
  lazyWithRetry(() =>
    import("@/pages/about-page").then((m) => ({ default: m.AboutPage }))
  )
);
const ProjectNewPage = lazy(
  lazyWithRetry(() =>
    import("@/pages/project-new-page").then((m) => ({ default: m.ProjectNewPage }))
  )
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
    sessionStorage.removeItem(
      "lazy-retry-refreshed"
    );
  }, [initialize]);

  return (
    <AppErrorBoundary>
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
    </AppErrorBoundary>
  );
}
