// 점수 계산 결과(등급 카드 + 항목별 요약)를 보여주는 화면
// panelMode=true면 데스크탑 옆 패널 안에, false면 모바일 전체화면으로 렌더링됨
export default function AnalysisResult({ result, location, onDetail, onBack, panelMode }) {
  const { totalScore, grade, color, bg, desc, details } = result;

  return (
    <div className={panelMode ? 'panel-section' : 'screen screen-scroll'}>
      <div className="app-bar">
        <button className="back-btn" onClick={onBack}>←</button>
        <span className="app-bar-title">분석 결과</span>
      </div>

      <div className="address-chip">📍 {location.address}</div>

      {/* 등급(S~D)에 따른 색상은 safetyApi.js의 GRADE_STYLE을 그대로 사용 */}
      <div className="grade-card" style={{ borderColor: color, backgroundColor: bg }}>
        <div className="grade-letter" style={{ color }}>{grade}</div>
        <div className="grade-score">{totalScore}점</div>
        <div className="grade-desc">{desc}</div>
      </div>

      {/* 보안시설(CCTV/보안등/경찰서) — 백엔드가 반경 내 개수·최근접 거리만 내려주므로
          항목별 점수 대신 전체 안전 점수 하나로 진행바를 표시한다 */}
      <div className="section">
        <div className="section-header">
          <h3 className="section-title">보안시설</h3>
        </div>

        <DetailRow
          icon="📹"
          label="CCTV"
          value={`반경 ${details.radiusMeters}m 이내 ${details.cctv.count}대`}
        />
        <DetailRow
          icon="💡"
          label="보안등"
          value={`반경 ${details.radiusMeters}m 이내 ${details.lamp.count}개`}
        />
        <DetailRow
          icon="🚔"
          label="경찰서·지구대"
          value={
            details.police.distance != null
              ? `최근접 ${details.police.distance}m`
              : '거리 정보 없음'
          }
        />
        <ProgressBar value={totalScore} color="#3b82f6" />
      </div>

      <div className="action-buttons">
        <button className="btn-secondary" onClick={onDetail}>
          보안시설 상세보기 →
        </button>
      </div>
    </div>
  );
}

// 아이콘 + 라벨 + 값 한 줄을 그리는 재사용 컴포넌트
function DetailRow({ icon, label, value }) {
  return (
    <div className="detail-row">
      <span className="detail-icon">{icon}</span>
      <div className="detail-info">
        <span className="detail-label">{label}</span>
        <span className="detail-value">{value}</span>
      </div>
    </div>
  );
}

// 항목별 점수 비율(pct)을 막대로 시각화
function ProgressBar({ value, color }) {
  return (
    <div className="progress-bg">
      <div className="progress-fill" style={{ width: `${value}%`, backgroundColor: color }} />
    </div>
  );
}
