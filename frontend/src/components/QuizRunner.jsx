import { useState } from 'react'

// questions: [{id, qtype, question, choices}]
// submit: (answers: [{questionId, chosen}]) => Promise<{correct, total, results, ...}>
export default function QuizRunner({ questions, submit, onDone }) {
  const [chosen, setChosen] = useState({}) // questionId -> string
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const allAnswered = questions.every((q) => chosen[q.id] !== undefined)

  function optionsOf(q) {
    if (q.qtype === 'OX') return ['O', 'X']
    return Array.isArray(q.choices) ? q.choices : JSON.parse(q.choices || '[]')
  }

  async function onSubmit() {
    setBusy(true)
    setError('')
    try {
      const answers = questions.map((q) => ({
        questionId: q.id,
        chosen: chosen[q.id],
      }))
      const r = await submit(answers)
      setResult(r)
      onDone?.(r)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const resultOf = (qid) => result?.results?.find((r) => r.questionId === qid)

  return (
    <div className="quiz">
      {questions.map((q, i) => {
        const r = resultOf(q.id)
        return (
          <div key={q.id} className="quiz-q">
            <p className="quiz-question">
              Q{i + 1}. {q.question}
            </p>
            <div className="quiz-options">
              {optionsOf(q).map((opt) => {
                let cls = 'choice'
                if (!result && chosen[q.id] === opt) cls += ' selected'
                if (result) {
                  if (opt === r?.answer) cls += ' correct'
                  else if (chosen[q.id] === opt && !r?.correct) cls += ' wrong'
                }
                return (
                  <button
                    key={opt}
                    type="button"
                    className={cls}
                    disabled={!!result || busy}
                    onClick={() => setChosen({ ...chosen, [q.id]: opt })}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
            {result && r?.explanation && (
              <p className={r.correct ? 'quiz-explain ok' : 'quiz-explain no'}>
                {r.correct ? '정답! ' : `오답 (정답: ${r.answer}) `}
                {r.explanation}
              </p>
            )}
          </div>
        )
      })}
      {error && <p className="error">{error}</p>}
      {!result && (
        <button type="button" onClick={onSubmit} disabled={!allAnswered || busy}>
          {busy ? '채점 중…' : '제출하기'}
        </button>
      )}
      {result && (
        <div className="quiz-summary">
          <p>
            {result.total}문항 중 <strong>{result.correct}개</strong> 정답
            {result.scorePct !== undefined && ` (${result.scorePct}점)`}
          </p>
          {result.passed !== undefined && (
            <p className={result.passed ? 'ok' : 'no'}>
              {result.passed ? '통과했습니다! 🎉' : '80점 이상이면 통과예요. 다시 도전해보세요.'}
            </p>
          )}
          {(result.bonusXp > 0 || result.xpAwarded > 0) && (
            <p className="ok">+{result.bonusXp || result.xpAwarded} XP</p>
          )}
        </div>
      )}
    </div>
  )
}
