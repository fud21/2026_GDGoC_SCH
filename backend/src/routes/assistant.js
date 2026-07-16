import { Router } from "express";
import { pool } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
import { chat, activeProvider, LlmError } from "../services/llm.js";
import { systemPromptFor, summarizePortfolio } from "../data/personas.js";
import { buildNudge } from "../services/nudges.js";
import { valueSession } from "../services/simEngine.js";
import { getTickers } from "../services/upbit.js";

const router = Router();

const HISTORY_LIMIT = 10; // 프롬프트에 넣는 최근 대화 수 (토큰 절약)
const MESSAGE_MAX_LEN = 500;
const DISCLAIMER = "※ 교육 목적의 안내이며 투자 권유가 아닙니다.";

// 유저의 라이브 세션 평가 요약 (없으면 null)
async function portfolioSummaryFor(userId, sessionId) {
  if (!sessionId) return null;
  const conn = await pool.getConnection();
  try {
    const [[session]] = await conn.query(
      "SELECT * FROM sim_sessions WHERE id = ? AND user_id = ?",
      [sessionId, userId]
    );
    if (!session) return null;
    const [instruments] = await conn.query(
      "SELECT id, symbol FROM instruments WHERE mode = 'live'"
    );
    let prices = new Map();
    try {
      const tickers = await getTickers(instruments.map((i) => i.symbol));
      for (const i of instruments) {
        const t = tickers.get(i.symbol);
        if (t) prices.set(i.id, t.price);
      }
    } catch {
      // 시세 실패 시 평단 기준으로 평가 (valueSession의 fallback)
    }
    const valuation = await valueSession(conn, session, prices);
    return { valuation, summary: summarizePortfolio(valuation) };
  } finally {
    conn.release();
  }
}

// 채팅
router.post("/chat", requireAuth, async (req, res) => {
  const { message, simSessionId } = req.body || {};
  const text = String(message ?? "").trim();
  if (!text) return res.status(400).json({ error: "메시지를 입력해주세요" });
  if (text.length > MESSAGE_MAX_LEN) {
    return res
      .status(400)
      .json({ error: `메시지는 ${MESSAGE_MAX_LEN}자 이내로 보내주세요` });
  }

  try {
    const [[user]] = await pool.query(
      "SELECT id, name, risk_type, level FROM users WHERE id = ?",
      [req.user.id]
    );

    const portfolio = await portfolioSummaryFor(
      req.user.id,
      simSessionId ? Number(simSessionId) : null
    );

    const [historyRows] = await pool.query(
      `SELECT role, content FROM chat_messages
       WHERE user_id = ? ORDER BY id DESC LIMIT ${HISTORY_LIMIT}`,
      [req.user.id]
    );
    const history = historyRows.reverse();

    const systemPrompt = systemPromptFor(user, portfolio?.summary ?? null);
    const reply = await chat(systemPrompt, [
      ...history,
      { role: "user", content: text },
    ]);
    const replyWithNote = `${reply}\n\n${DISCLAIMER}`;

    await pool.query(
      "INSERT INTO chat_messages (user_id, sim_session_id, role, content) VALUES (?, ?, 'user', ?), (?, ?, 'assistant', ?)",
      [
        req.user.id,
        simSessionId ?? null,
        text,
        req.user.id,
        simSessionId ?? null,
        replyWithNote,
      ]
    );

    res.json({ reply: replyWithNote, provider: activeProvider() });
  } catch (err) {
    if (err instanceof LlmError || err.name === "TimeoutError") {
      console.error(err.message);
      return res
        .status(503)
        .json({ error: "AI 응답을 받지 못했어요. 잠시 후 다시 시도해주세요." });
    }
    console.error(err);
    res.status(500).json({ error: "채팅 처리 중 오류가 발생했습니다" });
  }
});

// 대화 이력
router.get("/history", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, role, content, created_at FROM chat_messages WHERE user_id = ? ORDER BY id DESC LIMIT 50",
      [req.user.id]
    );
    res.json(rows.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "이력 조회 중 오류가 발생했습니다" });
  }
});

// 상황 개입 코멘트 (규칙 기반, LLM 미사용)
router.get("/nudge", requireAuth, async (req, res) => {
  const sessionId = Number(req.query.sessionId);
  if (!sessionId) return res.status(400).json({ error: "sessionId가 필요합니다" });
  try {
    const [[user]] = await pool.query(
      "SELECT risk_type FROM users WHERE id = ?",
      [req.user.id]
    );
    const portfolio = await portfolioSummaryFor(req.user.id, sessionId);
    if (!portfolio) return res.status(404).json({ error: "세션이 없습니다" });
    const nudge = buildNudge(portfolio.valuation, user?.risk_type);
    res.json({ nudge });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "코멘트 생성 중 오류가 발생했습니다" });
  }
});

export default router;
