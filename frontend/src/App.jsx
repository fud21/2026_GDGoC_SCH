import { useState } from 'react';
import StepProfile from './components/Onboarding/StepProfile';
import StepAddress from './components/Onboarding/StepAddress';
import MainLayout from './components/Main/MainLayout';
import { fetchSafetyScore, toAnalysisResult } from './api/safetyApi';
import { computeSafety } from './utils/mockSafety';
import './styles/variables.css';
import './styles/global.css';

// 앱의 최상위 컴포넌트. 화면 상태 5개를 관리한다:
// onboard-profile → onboard-address → main(검색 대기) → result(등급) → detail(시설 상세)
// main/result/detail은 MainLayout 하나가 담당하고, 내부에서 sidebar 콘텐츠만 바꾼다.
//
// 점수 계산은 백엔드 /api/safety-score(safetyApi.js)를 우선 호출하고,
// 백엔드가 꺼져있거나(네트워크 실패) 서버 내부 오류(500 — 예: KAKAO_API_KEY 미설정)일 때만
// mockSafety.js로 폴백한다. 주소를 못 찾거나(404) 관악구 밖(422)처럼 "입력이 잘못된" 경우는
// 폴백하지 않고 실제 에러를 그대로 보여준다 (mockSafety.js는 시연 안정성을 위해 남겨둔 폴백용).
export default function App() {
  const [screen, setScreen] = useState('onboard-profile');
  const [userProfile, setUserProfile] = useState(null); // { name, age, gender }
  const [homeAddress, setHomeAddress] = useState(''); // 온보딩에서 입력한 주소
  const [currentResult, setCurrentResult] = useState(null); // toAnalysisResult() / computeSafety() 결과
  const [recents, setRecents] = useState([]); // 최근 검색 (최대 6개)
  const [analyzing, setAnalyzing] = useState(false); // 검색 → 점수 계산 진행 중 여부

  const handleProfileSubmit = (profile) => {
    setUserProfile(profile);
    setScreen('onboard-address');
  };

  const handleAddressSubmit = (address) => {
    setHomeAddress(address);
    setScreen('main');
  };

  const finalizeSearch = (address, result) => {
    setCurrentResult(result);
    setRecents((prev) => [
      { addr: address, grade: result.grade, score: result.score },
      ...prev.filter((r) => r.addr !== address),
    ].slice(0, 6));
    setScreen('result');
  };

  const handleSearch = async (address) => {
    setAnalyzing(true);
    try {
      const data = await fetchSafetyScore(address);
      finalizeSearch(address, toAnalysisResult(data));
    } catch (err) {
      // 400(주소 누락)/404(주소 못 찾음)/422(관악구 밖)는 입력 문제 — 폴백하지 않고 안내만
      if (err.status === 400 || err.status === 404 || err.status === 422) {
        alert(err.message || '요청을 처리하지 못했습니다.');
      } else {
        // 네트워크 실패(백엔드 꺼짐, err.status 없음) 또는 500(서버 내부 오류) — 데모 모드로 폴백
        alert('백엔드 서버에 연결할 수 없습니다. 데모 모드로 전환합니다.');
        finalizeSearch(address, computeSafety(address));
      }
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div id="app">
      {screen === 'onboard-profile' && (
        <StepProfile onSubmit={handleProfileSubmit} />
      )}

      {screen === 'onboard-address' && (
        <StepAddress onSubmit={handleAddressSubmit} />
      )}

      {(screen === 'main' || screen === 'result' || screen === 'detail') && (
        <MainLayout
          userProfile={userProfile}
          homeAddress={homeAddress}
          screen={screen}
          currentResult={currentResult}
          recents={recents}
          analyzing={analyzing}
          onSearch={handleSearch}
          onShowDetail={() => setScreen('detail')}
          onBackToResult={() => setScreen('result')}
          onBackToSearch={() => setScreen('main')}
          onBackToOnboarding={() => setScreen('onboard-address')}
        />
      )}
    </div>
  );
}
