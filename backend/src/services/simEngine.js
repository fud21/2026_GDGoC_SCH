import { TRADE_FEE_RATE } from "../data/simRules.js";

// 금액/수량 반올림 (cash DECIMAL(18,2), qty DECIMAL(18,8))
export const roundCash = (v) => Math.round(v * 100) / 100;
export const roundQty = (v) => Math.round(v * 1e8) / 1e8;

export class SimError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// 보유 수량에 매수 반영 (평단 갱신)
async function applyBuyToHoldings(conn, sessionId, instrumentId, qty, price) {
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
    const newAvg =
      (oldQty * Number(h.avg_price) + qty * price) / (oldQty + qty);
    await conn.query(
      "UPDATE sim_holdings SET qty = ?, avg_price = ? WHERE session_id = ? AND instrument_id = ?",
      [newQty, roundCash(newAvg * 100) / 100, sessionId, instrumentId]
    );
  }
}

// 에스크로 환불용 수량 복원: 기존 보유가 남아있으면 평단을 건드리지 않고 수량만 되돌린다.
// 보유가 전량 차감돼 행이 사라진 경우에만 fallbackPrice(지정가)로 새 행을 만든다.
async function restoreHoldings(conn, sessionId, instrumentId, qty, fallbackPrice) {
  const [[h]] = await conn.query(
    "SELECT qty FROM sim_holdings WHERE session_id = ? AND instrument_id = ? FOR UPDATE",
    [sessionId, instrumentId]
  );
  if (!h) {
    await conn.query(
      "INSERT INTO sim_holdings (session_id, instrument_id, qty, avg_price) VALUES (?, ?, ?, ?)",
      [sessionId, instrumentId, roundQty(qty), fallbackPrice]
    );
  } else {
    await conn.query(
      "UPDATE sim_holdings SET qty = ? WHERE session_id = ? AND instrument_id = ?",
      [roundQty(Number(h.qty) + qty), sessionId, instrumentId]
    );
  }
}

// 보유 수량 차감 (매도 체결 또는 지정가 매도 에스크로)
async function deductHoldings(conn, sessionId, instrumentId, qty) {
  const [[h]] = await conn.query(
    "SELECT qty FROM sim_holdings WHERE session_id = ? AND instrument_id = ? FOR UPDATE",
    [sessionId, instrumentId]
  );
  const held = h ? Number(h.qty) : 0;
  if (held + 1e-9 < qty) {
    throw new SimError("보유 수량이 부족합니다");
  }
  const remain = roundQty(held - qty);
  if (remain <= 0) {
    await conn.query(
      "DELETE FROM sim_holdings WHERE session_id = ? AND instrument_id = ?",
      [sessionId, instrumentId]
    );
  } else {
    await conn.query(
      "UPDATE sim_holdings SET qty = ? WHERE session_id = ? AND instrument_id = ?",
      [remain, sessionId, instrumentId]
    );
  }
}

// 현금 증감 (음수면 차감). 부족하면 SimError.
async function adjustCash(conn, sessionId, delta) {
  const [[s]] = await conn.query(
    "SELECT cash FROM sim_sessions WHERE id = ? FOR UPDATE",
    [sessionId]
  );
  const cash = Number(s.cash);
  const next = roundCash(cash + delta);
  if (next < -1e-6) {
    throw new SimError("주문 가능 금액이 부족합니다");
  }
  await conn.query("UPDATE sim_sessions SET cash = ? WHERE id = ?", [
    Math.max(0, next),
    sessionId,
  ]);
  return Math.max(0, next);
}

