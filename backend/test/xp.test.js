import test from "node:test";
import assert from "node:assert/strict";
import { awardXpOnce } from "../src/utils/xp.js";

function connectionWithEventResult(affectedRows) {
  const statements = [];
  return {
    statements,
    async query(sql) {
      statements.push(sql);
      if (sql.startsWith("INSERT IGNORE")) return [{ affectedRows }];
      if (sql.startsWith("SELECT xp")) return [[{ xp: 160 }]];
      return [{ affectedRows: 1 }];
    },
  };
}

test("새 보상 사유면 XP와 레벨을 갱신한다", async () => {
  const conn = connectionWithEventResult(1);

  const result = await awardXpOnce(conn, 7, 10, "lesson:1");

  assert.deepEqual(result, { awarded: true, xp: 160, level: 2 });
  assert.equal(conn.statements.length, 4);
});

test("이미 지급한 보상 사유면 사용자 XP를 다시 갱신하지 않는다", async () => {
  const conn = connectionWithEventResult(0);

  const result = await awardXpOnce(conn, 7, 10, "lesson:1");

  assert.deepEqual(result, { awarded: false });
  assert.equal(conn.statements.length, 1);
});
