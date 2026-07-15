import test from "node:test";
import assert from "node:assert/strict";
import {
  gradeQuizAnswers,
  QuizValidationError,
} from "../src/utils/quiz.js";

const QUESTIONS = [
  { id: 1, answer: "O", explanation: "첫 번째 해설" },
  { id: 2, answer: "정답", explanation: "두 번째 해설" },
];

test("모든 문항을 문항 순서대로 채점한다", () => {
  const graded = gradeQuizAnswers(QUESTIONS, [
    { questionId: 2, chosen: "오답" },
    { questionId: 1, chosen: " O " },
  ]);

  assert.equal(graded.correct, 1);
  assert.deepEqual(
    graded.results.map(({ questionId, chosen, correct }) => ({
      questionId,
      chosen,
      correct,
    })),
    [
      { questionId: 1, chosen: "O", correct: true },
      { questionId: 2, chosen: "오답", correct: false },
    ]
  );
});

test("일부 문항만 제출하면 거부한다", () => {
  assert.throws(
    () => gradeQuizAnswers(QUESTIONS, [{ questionId: 1, chosen: "O" }]),
    QuizValidationError
  );
});

test("같은 문항을 중복 제출하면 거부한다", () => {
  assert.throws(
    () =>
      gradeQuizAnswers(QUESTIONS, [
        { questionId: 1, chosen: "O" },
        { questionId: 1, chosen: "O" },
      ]),
    /중복 답변/
  );
});

test("현재 퀴즈에 없는 문항과 빈 답변을 거부한다", () => {
  assert.throws(
    () =>
      gradeQuizAnswers(QUESTIONS, [
        { questionId: 1, chosen: "O" },
        { questionId: 3, chosen: "정답" },
      ]),
    /없는 문항/
  );
  assert.throws(
    () =>
      gradeQuizAnswers(QUESTIONS, [
        { questionId: 1, chosen: "O" },
        { questionId: 2, chosen: "   " },
      ]),
    /빈 답변/
  );
  assert.throws(
    () =>
      gradeQuizAnswers(QUESTIONS, [
        { questionId: 1, chosen: "O" },
        { questionId: 2, chosen: null },
      ]),
    /문항 번호와 답변/
  );
});
