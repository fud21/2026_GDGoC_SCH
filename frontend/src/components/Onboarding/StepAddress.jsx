import { useState } from 'react';

// 디자인 프로토타입(index.html)의 DONG_LIST를 그대로 사용
const DONG_LIST = [
  '신림동', '봉천동', '남현동', '서울대입구', '낙성대동', '신사동(관악)', '대학동',
  '청룡동', '인헌동', '조원동', '미성동', '난곡동', '신원동', '성현동',
];

// 온보딩 2단계: 주소 입력 + 동 이름 자동완성. 목록에서 동을 선택해야 "시작하기"가 활성화됨
export default function StepAddress({ onSubmit }) {
  const [inputValue, setInputValue] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');

  const trimmed = inputValue.trim();
  const matches = trimmed ? DONG_LIST.filter((d) => d.includes(trimmed)).slice(0, 5) : [];
  const showList = trimmed && !selectedAddress && matches.length > 0;
  const showEmpty = trimmed && !selectedAddress && matches.length === 0;

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setSelectedAddress('');
  };

  const handleSelect = (dong) => {
    const addr = `서울 관악구 ${dong}`;
    setInputValue(addr);
    setSelectedAddress(addr);
  };

  const handleStart = () => {
    if (!selectedAddress) return;
    onSubmit(selectedAddress);
  };

  return (
    <section className="screen active">
      <div className="onboard-wrap">
        <div className="onboard-card">
          <div className="brand-row">
            <span className="brand-dot" />
            <span className="brand-name">관악 안심지도</span>
          </div>
          <div className="progress-dots">
            <span className="on" />
            <span className="on" />
          </div>
          <h1 className="step-title">어디에 거주하고<br />계신가요?</h1>
          <p className="step-sub">관악구 내 주소를 입력하면 우리 동네 안전등급을 바로 보여드려요</p>

          <div className="field-label">주소</div>
          <input
            className="text-input"
            placeholder="예: 신림동, 봉천로, 남부순환로"
            autoComplete="off"
            value={inputValue}
            onChange={handleInputChange}
          />

          <div className="addr-suggest-list">
            {showList && matches.map((dong) => (
              <div key={dong} className="addr-suggest-item" onClick={() => handleSelect(dong)}>
                <span className="pin">📍</span>
                <span>서울 관악구 <b>{dong}</b></span>
              </div>
            ))}
            {showEmpty && (
              <div className="addr-suggest-empty">일치하는 관악구 동을 찾지 못했어요</div>
            )}
          </div>

          <button className="primary-btn" disabled={!selectedAddress} onClick={handleStart}>
            시작하기
          </button>
        </div>
      </div>
    </section>
  );
}
