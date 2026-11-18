import { describe, expect, it } from "vitest";
import { parseOg } from "./og";
import { hashCode, isValidCode, matchesHash } from "./reservation";
import { validateItemInput } from "./validation";

describe("validateItemInput", () => {
  it("valide un article complet", () => {
    const r = validateItemInput({ title: " Livre ", price: "12,50", priority: "idee", url: "https://ex.com/a" }, false);
    expect(r.ok && r.value).toMatchObject({ title: "Livre", price: 12.5, priority: "idee", category: "Divers" });
  });
  it("refuse les URL non http(s) et les priorités inconnues", () => {
    expect(validateItemInput({ title: "x", url: "javascript:alert(1)" }, false).ok).toBe(false);
    expect(validateItemInput({ title: "x", priority: "urgent" }, false).ok).toBe(false);
  });
  it("en mode partiel, ne touche qu'aux champs fournis", () => {
    const r = validateItemInput({ note: "hello" }, true);
    expect(r.ok && r.value).toEqual({ note: "hello" });
  });
});

describe("codes de réservation", () => {
  it("vérifie le code par article", () => {
    expect(isValidCode("0420")).toBe(true);
    expect(isValidCode("42")).toBe(false);
    expect(matchesHash(hashCode("a", "1234"), hashCode("a", "1234"))).toBe(true);
    expect(matchesHash(hashCode("a", "1234"), hashCode("b", "1234"))).toBe(false);
  });
});

describe("parseOg", () => {
  it("extrait titre, image relative et prix", () => {
    const html = `<html><head>
      <meta content="Super casque &amp; co" property="og:title">
      <meta property="og:image" content="/img/casque.jpg" />
      <meta property="product:price:amount" content="129,99" />
    </head></html>`;
    expect(parseOg(html, "https://shop.example/p/1")).toEqual({
      title: "Super casque & co",
      imageUrl: "https://shop.example/img/casque.jpg",
      price: 129.99,
    });
  });
});

describe("cleanTitle", () => {
  it("nettoie les titres Amazon", async () => {
    const { cleanTitle } = await import("./og");
    expect(cleanTitle("Enemy For A Brain: Beth, Zara: 9781068391804: Amazon.com: Books")).toBe("Enemy For A Brain — Beth, Zara");
    expect(cleanTitle("Amazon.fr : LEGO Technic Koenigsegg Jesko")).toBe("LEGO Technic Koenigsegg Jesko");
  });
  it("retire le nom de la boutique en suffixe", async () => {
    const { cleanTitle } = await import("./og");
    expect(cleanTitle("Casque Sony WH-1000XM5 | Fnac", "Fnac")).toBe("Casque Sony WH-1000XM5");
    expect(cleanTitle("Mug isotherme - Ma Boutique", "Ma Boutique")).toBe("Mug isotherme");
    expect(cleanTitle("Super produit")).toBe("Super produit");
  });
});
