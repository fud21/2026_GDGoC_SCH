import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CENTER, GRADE_COLOR, TYPE_META } from '../../utils/mockSafety';

function pinIcon(color, glyph) {
  return L.divIcon({
    className: 'grade-overlay-label',
    html: `<div class="pin-badge" style="background:${color}"><span>${glyph}</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 28],
  });
}

// 지도 영역: 검색 대기('main')/결과('result')/상세('detail') 상태에 따라
// 중심 이동, 등급 원형 오버레이, 시설 마커를 그린다. (Leaflet + OpenStreetMap)
export default function MapView({ screen, result, activeFilters }) {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);
  const gradeCircleRef = useRef(null);

  // 지도는 최초 1회만 초기화하고, 이후에는 재사용한다
  useEffect(() => {
    const map = L.map(mapElRef.current, { zoomControl: false, attributionControl: true }).setView(CENTER, 13);
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    setTimeout(() => map.invalidateSize(), 60);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 화면/결과/필터가 바뀔 때마다 마커·원·뷰를 다시 그린다
  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    if (gradeCircleRef.current) {
      map.removeLayer(gradeCircleRef.current);
      gradeCircleRef.current = null;
    }

    if (screen === 'main' || !result) {
      map.setView(CENTER, 13);
      return;
    }

    if (screen === 'result') {
      map.setView(result.latlng, 15);
      const color = GRADE_COLOR[result.grade];
      gradeCircleRef.current = L.circle(result.latlng, {
        radius: 260,
        color,
        fillColor: color,
        fillOpacity: 0.14,
        weight: 2,
        opacity: 0.5,
      }).addTo(map);
      L.marker(result.latlng, { icon: pinIcon(color, result.grade) }).addTo(markersLayer);
      return;
    }

    if (screen === 'detail') {
      map.setView(result.latlng, 17);
      const color = GRADE_COLOR[result.grade];
      L.marker(result.latlng, { icon: pinIcon(color, result.grade) }).addTo(markersLayer);
      result.facilities
        .filter((f) => activeFilters.includes(f.type))
        .forEach((f) => {
          const meta = TYPE_META[f.type];
          L.marker(f.latlng, { icon: pinIcon(meta.color, meta.glyph) }).addTo(markersLayer);
        });
    }
  }, [screen, result, activeFilters]);

  const badgeText =
    screen === 'main' || !result
      ? '관악구 전체'
      : screen === 'detail'
        ? `${result.addr.replace('서울 관악구 ', '')} 상세`
        : result.addr.replace('서울 관악구 ', '');

  return (
    <div className="map-pane">
      <div ref={mapElRef} id="map" />
      <div className="map-badge">{badgeText}</div>
    </div>
  );
}
