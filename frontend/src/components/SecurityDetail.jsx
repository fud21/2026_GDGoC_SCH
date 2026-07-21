import { Map, CustomOverlayMap } from 'react-kakao-maps-sdk';
import { haversineDistance } from '../utils/geoUtils';

export default function SecurityDetail({ result, location, onBack, panelMode }) {
  const { details } = result;
  const policeWithCoords = details.police.all.filter(p => p.lat && p.lng);

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
          {details.cctv.nearby.map((c, i) => (
            <CustomOverlayMap key={`cctv-${i}`} position={{ lat: c.lat, lng: c.lng }}>
              <div className="map-dot" style={{ background: '#3b82f6' }} />
            </CustomOverlayMap>
          ))}

          {details.lamp.nearby.map((l, i) => (
            <CustomOverlayMap key={`lamp-${i}`} position={{ lat: l.lat, lng: l.lng }}>
              <div className="map-dot" style={{ background: '#eab308' }} />
            </CustomOverlayMap>
          ))}

          {policeWithCoords.map((p, i) => (
            <CustomOverlayMap key={`police-${i}`} position={{ lat: p.lat, lng: p.lng }}>
              <div className="map-dot" style={{ background: '#ef4444' }} />
            </CustomOverlayMap>
          ))}

          <CustomOverlayMap position={{ lat: location.lat, lng: location.lng }}>
            <div className="map-dot-star">★</div>
          </CustomOverlayMap>
        </Map>
      </div>

      <div className="legend">
        <span className="legend-item"><span className="legend-dot" style={{ background: '#8b5cf6' }} />내 위치</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#3b82f6' }} />CCTV</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#eab308' }} />보안등</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#ef4444' }} />경찰서</span>
      </div>

      <div className="section">
        <h3 className="section-title">📹 CCTV</h3>
        <div className="stat-row">
          <span>500m 이내 총 대수</span>
          <strong>{details.cctv.count}대</strong>
        </div>
        <ScoreChip score={details.cctv.score} max={3} color="#3b82f6" />
      </div>

      <div className="section">
        <h3 className="section-title">💡 보안등</h3>
        <div className="stat-row">
          <span>200m 이내 개수</span>
          <strong>{details.lamp.count}개</strong>
        </div>
        <ScoreChip score={details.lamp.score} max={5} color="#eab308" />
      </div>

      <div className="section">
        <h3 className="section-title">🚔 경찰서·지구대</h3>
        {details.police.nearest && (
          <div className="stat-row">
            <span>가장 가까운 기관</span>
            <strong>{details.police.nearest.name} ({details.police.distance}m)</strong>
          </div>
        )}
        <ScoreChip score={details.police.score} max={15} color="#22c55e" />

        <div className="police-list">
          {policeWithCoords
            .map(p => ({
              ...p,
              dist: Math.round(haversineDistance(location.lat, location.lng, p.lat, p.lng)),
            }))
            .sort((a, b) => a.dist - b.dist)
            .map((p, i) => (
              <div key={i} className="police-item">
                <span>{p.name}</span>
                <span className="police-dist">{p.dist}m</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function ScoreChip({ score, max, color }) {
  return (
    <div className="score-chip" style={{ borderColor: color, color }}>
      {score}점 / {max}점 만점
    </div>
  );
}
