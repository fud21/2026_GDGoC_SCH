// 두 좌표 간 평면 근사 거리(m). 관악구 규모에서는 Haversine과 오차가 거의 없다.
function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const lat1r = (lat1 * Math.PI) / 180;
  const lat2r = (lat2 * Math.PI) / 180;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const dy = dLat * R;
  const dx = dLng * R * Math.cos((lat1r + lat2r) / 2);
  return Math.sqrt(dx * dx + dy * dy);
}

// 여러 시설 중 가장 가까운 거리(m) 반환. facilities가 비어있으면 null.
function nearestDistanceMeters(lat, lng, facilities, dataType) {
  let min = null;
  for (const f of facilities) {
    if (f.dataType !== dataType) continue;
    const d = distanceMeters(lat, lng, f.lat, f.lng);
    if (min === null || d < min) min = d;
  }
  return min;
}

module.exports = { distanceMeters, nearestDistanceMeters };
