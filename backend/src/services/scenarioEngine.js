// 과거 데이터 리플레이(시나리오 모드) 엔진
// - 가격은 price_candles의 일봉을 sim_clock 기준으로 조회한다
// - 지정가 체결은 하루의 고가/저가 범위를 기준으로 판정한다

import { roundCash, roundQty } from "./simEngine.js";
import { TRADE_FEE_RATE } from "../data/simRules.js";

// mysql2는 JSON 컬럼을 이미 파싱해서 주므로 문자열/배열 모두 허용한다
export function parseInstrumentIds(value) {
  return typeof value === "string" ? JSON.parse(value) : value;
}

// sim_clock 시점의 종가 맵 (instrument_id -> close)
export async function pricesAtClock(conn, instrumentIds, clock) {
  const map = new Map();
  if (instrumentIds.length === 0) return map;
  for (const id of instrumentIds) {
    const [[row]] = await conn.query(
      `SELECT close FROM price_candles
       WHERE instrument_id = ? AND ts <= ? ORDER BY ts DESC LIMIT 1`,
      [id, clock]
    );
    if (row) map.set(id, Number(row.close));
  }
  return map;
}

// (start, end] 구간의 일봉들 (체결 판정용)
async function candlesBetween(conn, instrumentId, after, until) {
  const [rows] = await conn.query(
    `SELECT ts, open, high, low, close FROM price_candles
     WHERE instrument_id = ? AND ts > ? AND ts <= ? ORDER BY ts`,
    [instrumentId, after, until]
  );
  return rows;
}

// 시간 전진 중 지정가 주문 체결 판정: 그날 저가<=지정가(매수) / 고가>=지정가(매도)
export async function fillOpenOrdersHistorical(conn, sessionId, after, until) {
  const [orders] = await conn.query(
    "SELECT * FROM sim_orders WHERE session_id = ? AND status = 'open' FOR UPDATE",
    [sessionId]
  );
  for (const o of orders) {
    const candles = await candlesBetween(conn, o.instrument_id, after, until);
    const limitPrice = Number(o.price);
    const qty = Number(o.qty);
    for (const c of candles) {
      const crossed =
        o.side === "BUY"
          ? Number(c.low) <= limitPrice
          : Number(c.high) >= limitPrice;
      if (!crossed) continue;

      if (o.side === "BUY") {
        // 현금은 주문 시 선차감됨 → 보유만 반영
        await applyBuy(conn, sessionId, o.instrument_id, qty, limitPrice);
      } else {
        const proceeds = roundCash(qty * limitPrice * (1 - TRADE_FEE_RATE));
        await conn.query(
          "UPDATE sim_sessions SET cash = cash + ? WHERE id = ?",
          [proceeds, sessionId]
        );
      }
      await conn.query(
        "UPDATE sim_orders SET status = 'filled', executed_price = ? WHERE id = ?",
        [limitPrice, o.id]
      );
      break;
    }
  }
}

async function applyBuy(conn, sessionId, instrumentId, qty, price) {
  const [[h]] = await conn.query(
    "SELECT qty, avg_price FROM sim_holdings WHERE session_id = ? AND instrument_id = ? FOR UPDATE",
    [sessionId, instrumentId]
  );
  if (!h) {
    await conn.query(
      "INSERT INTO sim_holdings (session_id, instrument_id, qty, avg_price) VALUES (?, ?, ?, ?)",
      [sessionId, instrumentId, roundQty(qty), price]
    );
  } else {
    const oldQty = Number(h.qty);
    const newQty = roundQty(oldQty + qty);
    const newAvg = (oldQty * Number(h.avg_price) + qty * price) / (oldQty + qty);
    await conn.query(
      "UPDATE sim_holdings SET qty = ?, avg_price = ? WHERE session_id = ? AND instrument_id = ?",
      [newQty, roundCash(newAvg * 100) / 100, sessionId, instrumentId]
    );
  }
}

// 종료 리포트: 종목 공개 + 매수후보유(B&H) 벤치마크 비교
export async function buildReviewReport(conn, session, scenario) {
  const instrumentIds = parseInstrumentIds(scenario.instrument_ids);
  const [instruments] = await conn.query(
    "SELECT id, display_name, real_name FROM instruments WHERE id IN (?)",
    [instrumentIds]
  );

  const benchmarks = [];
  for (const inst of instruments) {
    const [[first]] = await conn.query(
      "SELECT close FROM price_candles WHERE instrument_id = ? AND ts >= ? ORDER BY ts LIMIT 1",
      [inst.id, scenario.start_ts]
    );
    const [[last]] = await conn.query(
      "SELECT close FROM price_candles WHERE instrument_id = ? AND ts <= ? ORDER BY ts DESC LIMIT 1",
      [inst.id, scenario.end_ts]
    );
    if (first && last) {
      benchmarks.push({
        displayName: inst.display_name,
        realName: inst.real_name,
        buyHoldReturn: Number(last.close) / Number(first.close) - 1,
      });
    }
  }

  const [[stats]] = await conn.query(
    `SELECT COUNT(*) AS trades,
            SUM(side = 'BUY') AS buys,
            SUM(side = 'SELL') AS sells
     FROM sim_orders WHERE session_id = ? AND status = 'filled'`,
    [session.id]
  );

  return {
    finalReturn: Number(session.final_return),
    trades: Number(stats.trades),
    buys: Number(stats.buys ?? 0),
    sells: Number(stats.sells ?? 0),
    benchmarks,
    period: { start: scenario.start_ts, end: scenario.end_ts },
  };
}
