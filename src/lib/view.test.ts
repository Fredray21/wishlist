import { describe, expect, it } from "vitest";
import type { StoredItem } from "./types";
import { toPublicItem } from "./view";

const reserved: StoredItem = {
  id: "a",
  title: "Casque",
  category: "High-tech",
  priority: "envie",
  received: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  reservation: { name: "Léa", note: "secret", codeHash: "x", tokenHash: "y", createdAt: "2026-01-02T00:00:00.000Z" },
};

describe("toPublicItem (anti-spoiler)", () => {
  it("n'émet jamais la clé reserved pour l'admin", () => {
    const view = toPublicItem(reserved, true);
    expect("reserved" in view).toBe(false);
    expect(JSON.stringify(view)).not.toMatch(/reserv|Léa|secret|codeHash|tokenHash/i);
  });

  it("indique seulement un booléen aux visiteurs, sans détails", () => {
    const view = toPublicItem(reserved, false);
    expect(view.reserved).toBe(true);
    expect(JSON.stringify(view)).not.toMatch(/Léa|secret|codeHash|tokenHash/);
  });

  it("un article reçu n'est jamais marqué réservé", () => {
    expect(toPublicItem({ ...reserved, received: true }, false).reserved).toBe(false);
  });
});
