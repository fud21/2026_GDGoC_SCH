import { Router } from "express";
import { pool } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
import { awardXp, hasXpReason } from "../utils/xp.js";

const router = Router();

const FINAL_PASS_PCT = 80;
const FINAL_XP = 50;
const QUIZ_BONUS_XP = 5;

// 챕터 목록 + 내 진행률 + 종합퀴즈 통과 여부
router.get("/chapters", requireAuth, async (req, res) => {
  try {
    const [chapters] = await pool.query(
      `SELECT c.id, c.slug, c.title, c.description, c.sort_order,
              COUNT(DISTINCT l.id) AS total_lessons,
              COUNT(DISTINCT p.lesson_id) AS completed_lessons
       FROM chapters c
       LEFT JOIN lessons l ON l.chapter_id = c.id
       LEFT JOIN user_lesson_progress p
         ON p.lesson_id = l.id AND p.user_id = ?
       GROUP BY c.id
       ORDER BY c.sort_order`,
      [req.user.id]
    );
    const [finals] = await pool.query(
      "SELECT reason FROM xp_events WHERE user_id = ? AND reason LIKE 'final:%'",
      [req.user.id]
    );
    const passed = new Set(finals.map((r) => Number(r.reason.split(":")[1])));
    res.json(
      chapters.map((c) => ({ ...c, final_passed: passed.has(c.id) }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "챕터 조회 중 오류가 발생했습니다" });
  }
});

// 챕터의 레슨 목록
router.get("/chapters/:id/lessons", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT l.id, l.title, l.sort_order, l.xp_reward,
              (p.lesson_id IS NOT NULL) AS completed
       FROM lessons l
       LEFT JOIN user_lesson_progress p
         ON p.lesson_id = l.id AND p.user_id = ?
       WHERE l.chapter_id = ?
       ORDER BY l.sort_order`,
      [req.user.id, req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "레슨 목록 조회 중 오류가 발생했습니다" });
  }
});

// 레슨 본문 + 퀴즈 (정답/해설은 제외하고 내려준다)
router.get("/lessons/:id", requireAuth, async (req, res) => {
  try {
    const [[lesson]] = await pool.query(
      `SELECT l.id, l.chapter_id, l.title, l.content, l.xp_reward,
              (p.lesson_id IS NOT NULL) AS completed
       FROM lessons l
       LEFT JOIN user_lesson_progress p
         ON p.lesson_id = l.id AND p.user_id = ?
       WHERE l.id = ?`,
      [req.user.id, req.params.id]
    );
    if (!lesson) return res.status(404).json({ error: "레슨이 없습니다" });
    const [questions] = await pool.query(
      "SELECT id, qtype, question, choices FROM quiz_questions WHERE lesson_id = ?",
      [req.params.id]
    );
    res.json({ ...lesson, questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "레슨 조회 중 오류가 발생했습니다" });
  }
});

// 레슨 완료 (1회만 XP)
router.post("/lessons/:id/complete", requireAuth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [[lesson]] = await conn.query(
      "SELECT id, xp_reward FROM lessons WHERE id = ?",
      [req.params.id]
    );
    if (!lesson) return res.status(404).json({ error: "레슨이 없습니다" });

    await conn.beginTransaction();
    const [ins] = await conn.query(
      "INSERT IGNORE INTO user_lesson_progress (user_id, lesson_id) VALUES (?, ?)",
      [req.user.id, lesson.id]
    );
    let awarded = 0;
    let stats = null;
    if (ins.affectedRows > 0) {
      awarded = lesson.xp_reward;
      stats = await awardXp(conn, req.user.id, awarded, `lesson:${lesson.id}`);
    }
    await conn.commit();
    res.json({ completed: true, xpAwarded: awarded, ...(stats || {}) });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: "완료 처리 중 오류가 발생했습니다" });
  } finally {
    conn.release();
  }
});

// 퀴즈 채점 공통 로직
async function gradeAnswers(conn, userId, questionRows, answers) {
  const byId = new Map(questionRows.map((q) => [q.id, q]));
  const results = [];
  let correct = 0;
  for (const a of answers) {
    const q = byId.get(a.questionId);
    if (!q) continue;
    const isCorrect = String(a.chosen).trim() === String(q.answer).trim();
    if (isCorrect) correct += 1;
    await conn.query(
      "INSERT INTO user_quiz_attempts (user_id, question_id, chosen, is_correct) VALUES (?, ?, ?, ?)",
      [userId, q.id, String(a.chosen), isCorrect]
    );
    results.push({
      questionId: q.id,
      correct: isCorrect,
      answer: q.answer,
      explanation: q.explanation,
    });
  }
  return { results, correct };
}

// 레슨 퀴즈 제출
router.post("/lessons/:id/quiz", requireAuth, async (req, res) => {
  const { answers } = req.body || {};
  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: "answers 배열이 필요합니다" });
  }
  const conn = await pool.getConnection();
  try {
    const [questions] = await conn.query(
      "SELECT id, answer, explanation FROM quiz_questions WHERE lesson_id = ?",
      [req.params.id]
    );
    if (questions.length === 0) {
      return res.status(404).json({ error: "이 레슨에는 퀴즈가 없습니다" });
    }
    await conn.beginTransaction();
    const { results, correct } = await gradeAnswers(
      conn,
      req.user.id,
      questions,
      answers
    );
    // 전문항 정답 보너스는 레슨당 1회
    let bonus = 0;
    const bonusReason = `quiz_bonus:${req.params.id}`;
    if (
      correct === questions.length &&
      !(await hasXpReason(conn, req.user.id, bonusReason))
    ) {
      bonus = QUIZ_BONUS_XP;
      await awardXp(conn, req.user.id, bonus, bonusReason);
    }
    await conn.commit();
    res.json({ total: questions.length, correct, bonusXp: bonus, results });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: "채점 중 오류가 발생했습니다" });
  } finally {
    conn.release();
  }
});

// 챕터 종합퀴즈 문항
router.get("/chapters/:id/final", requireAuth, async (req, res) => {
  try {
    const [questions] = await pool.query(
      `SELECT id, qtype, question, choices FROM quiz_questions
       WHERE chapter_id = ? AND lesson_id IS NULL AND material_id IS NULL`,
      [req.params.id]
    );
    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "종합퀴즈 조회 중 오류가 발생했습니다" });
  }
});

// 챕터 종합퀴즈 제출 (80점 이상 통과, 통과 XP는 챕터당 1회)
router.post("/chapters/:id/final", requireAuth, async (req, res) => {
  const { answers } = req.body || {};
  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: "answers 배열이 필요합니다" });
  }
  const conn = await pool.getConnection();
  try {
    const [questions] = await conn.query(
      `SELECT id, answer, explanation FROM quiz_questions
       WHERE chapter_id = ? AND lesson_id IS NULL AND material_id IS NULL`,
      [req.params.id]
    );
    if (questions.length === 0) {
      return res.status(404).json({ error: "이 챕터에는 종합퀴즈가 없습니다" });
    }
    await conn.beginTransaction();
    const { results, correct } = await gradeAnswers(
      conn,
      req.user.id,
      questions,
      answers
    );
    const scorePct = Math.round((correct / questions.length) * 100);
    const passed = scorePct >= FINAL_PASS_PCT;
    let xpAwarded = 0;
    const reason = `final:${req.params.id}`;
    if (passed && !(await hasXpReason(conn, req.user.id, reason))) {
      xpAwarded = FINAL_XP;
      await awardXp(conn, req.user.id, xpAwarded, reason);
    }
    await conn.commit();
    res.json({
      total: questions.length,
      correct,
      scorePct,
      passed,
      xpAwarded,
      results,
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: "채점 중 오류가 발생했습니다" });
  } finally {
    conn.release();
  }
});

// 용어 사전 검색
router.get("/glossary", requireAuth, async (req, res) => {
  const { q, chapter } = req.query;
  try {
    let sql = `SELECT g.id, g.term, g.definition, g.example, c.slug AS chapter_slug, c.title AS chapter_title
               FROM glossary_terms g JOIN chapters c ON c.id = g.chapter_id`;
    const cond = [];
    const params = [];
    if (q) {
      cond.push("(g.term LIKE ? OR g.definition LIKE ?)");
      params.push(`%${q}%`, `%${q}%`);
    }
    if (chapter) {
      cond.push("c.slug = ?");
      params.push(chapter);
    }
    if (cond.length) sql += " WHERE " + cond.join(" AND ");
    sql += " ORDER BY g.term LIMIT 100";
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "용어 검색 중 오류가 발생했습니다" });
  }
});

export default router;
