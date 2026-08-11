import { useState } from 'react';
import SearchPanel from './SearchPanel';
import ResultPanel from './ResultPanel';
import DetailPanel from './DetailPanel';
import MapView from './MapView';

const ALL_FILTER_TYPES = ['cctv', 'light', 'police'];

// 메인 화면 뼈대: topbar + (sidebar + map) 레이아웃.
// sidebar 안쪽 내용은 screen('main'|'result'|'detail')에 따라 검색/결과/상세로 바뀐다.
export default function MainLayout({
  userProfile,
  homeAddress,
  screen,
  currentResult,
  recents,
  onSearch,
  onShowDetail,
  onBackToResult,
  onBackToSearch,
  onBackToOnboarding,
}) {
  const [activeFilters, setActiveFilters] = useState(ALL_FILTER_TYPES);

  const toggleFilter = (type) => {
    setActiveFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <section className="screen active">
      <div className="topbar">
        <button className="icon-btn" onClick={onBackToOnboarding} title="뒤로">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="#191F28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="title">관악 안심지도</div>
        <div className="avatar">{userProfile?.name?.[0] || '-'}</div>
      </div>

      <div className="main-body">
        <div className="sidebar">
          {screen === 'main' && (
            <SearchPanel homeAddress={homeAddress} recents={recents} onSearch={onSearch} />
          )}
          {screen === 'result' && currentResult && (
            <ResultPanel result={currentResult} onBack={onBackToSearch} onDetail={onShowDetail} />
          )}
          {screen === 'detail' && currentResult && (
            <DetailPanel
              result={currentResult}
              onBack={onBackToResult}
              activeFilters={activeFilters}
              onToggleFilter={toggleFilter}
            />
          )}
        </div>

        <MapView screen={screen} result={currentResult} activeFilters={activeFilters} />
      </div>
    </section>
  );
}
