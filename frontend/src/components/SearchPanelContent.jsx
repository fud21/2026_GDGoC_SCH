export default function SearchPanelContent({
  searchText,
  setSearchText,
  handleSearch,
  searching,
  foundAddress,
  markerPos,
  policeReady,
  onAnalyze,
}) {
  return (
    <>
      <div className="main-header">
        <h1 className="logo">안심집</h1>
        <p className="logo-sub">1인 가구 안심 주거 환경 분석</p>
      </div>

      <div className="search-bar">
        <input
          className="search-input"
          type="text"
          placeholder="주소를 입력하세요 (예: 관악구 봉천동 123)"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <button className="search-btn" onClick={handleSearch} disabled={searching}>
          {searching ? '...' : '검색'}
        </button>
      </div>

      {markerPos ? (
        <div className="bottom-panel">
          <p className="found-address">📍 {foundAddress}</p>
          <button className="btn-primary" disabled={!policeReady} onClick={onAnalyze}>
            {policeReady ? '이 위치 분석하기' : '데이터 준비 중...'}
          </button>
        </div>
      ) : (
        <div className="bottom-hint">
          <p>분석할 주소를 검색하세요</p>
          <p className="hint-sub">관악구 내 주소를 입력하면 안전 점수를 확인할 수 있어요</p>
        </div>
      )}
    </>
  );
}
