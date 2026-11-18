export const THEME_CHOICES = ["auto", "noel", "anniversaire", "minimaliste"] as const;
export type ThemeChoice = (typeof THEME_CHOICES)[number];
export type Theme = Exclude<ThemeChoice, "auto">;

export const THEME_LABELS: Record<ThemeChoice, string> = {
  auto: "Auto",
  noel: "Noël",
  anniversaire: "Anniversaire",
  minimaliste: "Minimaliste",
};

export const THEME_STORAGE_KEY = "wishlist:theme";

export function parseBirthdayMonth(value: string | undefined): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 12 ? n : null;
}

/**
 * Thème automatique selon le mois (1-12) :
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

export function resolveTheme(choice: ThemeChoice, month: number, birthdayMonth: number | null): Theme {
  return choice === "auto" ? autoTheme(month, birthdayMonth) : choice;
}

/** Script exécuté avant l'hydratation pour appliquer le thème sans flash. */
export function themeBootScript(birthdayMonth: number | null): string {
  return `(function(){try{var b=${birthdayMonth ?? "null"};var c=localStorage.getItem(${JSON.stringify(
    THEME_STORAGE_KEY,
  )})||"auto";var m=new Date().getMonth()+1;var t=c;if(["noel","anniversaire","minimaliste"].indexOf(c)<0){t=b&&m===b?"anniversaire":(m===11||m===12||m===1)?"noel":(b&&m===((b+10)%12)+1)?"anniversaire":"minimaliste";}document.documentElement.dataset.theme=t;}catch(e){}})();`;
}
