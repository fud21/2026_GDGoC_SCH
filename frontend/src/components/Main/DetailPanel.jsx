import { TYPE_META } from '../../utils/mockSafety';

const FILTER_TYPES = ['cctv', 'light', 'police'];

// 사이드바 - 상세 상태: 필터 칩 + 주변 시설 목록
// 필터 칩은 지도 마커만 필터링하고, 이 목록 자체는 항상 전체를 보여준다 (프로토타입과 동일)
export default function DetailPanel({ result, onBack, activeFilters, onToggleFilter }) {
  return (
    <div className="sub-state on">
      <div className="back-row" onClick={onBack}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        등급 요약으로
      </div>
      <div className="result-addr" style={{ fontSize: 16, marginTop: 10 }}>{result.addr}</div>

      <div className="filter-row">
        {FILTER_TYPES.map((type) => (
          <div
            key={type}
            className={`filter-chip${activeFilters.includes(type) ? ' on' : ''}`}
            data-type={type}
            onClick={() => onToggleFilter(type)}
          >
            <span className="dot" style={{ background: TYPE_META[type].color }} />
            {TYPE_META[type].label}
          </div>
        ))}
      </div>

      <div className="section-label">주변 시설 (가까운 순)</div>
      {result.facilities.length > 0 ? (
        <div>
          {result.facilities.map((f, i) => (
            <div key={i} className="facility-item">
              <div className="ico" style={{ background: TYPE_META[f.type].color }}>{TYPE_META[f.type].glyph}</div>
              <div style={{ flex: 1 }}>
                <div className="name">{f.name}</div>
                <div className="dist">{f.dist}m</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-hint">
          <div className="big">🔍</div>
          주변에서 시설 데이터를 찾지 못했어요
        </div>
      )}

      {result.isMock && (
        <div className="note-box">지도 마커는 서비스 소개를 위한 예시 위치이며, 실제 CCTV·보안등·파출소 데이터가 아닙니다.</div>
      )}

      {result.crime && (
        <>
          <div className="section-label">
            관악구 전체 범죄현황 ({result.crime.year}년 · {result.crime.source} 기준)
          </div>
          <div className="metric-grid">
            <div className="metric-box">
              <div className="k">절도</div>
              <div className="v">{result.crime.theft}<span> 건</span></div>
            </div>
            <div className="metric-box">
              <div className="k">폭력</div>
              <div className="v">{result.crime.violence}<span> 건</span></div>
            </div>
            <div className="metric-box">
              <div className="k">강도</div>
              <div className="v">{result.crime.rob}<span> 건</span></div>
            </div>
            <div className="metric-box">
              <div className="k">살인</div>
              <div className="v">{result.crime.kill}<span> 건</span></div>
            </div>
          </div>
          <div className="note-box">이 통계는 검색 주소가 아닌 관악구 전체 기준입니다.</div>
        </>
      )}
    </div>
  );
}
