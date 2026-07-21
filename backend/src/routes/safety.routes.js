// GET /api/safety-score?address=서울특별시 관악구 신림동 ...
//
// 1. Kakao 주소 검색 API로 address -> lat/lng 변환 (geocodeAddress)
// 2. 관악구 범위 내인지 확인 (isInGwanak, turf.js point-in-polygon)
// 3. 실제 요청 처리(점수 계산·응답 조립)는 safety.controller에 위임
//
// 필요 패키지: axios, @turf/turf
//   npm install axios @turf/turf
//
// 필요 데이터 파일 (backend/prisma/data/ 에 위치):
//   - gwanak_dong_boundary.geojson (관악구 범위 판별용, 21개 동 경계)

const express = require("express");
const axios = require("axios");
const turf = require("@turf/turf");
const fs = require("fs");
const path = require("path");

const dongBoundary = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../../prisma/data/gwanak_dong_boundary.geojson"),
    "utf-8"
  )
);
const gwanakUnion = turf.union(turf.featureCollection(dongBoundary.features));

const KAKAO_API_KEY = process.env.KAKAO_API_KEY;

// ── 1. 주소 -> 좌표 ──────────────────────────────────────────────
async function geocodeAddress(address) {
  const res = await axios.get(
    "https://dapi.kakao.com/v2/local/search/address.json",
    {
      params: { query: address },
      headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
    }
  );
  const docs = res.data.documents;
  if (!docs || docs.length === 0) return null;
  const { x, y } = docs[0];
  return { lat: parseFloat(y), lng: parseFloat(x) };
}

// ── 2. 관악구 범위 판별 ──────────────────────────────────────────
function isInGwanak(lat, lng) {
  const point = turf.point([lng, lat]);
  return turf.booleanPointInPolygon(point, gwanakUnion);
}

// ── 3. 라우트 등록 ───────────────────────────────────────────────
// safety.controller가 위의 geocodeAddress/isInGwanak을 require해서 쓰므로,
// 여기서 컨트롤러를 top-level에 require하면 순환 참조가 생긴다.
// 요청이 들어오는 시점(모듈 로드가 끝난 뒤)에만 필요하므로 핸들러 안에서 지연 로드한다.
const router = express.Router();
router.get("/safety-score", (req, res) => {
  require("../controllers/safety.controller").getSafetyScore(req, res);
});

module.exports = router;
module.exports.geocodeAddress = geocodeAddress;
module.exports.isInGwanak = isInGwanak;
