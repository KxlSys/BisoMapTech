import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight, Check, X, MapPin, Code, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { updateProfile } from "@/lib/profile-service";
import { CONGO_CITIES, getCityCoordinates } from "@/lib/cities";
import { TECH_OPTIONS, ROLE_TYPE_LABELS, EXPERIENCE_LABELS } from "@/lib/constants";
import type { RoleType, ExperienceLevel } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TECH_CATEGORIES = [
  {
    label: "Frontend",
    techs: ["React", "Vue.js", "Angular", "Next.js", "TypeScript", "Tailwind CSS"],
  },
  {
    label: "Backend & Infrastructure",
    techs: ["Node.js", "Python", "Django", "Go", "Docker", "AWS", "PostgreSQL"],
  },
  {
    label: "Mobile",
    techs: ["Flutter", "React Native", "Swift", "Kotlin"],
  },
  {
    label: "Data & IA",
    techs: ["Machine Learning", "Data Science", "Firebase", "Supabase"],
  },
];

export function OnboardingStepper() {
  const { user, profile, fetchProfile, setIsNewUser } = useAuthStore();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [techSearch, setTechSearch] = useState("");

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [city, setCity] = useState(profile?.city || "Brazzaville");
  const [techStack, setTechStack] = useState<string[]>(profile?.tech_stack || []);
  const [roleType, setRoleType] = useState<RoleType>(profile?.role_type || "fullstack");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    profile?.experience_level || "junior"
  );
  const [openToCollaboration, setOpenToCollaboration] = useState(true);

  const filteredAllTechs = techSearch
    ? TECH_OPTIONS.filter((t) => t.toLowerCase().includes(techSearch.toLowerCase()))
    : null;

  async function handleComplete() {
    if (!user || !fullName || !city || techStack.length === 0) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    setIsSubmitting(true);
    try {
      const coords = getCityCoordinates(city);
      await updateProfile(user.id, {
        full_name: fullName,
        bio,
        city,
        latitude: coords?.latitude || -4.2634,
        longitude: coords?.longitude || 15.2429,
        role_type: roleType,
        experience_level: experienceLevel,
        tech_stack: techStack,
        open_to_collaboration: openToCollaboration,
      });
      await fetchProfile(user.id);
      setIsNewUser(false);
      toast.success("Bienvenue sur BisoMapTech Map !");
      navigate("/");
    } catch {
      toast.error("Erreur lors de la sauvegarde du profil");
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
      {/* ---- LEFT BRANDING PANEL (desktop only) ---- */}
      <div className="relative hidden lg:flex lg:w-5/12 flex-col justify-between overflow-hidden border-r border-white/10 p-12">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-80 w-80 -translate-y-1/3 translate-x-1/3 rounded-full bg-primary/10 blur-[80px]" />
          <div className="absolute bottom-0 left-0 h-64 w-64 translate-y-1/3 -translate-x-1/3 rounded-full bg-primary/5 blur-[80px]" />
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "radial-gradient(oklch(0.82 0.16 155) 1px, transparent 1px)", backgroundSize: "32px 32px" }}
          />
        </div>

        <div className="relative z-10">
          <div className="mb-16 flex items-center gap-2 text-primary">
            <MapPin className="h-5 w-5" />
            <span className="text-lg font-bold tracking-tight text-foreground">BisoMapTech</span>
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            Map your impact.<br />
            <span className="text-primary">Join the ecosystem.</span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground max-w-sm">
            Positionnez-vous dans l'annuaire des talents tech congolais. Construisez votre profil, valorisez votre stack et connectez-vous aux batisseurs de demain.
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
            Rejoignez 2 400+ developpeurs &amp; ingenieurs
          </p>
        </div>
      </div>

      {/* ---- RIGHT FORM PANEL ---- */}
      <div className="flex flex-1 items-start justify-center overflow-y-auto px-4 py-8 sm:px-8 lg:items-center">
        {/* Ambient glow behind form */}
        <div className="pointer-events-none fixed left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[100px]" />

        <div className="relative z-10 w-full max-w-xl">
          {/* Mobile branding */}
          <div className="mb-8 flex items-center gap-2 text-primary lg:hidden">
            <MapPin className="h-5 w-5" />
            <span className="text-base font-bold tracking-tight text-foreground">BisoMapTech</span>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
              Rejoindre <span className="text-primary">l'Ecosysteme</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Positionnez-vous sur la cartographie des talents tech congolais.
            </p>
          </div>

          <div className="glass-panel space-y-6 rounded-2xl border border-white/10 p-6 sm:p-8">
            {/* Photo avatar (decorative — GitHub avatar will be used) */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/8">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Code className="h-3 w-3" />
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Photo depuis GitHub
              </p>
            </div>

            {/* Full name */}
            <div className="space-y-1.5">
              <Label htmlFor="onb-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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

            {/* Role */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Role principal
              </Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {Object.entries(ROLE_TYPE_LABELS).map(([value, label]) => (
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
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Localisation
              </Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Selectionner votre ville..." />
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

            {/* Bio */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="onb-bio" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Bio courte
                </Label>
                <span className="text-[11px] text-muted-foreground/60">{bio.length}/200</span>
              </div>
              <Textarea
                id="onb-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 200))}
                placeholder="Decrivez votre expertise et ce que vous cherchez..."
                rows={3}
                className="bg-white/5 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/30 resize-none"
              />
            </div>

            {/* Tech stack */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Technologies
              </Label>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher frameworks, langages..."
                  value={techSearch}
                  onChange={(e) => setTechSearch(e.target.value)}
                  className="bg-white/5 border-white/10 pl-9 text-sm focus:border-primary focus:ring-1 focus:ring-primary/30"
                />
              </div>

              {/* Selected stack */}
              {techStack.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {techStack.map((tech) => (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => toggleTech(tech)}
                      className="flex items-center gap-1 rounded-md border border-primary/50 bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                    >
                      {tech}
                      <X className="h-2.5 w-2.5 opacity-70" />
                    </button>
                  ))}
                </div>
              )}

              {/* Tech chips */}
              {filteredAllTechs ? (
                <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                  {filteredAllTechs.map((tech) => (
                    <TechChip key={tech} tech={tech} selected={techStack.includes(tech)} onToggle={() => toggleTech(tech)} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {TECH_CATEGORIES.map((cat) => (
                    <div key={cat.label}>
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                        {cat.label}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.techs.map((tech) => (
                          <TechChip key={tech} tech={tech} selected={techStack.includes(tech)} onToggle={() => toggleTech(tech)} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Experience */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Niveau d'experience
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

            {/* Collaboration */}
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
                  <p className={cn("text-sm font-semibold", openToCollaboration ? "text-primary" : "text-foreground")}>
                    Ouvert a la collaboration
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Visible pour des opportunites de projet
                  </p>
                </div>
                <Switch checked={openToCollaboration} onCheckedChange={setOpenToCollaboration} />
              </div>
            </button>

            {/* Divider */}
            <div className="h-px bg-white/10" />

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Retour a la carte
              </button>
              <Button
                onClick={handleComplete}
                disabled={isSubmitting || !fullName || !city || techStack.length === 0}
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
