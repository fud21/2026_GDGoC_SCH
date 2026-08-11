import { Map, CustomOverlayMap } from 'react-kakao-maps-sdk';

// "보안시설 상세보기" 화면: 반경 내 CCTV/보안등 개수와 가장 가까운 파출소까지의 거리를 보여줌
// 주의: 백엔드 /api/safety-score는 개별 시설의 좌표를 내려주지 않으므로,
// (예전 클라이언트 자체 계산 때와 달리) 지도에는 검색된 위치(★)만 표시한다
export default function SecurityDetail({ result, location, onBack, panelMode }) {
  const { details } = result;

  return (
    <div className={panelMode ? 'panel-section' : 'screen screen-scroll'}>
      <div className="app-bar">
        <button className="back-btn" onClick={onBack}>←</button>
        <span className="app-bar-title">보안시설 상세</span>
      </div>

      <div className="mini-map-container">
        <Map
          center={{ lat: location.lat, lng: location.lng }}
          style={{ width: '100%', height: '100%' }}
          level={4}
        >
          <CustomOverlayMap position={{ lat: location.lat, lng: location.lng }}>
            <div className="map-dot-star">★</div>
          </CustomOverlayMap>
        </Map>
      </div>

      <div className="legend">
        <span className="legend-item"><span className="legend-dot" style={{ background: '#8b5cf6' }} />내 위치</span>
      </div>

      <div className="section">
        <h3 className="section-title">📹 CCTV</h3>
        <div className="stat-row">
          <span>반경 {details.radiusMeters}m 이내</span>
          <strong>{details.cctv.count}대</strong>
        </div>
      </div>

      <div className="section">
        <h3 className="section-title">💡 보안등</h3>
        <div className="stat-row">
          <span>반경 {details.radiusMeters}m 이내</span>
          <strong>{details.lamp.count}개</strong>
        </div>
      </div>

      <div className="section">
        <h3 className="section-title">🚔 경찰서·지구대</h3>
        <div className="stat-row">
          <span>가장 가까운 기관까지 거리</span>
          <strong>{details.police.distance != null ? `${details.police.distance}m` : '정보 없음'}</strong>
        </div>
      </div>
    </div>
  );
}
