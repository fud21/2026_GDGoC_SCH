import { Router } from "express";
import { pool } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
import { getTickers, getMinuteCandles, UpbitError } from "../services/upbit.js";
import {
  placeOrder,
  cancelOrder,
  fillOpenOrders,
  valueSession,
  roundQty,
  SimError,
} from "../services/simEngine.js";
import {
  simRulesForLevel,
  allowedOrderTypes,
  TRADE_FEE_RATE,
} from "../data/simRules.js";

const router = Router();

async function getUserLevel(userId) {
  const [[u]] = await pool.query("SELECT level FROM users WHERE id = ?", [
    userId,
  ]);
  return u?.level ?? 1;
}

async function loadLiveInstruments() {
  const [rows] = await pool.query(
    "SELECT id, symbol, display_name FROM instruments WHERE mode = 'live' ORDER BY id"
  );
  return rows;
}

// instrument_id -> price 맵 (라이브 시세)
async function livePriceMap(instruments) {
  const tickers = await getTickers(instruments.map((i) => i.symbol));
  const map = new Map();
  for (const i of instruments) {
    const t = tickers.get(i.symbol);
    if (t) map.set(i.id, t.price);
  }
  return map;
}

// 내 레벨 규칙
router.get("/rules", requireAuth, async (req, res) => {
  const level = await getUserLevel(req.user.id);
  res.json({ level, ...simRulesForLevel(level) });
});

// 종목 + 현재 시세
router.get("/instruments", requireAuth, async (req, res) => {
  try {
    const instruments = await loadLiveInstruments();
    const tickers = await getTickers(instruments.map((i) => i.symbol));
    res.json(
      instruments.map((i) => {
        const t = tickers.get(i.symbol);
        return {
          id: i.id,
          symbol: i.symbol,
          displayName: i.display_name,
          price: t?.price ?? null,
          changeRate: t?.changeRate ?? null,
          stale: t?.stale ?? true,
        };
      })
    );
  } catch (err) {
    if (err instanceof UpbitError || err.name === "TimeoutError") {
      return res.status(503).json({ error: "시세 서버에 연결할 수 없습니다" });
    }
    console.error(err);
    res.status(500).json({ error: "종목 조회 중 오류가 발생했습니다" });
  }
});

// 미니 차트용 캔들 프록시
router.get("/candles", requireAuth, async (req, res) => {
  const { symbol, unit = 60, count = 48 } = req.query;
  if (!symbol) return res.status(400).json({ error: "symbol이 필요합니다" });
  try {
    const candles = await getMinuteCandles(
      symbol,
      Number(unit),
      Math.min(Number(count), 200)
    );
    res.json(candles);
  } catch (err) {
    if (err instanceof UpbitError || err.name === "TimeoutError") {
      return res.status(503).json({ error: "시세 서버에 연결할 수 없습니다" });
    }
    console.error(err);
    res.status(500).json({ error: "캔들 조회 중 오류가 발생했습니다" });
  }
});

// 진행 중인 라이브 세션 (없으면 null)
router.get("/sessions/active", requireAuth, async (req, res) => {
  try {
    const [[session]] = await pool.query(
      "SELECT id FROM sim_sessions WHERE user_id = ? AND mode = 'live' AND status = 'active' ORDER BY id DESC LIMIT 1",
      [req.user.id]
    );
    res.json({ sessionId: session?.id ?? null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "세션 조회 중 오류가 발생했습니다" });
  }
});

// 세션 시작 (라이브, 유저당 동시 1개)
router.post("/sessions", requireAuth, async (req, res) => {
  try {
    const [[existing]] = await pool.query(
      "SELECT id FROM sim_sessions WHERE user_id = ? AND mode = 'live' AND status = 'active' LIMIT 1",
      [req.user.id]
    );
    if (existing) {
      return res
        .status(409)
        .json({ error: "이미 진행 중인 모의투자가 있습니다", sessionId: existing.id });
    }
    const level = await getUserLevel(req.user.id);
    const { seedMoney } = simRulesForLevel(level);
    const [ins] = await pool.query(
      "INSERT INTO sim_sessions (user_id, mode, seed_money, cash) VALUES (?, 'live', ?, ?)",
      [req.user.id, seedMoney, seedMoney]
    );
    res.status(201).json({ sessionId: ins.insertId, seedMoney });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "세션 생성 중 오류가 발생했습니다" });
  }
});

