import { useEffect, useRef } from 'react';
import { GRADE_COLOR, GRADE_DESC } from '../../utils/mockSafety';

const RADIUS = 74;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// 사이드바 - 결과 상태: 등급 링 차트 + 항목별 지표 + 상세보기 버튼
export default function ResultPanel({ result, onBack, onDetail }) {
  const ringRef = useRef(null);

  // 마운트/결과 변경 시 0에서 점수만큼 링이 차오르는 애니메이션 (프로토타입과 동일한 방식)
  useEffect(() => {
    const ring = ringRef.current;
    if (!ring) return;
    ring.style.transition = 'none';
    ring.style.strokeDashoffset = String(CIRCUMFERENCE);
    requestAnimationFrame(() => {
      ring.style.transition = 'stroke-dashoffset .8s ease, stroke .3s';
      ring.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - result.score / 100));
    });
  }, [result]);

  const { addr, grade, score } = result;
  const color = GRADE_COLOR[grade];

  return (
    <div className="sub-state on">
      <div className="back-row" onClick={onBack}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        다시 검색
      </div>
      <div className="result-addr">{addr}</div>
      <div className="result-addr-sub">방금 확인 · 예시 데이터 기반</div>

      <div className="grade-card">
        <div className="grade-ring-wrap">
          <svg width="168" height="168" viewBox="0 0 168 168">
            <circle cx="84" cy="84" r={RADIUS} fill="none" stroke="#E5E8EB" strokeWidth="14" />
            <circle
              ref={ringRef}
              cx="84" cy="84" r={RADIUS}
              fill="none"
              stroke={color}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE}
            />
          </svg>
          <div className="grade-center">
            <div className="grade-letter" style={{ color }}>{grade}</div>
            <div className="grade-score">{score} / 100점</div>
          </div>
        </div>
        <div className="grade-desc">{GRADE_DESC[grade]}</div>
      </div>

      <div className="metric-grid">
        <div className="metric-box">
          <div className="k">주변 CCTV</div>
          <div className="v">{result.cctv}<span> 대</span></div>
        </div>
        <div className="metric-box">
          <div className="k">보안등</div>
          <div className="v">{result.light}<span> 개</span></div>
        </div>
        <div className="metric-box">
          <div className="k">최근 파출소</div>
          <div className="v">{result.police}<span> m</span></div>
        </div>
        <div className="metric-box">
          <div className="k">야간 통행량</div>
          <div className="v">{result.traffic}</div>
        </div>
      </div>

      <button className="detail-btn" onClick={onDetail}>
        지도에서 상세 시설 보기
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
