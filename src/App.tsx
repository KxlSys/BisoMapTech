import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Spinner } from "@/components/ui/spinner";
import { AppErrorBoundary } from "@/components/error/app-error-boundary";
import {
  isSupabaseConfigured,
  supabaseConfigStatus,
} from "@/lib/supabase";
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

function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 pb-24 pt-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <MapPin className="h-7 w-7 text-muted-foreground/40" />
      </div>
      <h1 className="text-xl font-bold text-foreground">Page introuvable</h1>
      <p className="text-sm text-muted-foreground">
        Cette adresse n'existe pas ou a été déplacée.
      </p>
      <Link
        to="/"
        className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-foreground hover:bg-white/8 transition-colors"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}

export default function App() {
  const { initialize, isLoading, authError } = useAuthStore();

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }
    const initAuth = () => {
      initialize();
      sessionStorage.removeItem("lazy-retry-refreshed");
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(initAuth);
    } else {
      setTimeout(initAuth, 100);
    }
  }, [initialize]);

  const showSupabaseDebug =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("supabase-debug");

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-2xl font-bold">
          Configuration manquante
        </h1>
        <p className="text-sm text-muted-foreground">
          Configuration Supabase invalide en production. Vérifie les variables Vercel
          <code className="mx-1 rounded bg-white/10 px-1 py-0.5">VITE_SUPABASE_URL</code>
          (ou
          <code className="mx-1 rounded bg-white/10 px-1 py-0.5">SUPABASE_URL</code>) et
          <code className="mx-1 rounded bg-white/10 px-1 py-0.5">VITE_SUPABASE_ANON_KEY</code>
          /
          <code className="mx-1 rounded bg-white/10 px-1 py-0.5">VITE_SUPABASE_PUBLISHABLE_KEY</code>
          (ou
          <code className="mx-1 rounded bg-white/10 px-1 py-0.5">SUPABASE_ANON_KEY</code> /
          <code className="mx-1 rounded bg-white/10 px-1 py-0.5">SUPABASE_PUBLISHABLE_KEY</code>)
          puis redéploie.
        </p>
        <ul className="mt-2 list-disc space-y-1 text-left text-xs text-muted-foreground">
          <li>URL présente: {supabaseConfigStatus.hasUrl ? "oui" : "non"}</li>
          <li>URL valide: {supabaseConfigStatus.isValidSupabaseUrl ? "oui" : "non"}</li>
          <li>Anon key présente: {supabaseConfigStatus.hasAnonKey ? "oui" : "non"}</li>
          <li>Anon key valide: {supabaseConfigStatus.isValidAnonKey ? "oui" : "non"}</li>
          <li>Source URL: {supabaseConfigStatus.urlSource}</li>
          <li>Source clé: {supabaseConfigStatus.anonKeySource}</li>
          <li>URL injectée: {supabaseConfigStatus.urlPreview}</li>
          {supabaseConfigStatus.urlHasUnexpectedPath && (
            <li className="text-amber-300">
              Attention: l'URL contient un path (ex. <code>/rest/v1</code>). Mets uniquement <code>https://&lt;ref&gt;.supabase.co</code>, supabase-js ajoute lui-même <code>/auth/v1</code>, <code>/rest/v1</code>, etc.
            </li>
          )}
          <li>Clé injectée: {supabaseConfigStatus.anonKeyPreview}</li>
          <li>Build mode: {supabaseConfigStatus.buildMode} (PROD={String(supabaseConfigStatus.isProd)})</li>
        </ul>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingFallback />;
  }

  return (
    <AppErrorBoundary>
      <BrowserRouter>
        {showSupabaseDebug && (
          <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-left text-xs text-amber-200">
            <strong>[supabase-debug]</strong> url={supabaseConfigStatus.urlPreview} | source-url=
            {supabaseConfigStatus.urlSource} | key={supabaseConfigStatus.anonKeyPreview} | source-key=
            {supabaseConfigStatus.anonKeySource} | mode={supabaseConfigStatus.buildMode} | prod=
            {String(supabaseConfigStatus.isProd)}
          </div>
        )}
        {authError && (
          <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-xs text-destructive">
            Session indisponible pour le moment ({authError}). Mode invite actif.
          </div>
        )}
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
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
