import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ArrowRight,
  Check,
  X,
  MapPin,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DebouncedInput } from "@/components/ui/debounced-input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/auth-store";
import { upsertProfile } from "@/lib/profile-service";
import { CONGO_CITIES, getCityCoordinates } from "@/lib/cities";
import {
  TECH_CATEGORIES,
  TECH_OPTIONS,
  ROLE_TYPE_LABELS,
  EXPERIENCE_LABELS,
  DB_ROLE_TYPES,
} from "@/lib/constants";
import type { RoleType, ExperienceLevel } from "@/types";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DRAFT_KEY_PREFIX = "bisomap.onboarding.draft.";

interface OnboardingDraft {
  fullName: string;
  bio: string;
  city: string;
  techStack: string[];
  roleType: RoleType;
  experienceLevel: ExperienceLevel;
  openToCollaboration: boolean;
  avatarUrl: string;
}

function isDbRoleType(value: string): value is (typeof DB_ROLE_TYPES)[number] {
  return DB_ROLE_TYPES.includes(value as (typeof DB_ROLE_TYPES)[number]);
}

function loadDraft(userId: string): Partial<OnboardingDraft> | null {
  try {
    const raw = localStorage.getItem(`${DRAFT_KEY_PREFIX}${userId}`);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<OnboardingDraft>;
  } catch {
    return null;
  }
}



