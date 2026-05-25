import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Save,
  RefreshCw,
  User,
  MapPin,
  Code,
  Briefcase,
  GitBranch,
  Image as ImageIcon,
  AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth-store";
import { upsertProfile } from "@/lib/profile-service";
import { CONGO_CITIES, getCityCoordinates } from "@/lib/cities";
import {
  TECH_CATEGORIES,
  ROLE_TYPE_LABELS,
  EXPERIENCE_LABELS,
  DB_ROLE_TYPES,
} from "@/lib/constants";
import type { RoleType, ExperienceLevel } from "@/types";
import { supabase } from "@/lib/supabase";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { toast } from "sonner";

const profileSchema = z.object({
  full_name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères"),
  bio: z.string().max(500, "La bio ne peut pas dépasser 500 caractères"),
  city: z.string().min(1, "Veuillez sélectionner une ville"),
  role_type: z.enum(DB_ROLE_TYPES),
  experience_level: z.enum(["junior", "mid", "senior"]),
  tech_stack: z
    .array(z.string())
    .min(1, "Sélectionnez au moins une technologie"),
  open_to_collaboration: z.boolean(),
  avatar_url: z.string(),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type DbRoleType = (typeof DB_ROLE_TYPES)[number];

function isDbRoleType(value: string): value is DbRoleType {
  return DB_ROLE_TYPES.includes(value as DbRoleType);
}

export function ProfileEditPage() {
  const { user, profile, profileLoaded, profileError, fetchProfile, setProfile } =
    useAuthStore();
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      bio: "",
      city: "",
      role_type: "fullstack",
      experience_level: "junior",
      tech_stack: [],
      open_to_collaboration: true,
      avatar_url: "",
    },
  });

  const techStack = watch("tech_stack");
  const bio = watch("bio");
  const avatarUrl = watch("avatar_url");
  const fullName = watch("full_name");

  useEffect(() => {
    if (!user && profileLoaded) {
      navigate("/");
      return;
    }
    if (profile) {
      const safeRoleType = isDbRoleType(profile.role_type) ? profile.role_type : "autre";
      setValue("full_name", profile.full_name ?? "");
      setValue("bio", profile.bio ?? "");
      setValue("city", profile.city ?? "");
      setValue("role_type", safeRoleType);
      setValue("experience_level", profile.experience_level ?? "junior");
      setValue("tech_stack", profile.tech_stack ?? []);
      setValue("open_to_collaboration", profile.open_to_collaboration ?? true);
      setValue("avatar_url", profile.avatar_url ?? "");
    }
  }, [user, profile, profileLoaded, navigate, setValue]);

  async function onSubmit(data: ProfileFormData) {
    if (!user) return;
    try {
      const coords = getCityCoordinates(data.city);
      const metadata = user.user_metadata ?? {};
      const username =
        profile?.username ||
        metadata.user_name ||
        metadata.preferred_username ||
        `user_${user.id.slice(0, 8)}`;

      // Use upsert: if a previous OAuth-callback insert silently failed, we
      // recover transparently instead of swallowing the save.
      await upsertProfile(user.id, {
        username,
        full_name: data.full_name,
        bio: data.bio,
        city: data.city,
        latitude: coords?.latitude || 0,
        longitude: coords?.longitude || 0,
        role_type: data.role_type as RoleType,
        experience_level: data.experience_level as ExperienceLevel,
        tech_stack: data.tech_stack,
        open_to_collaboration: data.open_to_collaboration,
        avatar_url: data.avatar_url,
      });
      toast.success("Profil mis à jour avec succès");
      await fetchProfile(user.id);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur lors de la sauvegarde du profil";
      console.error("Erreur SQL update profiles (profile edit):", error);
      toast.error(message);
    }
  }

  async function handleSyncRepos() {
    if (!profile?.username) return;
    try {
      const { error } = await supabase.functions.invoke("sync-github-repos", {
        body: { username: profile.username, profile_id: profile.id },
      });
      if (!error) {
        toast.success("Repositories GitHub synchronisés");
      } else {
        toast.error("Erreur lors de la synchronisation");
      }
    } catch {
      toast.error("Erreur de connexion");
    }
  }

  if (!user) return null;

  // Initial load — show skeleton while waiting for the very first fetch.
  if (!profileLoaded) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-6 md:pb-8">
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  // Profile is loaded but missing (RLS, network, etc.). Surface an actionable
  // panel instead of staying on the skeleton forever.
  if (!profile) {
    return (
      <div className="mx-auto max-w-md px-4 pt-10">
        <div className="glass-panel rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-center">
          <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-amber-400" />
          <h1 className="text-base font-semibold text-foreground">
            Profil indisponible
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {profileError
              ? `Nous n'avons pas pu charger votre profil : ${profileError}`
              : "Votre profil n'a pas encore été initialisé."}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button
              onClick={() => fetchProfile(user.id)}
              variant="ghost"
              className="border border-white/15 bg-white/5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Réessayer
            </Button>
            <Button
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link to="/onboarding">Configurer le profil</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6 md:pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Mon Profil
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mettez à jour vos informations pour apparaître sur la carte.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Avatar */}
        <section className="glass-panel rounded-2xl border border-white/10 p-5">
          <div className="mb-4 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Photo de profil
            </h2>
          </div>
          <AvatarUploader
            userId={user.id}
            value={avatarUrl}
            fallbackText={fullName || profile.full_name}
            onUploaded={(url) => {
              setValue("avatar_url", url, { shouldDirty: true });
              // Optimistically update the global profile so the navbar avatar
              // refreshes without waiting for the next fetch.
              setProfile({ ...profile, avatar_url: url });
            }}
            onCleared={() => {
              setValue("avatar_url", "", { shouldDirty: true });
              setProfile({ ...profile, avatar_url: "" });
            }}
          />
        </section>

        {/* Identity */}
        <section className="glass-panel rounded-2xl border border-white/10 p-5">
          <div className="mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Identité
            </h2>
          </div>

          <div className="space-y-4">
            <Controller
              name="full_name"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-xs text-muted-foreground uppercase tracking-wider">
                    Nom complet
                  </Label>
                  <Input
                    id="fullName"
                    {...field}
                    placeholder="Votre nom complet"
                    aria-invalid={!!errors.full_name}
                    className="bg-white/5 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/30"
                  />
                  {errors.full_name && (
                    <p className="text-xs text-destructive">{errors.full_name.message}</p>
                  )}
                </div>
              )}
            />

            <Controller
              name="bio"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label htmlFor="bio" className="text-xs text-muted-foreground uppercase tracking-wider">
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    {...field}
                    placeholder="Parlez-nous de vous, vos projets, vos ambitions..."
                    rows={3}
                    aria-invalid={!!errors.bio}
                    className="bg-white/5 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/30 resize-none"
                  />
                  <div className="flex items-center justify-between">
                    {errors.bio && (
                      <p className="text-xs text-destructive">{errors.bio.message}</p>
                    )}
                    <p className="ml-auto text-xs text-muted-foreground/60">
                      {bio?.length || 0}/500
                    </p>
                  </div>
                </div>
              )}
            />
          </div>
        </section>

        {/* Location + Role */}
        <section className="glass-panel rounded-2xl border border-white/10 p-5">
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Localisation & Rôle
            </h2>
          </div>

          <div className="space-y-4">
            <Controller
              name="city"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Ville</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      aria-invalid={!!errors.city}
                      className="bg-white/5 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/30"
                    >
                      <SelectValue placeholder="Choisir une ville" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONGO_CITIES.map((c) => (
                        <SelectItem key={c.name} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.city && (
                    <p className="text-xs text-destructive">{errors.city.message}</p>
                  )}
                </div>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="role_type"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                      Type de rôle
                    </Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-white/5 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DB_ROLE_TYPES.map((value) => (
                          <SelectItem key={value} value={value}>
                            {ROLE_TYPE_LABELS[value]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />

              <Controller
                name="experience_level"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                      Niveau d'expérience
                    </Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-white/5 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EXPERIENCE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
            </div>
          </div>
        </section>

        {/* Technologies — grouped by category so non-web disciplines are visible */}
        <section className="glass-panel rounded-2xl border border-white/10 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Code className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Technologies
            </h2>
            {techStack.length > 0 && (
              <span className="ml-auto rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                {techStack.length} sélectionnée{techStack.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="max-h-72 space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-white/3 p-3">
            {TECH_CATEGORIES.map((cat) => (
              <div key={cat.id}>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {cat.label}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {cat.techs.map((tech) => {
                    const isSelected = techStack.includes(tech);
                    return (
                      <Badge
                        key={tech}
                        variant="outline"
                        className={`cursor-pointer select-none text-xs transition-all ${
                          isSelected
                            ? "border-primary/60 bg-primary/15 text-primary hover:bg-primary/20"
                            : "border-white/15 bg-white/5 text-muted-foreground hover:border-white/25 hover:text-foreground"
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            setValue(
                              "tech_stack",
                              techStack.filter((t) => t !== tech),
                              { shouldValidate: true, shouldDirty: true }
                            );
                          } else {
                            setValue("tech_stack", [...techStack, tech], {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }
                        }}
                      >
                        {tech}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {errors.tech_stack && (
            <p className="mt-1.5 text-xs text-destructive">
              {errors.tech_stack.message as string}
            </p>
          )}
        </section>

        {/* Preferences */}
        <section className="glass-panel rounded-2xl border border-white/10 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Préférences
            </h2>
          </div>

          <Controller
            name="open_to_collaboration"
            control={control}
            render={({ field }) => (
              <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/3 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Ouvert à la collaboration
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Apparaître avec un indicateur vert sur la carte
                  </p>
                </div>
                <Switch id="collab" checked={field.value} onCheckedChange={field.onChange} />
              </div>
            )}
          />
        </section>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-[0_4px_20px_oklch(0.82_0.16_155/25%)]"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? "Sauvegarde..." : "Sauvegarder les modifications"}
          </Button>

          {profile.github_url && (
            <Button
              type="button"
              onClick={handleSyncRepos}
              className="gap-2 border border-white/15 bg-white/5 hover:bg-white/8 hover:border-white/25 text-foreground"
            >
              <GitBranch className="h-4 w-4" />
              <span className="hidden sm:inline">Sync repos</span>
              <RefreshCw className="h-4 w-4 sm:hidden" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
