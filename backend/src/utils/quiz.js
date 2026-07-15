export class QuizValidationError extends Error {}

export function gradeQuizAnswers(questionRows, answers) {
  if (!Array.isArray(answers) || answers.length !== questionRows.length) {
    throw new QuizValidationError("모든 문항에 한 번씩 답변해야 합니다");
  }

  const questionsById = new Map(
    questionRows.map((question) => [String(question.id), question])
  );
  const chosenByQuestionId = new Map();

  for (const submitted of answers) {
    if (submitted?.questionId == null || submitted?.chosen == null) {
      throw new QuizValidationError("문항 번호와 답변이 필요합니다");
    }

    const questionId = String(submitted.questionId);
    if (!questionsById.has(questionId)) {
      throw new QuizValidationError("현재 퀴즈에 없는 문항이 포함되어 있습니다");
    }
    if (chosenByQuestionId.has(questionId)) {
      throw new QuizValidationError("같은 문항에 중복 답변할 수 없습니다");
    }

    const chosen = String(submitted.chosen).trim();
    if (!chosen) {
      throw new QuizValidationError("빈 답변은 제출할 수 없습니다");
    }
    chosenByQuestionId.set(questionId, chosen);
  }

  let correct = 0;
  const results = questionRows.map((question) => {
    const chosen = chosenByQuestionId.get(String(question.id));
    const isCorrect = chosen === String(question.answer).trim();
    if (isCorrect) correct += 1;

    return {
      questionId: question.id,
      chosen,
      correct: isCorrect,
      answer: question.answer,
      explanation: question.explanation,
    };
  });

  return { results, correct };
}
