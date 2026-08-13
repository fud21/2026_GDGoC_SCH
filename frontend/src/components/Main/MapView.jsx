import { useEffect, useRef } from 'react';
import { CENTER, GRADE_COLOR, TYPE_META } from '../../utils/mockSafety';

function pinOverlay(position, color, glyph) {
  const content = document.createElement('div');
  content.className = 'pin-badge';
  content.style.background = color;
  content.innerHTML = `<span>${glyph}</span>`;
  return new window.kakao.maps.CustomOverlay({ position, content, yAnchor: 1, xAnchor: 0.5 });
}

// 지도 영역: 검색 대기('main')/결과('result')/상세('detail') 상태에 따라
// 중심 이동, 등급 원형 오버레이, 시설 마커를 그린다. (Kakao Maps JS SDK)
export default function MapView({ screen, result, activeFilters }) {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const overlaysRef = useRef([]);
  const circleRef = useRef(null);
  // draw()가 항상 최신 props를 보도록 ref에 매 렌더마다 반영해둔다
  // (SDK 비동기 load 콜백 안에서 최초 draw를 호출해야 해서 클로저로는 최신값을 못 잡는다)
  const stateRef = useRef({ screen, result, activeFilters });
  stateRef.current = { screen, result, activeFilters };

  const clearOverlays = () => {
    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = [];
    if (circleRef.current) {
      circleRef.current.setMap(null);
      circleRef.current = null;
    }
  };

  const draw = () => {
    const map = mapRef.current;
    const kakao = window.kakao;
    if (!map || !kakao) return;
    const { screen, result, activeFilters } = stateRef.current;

    clearOverlays();

    if (screen === 'main' || !result) {
      map.setCenter(new kakao.maps.LatLng(CENTER[0], CENTER[1]));
      map.setLevel(7);
      return;
    }

    const center = new kakao.maps.LatLng(result.latlng[0], result.latlng[1]);

    if (screen === 'result') {
      map.setCenter(center);
      map.setLevel(4);
      const color = GRADE_COLOR[result.grade];
      circleRef.current = new kakao.maps.Circle({
        center,
        radius: 260,
        strokeWeight: 2,
        strokeColor: color,
        strokeOpacity: 0.5,
        fillColor: color,
        fillOpacity: 0.14,
        map,
      });
      const overlay = pinOverlay(center, color, result.grade);
      overlay.setMap(map);
      overlaysRef.current.push(overlay);
      return;
    }

    if (screen === 'detail') {
      map.setCenter(center);
      map.setLevel(3);
      const color = GRADE_COLOR[result.grade];
      const mainOverlay = pinOverlay(center, color, result.grade);
      mainOverlay.setMap(map);
      overlaysRef.current.push(mainOverlay);

      result.facilities
        .filter((f) => activeFilters.includes(f.type))
        .forEach((f) => {
          const meta = TYPE_META[f.type];
          const position = new kakao.maps.LatLng(f.latlng[0], f.latlng[1]);
          const overlay = pinOverlay(position, meta.color, meta.glyph);
          overlay.setMap(map);
          overlaysRef.current.push(overlay);
        });
    }
  };

  // 지도는 최초 1회만 초기화하고, 이후에는 재사용한다
  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) {
      console.error('Kakao Maps SDK를 불러오지 못했습니다. VITE_KAKAO_MAP_KEY를 확인하세요.');
      return;
    }

    window.kakao.maps.load(() => {
      const kakao = window.kakao;
      const center = new kakao.maps.LatLng(CENTER[0], CENTER[1]);
      const map = new kakao.maps.Map(mapElRef.current, { center, level: 7 });
      map.addControl(new kakao.maps.ZoomControl(), kakao.maps.ControlPosition.RIGHT);
      mapRef.current = map;
      setTimeout(() => map.relayout(), 60);
      draw();
    });

    return () => {
      clearOverlays();
      mapRef.current = null;
    };
  }, []);

  // 화면/결과/필터가 바뀔 때마다 마커·원·뷰를 다시 그린다
  useEffect(() => {
    draw();
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
