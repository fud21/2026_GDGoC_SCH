// 반경(radius) 기반 안전점수 계산.
// 좌표(lat, lng)를 받아서 그 지점 주변 CCTV/보안등 밀집도로 점수를 계산한다.
// facilities: [{ lat, lng, dataType }, ...] — DB 조회 및 캐싱은 호출부(controller)에서 담당.

const fs = require("fs");
const path = require("path");
const { distanceMeters } = require("../utils/distance");

const config = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../../prisma/data/safety_score_config.json"),
    "utf-8"
  )
);

// ── 반경 내 개수 세기 ────────────────────────────────────────────
function countWithinRadius(lat, lng, facilities, dataType, radiusM) {
  let count = 0;
  for (const f of facilities) {
    if (f.dataType !== dataType) continue;
    if (distanceMeters(lat, lng, f.lat, f.lng) <= radiusM) count++;
  }
  return count;
}

// ── 정규화 (0~100, 설정된 min/max 기준 클리핑) ─────────────────
function normalize(value, min, max) {
  const score = ((value - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, score));
}

// ── 점수 -> 등급 ─────────────────────────────────────────────────
function scoreToGrade(score) {
  const c = config.gradeCutoffs;
  if (score >= c.A_S) return "S";
  if (score >= c.B_A) return "A";
  if (score >= c.C_B) return "B";
  if (score >= c.D_C) return "C";
  return "D";
}

// ── 메인 함수: 좌표 -> 안전점수 ────────────────────────────────
// facilities는 SafetyData 중 is_gwanak=true인 항목을 미리 메모리에 캐싱해서 전달
function computeSafetyScore(lat, lng, facilities) {
  const radius = config.radiusMeters;

  const cctvCount = countWithinRadius(lat, lng, facilities, "cctv", radius);
  const lampCount = countWithinRadius(lat, lng, facilities, "보안등", radius);

  const cctvScore = normalize(
    cctvCount,
    config.normalization.cctv.min,
    config.normalization.cctv.max
  );
  const lampScore = normalize(
    lampCount,
    config.normalization.lamp.min,
    config.normalization.lamp.max
  );

  const safetyScore =
    cctvScore * config.weights.cctv + lampScore * config.weights.lamp;
  const grade = scoreToGrade(safetyScore);

  return {
    radiusMeters: radius,
    cctvCount,
    lampCount,
    cctvScore: Math.round(cctvScore * 10) / 10,
    lampScore: Math.round(lampScore * 10) / 10,
    safetyScore: Math.round(safetyScore * 10) / 10,
    grade,
  };
}

module.exports = { countWithinRadius, normalize, scoreToGrade, computeSafetyScore };
