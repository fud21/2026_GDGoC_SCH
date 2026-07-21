import { getItemsWithinRadius, getNearestItem } from './geoUtils';

export const GRADE_CONFIG = {
  S: { min: 80, color: '#3b82f6', bg: '#eff6ff', desc: '매우 안전한 지역입니다' },
  A: { min: 70, color: '#22c55e', bg: '#f0fdf4', desc: '안전한 지역입니다' },
  B: { min: 60, color: '#eab308', bg: '#fefce8', desc: '보통 수준의 안전 지역입니다' },
  C: { min: 50, color: '#f97316', bg: '#fff7ed', desc: '다소 주의가 필요한 지역입니다' },
  D: { min: 0,  color: '#ef4444', bg: '#fef2f2', desc: '안전 시설이 부족한 지역입니다' },
};

export function getGrade(score) {
  for (const [grade, cfg] of Object.entries(GRADE_CONFIG)) {
    if (score >= cfg.min) return { grade, ...cfg };
  }
  return { grade: 'D', ...GRADE_CONFIG.D };
}

export function calculateScore(lat, lng, csvData) {
  const { cctv, lamp, police, crime } = csvData;

  // CCTV (500m 이내): 0~3점
  const cctvNearby = getItemsWithinRadius(cctv, lat, lng, 500);
  const cctvTotal = cctvNearby.reduce((s, c) => s + (c.count || 1), 0);
  const cctvScore = cctvTotal === 0 ? 0 : cctvTotal <= 5 ? 1 : cctvTotal <= 20 ? 2 : 3;

  // 보안등 (200m 이내): 0~5점
  const lampNearby = getItemsWithinRadius(lamp, lat, lng, 200);
  const lampCount = lampNearby.length;
  const lampScore = lampCount === 0 ? 0 : lampCount <= 3 ? 1 : lampCount <= 10 ? 3 : 5;

  // 경찰서 거리: 0/5/10/15점
  const { item: nearestPolice, distance: policeDistance } = getNearestItem(police, lat, lng);
  const policeScore =
    policeDistance <= 300 ? 15 :
    policeDistance <= 500 ? 10 :
    policeDistance <= 1000 ? 5 : 0;

  // 환경조명 (보안등 밀도 기반): -10~+10점
  const brightnessScore =
    lampCount >= 20 ? 10 :
    lampCount >= 8  ? 5  :
    lampCount < 2   ? -10 : 0;

  // 범죄정보 (구 전체 연간 통계): 고정 감점
  const totalCrimes = crime ? crime.kill + crime.rob + crime.theft + crime.violence : 0;
  const crimeScore = totalCrimes > 3000 ? -5 : totalCrimes > 1000 ? -3 : 0;

  const rawScore = 60 + cctvScore + lampScore + policeScore + brightnessScore + crimeScore;
  const totalScore = Math.max(0, Math.min(100, rawScore));
  const gradeInfo = getGrade(totalScore);

  const securityMax = 3 + 5 + 15;
  const securityScore = cctvScore + lampScore + policeScore;

  return {
    totalScore,
    ...gradeInfo,
    details: {
      security: {
        score: securityScore,
        max: securityMax,
        pct: Math.round((securityScore / securityMax) * 100),
      },
      brightness: {
        score: brightnessScore,
        pct: Math.max(0, Math.round(((brightnessScore + 10) / 20) * 100)),
      },
      crime: { score: crimeScore, totalCrimes },
      cctv: { count: cctvTotal, score: cctvScore, nearby: cctvNearby.slice(0, 30) },
      lamp: { count: lampCount, score: lampScore, nearby: lampNearby.slice(0, 30) },
      police: {
        nearest: nearestPolice,
        distance: Math.round(policeDistance),
        score: policeScore,
        all: police,
      },
    },
  };
}
