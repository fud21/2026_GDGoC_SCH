import { useState } from 'react';

const GENDER_OPTIONS = [
  { value: 'f', label: '여성' },
  { value: 'm', label: '남성' },
  { value: 'n', label: '선택안함' },
];

// 온보딩 1단계: 이름/나이/성별 입력. 셋 다 채워야 "다음" 버튼이 활성화됨
export default function StepProfile({ onSubmit }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState(null);

  const canSubmit = Boolean(name.trim() && age.trim() && gender);

  const handleNext = () => {
    if (!canSubmit) return;
    onSubmit({ name: name.trim(), age: age.trim(), gender });
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
            <span />
          </div>
          <h1 className="step-title">반가워요.<br />먼저 본인 정보를 알려주세요</h1>
          <p className="step-sub">맞춤형 안전 정보를 보여드리기 위해 필요해요</p>

          <div className="field-label">이름</div>
          <input
            className="text-input"
            placeholder="이름을 입력하세요"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="field-label">나이</div>
          <input
            className="text-input"
            type="number"
            min="1"
            max="120"
            placeholder="숫자만 입력하세요"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />

          <div className="field-label">성별</div>
          <div className="seg-row">
            {GENDER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`seg-btn${gender === opt.value ? ' active' : ''}`}
                onClick={() => setGender(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button className="primary-btn" disabled={!canSubmit} onClick={handleNext}>
            다음
          </button>
        </div>
      </div>
    </section>
  );
}
