import { useLocationSearch } from '../hooks/useLocationSearch';
import SearchPanelContent from './SearchPanelContent';
import LocationMap from './LocationMap';

// 모바일(768px 미만) 첫 화면: 지도 위에 검색창 카드를 겹쳐 보여줌
// 카드 내용은 SearchPanelContent가 담당하고, 여기서는 지도와 배치만 담당
export default function MainMap({ kakaoLoaded, policeReady, onAnalyze }) {
  const search = useLocationSearch(kakaoLoaded);

  return (
    <div className="screen main-screen">
      {/* map-overlay: 지도 위에 절대 위치로 떠 있는 카드 (App.css에서 위치 지정) */}
      <div className="map-overlay">
        <SearchPanelContent
          {...search}
          policeReady={policeReady}
          onAnalyze={() => onAnalyze({ ...search.markerPos, address: search.foundAddress })}
        />
      </div>

      <div className="map-container">
        <LocationMap kakaoLoaded={kakaoLoaded} center={search.mapCenter} markerPos={search.markerPos} />
      </div>
    </div>
  );
}
