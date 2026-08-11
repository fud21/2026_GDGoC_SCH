import { useState } from 'react';
import StepProfile from './components/Onboarding/StepProfile';
import StepAddress from './components/Onboarding/StepAddress';
import MainLayout from './components/Main/MainLayout';
import { computeSafety } from './utils/mockSafety';
import './styles/variables.css';
import './styles/global.css';

// 앱의 최상위 컴포넌트. 화면 상태 5개를 관리한다:
// onboard-profile → onboard-address → main(검색 대기) → result(등급) → detail(시설 상세)
// main/result/detail은 MainLayout 하나가 담당하고, 내부에서 sidebar 콘텐츠만 바꾼다.
// 점수 계산은 아직 mockSafety(목업)를 쓰고, 나중에 api/safetyApi.js로 교체할 예정.
export default function App() {
  const [screen, setScreen] = useState('onboard-profile');
  const [userProfile, setUserProfile] = useState(null); // { name, age, gender }
  const [homeAddress, setHomeAddress] = useState(''); // 온보딩에서 입력한 주소
  const [currentResult, setCurrentResult] = useState(null); // mockSafety.computeSafety() 결과
  const [recents, setRecents] = useState([]); // 최근 검색 (최대 6개)

  const handleProfileSubmit = (profile) => {
    setUserProfile(profile);
    setScreen('onboard-address');
  };

  const handleAddressSubmit = (address) => {
    setHomeAddress(address);
    setScreen('main');
  };

  const handleSearch = (address) => {
    const result = computeSafety(address);
    setCurrentResult(result);
    setRecents((prev) => [
      { addr: address, grade: result.grade, score: result.score },
      ...prev.filter((r) => r.addr !== address),
    ].slice(0, 6));
    setScreen('result');
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
