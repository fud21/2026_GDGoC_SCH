// 두 좌표(lat1,lng1)-(lat2,lng2) 사이의 실제 거리를 미터 단위로 계산
// 지구가 둥글기 때문에 좌표 숫자를 그냥 빼면 오차가 커서, 곡률을 반영한 공식(하버사인 공식) 사용
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // 지구 반지름(m)
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 기준 좌표(lat, lng)에서 반경(radius, 미터) 이내에 있는 항목들만 걸러서
// 가까운 순서로 정렬해 반환 (CCTV/보안등 개수 셀 때 사용)
export function getItemsWithinRadius(items, lat, lng, radius) {
  // 먼저 위경도 차이로 대충 걸러서(사각형 범위) 계산량을 줄이고,
  // 그 다음 정확한 거리(haversineDistance)로 한 번 더 확인
  const dLat = radius / 111111;
  const dLng = radius / (111111 * Math.cos(lat * Math.PI / 180));
  return items
    .filter(item => {
      if (Math.abs(item.lat - lat) > dLat || Math.abs(item.lng - lng) > dLng) return false;
      return haversineDistance(lat, lng, item.lat, item.lng) <= radius;
    })
    .sort((a, b) =>
      haversineDistance(lat, lng, a.lat, a.lng) - haversineDistance(lat, lng, b.lat, b.lng)
    );
}

// 기준 좌표(lat, lng)에서 가장 가까운 항목 하나와 그 거리를 반환 (가장 가까운 파출소 찾을 때 사용)
export function getNearestItem(items, lat, lng) {
  const withCoords = items.filter(i => i.lat && i.lng);
  if (withCoords.length === 0) return { item: null, distance: Infinity };
  let nearest = null, minDist = Infinity;
  for (const item of withCoords) {
    const d = haversineDistance(lat, lng, item.lat, item.lng);
    if (d < minDist) { minDist = d; nearest = item; }
  }
  return { item: nearest, distance: minDist };
}
