import { useState } from 'react';
import { GRADE_COLOR } from '../../utils/mockSafety';

// 사이드바 - 검색 대기 상태: 검색바 + 내 동네 홈카드 + 최근 검색 목록
export default function SearchPanel({ homeAddress, recents, onSearch }) {
  const [searchText, setSearchText] = useState('');

  const handleGo = () => {
    const trimmed = searchText.trim();
    if (!trimmed) return;
    onSearch(`서울 관악구 ${trimmed.replace('서울 관악구', '').trim()}`);
    setSearchText('');
  };

  return (
    <div className="sub-state on">
      <div className="search-bar">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="#8B95A1" strokeWidth="2" />
          <path d="M21 21l-4-4" stroke="#8B95A1" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          placeholder="확인하고 싶은 주소를 검색하세요"
          autoComplete="off"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGo()}
        />
        <button className="search-go" onClick={handleGo}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="section-label">내 동네</div>
      <div className="home-card" onClick={() => homeAddress && onSearch(homeAddress)}>
        <div className="ico">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <path d="M3 11l9-7 9 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <div className="t1">{homeAddress || '주소 미등록'}</div>
          <div className="t2">등록한 주소의 안전등급 바로 보기</div>
        </div>
      </div>

      <div className="section-label">최근 검색</div>
      {recents.length > 0 ? (
        recents.slice(0, 6).map((r, i) => (
          <div key={`${r.addr}-${i}`} className="recent-item" onClick={() => onSearch(r.addr)}>
            <div className="ico">📍</div>
            <div style={{ flex: 1 }}>
              <div className="addr">{r.addr}</div>
              <div className="meta">{r.score}점</div>
            </div>
            <div className="grade-chip" style={{ background: GRADE_COLOR[r.grade] }}>{r.grade}등급</div>
          </div>
        ))
      ) : (
        <div className="empty-hint">
          <div className="big">🔎</div>
          검색 기록이 없어요.<br />주소를 검색해 안전등급을 확인해보세요.
        </div>
      )}
    </div>
  );
}
