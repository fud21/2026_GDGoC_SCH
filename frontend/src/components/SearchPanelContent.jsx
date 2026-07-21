// 로고 + 검색창 + (검색 결과에 따라) 분석 버튼 or 안내문
// 모바일의 지도 위 카드, 데스크탑의 옆 패널 둘 다 이 컴포넌트를 공유해서 씀
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

      {/* 검색으로 위치를 찾았으면 분석 버튼을, 아직이면 안내 문구를 보여줌 */}
      {markerPos ? (
        <div className="bottom-panel">
          <p className="found-address">📍 {foundAddress}</p>
          {/* policeReady: 파출소 좌표 변환이 끝나야 정확한 점수 계산이 가능해서 그 전까진 버튼 비활성화 */}
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
