import { expect, test } from "bun:test";
import { lexicalRecommendations } from "../src/server/lexical-recommendations";
import { createRecommender } from "../src/server/recommendations";
const candidates = [
  {id: "intro", description: "Write blog post intros", referenceId: "a", revision: "v1"},
  {id: "reha-prozesse-coding", description: "Develop REHA apps", referenceId: "b", revision: "v1"},
];

test("German natural-language fallback finds token matches without claiming semantic scoring", async () => {
  expect(lexicalRecommendations("Schreib einen Einstieg für meinen Blog", candidates).map((s) => s.id)).toEqual(["intro"]);
  const recommend = createRecommender();
  const result = await recommend({
    catalog: async () => ({scope: "fixture", candidates}),
    search: async () => ({items: [], hasMore: false, nextOffset: null}),
  }, {task: "Die REHA Prozesse App lädt nicht"});
  expect(result).toMatchObject({method: "search", noMatch: null, fallbackReason: "not_configured"});
  expect(result.items[0]).toMatchObject({id: "reha-prozesse-coding", relevance: null});
});

test("unrelated tasks and common words do not force a recommendation", () => {
  expect(lexicalRecommendations("Bitte hilf mir", candidates)).toEqual([]);
  expect(lexicalRecommendations("Wie alt ist dieser Kalkstein?", candidates)).toEqual([]);
});
