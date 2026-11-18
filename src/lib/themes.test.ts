import { describe, expect, it } from "vitest";
import { autoTheme, resolveTheme } from "./themes";

describe("autoTheme", () => {
  it("Noël en novembre, décembre et janvier", () => {
    expect([11, 12, 1].map((m) => autoTheme(m, null))).toEqual(["noel", "noel", "noel"]);
  });
  it("Minimaliste le reste de l'année sans anniversaire", () => {
    expect(autoTheme(6, null)).toBe("minimaliste");
  });
  it("Anniversaire le mois d'anniversaire et le mois précédent", () => {
    expect(autoTheme(4, 4)).toBe("anniversaire");
    expect(autoTheme(3, 4)).toBe("anniversaire");
    expect(autoTheme(5, 4)).toBe("minimaliste");
    expect(autoTheme(12, 1)).toBe("noel");
    expect(autoTheme(1, 1)).toBe("anniversaire");
  });
  it("un choix manuel l'emporte", () => {
    expect(resolveTheme("minimaliste", 12, null)).toBe("minimaliste");
    expect(resolveTheme("auto", 12, null)).toBe("noel");
  });
});
