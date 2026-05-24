import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X, Rocket, FileText, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";
import { TECH_OPTIONS } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const BUDGET_OPTIONS = [
  "< 500$ / mois",
  "500$ – 1 500$ / mois",
  "1 500$ – 3 000$ / mois",
  "3 000$ – 5 000$ / mois",
  "5 000$+ / mois",
  "Equity uniquement",
  "Equity + Salaire",
  "Contrat / TJM",
  "Bénévolat",
];

const DURATION_OPTIONS = [
  "< 1 mois",
  "1 – 3 mois",
  "3 – 6 mois",
  "6 – 12 mois",
  "Long terme (1 an+)",
  "Indéterminé",
];

const COLLAB_OPTIONS = ["Remote", "Présentiel", "Hybride"];

export function ProjectNewPage() {
  const { user, signInWithGitHub } = useAuthStore();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [techInput, setTechInput] = useState("");
  const [budget, setBudget] = useState("");
  const [duration, setDuration] = useState("");
  const [collab, setCollab] = useState("Remote");
  const [openToCollab, setOpenToCollab] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function addTech(tech: string) {
    const t = tech.trim();
    if (t && !techStack.includes(t)) {
      setTechStack([...techStack, t]);
    }
    setTechInput("");
  }

  function removeTech(tech: string) {
    setTechStack(techStack.filter((t) => t !== tech));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Titre et description sont requis.");
      return;
    }
    setIsSubmitting(true);
    // Simulate async submission
    await new Promise((r) => setTimeout(r, 800));
    setIsSubmitting(false);
    toast.success("Projet publié ! Les talents correspondants seront notifiés.", {
      description: `"${title}" est désormais visible dans le moteur de matching.`,
      duration: 5000,
    });
    navigate("/matching");
  }

  // Not logged in — show auth gate
  if (!user) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-6 px-4 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
          <Rocket className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Déposer un Projet</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connectez-vous pour publier votre projet et être mis en relation avec les meilleurs talents tech congolais.
          </p>
        </div>
        <Button
          onClick={signInWithGitHub}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
        >
          <LogIn className="h-4 w-4" />
          Se connecter avec GitHub
        </Button>
        <Link to="/matching" className="text-xs text-muted-foreground hover:text-primary transition-colors">
          Retour au matching
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-6 md:pb-8">
      {/* Back */}
      <Link to="/matching">
        <Button variant="ghost" size="sm" className="mb-6 gap-2 text-muted-foreground hover:text-foreground hover:bg-white/5">
          <ArrowLeft className="h-4 w-4" />
          Retour au Matching
        </Button>
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Déposer un Nouveau Projet
        </h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          Définissez vos besoins pour être mis en relation avec les talents tech spécialisés de l'écosystème congolais.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className="glass-panel relative overflow-hidden rounded-2xl border border-white/10 p-6 md:p-8">
          {/* Ambient glow */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />

          {/* Section 1 — Core Details */}
          <div className="relative z-10 mb-8 border-b border-white/8 pb-8">
            <h2 className="mb-5 text-base font-semibold text-muted-foreground">
              Informations Générales
            </h2>
            <div className="flex flex-col gap-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground" htmlFor="project_title">
                  Titre du Projet <span className="text-primary">*</span>
                </label>
                <Input
                  id="project_title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ex : Plateforme Mobile Fintech Congo"
                  className="border-white/10 bg-white/5 focus:border-primary focus:ring-1 focus:ring-primary/30"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground" htmlFor="project_description">
                  Description <span className="text-primary">*</span>
                </label>
                <textarea
                  id="project_description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Décrivez le problème à résoudre, la solution envisagée, et le profil attendu du talent..."
                  className="w-full resize-y rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2 — Technical & Scope */}
          <div className="relative z-10 mb-8 border-b border-white/8 pb-8">
            <h2 className="mb-5 text-base font-semibold text-muted-foreground">
              Stack Technique & Portée
            </h2>
            <div className="flex flex-col gap-5">
              {/* Tech stack tag input */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Technologies Requises
                </label>
                <div
                  className="min-h-[52px] w-full cursor-text rounded-lg border border-white/10 bg-white/5 p-2.5 transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30"
                >
                  <div className="flex flex-wrap gap-1.5">
                    {techStack.map((tech) => (
                      <span
                        key={tech}
                        className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                      >
                        {tech}
                        <button
                          type="button"
                          onClick={() => removeTech(tech)}
                          className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      value={techInput}
                      onChange={(e) => setTechInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); addTech(techInput); }
                        if (e.key === "," || e.key === " ") { e.preventDefault(); addTech(techInput); }
                      }}
                      placeholder={techStack.length === 0 ? "Tapez une technologie et appuyez sur Entrée..." : "Ajouter..."}
                      className="min-w-[160px] flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                  </div>
                </div>
                {/* Quick-add chips */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {TECH_OPTIONS.slice(0, 10).filter(t => !techStack.includes(t)).map((tech) => (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => addTech(tech)}
                      className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                    >
                      <Plus className="h-2.5 w-2.5" />
                      {tech}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {/* Budget */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground" htmlFor="budget">
                    Budget
                  </label>
                  <select
                    id="budget"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                  >
                    <option value="" className="bg-background">Sélectionner...</option>
                    {BUDGET_OPTIONS.map((b) => (
                      <option key={b} value={b} className="bg-background">{b}</option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground" htmlFor="duration">
                    Durée Estimée
                  </label>
                  <select
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                  >
                    <option value="" className="bg-background">Sélectionner...</option>
                    {DURATION_OPTIONS.map((d) => (
                      <option key={d} value={d} className="bg-background">{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 — Collaboration Preferences */}
          <div className="relative z-10">
            <h2 className="mb-5 text-base font-semibold text-muted-foreground">
              Préférences de Collaboration
            </h2>
            <div className="flex flex-col gap-5">
              {/* Collab mode chips */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-foreground">
                  Mode de Travail
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLLAB_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setCollab(opt)}
                      className={cn(
                        "rounded-full border px-4 py-1.5 text-xs font-medium transition-all",
                        collab === opt
                          ? "border-primary/50 bg-primary/15 text-primary shadow-[0_0_8px_rgba(78,222,163,0.15)]"
                          : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Open to collaboration toggle */}
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Ouvert à la collaboration</p>
                  <p className="text-xs text-muted-foreground">Votre projet apparaîtra dans le moteur de matching</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenToCollab(!openToCollab)}
                  className={cn(
                    "relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border-2 transition-colors",
                    openToCollab ? "border-primary bg-primary" : "border-white/20 bg-white/10"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                      openToCollab ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Form actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            className="gap-2 border border-white/10 bg-white/5 hover:bg-white/8 sm:w-auto"
            onClick={() => {
              toast.info("Brouillon sauvegardé.");
            }}
          >
            <FileText className="h-4 w-4" />
            Sauvegarder le Brouillon
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !title.trim() || !description.trim()}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-[0_4px_16px_rgba(78,222,163,0.25)] sm:w-auto"
          >
            <Rocket className="h-4 w-4" />
            {isSubmitting ? "Publication..." : "Publier le Projet"}
          </Button>
        </div>
      </form>
    </div>
  );
}
