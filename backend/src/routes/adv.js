import { Router } from "express";
import { pool } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
import { gradeQuizAnswers, QuizValidationError } from "../utils/quiz.js";
import { awardXpOnce } from "../utils/xp.js";

const router = Router();

const ADV_PASS_PCT = 80;
const ADV_XP = 30;

const MTYPE_LABEL = {
  article: "기사 독해",
  report: "리포트 분석",
  financial_stmt: "재무제표 읽기",
};

async function getUserLevel(userId) {
  const [[u]] = await pool.query("SELECT level FROM users WHERE id = ?", [
    userId,
  ]);
  return u?.level ?? 1;
}

// 심화 자료 목록 (잠금 상태 + 통과 여부 포함)
router.get("/materials", requireAuth, async (req, res) => {
  try {
    const level = await getUserLevel(req.user.id);
    const [materials] = await pool.query(
      "SELECT id, mtype, title, min_level FROM adv_materials ORDER BY min_level, id"
    );
    const [passes] = await pool.query(
      "SELECT reason FROM xp_events WHERE user_id = ? AND reason LIKE 'adv:%'",
      [req.user.id]
    );
    const passed = new Set(passes.map((r) => Number(r.reason.split(":")[1])));
    res.json(
      materials.map((m) => ({
        id: m.id,
        type: m.mtype,
        typeLabel: MTYPE_LABEL[m.mtype] ?? m.mtype,
        title: m.title,
        minLevel: m.min_level,
        locked: level < m.min_level,
        passed: passed.has(m.id),
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "심화 자료 조회 중 오류가 발생했습니다" });
  }
});

// 지문 + 문항 (레벨 게이트, 정답/해설 미포함)
router.get("/materials/:id", requireAuth, async (req, res) => {
  try {
    const [[material]] = await pool.query(
      "SELECT * FROM adv_materials WHERE id = ?",
      [req.params.id]
    );
    if (!material) return res.status(404).json({ error: "자료가 없습니다" });
    const level = await getUserLevel(req.user.id);
    if (level < material.min_level) {
      return res
        .status(403)
        .json({ error: `이 자료는 레벨 ${material.min_level}부터 열람할 수 있어요` });
    }
    const [questions] = await pool.query(
      "SELECT id, qtype, question, choices FROM quiz_questions WHERE material_id = ?",
      [req.params.id]
    );
    res.json({
      id: material.id,
      type: material.mtype,
      typeLabel: MTYPE_LABEL[material.mtype] ?? material.mtype,
      title: material.title,
      body: material.body,
      meta: material.meta,
      questions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "자료 조회 중 오류가 발생했습니다" });
  }
});

// 심화 퀴즈 제출 (80점 이상 통과, XP는 자료당 1회)
router.post("/materials/:id/quiz", requireAuth, async (req, res) => {
  const { answers } = req.body || {};
  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: "answers 배열이 필요합니다" });
  }
  const conn = await pool.getConnection();
  try {
    const [[material]] = await conn.query(
      "SELECT id, min_level FROM adv_materials WHERE id = ?",
      [req.params.id]
    );
    if (!material) return res.status(404).json({ error: "자료가 없습니다" });
    const level = await getUserLevel(req.user.id);
    if (level < material.min_level) {
      return res.status(403).json({ error: "레벨이 부족합니다" });
    }
    const [questions] = await conn.query(
      "SELECT id, answer, explanation FROM quiz_questions WHERE material_id = ?",
      [req.params.id]
    );
    if (questions.length === 0) {
      return res.status(404).json({ error: "이 자료에는 문항이 없습니다" });
    }
    const { results, correct } = gradeQuizAnswers(questions, answers);
    await conn.beginTransaction();
    for (const result of results) {
      await conn.query(
        "INSERT INTO user_quiz_attempts (user_id, question_id, chosen, is_correct) VALUES (?, ?, ?, ?)",
        [req.user.id, result.questionId, result.chosen, result.correct]
      );
    }
    const scorePct = Math.round((correct / questions.length) * 100);
    const passed = scorePct >= ADV_PASS_PCT;
    let xpAwarded = 0;
    if (passed) {
      const xpResult = await awardXpOnce(
        conn,
        req.user.id,
        ADV_XP,
        `adv:${material.id}`
      );
      xpAwarded = xpResult.awarded ? ADV_XP : 0;
    }
    await conn.commit();
    res.json({ total: questions.length, correct, scorePct, passed, xpAwarded, results });
  } catch (err) {
    await conn.rollback();
    if (err instanceof QuizValidationError) {
      return res.status(400).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: "채점 중 오류가 발생했습니다" });
  } finally {
    conn.release();
  }
});

export default router;
