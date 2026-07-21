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

module.exports = { distanceMeters };
