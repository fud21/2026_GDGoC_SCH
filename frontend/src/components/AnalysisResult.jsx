export default function AnalysisResult({ result, location, onDetail, onBack, panelMode }) {
  const { totalScore, grade, color, bg, desc, details } = result;

  return (
    <div className={panelMode ? 'panel-section' : 'screen screen-scroll'}>
      <div className="app-bar">
        <button className="back-btn" onClick={onBack}>←</button>
        <span className="app-bar-title">분석 결과</span>
      </div>

      <div className="address-chip">📍 {location.address}</div>

      <div className="grade-card" style={{ borderColor: color, backgroundColor: bg }}>
        <div className="grade-letter" style={{ color }}>{grade}</div>
        <div className="grade-score">{totalScore}점</div>
        <div className="grade-desc">{desc}</div>
      </div>

      <div className="section">
        <div className="section-header">
          <h3 className="section-title">보안시설</h3>
          <span className="section-weight">60%</span>
        </div>

        <DetailRow
          icon="📹"
          label="CCTV"
          value={`500m 이내 ${details.cctv.count}대`}
          score={`+${details.cctv.score}점`}
          scoreColor="#3b82f6"
        />
        <DetailRow
          icon="💡"
          label="보안등"
          value={`200m 이내 ${details.lamp.count}개`}
          score={`+${details.lamp.score}점`}
          scoreColor="#eab308"
        />
        <DetailRow
          icon="🚔"
          label="경찰서·지구대"
          value={
            details.police.distance < 99999
              ? `최근접 ${details.police.distance}m`
              : '1km 초과'
          }
          score={`+${details.police.score}점`}
          scoreColor="#22c55e"
        />
        <ProgressBar value={details.security.pct} color="#3b82f6" />
      </div>

      <div className="section">
        <div className="section-header">
          <h3 className="section-title">환경조명</h3>
          <span className="section-weight">20%</span>
        </div>
        <DetailRow
          icon="🌙"
          label="야간 밝기"
          value={
            details.lamp.count >= 20 ? '밝음 (70% 이상)' :
            details.lamp.count >= 8  ? '보통 (30~70%)' : '어두움 (30% 미만)'
          }
          score={`${details.brightness.score >= 0 ? '+' : ''}${details.brightness.score}점`}
          scoreColor={details.brightness.score >= 0 ? '#22c55e' : '#ef4444'}
        />
        <ProgressBar value={details.brightness.pct} color="#a855f7" />
      </div>

      <div className="section">
        <div className="section-header">
          <h3 className="section-title">범죄정보</h3>
          <span className="section-weight">20%</span>
        </div>
        <DetailRow
          icon="📊"
          label="관악구 2024년 범죄"
          value={`총 ${details.crime.totalCrimes.toLocaleString()}건`}
          score={`${details.crime.score}점`}
          scoreColor={details.crime.score < 0 ? '#ef4444' : '#22c55e'}
        />
      </div>

      <div className="action-buttons">
        <button className="btn-secondary" onClick={onDetail}>
          보안시설 상세보기 →
        </button>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value, score, scoreColor }) {
  return (
    <div className="detail-row">
      <span className="detail-icon">{icon}</span>
      <div className="detail-info">
        <span className="detail-label">{label}</span>
        <span className="detail-value">{value}</span>
      </div>
      <span className="detail-score" style={{ color: scoreColor }}>{score}</span>
    </div>
  );
}

function ProgressBar({ value, color }) {
  return (
    <div className="progress-bg">
      <div className="progress-fill" style={{ width: `${value}%`, backgroundColor: color }} />
    </div>
  );
}
