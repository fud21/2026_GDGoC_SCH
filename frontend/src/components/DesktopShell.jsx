import { useState } from 'react';
import { useLocationSearch } from '../hooks/useLocationSearch';
import SidePanel from './SidePanel';
import SearchPanelContent from './SearchPanelContent';
import LocationMap from './LocationMap';
import AnalysisResult from './AnalysisResult';
import SecurityDetail from './SecurityDetail';

// 데스크탑(768px 이상) 전용 화면 뼈대
// 지도는 화면 전체에 고정하고, 그 위에 여닫히는 옆 패널(SidePanel)을 띄우는 구조
// 패널 안 내용은 현재 screen 상태('main'|'result'|'detail')에 따라 검색/결과/상세로 바뀜
export default function DesktopShell({
  kakaoLoaded,
  policeReady,
  screen,
  result,
  location,
  onAnalyze,
  onDetail,
  onBackToMain,
  onBackToResult,
}) {
  const [panelOpen, setPanelOpen] = useState(true); // 패널 열림/닫힘 상태
  const search = useLocationSearch(kakaoLoaded); // 검색창 로직 (모바일 MainMap과 공유)

  return (
    <div className="desktop-shell">
      <SidePanel open={panelOpen} onToggle={() => setPanelOpen(o => !o)}>
        {screen === 'main' && (
          <SearchPanelContent
            {...search}
            policeReady={policeReady}
            onAnalyze={() => onAnalyze({ ...search.markerPos, address: search.foundAddress })}
          />
        )}
        {screen === 'result' && result && (
          // panelMode: 전체화면이 아니라 패널 안에 들어가는 축소된 형태로 렌더링
          <AnalysisResult
            panelMode
            result={result}
            location={location}
            onDetail={onDetail}
            onBack={onBackToMain}
          />
        )}
        {screen === 'detail' && result && (
          <SecurityDetail
            panelMode
            result={result}
            location={location}
            onBack={onBackToResult}
          />
        )}
      </SidePanel>

      {/* 지도는 패널 상태와 무관하게 항상 화면 전체 크기로 고정됨 (App.css의 position:absolute 참고) */}
      <div className="map-container">
        <LocationMap kakaoLoaded={kakaoLoaded} center={search.mapCenter} markerPos={search.markerPos} />
      </div>
    </div>
  );
}
