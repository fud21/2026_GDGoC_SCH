const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';

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

// 백엔드 응답(fetchSafetyScore의 반환값)을 mockSafety.computeSafety()와 같은 형태로 변환.
// ResultPanel/DetailPanel/MapView가 이 형태({ addr, latlng, score, grade, cctv, light, police, traffic, facilities })를
// 기대하므로, mock 모드와 실제 API 모드를 컴포넌트 입장에서 동일하게 다룰 수 있다.
//
// 주의: 백엔드는 개별 시설 좌표 목록과 환경조명(밝기)·범죄통계·야간 통행량을 내려주지 않는다.
// 없는 값은 지어내지 않고 traffic만 임시 고정값("보통")을 쓰고, facilities는 빈 배열로 둔다.
export function toAnalysisResult(apiResponse) {
  const { address, lat, lng, grade, score, details, crime } = apiResponse;

  return {
    addr: address,
    latlng: [lat, lng],
    score,
    grade,
    cctv: details.cctvCount,
    light: details.lampCount,
    police: details.policeDistanceMeters,
    traffic: '보통', // API에 없는 필드 — 임시 고정값
    facilities: [], // API가 개별 시설 좌표를 내려주지 않음
    crime, // 관악구 전체 집계 참고용 통계 (검색 주소와 무관하게 항상 동일값) — 그대로 통과
  };
}
