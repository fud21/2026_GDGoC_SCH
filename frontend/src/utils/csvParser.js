// public/data.csv(관악구 안전데이터)를 불러와서
// CCTV / 보안등 / 파출소 / 범죄통계 종류별로 나눠 담아 반환
export async function loadCSVData() {
  const response = await fetch('/data.csv');
  const text = await response.text();
  const lines = text.trim().split('\n');

  const result = { cctv: [], lamp: [], police: [], crime: null };

  // 1번째 줄(헤더)은 건너뛰고, 각 줄의 첫 칸(종류)을 보고 알맞은 바구니에 담음
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const type = cols[0]?.replace(/^﻿/, ''); // 파일 맨 앞에 붙는 보이지 않는 문자(BOM) 제거

    if (type === 'cctv') {
      const lat = parseFloat(cols[4]);
      const lng = parseFloat(cols[5]);
      if (!isNaN(lat) && !isNaN(lng)) {
        result.cctv.push({ lat, lng, count: parseFloat(cols[7]) || 1 });
      }
    } else if (type === '보안등') {
      const lat = parseFloat(cols[4]);
      const lng = parseFloat(cols[5]);
      if (!isNaN(lat) && !isNaN(lng)) {
        result.lamp.push({ lat, lng });
      }
    } else if (type === '파출소') {
      // 주소에서 "지구대/파출소" 뒤 상세 설명, 콤마 이후 내용을 잘라내 지오코딩에 쓰기 좋은 형태로 정리
      const raw = cols[3] || '';
      const cleanAddr = raw
        .replace(/\s+/g, ' ')
        .replace(/(지구대|파출소)[^\s]*.*$/, '')
        .replace(/,.*$/, '')
        .trim();
      result.police.push({
        id: cols[1],
        name: cols[2],
        address: cleanAddr,
        lat: null, // 파출소는 CSV에 좌표가 없어서, 나중에 App.jsx에서 카카오 Geocoder로 채워 넣음
        lng: null,
      });
    } else if (type === '범죄통계') {
      result.crime = {
        year: parseFloat(cols[12]) || 0,
        kill: parseFloat(cols[13]) || 0,
        rob: parseFloat(cols[14]) || 0,
        theft: parseFloat(cols[15]) || 0,
        violence: parseFloat(cols[16]) || 0,
      };
    }
  }

  return result;
}

// CSV 한 줄을 콤마 기준으로 칸 나누기 (따옴표 안에 있는 콤마는 무시)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}
