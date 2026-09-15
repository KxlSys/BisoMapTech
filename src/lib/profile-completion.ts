// ======================================================
// COMPLÉTION DE PROFIL
// ------------------------------------------------------
// Un profil incomplet n'est pas seulement moins joli : il sort des filtres et
// des suggestions. Chaque manque est donc formulé par sa conséquence, pas par
// un pourcentage abstrait.
// ======================================================

export interface CompletionInput {
  full_name?: string | null;
  bio?: string | null;
  city?: string | null;
  avatar_url?: string | null;
  github_url?: string | null;
  tech_stack?: string[] | null;
  role_type?: string | null;
}

export interface MissingField {
  /** Identifiant stable, utilisé comme clé de rendu et dans les tests. */
  id: "tech_stack" | "bio" | "city" | "avatar_url" | "github_url";
  label: string;
  /** Ce que l'absence coûte concrètement à la personne. */
  consequence: string;
  /** Un manque bloquant prive de visibilité, les autres affaiblissent le profil. */
  blocking: boolean;
}

export interface CompletionResult {
  missing: MissingField[];
  /** Part des champs renseignés, de 0 à 100. */
  percent: number;
  isComplete: boolean;
}

const MIN_BIO_LENGTH = 30;

function isFilled(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Liste ce qui manque à un profil, du plus coûteux au moins coûteux.
 *
 * L'ordre compte : la première ligne est celle que l'on met en avant dans le
 * bandeau, les autres suivent.
 */
export function getProfileCompletion(profile: CompletionInput): CompletionResult {
  const missing: MissingField[] = [];

  const techCount = (profile.tech_stack ?? []).filter((t) => isFilled(t)).length;
  if (techCount === 0) {
    missing.push({
      id: "tech_stack",
      label: "Vos technologies",
      consequence:
        "Sans elles, vous n'apparaissez dans aucune recherche par compétence.",
      blocking: true,
    });
  }

  if (!isFilled(profile.city)) {
    missing.push({
      id: "city",
      label: "Votre ville",
      consequence: "Sans ville, votre profil ne peut pas être placé sur la carte.",
      blocking: true,
    });
  }

  if (!isFilled(profile.bio) || (profile.bio ?? "").trim().length < MIN_BIO_LENGTH) {
    missing.push({
      id: "bio",
      label: "Une bio",
      consequence:
        "C'est ce qu'on lit avant de vous écrire, et ce qui s'affiche quand on partage votre profil.",
      blocking: false,
    });
  }

  if (!isFilled(profile.avatar_url)) {
    missing.push({
      id: "avatar_url",
      label: "Une photo",
      consequence: "Un profil avec photo est bien plus souvent contacté.",
      blocking: false,
    });
  }

  if (!isFilled(profile.github_url)) {
    missing.push({
      id: "github_url",
      label: "Votre GitHub",
      consequence: "Vos dépôts publics enrichissent automatiquement votre profil.",
      blocking: false,
    });
  }

  const TOTAL_CHECKS = 5;
  const percent = Math.round(((TOTAL_CHECKS - missing.length) / TOTAL_CHECKS) * 100);

  return {
    missing,
    percent,
    isComplete: missing.length === 0,
  };
}
