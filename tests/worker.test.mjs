import test from "node:test";
import assert from "node:assert/strict";
import { fallbackPlan, scoreCandidate } from "../worker/index.ts";

test("buyer demand plan creates compact queries without echoing the brief", () => {
  const plan = fallbackPlan({ target: "buyer", mode: "demand", product: "日本産の冷凍水産物と加工食品", geographies: ["Thailand", "Singapore"], companyTypes: ["food importer", "foodservice distributor"], triggers: ["new supplier"], exclusions: "" });
  assert.equal(plan.target, "buyer");
  assert.equal(plan.mode, "demand");
  assert.ok(plan.search_phrases.every((query) => query.length < 180));
  assert.ok(plan.search_phrases.some((query) => query.includes("looking for a supplier")));
});

test("company map does not claim current demand", () => {
  const plan = fallbackPlan({ target: "buyer", mode: "map", product: "Japanese frozen food", geographies: ["Thailand"], companyTypes: ["food importer"], triggers: [], exclusions: "" });
  assert.match(plan.evidence_required, /現在の需要は未確認/);
  assert.ok(plan.search_phrases.every((query) => !query.includes("looking for a supplier")));
});

test("buyer demand ranking rejects supplier promotion and accepts a sourcing signal", () => {
  const plan = fallbackPlan({ target: "buyer", mode: "demand", product: "Japanese seafood", geographies: ["Thailand"], companyTypes: [], triggers: [], exclusions: "" });
  assert.ok(scoreCandidate("Bangkok restaurant is looking for a supplier", "We need a supplier to import Japanese frozen scallops for our Thailand locations.", plan) >= 10);
  assert.ok(scoreCandidate("Japanese seafood supplier", "We supply frozen food globally.", plan) < 4);
});

test("buyer demand ranking rejects procurement commentary without a live product request", () => {
  const plan = fallbackPlan({ target: "buyer", mode: "demand", product: "日本産の冷凍水産物", geographies: ["東南アジア"], companyTypes: [], triggers: [], exclusions: "" });
  assert.equal(scoreCandidate("Procurement Beyond Buying", "Supply Chain & Procurement Professional | Strategic Sourcing | Food & Beverage Industry", plan), -100);
  assert.equal(scoreCandidate("Sourcing Strategies", "Procurement vs sales process. Supplier selection starts after market research.", plan), -100);
  assert.equal(scoreCandidate("Japan food buyer wanted", "We are looking for a supplier of Japanese frozen seafood for our Singapore restaurants.", plan) >= 10, true);
});
