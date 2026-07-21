import { Map, MapMarker } from 'react-kakao-maps-sdk';

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
