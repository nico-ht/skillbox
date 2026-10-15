import type { Candidate } from "./recommendations";

const stop = new Set("the and for with from this that use using please der die das den dem des ein eine einen einer einem und oder für mit von auf bei zum zur im am ist sind bitte mir wir ich du dein deine my our your to of in an is a it".split(" "));
function tokens(value: string) {
  return [...new Set(value.toLowerCase().normalize("NFKC").match(/[\p{L}\p{N}]+/gu) ?? [])]
    .filter((token) => token.length > 2 && !stop.has(token));
}

/** Transparent token matching only; never presented as semantic relevance. */
export function lexicalRecommendations(task: string, candidates: Candidate[]) {
  const query = tokens(task);
  return candidates.map((candidate) => {
    const name = new Set(tokens(candidate.id));
    const description = new Set(tokens(candidate.description));
    const score = query.reduce((sum, token) => sum + (name.has(token) ? 3 : description.has(token) ? 1 : 0), 0);
    return {candidate, score};
  }).filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.candidate.id.localeCompare(b.candidate.id))
    .map((item) => item.candidate);
}
