// 실제 요청 처리: 주소 → 좌표 변환 → 관악구 범위 확인 → 안전점수 계산 → 응답 조립.

const prisma = require("../config/prisma");
const { geocodeAddress, isInGwanak } = require("../routes/safety.routes");
const { computeSafetyScore } = require("../services/score.service");
const { distanceMeters } = require("../utils/distance");

// 상세화면 "주변 시설" 리스트용 설정. 점수 계산(score.service.js)과는 무관한
// 표시 전용 상수라 여기 따로 둔다.
const NEARBY_RADIUS_METERS = 300;
const NEARBY_LIMIT_PER_TYPE = 10;

// ── 시설 데이터 캐싱 (서버 시작 후 첫 요청 시 1회 로드, 이후 재사용) ──
// 반경 계산은 매 요청 실시간이지만, DB 조회 자체는 한 번만 하고
// 메모리에 올려두는 게 요청마다 15,000건씩 DB 왕복하는 것보다 훨씬 빠르다.
let facilitiesCache = null;
async function getFacilities() {
  if (facilitiesCache) return facilitiesCache;
  facilitiesCache = await prisma.safetyData.findMany({
    where: {
      isGwanak: true,
      dataType: { in: ["cctv", "보안등", "파출소"] },
      lat: { not: null },
      lng: { not: null },
    },
    select: { lat: true, lng: true, dataType: true, name: true, address: true },
  });
  return facilitiesCache;
}

// CCTV/보안등의 name은 전부 "서울특별시 관악구청"(설치기관명)이라 표시용으로 무의미하다.
// 대신 address(공원명·도로명이 들어있어 항목마다 다름)에서 흔한 접두어만 잘라 라벨로 쓴다.
function facilityLabel(f) {
  if (f.dataType === "파출소") {
    const name = f.name || "";
    return name.endsWith("파출소") ? name : `${name}파출소`;
  }
  return (f.address || f.name || "").replace(/^서울특별시\s관악구\s/, "");
}

// 상세화면용 "가까운 시설" 목록.
// CCTV/보안등: 반경 NEARBY_RADIUS_METERS 이내를 거리순 상위 N개.
// 파출소: 관악구에 9곳뿐이라 반경 안에 거의 안 들어오므로, 거리 무관하게 최근접 1곳만 항상 포함.
function getNearbyFacilities(lat, lng, facilities) {
  const withDistance = (dataType) =>
    facilities
      .filter((f) => f.dataType === dataType)
      .map((f) => ({ ...f, distanceMeters: distanceMeters(lat, lng, f.lat, f.lng) }));

  const cctv = withDistance("cctv")
    .filter((f) => f.distanceMeters <= NEARBY_RADIUS_METERS)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, NEARBY_LIMIT_PER_TYPE);

  const lamp = withDistance("보안등")
    .filter((f) => f.distanceMeters <= NEARBY_RADIUS_METERS)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, NEARBY_LIMIT_PER_TYPE);

  const police = withDistance("파출소")
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, 1);

  return [...cctv, ...lamp, ...police]
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .map((f) => ({
      dataType: f.dataType,
      label: facilityLabel(f),
      distanceMeters: Math.round(f.distanceMeters),
      lat: f.lat,
      lng: f.lng,
    }));
}

// ── 범죄 통계 캐싱 (관악구 전체 집계, 검색 주소와 무관하게 항상 동일) ──
// 점수 계산에는 쓰이지 않는 참고용 정보라 별도로 캐싱한다.
let crimeStatCache = null;
async function getCrimeStat() {
  if (crimeStatCache) return crimeStatCache;
  const row = await prisma.safetyData.findFirst({
    where: { dataType: "범죄통계" },
  });
  if (!row) return null;
  crimeStatCache = {
    source: row.name,
    year: row.crimeYear,
    kill: row.crimeKill,
    rob: row.crimeRob,
    theft: row.crimeTheft,
    violence: row.crimeViolence,
  };
  return crimeStatCache;
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
    const crime = await getCrimeStat();
    const nearbyFacilities = getNearbyFacilities(coord.lat, coord.lng, facilities);

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
        policeDistanceMeters: result.policeDistance,
      },
      crime,
      nearbyFacilities,
      meta: {
        phase: 2,
        method: "radius",
        note: "입력 좌표 반경 300m 내 CCTV/보안등 밀집도 및 최근접 파출소 거리 기준 점수입니다. 파출소 거리 정규화 기준은 격자 샘플링 전 임시값입니다. crime 필드는 관악구 전체 집계 통계로, 점수 계산에는 반영되지 않는 참고용 정보입니다. nearbyFacilities는 반경 내 CCTV/보안등 상위 10개와 최근접 파출소 1곳(거리 무관)입니다.",
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
}

module.exports = { getSafetyScore };
