// 파출소 9건 좌표 지오코딩 스크립트
// 파출소 데이터는 원본 CSV에 위경도가 없어서, address를 Kakao API로 지오코딩하고
// 관악구 동 경계(gwanak_dong_boundary.geojson)와 대조해 dongCode/dongName/isGwanak을 채운다.
//
// 실행: cd backend && node prisma/geocodePoliceStations.js

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const turf = require("@turf/turf");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const KAKAO_API_KEY = process.env.KAKAO_API_KEY;

const dongBoundary = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "data/gwanak_dong_boundary.geojson"),
    "utf-8"
  )
);

// 좌표 -> 카카오 지오코딩
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

// 좌표가 속한 동(feature) 찾기
function findDong(lat, lng) {
  const point = turf.point([lng, lat]);
  for (const feature of dongBoundary.features) {
    if (turf.booleanPointInPolygon(point, feature)) {
      return feature.properties; // { dong_code, dong_name, sgg_code }
    }
  }
  return null;
}

async function main() {
  const stations = await prisma.safetyData.findMany({
    where: { dataType: "파출소" },
  });

  console.log(`대상 파출소: ${stations.length}건`);

  for (const station of stations) {
    if (!station.address) {
      console.log(`[SKIP] id=${station.id} 주소 없음`);
      continue;
    }

    try {
      const coord = await geocodeAddress(station.address);
      if (!coord) {
        console.log(`[FAIL] id=${station.id} "${station.address}" 지오코딩 결과 없음`);
        continue;
      }

      const dong = findDong(coord.lat, coord.lng);

      await prisma.safetyData.update({
        where: { id: station.id },
        data: {
          lat: coord.lat,
          lng: coord.lng,
          dongCode: dong ? dong.dong_code : null,
          dongName: dong ? dong.dong_name : null,
          sggCode: dong ? dong.sgg_code : null,
          isGwanak: !!dong,
        },
      });

      console.log(
        `[OK] id=${station.id} "${station.name || station.address}" -> lat=${coord.lat}, lng=${coord.lng}, dong=${dong ? dong.dong_name : "관악구 밖"}`
      );
    } catch (err) {
      console.error(`[ERROR] id=${station.id}`, err.message);
    }
  }

  await prisma.$disconnect();
  console.log("완료");
}

main();