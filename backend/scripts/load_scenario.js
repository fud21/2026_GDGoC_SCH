// 시나리오 모드용 과거 일봉 데이터 적재 스크립트
// 사용법: node scripts/load_scenario.js [slug]
//   slug 생략 시 정의된 모든 시나리오를 적재한다. (재실행 안전 — upsert)
// 예: node scripts/load_scenario.js 2024-halving-rally

import dotenv from "dotenv";
import { pool } from "../src/config/db.js";
import { getDayCandles } from "../src/services/upbit.js";

dotenv.config();

// 종목명은 익명(A/B/C코인)으로 노출하고, 종료 후 real_name을 공개한다.
const SCENARIOS = {
  "2024-halving-rally": {
    title: "상승장에서 살아남기",
    description:
      "어느 해 상반기, 시장 전체가 뜨겁게 달아올랐던 6개월입니다. " +
      "상승장에서도 수익을 지키는 것이 실력입니다.",
    start: "2024-01-01",
    end: "2024-06-30",
    minLevel: 3,
    markets: [
      { market: "KRW-BTC", real: "비트코인 (2024 상반기)" },
      { market: "KRW-ETH", real: "이더리움 (2024 상반기)" },
      { market: "KRW-SOL", real: "솔라나 (2024 상반기)" },
    ],
  },
  "2022-bear-market": {
    title: "하락장에서 살아남기",
    description:
      "어느 해, 금리 인상과 연쇄 파산으로 시장이 얼어붙었던 9개월입니다. " +
      "떨어지는 칼날 앞에서 원칙이 있는지 시험해보세요.",
    start: "2022-04-01",
    end: "2022-12-31",
    minLevel: 5,
    markets: [
      { market: "KRW-BTC", real: "비트코인 (2022)" },
      { market: "KRW-ETH", real: "이더리움 (2022)" },
      { market: "KRW-XRP", real: "리플 (2022)" },
    ],
  },
};

const LABELS = ["A코인", "B코인", "C코인", "D코인", "E코인"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function loadCandles(market, startDate, endDate) {
  // 업비트 day 캔들은 to(마지막 캔들 시각) 기준으로 과거 방향 200개씩 준다
  const out = [];
  let to = `${endDate} 23:59:59`;
  for (let page = 0; page < 20; page++) {
    const batch = await getDayCandles(market, 200, to);
    if (batch.length === 0) break;
    out.unshift(...batch);
    const earliest = batch[0].ts; // "2024-01-01T09:00:00"
    if (earliest.slice(0, 10) <= startDate) break;
    to = earliest.replace("T", " ");
    await sleep(200); // rate limit 여유
  }
  return out.filter(
    (c) => c.ts.slice(0, 10) >= startDate && c.ts.slice(0, 10) <= endDate
  );
}

async function upsertScenario(slug) {
  const cfg = SCENARIOS[slug];
  if (!cfg) {
    throw new Error(
      `정의되지 않은 시나리오: ${slug} (가능: ${Object.keys(SCENARIOS).join(", ")})`
    );
  }
  console.log(`\n[${slug}] ${cfg.title} — ${cfg.start} ~ ${cfg.end}`);

  const instrumentIds = [];
  for (let i = 0; i < cfg.markets.length; i++) {
    const { market, real } = cfg.markets[i];
    const symbol = `${market}#${slug}`; // 시나리오별로 유니크
    await pool.query(
      `INSERT INTO instruments (mode, symbol, display_name, real_name)
       VALUES ('historical', ?, ?, ?)
       ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), real_name = VALUES(real_name)`,
      [symbol, LABELS[i], real]
    );
    const [[inst]] = await pool.query(
      "SELECT id FROM instruments WHERE mode = 'historical' AND symbol = ?",
      [symbol]
    );
    instrumentIds.push(inst.id);

    const candles = await loadCandles(market, cfg.start, cfg.end);
    if (candles.length === 0) {
      throw new Error(`${market}: 캔들을 받지 못했습니다`);
    }
    for (const c of candles) {
      await pool.query(
        `INSERT INTO price_candles (instrument_id, ts, open, high, low, close, volume)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE open=VALUES(open), high=VALUES(high),
           low=VALUES(low), close=VALUES(close), volume=VALUES(volume)`,
        [inst.id, c.ts.replace("T", " "), c.open, c.high, c.low, c.close, c.volume]
      );
    }
    console.log(`  ${LABELS[i]} <- ${market}: 캔들 ${candles.length}개`);
    await sleep(200);
  }

  // 시작/종료 시각은 실제 첫/마지막 캔들에 맞춘다
  const [[range]] = await pool.query(
    "SELECT MIN(ts) AS s, MAX(ts) AS e FROM price_candles WHERE instrument_id = ?",
    [instrumentIds[0]]
  );
  const [existing] = await pool.query(
    "SELECT id FROM scenarios WHERE title = ?",
    [cfg.title]
  );
  if (existing.length > 0) {
    await pool.query(
      `UPDATE scenarios SET description=?, start_ts=?, end_ts=?, min_level=?, instrument_ids=? WHERE id=?`,
      [
        cfg.description,
        range.s,
        range.e,
        cfg.minLevel,
        JSON.stringify(instrumentIds),
        existing[0].id,
      ]
    );
    console.log(`  시나리오 갱신 (id=${existing[0].id})`);
  } else {
    const [ins] = await pool.query(
      `INSERT INTO scenarios (title, description, start_ts, end_ts, min_level, instrument_ids)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        cfg.title,
        cfg.description,
        range.s,
        range.e,
        cfg.minLevel,
        JSON.stringify(instrumentIds),
      ]
    );
    console.log(`  시나리오 생성 (id=${ins.insertId})`);
  }
}

const target = process.argv[2];
const slugs = target ? [target] : Object.keys(SCENARIOS);
try {
  for (const slug of slugs) {
    await upsertScenario(slug);
  }
  console.log("\n완료");
} finally {
  await pool.end();
}