// 주문 실행. price = 체결 가격.
// - MARKET: 즉시 체결 (현금/보유 즉시 반영)
// - LIMIT: 에스크로만 잡고 open 상태로 저장 (매수=현금 선차감, 매도=수량 선차감)
export async function placeOrder(conn, session, params) {
  const { instrumentId, side, orderType, qty, price, marketPrice } = params;

  if (side === "BUY") {
    const execPrice = orderType === "MARKET" ? marketPrice : price;
    const cost = roundCash(qty * execPrice * (1 + TRADE_FEE_RATE));
    await adjustCash(conn, session.id, -cost);
    if (orderType === "MARKET") {
      await applyBuyToHoldings(conn, session.id, instrumentId, qty, execPrice);
    }
  } else {
    // SELL: 수량 선차감 (MARKET이면 곧바로 현금 입금까지)
    await deductHoldings(conn, session.id, instrumentId, qty);
    if (orderType === "MARKET") {
      const proceeds = roundCash(qty * marketPrice * (1 - TRADE_FEE_RATE));
      await adjustCash(conn, session.id, proceeds);
    }
  }

  const status = orderType === "MARKET" ? "filled" : "open";
  const executedPrice = orderType === "MARKET" ? marketPrice : null;
  const [ins] = await conn.query(
    `INSERT INTO sim_orders (session_id, instrument_id, side, order_type, qty, price, status, executed_price)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      session.id,
      instrumentId,
      side,
      orderType,
      roundQty(qty),
      orderType === "LIMIT" ? price : null,
      status,
      executedPrice,
    ]
  );
  return { orderId: ins.insertId, status, executedPrice };
}

// 미체결 지정가 주문 취소 + 에스크로 환불
export async function cancelOrder(conn, sessionId, orderId) {
  const [[order]] = await conn.query(
    "SELECT * FROM sim_orders WHERE id = ? AND session_id = ? FOR UPDATE",
    [orderId, sessionId]
  );
  if (!order) throw new SimError("주문이 없습니다", 404);
  if (order.status !== "open") throw new SimError("이미 처리된 주문입니다");

  if (order.side === "BUY") {
    const refund = roundCash(
      Number(order.qty) * Number(order.price) * (1 + TRADE_FEE_RATE)
    );
    await adjustCash(conn, sessionId, refund);
  } else {
    await restoreHoldings(
      conn,
      sessionId,
      order.instrument_id,
      Number(order.qty),
      Number(order.price)
    );
  }
  await conn.query("UPDATE sim_orders SET status = 'cancelled' WHERE id = ?", [
    orderId,
  ]);
}

// 열려 있는 지정가 주문을 현재가와 비교해 체결 (lazy fill)
// prices: Map(instrument_id -> currentPrice)
export async function fillOpenOrders(conn, sessionId, prices) {
  const [orders] = await conn.query(
    "SELECT * FROM sim_orders WHERE session_id = ? AND status = 'open' FOR UPDATE",
    [sessionId]
  );
  const filled = [];
  for (const o of orders) {
    const current = prices.get(o.instrument_id);
    if (current == null) continue;
    const limitPrice = Number(o.price);
    const qty = Number(o.qty);

    if (o.side === "BUY" && current <= limitPrice) {
      // 현금은 주문 시 선차감됨 → 보유만 반영 (체결가 = 지정가)
      await applyBuyToHoldings(conn, sessionId, o.instrument_id, qty, limitPrice);
      await conn.query(
        "UPDATE sim_orders SET status = 'filled', executed_price = ? WHERE id = ?",
        [limitPrice, o.id]
      );
      filled.push(o.id);
    } else if (o.side === "SELL" && current >= limitPrice) {
      // 수량은 주문 시 선차감됨 → 현금만 입금
      const proceeds = roundCash(qty * limitPrice * (1 - TRADE_FEE_RATE));
      await adjustCash(conn, sessionId, proceeds);
      await conn.query(
        "UPDATE sim_orders SET status = 'filled', executed_price = ? WHERE id = ?",
        [limitPrice, o.id]
      );
      filled.push(o.id);
    }
  }
  return filled;
}

// 세션 평가: 현금 + 보유 평가액 + 미체결 주문에 묶인 금액(에스크로), 수익률
export async function valueSession(conn, session, prices) {
  const [holdings] = await conn.query(
    `SELECT h.instrument_id, h.qty, h.avg_price, i.symbol, i.display_name
     FROM sim_holdings h JOIN instruments i ON i.id = h.instrument_id
     WHERE h.session_id = ?`,
    [session.id]
  );
  // 에스크로: 지정가 매수는 현금이, 지정가 매도는 수량이 선차감돼 있으므로
  // 평가액에 되돌려 넣어야 총자산이 왜곡되지 않는다.
  const [openOrders] = await conn.query(
    "SELECT instrument_id, side, qty, price FROM sim_orders WHERE session_id = ? AND status = 'open'",
    [session.id]
  );
  let lockedCash = 0; // 매수 주문에 묶인 현금 (수수료 포함)
  let lockedValue = 0; // 매도 주문에 묶인 수량의 현재 평가액
  for (const o of openOrders) {
    if (o.side === "BUY") {
      lockedCash += Number(o.qty) * Number(o.price) * (1 + TRADE_FEE_RATE);
    } else {
      const current = prices.get(o.instrument_id) ?? Number(o.price);
      lockedValue += Number(o.qty) * current;
    }
  }
  let holdingsValue = 0;
  const detailed = holdings.map((h) => {
    const qty = Number(h.qty);
    const avg = Number(h.avg_price);
    const current = prices.get(h.instrument_id) ?? avg;
    const value = qty * current;
    holdingsValue += value;
    return {
      instrumentId: h.instrument_id,
      symbol: h.symbol,
      displayName: h.display_name,
      qty,
      avgPrice: avg,
      currentPrice: current,
      value: roundCash(value),
      pnl: roundCash((current - avg) * qty),
      pnlRate: avg > 0 ? (current - avg) / avg : 0,
    };
  });
  const cash = Number(session.cash);
  const equity = roundCash(cash + holdingsValue + lockedCash + lockedValue);
  const seed = Number(session.seed_money);
  return {
    cash,
    lockedCash: roundCash(lockedCash),
    lockedValue: roundCash(lockedValue),
    holdings: detailed,
    equity,
    returnRate: seed > 0 ? equity / seed - 1 : 0,
  };
}
