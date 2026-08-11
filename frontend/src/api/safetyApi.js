const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';

// 등급별 색상/설명 — 백엔드는 등급 문자(S~D)만 내려주므로 화면 표시용 스타일은 프론트에서 매핑
export const GRADE_STYLE = {
  S: { color: '#3b82f6', bg: '#eff6ff', desc: '매우 안전한 지역입니다' },
  A: { color: '#22c55e', bg: '#f0fdf4', desc: '안전한 지역입니다' },
  B: { color: '#eab308', bg: '#fefce8', desc: '보통 수준의 안전 지역입니다' },
  C: { color: '#f97316', bg: '#fff7ed', desc: '다소 주의가 필요한 지역입니다' },
  D: { color: '#ef4444', bg: '#fef2f2', desc: '안전 시설이 부족한 지역입니다' },
};

// GET /api/safety-score?address=... 호출
// 실패 시(400/404/422/500) 백엔드가 내려준 error 메시지를 담은 Error를 던짐 (status 프로퍼티 포함)
export async function fetchSafetyScore(address) {
  const url = `${BASE_URL}/api/safety-score?address=${encodeURIComponent(address)}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data.error || `요청에 실패했습니다 (${res.status})`);
    error.status = res.status;
    throw error;
  }

  return data;
}

// 백엔드 응답(fetchSafetyScore의 반환값)을 AnalysisResult/SecurityDetail 컴포넌트가 쓰는 형태로 변환
//
// 주의: 백엔드는 반경 내 "개수"(cctvCount/lampCount)와 파출소까지의 "거리"만 내려주고,
// 예전에 프론트가 CSV를 직접 읽어 계산할 때 쓰던 개별 시설 좌표 목록, 가장 가까운 파출소 이름,
// 환경조명(밝기)·범죄통계 점수는 이 API에 없다. 없는 값은 지어내지 않고 빈 배열/null로 둔다.
export function toAnalysisResult(apiResponse) {
  const { grade, score, details } = apiResponse;
  const style = GRADE_STYLE[grade] || GRADE_STYLE.D;

  return {
    totalScore: score,
    grade,
    ...style,
    details: {
      radiusMeters: details.radiusMeters,
      cctv: { count: details.cctvCount, nearby: [] },
      lamp: { count: details.lampCount, nearby: [] },
      police: {
        distance: details.policeDistanceMeters ?? null,
        nearest: null,
        all: [],
      },
    },
  };
}
