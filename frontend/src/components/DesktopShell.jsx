import { useState } from 'react';
import { useLocationSearch } from '../hooks/useLocationSearch';
import SidePanel from './SidePanel';
import SearchPanelContent from './SearchPanelContent';
import LocationMap from './LocationMap';
import AnalysisResult from './AnalysisResult';
import SecurityDetail from './SecurityDetail';

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
  const [panelOpen, setPanelOpen] = useState(true);
  const search = useLocationSearch(kakaoLoaded);

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

      <div className="map-container">
        <LocationMap kakaoLoaded={kakaoLoaded} center={search.mapCenter} markerPos={search.markerPos} />
      </div>
    </div>
  );
}
