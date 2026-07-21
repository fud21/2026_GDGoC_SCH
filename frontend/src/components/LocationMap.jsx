import { Map, MapMarker } from 'react-kakao-maps-sdk';

// 카카오맵 하나 + (있으면) 마커 하나만 그리는 가장 기본적인 지도 컴포넌트
// kakaoLoaded가 false면 SDK 로딩이 안 끝난 것이므로 로딩 문구만 표시
export default function LocationMap({ kakaoLoaded, center, markerPos, level = 5 }) {
  if (!kakaoLoaded) {
    return <div className="map-loading">지도 불러오는 중...</div>;
  }

  return (
    <Map center={center} style={{ width: '100%', height: '100%' }} level={level}>
      {markerPos && <MapMarker position={markerPos} />}
    </Map>
  );
}