// 세션 소유 검증 공통
async function loadOwnSession(conn, userId, sessionId, { forUpdate = false } = {}) {
  const [[session]] = await conn.query(
    `SELECT * FROM sim_sessions WHERE id = ? AND user_id = ?${forUpdate ? " FOR UPDATE" : ""}`,
    [sessionId, userId]
  );
  if (!session) throw new SimError("세션이 없습니다", 404);
  return session;
}

// 포트폴리오 (미체결 지정가 lazy fill 포함)
router.get("/sessions/:id", requireAuth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const instruments = await loadLiveInstruments();
    const prices = await livePriceMap(instruments);

    await conn.beginTransaction();
    const session = await loadOwnSession(conn, req.user.id, req.params.id, {
      forUpdate: true,
    });
    if (session.status === "active") {
      await fillOpenOrders(conn, session.id, prices);
    }
    // fill 이후 잔고가 바뀌었을 수 있으니 다시 읽는다
    const [[fresh]] = await conn.query(
      "SELECT * FROM sim_sessions WHERE id = ?",
      [session.id]
    );
    const valuation = await valueSession(conn, fresh, prices);
    const [openOrders] = await conn.query(
      `SELECT o.id, o.instrument_id, i.display_name, o.side, o.order_type, o.qty, o.price, o.created_at
       FROM sim_orders o JOIN instruments i ON i.id = o.instrument_id
       WHERE o.session_id = ? AND o.status = 'open' ORDER BY o.id DESC`,
      [session.id]
    );
    await conn.commit();

    res.json({
      id: fresh.id,
      mode: fresh.mode,
      status: fresh.status,
      seedMoney: Number(fresh.seed_money),
      startedAt: fresh.started_at,
      finalReturn: fresh.final_return != null ? Number(fresh.final_return) : null,
      ...valuation,
      openOrders: openOrders.map((o) => ({
        ...o,
        qty: Number(o.qty),
        price: Number(o.price),
      })),
    });
  } catch (err) {
    await conn.rollback();
    if (err instanceof SimError) {
      return res.status(err.status).json({ error: err.message });
    }
    if (err instanceof UpbitError || err.name === "TimeoutError") {
      return res.status(503).json({ error: "시세 서버에 연결할 수 없습니다" });
    }
    console.error(err);
    res.status(500).json({ error: "포트폴리오 조회 중 오류가 발생했습니다" });
  } finally {
    conn.release();
  }
});

