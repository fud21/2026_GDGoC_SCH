// 업비트 공개 API 클라이언트 (인증 불필요)
// - 티커는 짧게 캐시해 폴링 부하를 줄인다
// - API 장애 시 마지막으로 받은 가격을 stale 표시와 함께 반환한다 (폴백)

const BASE = "https://api.upbit.com/v1";
const TICKER_TTL_MS = 5_000;
const CANDLE_TTL_MS = 60_000;

const tickerCache = new Map(); // market -> { at, data }
const candleCache = new Map(); // key -> { at, data }

export class UpbitError extends Error {}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(5_000),
  });
  if (!res.ok) {
    throw new UpbitError(`업비트 API 오류 (${res.status})`);
  }
  return res.json();
}

// markets: ["KRW-BTC", ...] → Map(market -> {price, changeRate, high, low, stale})
export async function getTickers(markets) {
  const now = Date.now();
  const need = markets.filter((m) => {
    const c = tickerCache.get(m);
    return !c || now - c.at > TICKER_TTL_MS;
  });

  if (need.length > 0) {
    try {
      const rows = await fetchJson(
        `${BASE}/ticker?markets=${encodeURIComponent(need.join(","))}`
      );
      for (const t of rows) {
        tickerCache.set(t.market, {
          at: now,
          data: {
            market: t.market,
            price: t.trade_price,
            changeRate: t.signed_change_rate,
            high: t.high_price,
            low: t.low_price,
            stale: false,
          },
        });
      }
    } catch (err) {
      // 폴백: 캐시가 하나도 없으면 그대로 던지고, 있으면 stale로 계속 서비스
      const uncovered = need.filter((m) => !tickerCache.has(m));
      if (uncovered.length > 0) throw err;
    }
  }

  const out = new Map();
  for (const m of markets) {
    const c = tickerCache.get(m);
    if (!c) continue;
    out.set(m, {
      ...c.data,
      stale: Date.now() - c.at > TICKER_TTL_MS * 3,
    });
  }
  return out;
}

// 분봉 캔들 (미니 차트용). unit: 1|5|15|60|240
export async function getMinuteCandles(market, unit = 60, count = 48) {
  const key = `${market}:${unit}:${count}`;
  const now = Date.now();
  const cached = candleCache.get(key);
  if (cached && now - cached.at < CANDLE_TTL_MS) return cached.data;

  const rows = await fetchJson(
    `${BASE}/candles/minutes/${unit}?market=${encodeURIComponent(market)}&count=${count}`
  );
  // 업비트는 최신순으로 주므로 시간순으로 뒤집는다
  const data = rows
    .map((r) => ({
      ts: r.candle_date_time_kst,
      open: r.opening_price,
      high: r.high_price,
      low: r.low_price,
      close: r.trade_price,
      volume: r.candle_acc_trade_volume,
    }))
    .reverse();
  candleCache.set(key, { at: now, data });
  return data;
}

// 일봉 캔들 (과거 데이터 적재용). to: "yyyy-MM-dd HH:mm:ss" (KST) 이전 캔들
export async function getDayCandles(market, count = 200, to = null) {
  let url = `${BASE}/candles/days?market=${encodeURIComponent(market)}&count=${count}`;
  if (to) url += `&to=${encodeURIComponent(to)}`;
  const rows = await fetchJson(url);
  return rows
    .map((r) => ({
      ts: r.candle_date_time_kst,
      open: r.opening_price,
      high: r.high_price,
      low: r.low_price,
      close: r.trade_price,
      volume: r.candle_acc_trade_volume,
    }))
    .reverse();
}
