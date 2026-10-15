import { expect, test } from "bun:test";
import { manualOnly } from "../src/invocation-policy";

test("manual-only controls survive descriptions and client YAML policies", () => {
  expect(manualOnly("Explicit request only. Review security.")).toBe(true);
  expect(manualOnly("Review", { "disable-model-invocation": true })).toBe(true);
  expect(manualOnly("Review", {}, "policy:\n  allow_implicit_invocation: false")).toBe(true);
  expect(manualOnly("Review", {}, "---\npolicy:\n  allow_implicit_invocation: false\n...")).toBe(true);
  expect(manualOnly("Review", {}, "policy:\n  allow_implicit_invocation: true")).toBe(false);
  expect(manualOnly("Review", {}, "policy: [broken")).toBe(true);
  expect(manualOnly("Review")).toBe(false);
});
