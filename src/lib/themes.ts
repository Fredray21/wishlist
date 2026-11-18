export type Theme = "noel" | "anniversaire" | "minimaliste";

export const THEME_LABELS: Record<Theme, string> = {
  noel: "Noël",
  anniversaire: "Anniversaire",
  minimaliste: "Minimaliste",
};

export function parseBirthdayMonth(value: string | undefined): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 12 ? n : null;
}

/**
 * Thème (toujours automatique) selon le mois (1-12) :
 * - mois d'anniversaire → Anniversaire (prioritaire) ;
 * - novembre, décembre, janvier → Noël ;
 * - mois précédant l'anniversaire → Anniversaire ;
 * - sinon → Minimaliste.
 */
export function autoTheme(month: number, birthdayMonth: number | null): Theme {
  if (birthdayMonth && month === birthdayMonth) return "anniversaire";
  if (month === 11 || month === 12 || month === 1) return "noel";
  if (birthdayMonth && month === ((birthdayMonth + 10) % 12) + 1) return "anniversaire";
  return "minimaliste";
}

/** Mois courant à Paris (le serveur tourne en UTC). */
export function currentMonth(now = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-US", { month: "numeric", timeZone: "Europe/Paris" }).format(now));
}