// 주문
// body: { instrumentId, side, orderType, qty?, amountKrw?, price? }
router.post("/sessions/:id/orders", requireAuth, async (req, res) => {
  const { instrumentId, side, orderType, price } = req.body || {};
  let { qty, amountKrw } = req.body || {};

  if (!["BUY", "SELL"].includes(side)) {
    return res.status(400).json({ error: "side는 BUY 또는 SELL이어야 합니다" });
  }
  if (!["MARKET", "LIMIT"].includes(orderType)) {
    return res.status(400).json({ error: "orderType이 올바르지 않습니다" });
  }

  const conn = await pool.getConnection();
  try {
    const level = await getUserLevel(req.user.id);
    if (!allowedOrderTypes(level).includes(orderType)) {
      return res
        .status(403)
        .json({ error: "지정가 주문은 레벨 3부터 사용할 수 있어요" });
    }

    const instruments = await loadLiveInstruments();
    const instrument = instruments.find((i) => i.id === Number(instrumentId));
    if (!instrument) {
      return res.status(404).json({ error: "종목이 없습니다" });
    }
    const prices = await livePriceMap(instruments);
    const marketPrice = prices.get(instrument.id);
    if (!marketPrice) {
      return res.status(503).json({ error: "현재가를 가져올 수 없습니다" });
    }

    // 수량 결정: 매수는 금액 입력도 허용 (금액 → 수량 환산)
    if (qty == null && amountKrw != null && side === "BUY") {
      const basis = orderType === "LIMIT" ? Number(price) : marketPrice;
      qty = Number(amountKrw) / basis;
    }
    qty = roundQty(Number(qty));
    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ error: "수량이 올바르지 않습니다" });
    }
    if (orderType === "LIMIT") {
      const p = Number(price);
      if (!Number.isFinite(p) || p <= 0) {
        return res.status(400).json({ error: "지정가가 올바르지 않습니다" });
      }
    }

    await conn.beginTransaction();
    const session = await loadOwnSession(conn, req.user.id, req.params.id, {
      forUpdate: true,
    });
    if (session.status !== "active") {
      throw new SimError("종료된 세션입니다");
    }
    const result = await placeOrder(conn, session, {
      instrumentId: instrument.id,
      side,
      orderType,
      qty,
      price: orderType === "LIMIT" ? Number(price) : null,
      marketPrice,
    });
    await conn.commit();
    res.status(201).json(result);
  } catch (err) {
    await conn.rollback();
    if (err instanceof SimError) {
      return res.status(err.status).json({ error: err.message });
    }
    if (err instanceof UpbitError || err.name === "TimeoutError") {
      return res.status(503).json({ error: "시세 서버에 연결할 수 없습니다" });
    }
    console.error(err);
    res.status(500).json({ error: "주문 처리 중 오류가 발생했습니다" });
  } finally {
    conn.release();
  }
});

// 주문 취소
router.delete("/sessions/:id/orders/:orderId", requireAuth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const session = await loadOwnSession(conn, req.user.id, req.params.id, {
      forUpdate: true,
    });
    if (session.status !== "active") throw new SimError("종료된 세션입니다");
    await cancelOrder(conn, session.id, Number(req.params.orderId));
    await conn.commit();
    res.json({ cancelled: true });
  } catch (err) {
    await conn.rollback();
    if (err instanceof SimError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: "취소 처리 중 오류가 발생했습니다" });
  } finally {
    conn.release();
  }
});

// 주문 내역
router.get("/sessions/:id/orders", requireAuth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const session = await loadOwnSession(conn, req.user.id, req.params.id);
    const [orders] = await conn.query(
      `SELECT o.id, i.display_name, i.symbol, o.side, o.order_type, o.qty, o.price,
              o.status, o.executed_price, o.created_at
       FROM sim_orders o JOIN instruments i ON i.id = o.instrument_id
       WHERE o.session_id = ? ORDER BY o.id DESC LIMIT 100`,
      [session.id]
    );
    res.json(
      orders.map((o) => ({
        ...o,
        qty: Number(o.qty),
        price: o.price != null ? Number(o.price) : null,
        executed_price:
          o.executed_price != null ? Number(o.executed_price) : null,
      }))
    );
  } catch (err) {
    if (err instanceof SimError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: "주문 내역 조회 중 오류가 발생했습니다" });
  } finally {
    conn.release();
  }
});

// 세션 종료: 미체결 취소(환불) → 현재가 평가 → 수익률 확정
router.post("/sessions/:id/end", requireAuth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const instruments = await loadLiveInstruments();
    const prices = await livePriceMap(instruments);

    await conn.beginTransaction();
    const session = await loadOwnSession(conn, req.user.id, req.params.id, {
      forUpdate: true,
    });
    if (session.status !== "active") throw new SimError("이미 종료된 세션입니다");

    const [openOrders] = await conn.query(
      "SELECT id FROM sim_orders WHERE session_id = ? AND status = 'open'",
      [session.id]
    );
    for (const o of openOrders) {
      await cancelOrder(conn, session.id, o.id);
    }
    const [[fresh]] = await conn.query(
      "SELECT * FROM sim_sessions WHERE id = ?",
      [session.id]
    );
    const valuation = await valueSession(conn, fresh, prices);
    await conn.query(
      "UPDATE sim_sessions SET status = 'ended', final_return = ?, ended_at = NOW() WHERE id = ?",
      [valuation.returnRate.toFixed(4), session.id]
    );
    await conn.commit();
    res.json({
      ended: true,
      equity: valuation.equity,
      returnRate: valuation.returnRate,
    });
  } catch (err) {
    await conn.rollback();
    if (err instanceof SimError) {
      return res.status(err.status).json({ error: err.message });
    }
    if (err instanceof UpbitError || err.name === "TimeoutError") {
      return res.status(503).json({ error: "시세 서버에 연결할 수 없습니다" });
    }
    console.error(err);
    res.status(500).json({ error: "종료 처리 중 오류가 발생했습니다" });
  } finally {
    conn.release();
  }
});

