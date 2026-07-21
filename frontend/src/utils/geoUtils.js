export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getItemsWithinRadius(items, lat, lng, radius) {
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
