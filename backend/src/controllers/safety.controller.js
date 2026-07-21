// 실제 요청 처리: 주소 → 좌표 변환 → 관악구 범위 확인 → 안전점수 계산 → 응답 조립.

const prisma = require("../config/prisma");
const { geocodeAddress, isInGwanak } = require("../routes/safety.routes");
const { computeSafetyScore } = require("../services/score.service");

// ── 시설 데이터 캐싱 (서버 시작 후 첫 요청 시 1회 로드, 이후 재사용) ──
// 반경 계산은 매 요청 실시간이지만, DB 조회 자체는 한 번만 하고
// 메모리에 올려두는 게 요청마다 15,000건씩 DB 왕복하는 것보다 훨씬 빠르다.
let facilitiesCache = null;
async function getFacilities() {
  if (facilitiesCache) return facilitiesCache;
  facilitiesCache = await prisma.safetyData.findMany({
    where: {
      isGwanak: true,
      dataType: { in: ["cctv", "보안등"] },
      lat: { not: null },
      lng: { not: null },
    },
    select: { lat: true, lng: true, dataType: true },
  });
  return facilitiesCache;
}

async function getSafetyScore(req, res) {
  const { address } = req.query;
  if (!address) {
    return res.status(400).json({ error: "address 쿼리 파라미터가 필요합니다." });
  }

  try {
    const coord = await geocodeAddress(address);
    if (!coord) {
      return res.status(404).json({ error: "주소를 찾을 수 없습니다." });
    }

    if (!isInGwanak(coord.lat, coord.lng)) {
      return res.status(422).json({
        error: "관악구 범위 밖의 주소입니다.",
        lat: coord.lat,
        lng: coord.lng,
      });
    }

    const facilities = await getFacilities();
    const result = computeSafetyScore(coord.lat, coord.lng, facilities);

    return res.json({
      address,
      lat: coord.lat,
      lng: coord.lng,
      grade: result.grade,
      score: result.safetyScore,
      details: {
        radiusMeters: result.radiusMeters,
        cctvCount: result.cctvCount,
        lampCount: result.lampCount,
      },
      meta: {
        phase: 1,
        method: "radius",
        note: "입력 좌표 반경 300m 내 CCTV/보안등 밀집도 기준 점수입니다. 파출소·범죄 데이터는 추후 반영 예정입니다.",
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
}

module.exports = { getSafetyScore };