export function OnboardingStepper() {
  const { user, profile, fetchProfile, setProfile, setIsNewUser } = useAuthStore();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [techSearch, setTechSearch] = useState("");


  const draft = useMemo(() => (user ? loadDraft(user.id) : null), [user]);

  const DRAFT_KEY = `onboarding_draft_${user?.id}`;

  const [fullName, setFullName] = useState(() => {
    const draft = localStorage.getItem(`${DRAFT_KEY}_fullName`);
    return draft !== null ? draft : (profile?.full_name || "");
  });

  const [bio, setBio] = useState(() => {
    const draft = localStorage.getItem(`${DRAFT_KEY}_bio`);
    return draft !== null ? draft : (profile?.bio || "");
  });

  const [city, setCity] = useState(() => {
    const draft = localStorage.getItem(`${DRAFT_KEY}_city`);
    return draft !== null ? draft : (profile?.city || "Brazzaville");
  });

  const [techStack, setTechStack] = useState<string[]>(() => {
    const draft = localStorage.getItem(`${DRAFT_KEY}_techStack`);
    return draft !== null ? JSON.parse(draft) : (profile?.tech_stack || []);
  });

  const [roleType, setRoleType] = useState<RoleType>(() => {
    const draft = localStorage.getItem(`${DRAFT_KEY}_roleType`);
    if (draft && isDbRoleType(draft)) return draft as RoleType;
    return profile?.role_type && isDbRoleType(profile.role_type) ? profile.role_type : "fullstack";
  });

  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(() => {
    const draft = localStorage.getItem(`${DRAFT_KEY}_experienceLevel`);
    return (draft as ExperienceLevel) || profile?.experience_level || "junior";
  });

  const [openToCollaboration, setOpenToCollaboration] = useState(() => {
    const draft = localStorage.getItem(`${DRAFT_KEY}_openToCollaboration`);
    return draft !== null ? draft === "true" : true;
  });

  const [avatarUrl, setAvatarUrl] = useState(() => {
    const draft = localStorage.getItem(`${DRAFT_KEY}_avatarUrl`);
    return draft !== null ? draft : (profile?.avatar_url || "");
  });

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(`${DRAFT_KEY}_fullName`, fullName);
    localStorage.setItem(`${DRAFT_KEY}_bio`, bio);
    localStorage.setItem(`${DRAFT_KEY}_city`, city);
    localStorage.setItem(`${DRAFT_KEY}_techStack`, JSON.stringify(techStack));
    localStorage.setItem(`${DRAFT_KEY}_roleType`, roleType);
    localStorage.setItem(`${DRAFT_KEY}_experienceLevel`, experienceLevel);
    localStorage.setItem(`${DRAFT_KEY}_openToCollaboration`, String(openToCollaboration));
    localStorage.setItem(`${DRAFT_KEY}_avatarUrl`, avatarUrl);
  }, [user, fullName, bio, city, techStack, roleType, experienceLevel, openToCollaboration, avatarUrl]);

  // ⚡ Bolt: Memoize the filtered technologies list to prevent unnecessary O(N) array filtering allocations on every render
  const filteredAllTechs = useMemo<string[] | null>(() => {
    if (!techSearch) return null;
    const searchLower = techSearch.toLowerCase();
    return TECH_OPTIONS.filter((t) => t.toLowerCase().includes(searchLower));
  }, [techSearch]);

  const canSubmit = !!fullName.trim() && !!city && techStack.length > 0;

  async function handleComplete() {
    if (!user) return;
    if (!canSubmit) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const coords = getCityCoordinates(city);
      const metadata = user.user_metadata ?? {};
      const username =
        profile?.username ||
        metadata.user_name ||
        metadata.preferred_username ||
        `user_${user.id.slice(0, 8)}`;

      await upsertProfile(user.id, {
        username,
        full_name: fullName.trim(),
        bio: bio.trim(),
        city,
        latitude: coords?.latitude || -4.2634,
        longitude: coords?.longitude || 15.2429,
        role_type: roleType,
        experience_level: experienceLevel,
        tech_stack: techStack,
        open_to_collaboration: openToCollaboration,
        avatar_url: avatarUrl,
      });
      const refreshed = await fetchProfile(user.id);
      if (refreshed) setProfile(refreshed);
      setIsNewUser(false);

      localStorage.removeItem(`${DRAFT_KEY}_fullName`);
      localStorage.removeItem(`${DRAFT_KEY}_bio`);
      localStorage.removeItem(`${DRAFT_KEY}_city`);
      localStorage.removeItem(`${DRAFT_KEY}_techStack`);
      localStorage.removeItem(`${DRAFT_KEY}_roleType`);
      localStorage.removeItem(`${DRAFT_KEY}_experienceLevel`);
      localStorage.removeItem(`${DRAFT_KEY}_openToCollaboration`);
      localStorage.removeItem(`${DRAFT_KEY}_avatarUrl`);

      toast.success("Bienvenue sur BisoMapTech !");
      navigate(`/contributeurs/${username}`, { replace: true });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erreur lors de la sauvegarde du profil";
      console.error("Erreur SQL update profiles (onboarding):", error);
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleTech(tech: string) {
    if (techStack.includes(tech)) {
      setTechStack(techStack.filter((t) => t !== tech));
    } else {
      setTechStack([...techStack, tech]);
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden lg:flex lg:w-5/12 flex-col justify-between overflow-hidden border-r border-white/10 p-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-80 w-80 -translate-y-1/3 translate-x-1/3 rounded-full bg-primary/10 blur-[80px]" />
          <div className="absolute bottom-0 left-0 h-64 w-64 translate-y-1/3 -translate-x-1/3 rounded-full bg-primary/5 blur-[80px]" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(oklch(0.82 0.16 155) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        <div className="relative z-10">
          <div className="mb-16 flex items-center gap-2 text-primary">
            <MapPin className="h-5 w-5" />
            <span className="text-lg font-bold tracking-tight text-foreground">
              BisoMapTech
            </span>
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            Map your impact.
            <br />
            <span className="text-primary">Join the ecosystem.</span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground max-w-sm">
            Positionnez-vous dans l'annuaire des développeurs de la République du Congo.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="flex -space-x-3">
            {["JD", "MK", "AL"].map((initials, i) => (
              <div
                key={i}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-primary/20 text-xs font-bold text-primary"
              >
                {initials}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Rejoignez 2 400+ développeurs &amp; ingénieurs
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-start justify-center overflow-y-auto px-4 py-8 sm:px-8 lg:items-center">
        <div className="pointer-events-none fixed left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[100px]" />

        <div className="relative z-10 w-full max-w-xl">
          <div className="mb-8 flex items-center gap-2 text-primary lg:hidden">
            <MapPin className="h-5 w-5" />
            <span className="text-base font-bold tracking-tight text-foreground">
              BisoMapTech
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
              Rejoindre <span className="text-primary">l'écosystème</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Positionnez-vous sur la cartographie des développeurs de la République du Congo.
            </p>
            {draft && (
              <p className="mt-1 text-[11px] text-muted-foreground/70">
                Brouillon restauré automatiquement.
              </p>
            )}
          </div>

          <div className="glass-panel space-y-6 rounded-2xl border border-white/10 p-6 sm:p-8">
            {user && (
              <div className="flex flex-col items-center">
                <AvatarUploader
                  userId={user.id}
                  value={avatarUrl}
                  fallbackText={fullName || profile?.full_name || profile?.username}
                  caption={
                    avatarUrl ? "Photo personnalisée" : "Importez ou utilisez votre photo GitHub"
                  }
                  onUploaded={(url) => setAvatarUrl(url)}
                  onCleared={() => setAvatarUrl("")}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label
                htmlFor="onb-name"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Nom complet
              </Label>
              <Input
                id="onb-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Lumumba Tech"
                className="bg-white/5 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Rôle principal
              </Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {DB_ROLE_TYPES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRoleType(value as RoleType)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-center text-xs font-medium transition-all",
                      roleType === value
                        ? "border-primary/60 bg-primary/15 text-primary"
                        : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground"
                    )}
                  >
                    {ROLE_TYPE_LABELS[value]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Localisation
              </Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Sélectionner votre ville..." />
                </SelectTrigger>
                <SelectContent>
                  {CONGO_CITIES.map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="onb-bio"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Bio courte
                </Label>
                <span className="text-[11px] text-muted-foreground/60">
                  {bio.length}/200
                </span>
              </div>
              <Textarea
                id="onb-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 200))}
                placeholder="Décrivez votre expertise et ce que vous cherchez..."
                rows={3}
                className="bg-white/5 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/30 resize-none"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Technologies
              </Label>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                {/* ⚡ Bolt: Use DebouncedInput to prevent unnecessary re-renders of the entire form while typing */}
                <DebouncedInput
                  placeholder="Rechercher : Linux, Cisco, Pentest, Python, AWS, Flutter..."
                  value={techSearch}
                  onChange={setTechSearch}
                  className="bg-white/5 border-white/10 pl-9 text-sm focus:border-primary focus:ring-1 focus:ring-primary/30"
                />
              </div>

              {techStack.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {techStack.map((tech) => (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => toggleTech(tech)}
                      aria-label={`Supprimer ${tech}`}
                      className="flex items-center gap-1 rounded-md border border-primary/50 bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    >
                      {tech}
                      <X className="h-2.5 w-2.5 opacity-70" />
                    </button>
                  ))}
                </div>
              )}

              {filteredAllTechs ? (
                <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
                  {filteredAllTechs.map((tech) => (
                    <TechChip
                      key={tech}
                      tech={tech}
                      selected={techStack.includes(tech)}
                      onToggle={() => toggleTech(tech)}
                    />
                  ))}
                  {filteredAllTechs.length === 0 && (
                    <p className="text-xs text-muted-foreground/70">
                      Aucune technologie trouvée.
                    </p>
                  )}
                </div>
              ) : (
                <div className="max-h-72 space-y-3 overflow-y-auto rounded-lg border border-white/10 bg-white/3 p-3">
                  {TECH_CATEGORIES.map((cat) => (
                    <div key={cat.id}>
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                        {cat.label}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.techs.map((tech) => (
                          <TechChip
                            key={tech}
                            tech={tech}
                            selected={techStack.includes(tech)}
                            onToggle={() => toggleTech(tech)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Niveau d'expérience
              </Label>
              <div className="flex gap-2">
                {Object.entries(EXPERIENCE_LABELS).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setExperienceLevel(value as ExperienceLevel)}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                      experienceLevel === value
                        ? "border-primary/60 bg-primary/15 text-primary"
                        : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpenToCollaboration(!openToCollaboration)}
              className={cn(
                "w-full rounded-xl border p-4 text-left transition-all",
                openToCollaboration
                  ? "border-primary/50 bg-primary/8"
                  : "border-white/10 bg-white/5 hover:border-white/20"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      openToCollaboration ? "text-primary" : "text-foreground"
                    )}
                  >
                    Ouvert à la collaboration
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Visible pour des opportunités de projet
                  </p>
                </div>
                <Switch
                  checked={openToCollaboration}
                  onCheckedChange={setOpenToCollaboration}
                />
              </div>
            </button>

            {!canSubmit && (
              <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-300">
                {!fullName.trim() && <p>• Renseignez votre nom complet</p>}
                {!city && <p>• Choisissez votre ville</p>}
                {techStack.length === 0 && (
                  <p>• Sélectionnez au moins une technologie</p>
                )}
              </div>
            )}

            {submitError && (
              <div
                role="alert"
                className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">Sauvegarde impossible</p>
                    <p className="mt-0.5 text-destructive/80">{submitError}</p>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Votre saisie est conservée localement, vous pouvez réessayer
                  sans perdre vos données.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleComplete}
                  disabled={isSubmitting}
                  className="self-start gap-1 border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15"
                >
                  <RefreshCw className="h-3 w-3" />
                  Réessayer
                </Button>
              </div>
            )}

            <div className="h-px bg-white/10" />

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Retour à la carte
              </button>
              <Button
                onClick={handleComplete}
                disabled={isSubmitting || !canSubmit}
                className="gap-2 bg-primary text-primary-foreground font-semibold shadow-[0_4px_20px_rgba(78,222,163,0.3)] hover:bg-primary/90 hover:shadow-[0_6px_28px_rgba(78,222,163,0.4)] disabled:opacity-40"
              >
                {isSubmitting ? "Sauvegarde..." : "Initialiser le profil"}
                {!isSubmitting && <ArrowRight className="h-4 w-4" />}
                {isSubmitting && <Check className="h-4 w-4 animate-spin" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TechChip({
  tech,
  selected,
  onToggle,
}: {
  tech: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all",
        selected
          ? "border-primary/60 bg-primary/20 text-primary shadow-[0_0_6px_rgba(78,222,163,0.15)]"
          : "border-white/15 bg-white/5 text-muted-foreground hover:border-white/25 hover:text-foreground"
      )}
    >
      {tech}
    </button>
  );
}
