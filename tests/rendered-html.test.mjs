import assert from "node:assert/strict";
import test from "node:test";

async function fetchWorker(path = "/", init = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, init),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the RIVERSE simulation dashboard", async () => {
  const response = await fetchWorker();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="ko">/i);
  assert.match(html, /<title>RIVERSE \| 도시 수해 디지털 트윈<\/title>/i);
  assert.match(html, /냉천 산업지구 공사 영향 분석/);
  assert.match(html, /시뮬레이션 조건/);
  assert.match(html, /3D 침수 시뮬레이션 지도/);
  assert.match(html, /LIVE RISK ASSESSMENT/);
  assert.match(html, /og\.png/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("simulation API calculates flood metrics and comparison", async () => {
  const response = await fetchWorker("/api/simulate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      rainfall: 110,
      duration: 180,
      discharge: 1050,
      tide: 0.9,
      interventions: [
        { id: "test-blockage", type: "blockage", x: 18, y: 11 },
      ],
    }),
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.grid.width, 32);
  assert.equal(body.grid.height, 22);
  assert.equal(body.cells.length, 704);
  assert.ok(body.metrics.maxDepth > 0);
  assert.ok(body.metrics.riskScore >= 0 && body.metrics.riskScore <= 100);
  assert.equal(typeof body.comparison.deltaRisk, "number");
  assert.equal(body.model, "RIVERSE rapid-grid v0.1");
});
