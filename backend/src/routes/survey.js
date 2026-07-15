import { Router } from "express";
import { pool } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
import {
  SURVEY_QUESTIONS,
  classifyRisk,
  scoreAnswers,
} from "../data/surveyQuestions.js";

const router = Router();

router.get("/questions", (req, res) => {
  // points는 클라이언트에 노출하지 않는다 (설문 조작 방지)
  res.json(
    SURVEY_QUESTIONS.map((q) => ({
      id: q.id,
      question: q.question,
      choices: q.choices.map((c) => c.label),
    }))
  );
});

router.post("/submit", requireAuth, async (req, res) => {
  const { answers } = req.body || {};
  if (!Array.isArray(answers)) {
    return res.status(400).json({ error: "answers 배열이 필요합니다" });
  }

  let score;
  try {
    score = scoreAnswers(answers);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
  const riskType = classifyRisk(score);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      "INSERT INTO risk_surveys (user_id, answers, score, risk_type) VALUES (?, ?, ?, ?)",
      [req.user.id, JSON.stringify(answers), score, riskType]
    );
    await conn.query("UPDATE users SET risk_type = ? WHERE id = ?", [
      riskType,
      req.user.id,
    ]);
    await conn.commit();
    res.json({ score, riskType });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: "설문 저장 중 오류가 발생했습니다" });
  } finally {
    conn.release();
  }
});

export default router;
