import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { POST } from "../app/api/simulate/route.ts";

test("RIVERSE 화면에 시민용 실제 지도 시뮬레이션 UI가 포함된다", async () => {
  const source = await readFile(
    new URL("../app/flood-lab.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /RIVERSE/);
  assert.match(source, /냉천 하류 예상 침수지역/);
  assert.match(source, /실제 2D 지도 기반 침수 위험 히트맵/);
  assert.match(source, /\/api\/simulate/);
  assert.match(source, /시민 행동 안내/);

  const mapSource = await readFile(
    new URL("../app/flood-map.tsx", import.meta.url),
    "utf8",
  );
  assert.match(mapSource, /dapi\.kakao\.com/);
  assert.match(mapSource, /CustomOverlay/);
  assert.match(mapSource, /NEXT_PUBLIC_KAKAO_MAP_JAVASCRIPT_KEY/);
});

test("시뮬레이션 API가 격자 결과와 비교 지표를 계산한다", async () => {
  const request = new Request("http://localhost:3000/api/simulate", {
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

  const response = await POST(request);
  assert.equal(response.status, 200);

  const body = await response.json();
  assert.equal(body.grid.width, 32);
  assert.equal(body.grid.height, 22);
  assert.equal(body.cells.length, 704);
  assert.equal(body.region.id, "pohang-naengcheon");
  assert.equal(body.region.coordinateSystem, "WGS84");
  assert.ok(body.metrics.maxDepth > 0);
  assert.ok(body.metrics.riskScore >= 0 && body.metrics.riskScore <= 100);
  assert.equal(typeof body.comparison.deltaRisk, "number");
  assert.equal(body.model, "RIVERSE rapid-grid v0.1");
});