// 리더보드: 진행 중 세션은 현재가로, 종료 세션(최근 7일)은 확정 수익률로
router.get("/leaderboard", requireAuth, async (req, res) => {
  try {
    const instruments = await loadLiveInstruments();
    const prices = await livePriceMap(instruments);

    const [active] = await pool.query(
      `SELECT s.id, s.user_id, u.name, s.seed_money, s.cash
       FROM sim_sessions s JOIN users u ON u.id = s.user_id
       WHERE s.mode = 'live' AND s.status = 'active'`
    );
    const [allHoldings] = await pool.query(
      `SELECT h.session_id, h.instrument_id, h.qty
       FROM sim_holdings h
       WHERE h.session_id IN (SELECT id FROM sim_sessions WHERE mode='live' AND status='active')`
    );
    const holdingsBySession = new Map();
    for (const h of allHoldings) {
      if (!holdingsBySession.has(h.session_id)) {
        holdingsBySession.set(h.session_id, []);
      }
      holdingsBySession.get(h.session_id).push(h);
    }
    // 미체결 에스크로(매수=현금, 매도=수량)도 총자산에 포함
    const [allOpenOrders] = await pool.query(
      `SELECT o.session_id, o.instrument_id, o.side, o.qty, o.price
       FROM sim_orders o
       WHERE o.status = 'open'
         AND o.session_id IN (SELECT id FROM sim_sessions WHERE mode='live' AND status='active')`
    );
    const escrowBySession = new Map();
    for (const o of allOpenOrders) {
      let v;
      if (o.side === "BUY") {
        v = Number(o.qty) * Number(o.price) * (1 + TRADE_FEE_RATE);
      } else {
        v = Number(o.qty) * (prices.get(o.instrument_id) ?? Number(o.price));
      }
      escrowBySession.set(o.session_id, (escrowBySession.get(o.session_id) ?? 0) + v);
    }

    const rows = active.map((s) => {
      let value = Number(s.cash) + (escrowBySession.get(s.id) ?? 0);
      for (const h of holdingsBySession.get(s.id) ?? []) {
        const p = prices.get(h.instrument_id);
        if (p) value += Number(h.qty) * p;
      }
      return {
        name: s.name,
        returnRate: value / Number(s.seed_money) - 1,
        status: "active",
        mine: s.user_id === req.user.id,
      };
    });

    const [ended] = await pool.query(
      `SELECT s.user_id, u.name, s.final_return
       FROM sim_sessions s JOIN users u ON u.id = s.user_id
       WHERE s.mode = 'live' AND s.status = 'ended' AND s.ended_at > NOW() - INTERVAL 7 DAY`
    );
    for (const s of ended) {
      rows.push({
        name: s.name,
        returnRate: Number(s.final_return),
        status: "ended",
        mine: s.user_id === req.user.id,
      });
    }

    rows.sort((a, b) => b.returnRate - a.returnRate);
    res.json(rows.slice(0, 20).map((r, i) => ({ rank: i + 1, ...r })));
  } catch (err) {
    if (err instanceof UpbitError || err.name === "TimeoutError") {
      return res.status(503).json({ error: "시세 서버에 연결할 수 없습니다" });
    }
    console.error(err);
    res.status(500).json({ error: "리더보드 조회 중 오류가 발생했습니다" });
  }
});

export default router;
