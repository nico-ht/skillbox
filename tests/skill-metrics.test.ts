import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SkillMetrics } from "../src/client/skill-metrics";
import type { SkillSummary } from "../src/shared";

const summary: SkillSummary = {
  id: "workflow",
  title: "Workflow",
  description: "A workflow",
  revision: "revision-1",
  updatedAt: "2026-10-15T08:00:00Z",
  kind: "skill",
  members: [],
  archived: false,
  disabled: false,
  replacement: null,
  tags: [],
};

function render(metrics: Partial<SkillSummary>) {
  const html = renderToStaticMarkup(
    createElement(SkillMetrics, { skill: { ...summary, ...metrics } }),
  );
  return { html, text: html.replace(/<[^>]*>/g, "") };
}

test("reads are visible even when application has not been reported", () => {
  const { text } = render({
    readCount: 7,
    usageCount: 0,
    lastAgentReadAt: "2026-10-15T08:00:00Z",
  });
  expect(text).toContain("7 agent reads / loads");
  expect(text).toContain("latest");
  expect(text).toContain("Application unknown · no reports");
  expect(text).not.toContain("0 application reports");
});

test("application reports remain separate from read counts", () => {
  const { text } = render({ readCount: 7, usageCount: 2 });
  expect(text).toContain("7 agent reads / loads");
  expect(text).toContain("2 application reports");
  expect(text).not.toContain("Application unknown");
});

test("zero tracked reads do not establish that the skill was unused", () => {
  const { text } = render({ readCount: 0, usageCount: 0 });
  expect(text).toContain("0 agent reads / loads");
  expect(text).toContain("Application unknown · no reports");
});

test("activity remains visible when package size metrics are unavailable", () => {
  const { html, text } = render({ readCount: 3, usageCount: 1 });
  expect(text).toContain("3 agent reads / loads");
  expect(text).toContain("1 application report");
  expect(html).not.toContain("skill-length");
});

test("summaries without owner metrics do not invent activity", () => {
  expect(render({}).html).toBe("");
});
