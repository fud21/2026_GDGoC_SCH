// 디자인 프로토타입(index.html)의 computeSafety 목업 로직을 그대로 추출한 것.
// 백엔드 /api/safety-score 연동 시 이 파일 대신 ../api/safetyApi.js를 쓰도록 교체할 예정이라
// 의도적으로 분리해뒀다 — 주소 문자열을 시드로 한 가짜(결정적) 데이터를 생성할 뿐, 실제 안전 데이터가 아니다.

export const CENTER = [37.4784, 126.9516]; // 관악구 중심 대략값

export const GRADE_COLOR = { S: '#1CC88A', A: '#6FCF57', B: '#F2C94C', C: '#F2994A', D: '#EB5757' };

export const GRADE_DESC = {
  S: '매우 안전한 지역이에요. CCTV와 보안등이 촘촘히 설치되어 있어요.',
  A: '전반적으로 안전한 지역이에요. 야간에도 비교적 안심할 수 있어요.',
  B: '보통 수준의 안전등급이에요. 늦은 밤에는 큰 길로 다니는 걸 추천해요.',
  C: '주의가 필요한 지역이에요. 야간 이동 시 동행을 권장해요.',
  D: '안전 인프라가 부족한 지역이에요. 밤늦은 단독 이동은 피해주세요.',
};

export const TYPE_META = {
  cctv: { color: '#3182F6', glyph: '🎥', label: 'CCTV' },
  light: { color: '#F2A900', glyph: '💡', label: '보안등' },
  police: { color: '#EB5757', glyph: '🚓', label: '파출소' },
};

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) | 0; }
  return Math.abs(h);
}

function seededRand(seed) {
  // mulberry32
  let t = (seed += 0x6D2B79F5);
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function gradeFromScore(score) {
  if (score >= 90) return 'S';
  if (score >= 75) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

// 주소 문자열을 시드로 한 결정적 난수로 점수/시설 목업 데이터를 만든다.
// 같은 주소를 검색하면 항상 같은 결과가 나온다.
export function computeSafety(addr) {
  const h = hashStr(addr.trim());
  const rand = seededRand(h);
  const score = 30 + Math.floor(rand() * 69); // 30-98
  const grade = gradeFromScore(score);
  const cctv = 3 + Math.floor(rand() * 22);
  const light = 6 + Math.floor(rand() * 40);
  const police = 120 + Math.floor(rand() * 900);
  const trafficLevels = ['적음', '보통', '많음'];
  const traffic = trafficLevels[Math.floor(rand() * 3)];
  const latlng = [
    CENTER[0] + (rand() - 0.5) * 0.028,
    CENTER[1] + (rand() - 0.5) * 0.034,
  ];

  const facilities = [];
  const types = [
    { type: 'cctv', n: Math.min(cctv, 8), label: 'CCTV' },
    { type: 'light', n: Math.min(light, 8), label: '보안등' },
  ];
  types.forEach((t) => {
    for (let i = 0; i < t.n; i++) {
      const dLat = (rand() - 0.5) * 0.006;
      const dLng = (rand() - 0.5) * 0.007;
      const dist = Math.round(30 + rand() * 420);
      facilities.push({ type: t.type, name: `${t.label} ${i + 1}`, dist, latlng: [latlng[0] + dLat, latlng[1] + dLng] });
    }
  });
  facilities.push({
    type: 'police',
    name: '관악경찰서 파출소',
    dist: police,
    latlng: [latlng[0] + (rand() - 0.5) * 0.01, latlng[1] + (rand() - 0.5) * 0.01],
  });
  facilities.sort((a, b) => a.dist - b.dist);

  return { addr, latlng, score, grade, cctv, light, police, traffic, facilities };
}
