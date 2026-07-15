import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/useAuth'

export default function Survey() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [questions, setQuestions] = useState(null)
  const [answers, setAnswers] = useState({}) // qid -> choice index
  const [step, setStep] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api('/survey/questions').then(setQuestions).catch((e) => setError(e.message))
  }, [])

  if (error) return <p className="error">{error}</p>
  if (!questions) return <p className="hint">설문을 불러오는 중…</p>

  if (result) {
    return (
      <div className="survey-page">
        <h1>성향 진단 완료</h1>
        <div className="result-card">
          <p className="risk-type">{result.riskType}</p>
          <p className="hint">
            이 성향에 맞춘 AI 어시스턴트가 시뮬레이션에서 함께합니다.
            성향은 마이페이지에서 언제든 다시 진단할 수 있어요.
          </p>
        </div>
        <button onClick={() => navigate('/')}>시작하기</button>
      </div>
    )
  }

  const q = questions[step]
  const total = questions.length
  const isLast = step === total - 1

  async function choose(idx) {
    const next = { ...answers, [q.id]: idx }
    setAnswers(next)
    if (!isLast) {
      setStep(step + 1)
      return
    }
    setBusy(true)
    setError('')
    try {
      const payload = questions.map((qq) => ({ qid: qq.id, choice: next[qq.id] }))
      const r = await api('/survey/submit', { method: 'POST', body: { answers: payload } })
      await refresh()
      setResult(r)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="survey-page">
      <p className="progress">
        {step + 1} / {total}
      </p>
      <h2>{q.question}</h2>
      <div className="choices">
        {q.choices.map((label, idx) => (
          <button
            key={idx}
            type="button"
            disabled={busy}
            className={answers[q.id] === idx ? 'choice selected' : 'choice'}
            onClick={() => choose(idx)}
          >
            {label}
          </button>
        ))}
      </div>
      {step > 0 && (
        <button type="button" className="ghost" onClick={() => setStep(step - 1)}>
          이전 문항
        </button>
      )}
    </div>
  )
}
