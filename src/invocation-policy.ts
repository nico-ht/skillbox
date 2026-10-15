import matter from "gray-matter";
const yamlEngine = (matter as typeof matter & {
  engines: { yaml: { parse: (value: string) => unknown } };
}).engines.yaml;

/** Invocation policy is routing guidance, never an execution permission. */
export function manualOnly(
  description: string,
  frontmatter: Record<string, unknown> = {},
  openaiYaml?: string | null,
) {
  if (frontmatter["disable-model-invocation"] === true) return true;
  if (/^Explicit request only\b/i.test(description.trim())) return true;
  if (openaiYaml) {
    try {
      const data = yamlEngine.parse(openaiYaml) as { policy?: { allow_implicit_invocation?: boolean } } | null;
      return data?.policy?.allow_implicit_invocation === false;
    } catch {
      // An unreadable explicit policy must not enable implicit selection.
      return true;
    }
  }
  return false;
}
