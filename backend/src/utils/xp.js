import { levelForXp } from "./level.js";

// 동일한 보상 사유는 한 번만 적립한다. 반드시 트랜잭션 커넥션 안에서 호출할 것.
export async function awardXpOnce(conn, userId, amount, reason) {
  const [event] = await conn.query(
    "INSERT IGNORE INTO xp_events (user_id, amount, reason) VALUES (?, ?, ?)",
    [userId, amount, reason]
  );
  if (event.affectedRows === 0) {
    return { awarded: false };
  }

  await conn.query("UPDATE users SET xp = xp + ? WHERE id = ?", [
    amount,
    userId,
  ]);
  const [[row]] = await conn.query("SELECT xp FROM users WHERE id = ?", [
    userId,
  ]);
  const level = levelForXp(row.xp);
  await conn.query("UPDATE users SET level = ? WHERE id = ?", [level, userId]);
  return { awarded: true, xp: row.xp, level };
}
