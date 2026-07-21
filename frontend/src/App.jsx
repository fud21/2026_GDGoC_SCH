import { useState, useEffect, useRef } from 'react';
import { loadCSVData } from './utils/csvParser';
import { calculateScore } from './utils/scoreCalculator';
import MainMap from './components/MainMap';
import AnalysisResult from './components/AnalysisResult';
import SecurityDetail from './components/SecurityDetail';
import DesktopShell from './components/DesktopShell';
import './App.css';

// 화면 너비가 768px 이상이면 데스크탑, 아니면 모바일로 판단하는 훅
// 창 크기가 바뀌면(resize) 자동으로 다시 계산됨
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

// 앱의 최상위 컴포넌트
// 전체 흐름: 데이터 로딩 → 주소 검색 → 점수 계산 → 결과/상세 화면 표시
export default function App() {
  const [kakaoLoaded, setKakaoLoaded] = useState(false); // 카카오맵 SDK 로딩 완료 여부
  const [screen, setScreen] = useState('main'); // 현재 화면: 'main' | 'result' | 'detail'
  const [csvData, setCsvData] = useState(null); // CCTV/보안등/파출소/범죄통계 데이터
  const [location, setLocation] = useState(null); // 분석 대상으로 선택된 좌표
  const [result, setResult] = useState(null); // calculateScore()로 계산된 결과
  const [policeReady, setPoliceReady] = useState(false); // 파출소 좌표 변환 완료 여부
  const geocodingDoneRef = useRef(false); // 파출소 좌표 변환을 딱 한 번만 실행하기 위한 플래그
  const isDesktop = useIsDesktop();

  // 앱이 처음 켜질 때 CSV 데이터를 한 번 불러옴
  useEffect(() => {
    loadCSVData().then(setCsvData);
  }, []);

  // 카카오맵 SDK가 준비되면 kakaoLoaded를 true로 설정
  useEffect(() => {
    if (!window.kakao) return;
    window.kakao.maps.load(() => setKakaoLoaded(true));
  }, []);

  // 카카오맵과 CSV 데이터가 모두 준비되면, 주소만 있고 좌표가 없는 파출소들을
  // 카카오 Geocoder로 한 번에 좌표 변환함 (csvParser.js에서 lat/lng를 null로 남겨둔 부분)
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

  // "이 위치 분석하기" 버튼을 눌렀을 때: 점수를 계산하고 결과 화면으로 전환
  const handleAnalyze = (loc) => {
    setLocation(loc);
    if (csvData) {
      setResult(calculateScore(loc.lat, loc.lng, csvData));
      setScreen('result');
    }
  };

  // 데스크탑: 지도 + 여닫는 옆 패널 레이아웃
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

  // 모바일: 화면 전체가 main → result → detail 순서로 전환되는 방식
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
