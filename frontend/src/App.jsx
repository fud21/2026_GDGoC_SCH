import { useState, useEffect, useRef } from 'react';
import { loadCSVData } from './utils/csvParser';
import { calculateScore } from './utils/scoreCalculator';
import MainMap from './components/MainMap';
import AnalysisResult from './components/AnalysisResult';
import SecurityDetail from './components/SecurityDetail';
import DesktopShell from './components/DesktopShell';
import './App.css';

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => window.matchMedia('(min-width: 768px)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = e => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isDesktop;
}

export default function App() {
  const [kakaoLoaded, setKakaoLoaded] = useState(false);
  const [screen, setScreen] = useState('main');
  const [csvData, setCsvData] = useState(null);
  const [location, setLocation] = useState(null);
  const [result, setResult] = useState(null);
  const [policeReady, setPoliceReady] = useState(false);
  const geocodingDoneRef = useRef(false);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    loadCSVData().then(setCsvData);
  }, []);

  useEffect(() => {
    if (!window.kakao) return;
    window.kakao.maps.load(() => setKakaoLoaded(true));
  }, []);

  useEffect(() => {
    if (!kakaoLoaded || !csvData || geocodingDoneRef.current) return;
    geocodingDoneRef.current = true;

    const geocoder = new window.kakao.maps.services.Geocoder();
    const promises = csvData.police.map(station =>
      new Promise(resolve => {
        if (!station.address) return resolve(station);
        geocoder.addressSearch(station.address, (res, status) => {
          if (status === window.kakao.maps.services.Status.OK && res.length > 0) {
            resolve({ ...station, lat: parseFloat(res[0].y), lng: parseFloat(res[0].x) });
          } else {
            resolve(station);
          }
        });
      })
    );

    Promise.all(promises).then(geocodedPolice => {
      setCsvData(prev => ({ ...prev, police: geocodedPolice }));
      setPoliceReady(true);
    });
  }, [kakaoLoaded, csvData]);

  const handleAnalyze = (loc) => {
    setLocation(loc);
    if (csvData) {
      setResult(calculateScore(loc.lat, loc.lng, csvData));
      setScreen('result');
    }
  };

  if (isDesktop) {
    return (
      <div className="app-container app-container--desktop">
        <DesktopShell
          kakaoLoaded={kakaoLoaded}
          policeReady={policeReady}
          screen={screen}
          result={result}
          location={location}
          onAnalyze={handleAnalyze}
          onDetail={() => setScreen('detail')}
          onBackToMain={() => setScreen('main')}
          onBackToResult={() => setScreen('result')}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      {screen === 'main' && (
        <MainMap kakaoLoaded={kakaoLoaded} policeReady={policeReady} onAnalyze={handleAnalyze} />
      )}
      {screen === 'result' && result && (
        <AnalysisResult
          result={result}
          location={location}
          onDetail={() => setScreen('detail')}
          onBack={() => setScreen('main')}
        />
      )}
      {screen === 'detail' && result && (
        <SecurityDetail
          result={result}
          location={location}
          onBack={() => setScreen('result')}
        />
      )}
    </div>
  );
}
