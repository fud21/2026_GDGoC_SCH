import { levelForXp } from "./level.js";

// XP를 적립하고 레벨을 재계산한다. 반드시 트랜잭션 커넥션 안에서 호출할 것.
export async function awardXp(conn, userId, amount, reason) {
  await conn.query(
    "INSERT INTO xp_events (user_id, amount, reason) VALUES (?, ?, ?)",
    [userId, amount, reason]
  );
  await conn.query("UPDATE users SET xp = xp + ? WHERE id = ?", [
    amount,
    userId,
  ]);
  const [[row]] = await conn.query("SELECT xp FROM users WHERE id = ?", [
    userId,
  ]);
  const level = levelForXp(row.xp);
  await conn.query("UPDATE users SET level = ? WHERE id = ?", [level, userId]);
  return { xp: row.xp, level };
}

// 같은 reason으로 이미 적립된 적이 있는지 (1회성 보상 중복 방지)
export async function hasXpReason(conn, userId, reason) {
  const [rows] = await conn.query(
    "SELECT id FROM xp_events WHERE user_id = ? AND reason = ? LIMIT 1",
    [userId, reason]
  );
  return rows.length > 0;
}
