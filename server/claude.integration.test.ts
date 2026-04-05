import { describe, it, expect } from "vitest";
import { parseStructuredTags, buildSystemPrompt, selectModel } from "./services/claudeService";
// Note: ENV dépendances mockées via vitest

// ─── Test parseStructuredTags ─────────────────────────────────────
describe("parseStructuredTags", () => {
  it("extrait les PLACES correctement", () => {
    const content = `Voici mes recommandations :
:::PLACES:::[{"name":"Le Grand Véfour","type":"restaurant","city":"Paris","country":"France","rating":4.9,"description":"Bijou du Palais-Royal","priceRange":"€€€€€"}]:::END:::
:::QR:::🍽️ Voir plus | ✨ Surprends-moi:::END:::`;

    const result = parseStructuredTags(content);
    expect(result.places).toHaveLength(1);
    expect(result.places![0].name).toBe("Le Grand Véfour");
    expect(result.qr).toHaveLength(2);
    expect(result.cleanMessage).not.toContain(":::PLACES:::");
    expect(result.cleanMessage).not.toContain(":::QR:::");
  });

  it("extrait les BOOKING correctement", () => {
    const content = `:::BOOKING:::{"name":"Hôtel Costes","phone":"+33 1 42 44 50 25","options":["self","assistant","concierge","baymora"]}:::END:::`;
    const result = parseStructuredTags(content);
    expect(result.booking).toHaveLength(1);
    expect(result.booking![0].options).toHaveLength(4);
  });

  it("extrait les GCAL correctement", () => {
    const content = `:::GCAL:::{"title":"Dîner Guy Savoy","date":"2026-07-20","time":"20:30","location":"Paris"}:::END:::`;
    const result = parseStructuredTags(content);
    expect(result.gcal).toHaveLength(1);
    expect(result.gcal![0].title).toBe("Dîner Guy Savoy");
  });

  it("extrait le JOURNEY correctement", () => {
    const content = `:::JOURNEY:::{"from":"Paris","to":"Nice","duration":"5h30","steps":[{"mode":"TGV","from":"Paris Gare de Lyon","to":"Nice Ville","duration":"5h30"}]}:::END:::`;
    const result = parseStructuredTags(content);
    expect(result.journey).toBeTruthy();
    expect(result.journey!.steps).toHaveLength(1);
  });

  it("extrait le PLAN correctement", () => {
    const content = `:::PLAN:::{"destination":"Paris","dates":"15-18 juillet","travelers":2,"hotels":[{"name":"Hôtel de Crillon"}]}:::END:::`;
    const result = parseStructuredTags(content);
    expect(result.plan).toBeTruthy();
    expect(result.plan!.destination).toBe("Paris");
  });

  it("nettoie le message de tous les tags", () => {
    const content = `Voici votre programme ✨\n:::PLACES:::[{"name":"Test","type":"hotel","city":"Paris","description":"Test"}]:::END:::Bonne journée !`;
    const result = parseStructuredTags(content);
    expect(result.cleanMessage).not.toContain(":::PLACES:::");
    expect(result.cleanMessage).not.toContain(":::QR:::");
    expect(result.cleanMessage).toContain("Voici votre programme");
    expect(result.cleanMessage).toContain("Bonne journée");
  });
});

// ─── Test buildSystemPrompt ───────────────────────────────────────
describe("buildSystemPrompt", () => {
  it("génère un system prompt non vide", () => {
    const prompt = buildSystemPrompt();
    expect(prompt.length).toBeGreaterThan(1000);
    expect(prompt).toContain("Baymora");
    expect(prompt).toContain("PROFIL A");
    expect(prompt).toContain(":::PLACES:::");
    expect(prompt).toContain(":::QR:::");
  });

  it("intègre le profil client dans le prompt", () => {
    const prompt = buildSystemPrompt({
      name: "Jean",
      homeCity: "Paris",
      preferences: [{ category: "cuisine", key: "type", value: "gastronomique" }],
    });
    expect(prompt).toContain("Jean");
    expect(prompt).toContain("Paris");
    expect(prompt).toContain("gastronomique");
  });
});

// ─── Test routing modèle ─────────────────────────────────────────
describe("Routing modèle Claude", () => {
  it("utilise Opus pour les 5 premiers messages", () => {
    expect(selectModel(1, "bonjour")).toBe("claude-opus-4-5");
    expect(selectModel(5, "ok")).toBe("claude-opus-4-5");
  });

  it("utilise Sonnet pour les messages courts après le 5e", () => {
    expect(selectModel(6, "ok")).toBe("claude-sonnet-4-5");
    expect(selectModel(10, "merci")).toBe("claude-sonnet-4-5");
  });

  it("utilise Opus pour les triggers complexes", () => {
    expect(selectModel(6, "surprends-moi avec un week-end")).toBe("claude-opus-4-5");
    expect(selectModel(8, "organise un itinéraire complet")).toBe("claude-opus-4-5");
  });

  it("le system prompt contient les règles de routing", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("PROACTIVITÉ");
    expect(prompt).toContain("ANTI-RÉPÉTITION");
  });
});
