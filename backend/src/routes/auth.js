import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import { xpNeededForLevel } from "../utils/level.js";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/register", async (req, res) => {
  const { email, password, name, birthYear, gender } = req.body || {};

  if (!EMAIL_RE.test(email || "")) {
    return res.status(400).json({ error: "올바른 이메일을 입력해주세요" });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: "비밀번호는 8자 이상이어야 합니다" });
  }
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "이름을 입력해주세요" });
  }
  const year = birthYear ? Number(birthYear) : null;
  if (year !== null && (year < 1900 || year > new Date().getFullYear())) {
    return res.status(400).json({ error: "출생연도가 올바르지 않습니다" });
  }
  if (gender && !["M", "F", "X"].includes(gender)) {
    return res.status(400).json({ error: "성별 값이 올바르지 않습니다" });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (email, password_hash, name, birth_year, gender)
       VALUES (?, ?, ?, ?, ?)`,
      [email.toLowerCase(), hash, name.trim(), year, gender || null]
    );
    const user = { id: result.insertId, email: email.toLowerCase() };
    res.status(201).json({ token: signToken(user) });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "이미 가입된 이메일입니다" });
    }
    console.error(err);
    res.status(500).json({ error: "가입 처리 중 오류가 발생했습니다" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "이메일과 비밀번호를 입력해주세요" });
  }
  try {
    const [rows] = await pool.query(
      "SELECT id, email, password_hash FROM users WHERE email = ?",
      [email.toLowerCase()]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "이메일 또는 비밀번호가 일치하지 않습니다" });
    }
    res.json({ token: signToken(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "로그인 처리 중 오류가 발생했습니다" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, email, name, birth_year, gender, risk_type, xp, level, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );
    const user = rows[0];
    if (!user) return res.status(404).json({ error: "사용자를 찾을 수 없습니다" });
    res.json({
      ...user,
      nextLevelXp: xpNeededForLevel(user.level + 1),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "조회 중 오류가 발생했습니다" });
  }
});

export default router;
