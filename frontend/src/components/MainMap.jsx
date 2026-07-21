import { useLocationSearch } from '../hooks/useLocationSearch';
import SearchPanelContent from './SearchPanelContent';
import LocationMap from './LocationMap';

export default function MainMap({ kakaoLoaded, policeReady, onAnalyze }) {
  const search = useLocationSearch(kakaoLoaded);

  return (
    <div className="screen main-screen">
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
