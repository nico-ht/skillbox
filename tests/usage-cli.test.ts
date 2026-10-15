import { expect, test } from "bun:test";
import { resolve } from "node:path";

function fixture(respond = () => Response.json({ recorded: true })) {
  const requests: Array<{
    path: string;
    method: string;
    authorization: string | null;
    source: string | null;
    body: unknown;
  }> = [];
  // Finite loopback-only fixture; no real library or provider is contacted.
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch: async (request) => {
      requests.push({
        path: new URL(request.url).pathname,
        method: request.method,
        authorization: request.headers.get("Authorization"),
        source: request.headers.get("X-Skillbox-Source"),
        body: await request.json(),
      });
      return respond();
    },
  });
  const run = async (...args: string[]) => {
    const child = Bun.spawn(
      [process.execPath, resolve("cli/skillbox.mjs"), "report-use", ...args],
      {
        env: {
          ...process.env,
          SKILLBOX_CONFIG: "/tmp/skillbox-nonexistent-fixture-config",
          SKILLBOX_URL: `http://127.0.0.1:${server.port}`,
          SKILLBOX_TOKEN: "fixture-token",
        },
        stdout: "pipe",
        stderr: "pipe",
      },
    );
    const [stdout, stderr, code] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    return { stdout, stderr, code };
  };
  return { server, requests, run };
}

test("CLI report-use posts the exact skill revision, outcome and caller context", async () => {
  const { server, requests, run } = fixture();
  try {
    for (const outcome of ["applied", "succeeded", "failed"]) {
      const result = await run("workflow", "revision-1", outcome);
      expect(result.code).toBe(0);
      expect(result.stderr).toBe("");
      expect(JSON.parse(result.stdout)).toEqual({ recorded: true });
      expect(requests.at(-1)).toEqual({
        path: "/api/skill-usage",
        method: "POST",
        authorization: "Bearer fixture-token",
        source: "cli",
        body: {
          id: "workflow",
          revision: "revision-1",
          outcome,
          context: { harness: "skillbox-cli" },
        },
      });
    }
    expect(requests).toHaveLength(3);
  } finally {
    server.stop(true);
  }
});

test("CLI report-use rejects missing arguments and invalid outcomes before HTTP", async () => {
  const { server, requests, run } = fixture();
  try {
    for (const args of [
      [],
      ["workflow"],
      ["workflow", "revision-1"],
      ["", "revision-1", "applied"],
      ["workflow", "", "applied"],
      ["workflow", "revision-1", "read"],
      ["workflow", "revision-1", "succeeded", "extra"],
    ]) {
      const result = await run(...args);
      expect(result.code).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain(
        "Usage: skillbox report-use ID REVISION applied|succeeded|failed",
      );
    }
    expect(requests).toHaveLength(0);
  } finally {
    server.stop(true);
  }
});

test("CLI report-use propagates server failure without claiming a recorded report", async () => {
  for (const [respond, message] of [
    [
      () =>
        Response.json(
          { error: "Skill or revision not found" },
          { status: 404 },
        ),
      "Skill or revision not found",
    ],
    [() => new Response("Unavailable", { status: 500 }), "Library HTTP 500"],
  ] as const) {
    const { server, requests, run } = fixture(respond);
    try {
      const result = await run("workflow", "unknown-revision", "applied");
      expect(result.code).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain(message);
      expect(requests).toHaveLength(1);
    } finally {
      server.stop(true);
    }
  }
});
