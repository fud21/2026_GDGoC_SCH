export async function loadCSVData() {
  const response = await fetch('/data.csv');
  const text = await response.text();
  const lines = text.trim().split('\n');

  const result = { cctv: [], lamp: [], police: [], crime: null };

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const type = cols[0]?.replace(/^﻿/, '');

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
        lat: null,
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
