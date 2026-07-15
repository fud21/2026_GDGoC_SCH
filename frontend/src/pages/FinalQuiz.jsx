import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/useAuth'
import QuizRunner from '../components/QuizRunner'

export default function FinalQuiz() {
  const { id } = useParams()
  const { refresh } = useAuth()
  const [questions, setQuestions] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api(`/edu/chapters/${id}/final`)
      .then(setQuestions)
      .catch((e) => setError(e.message))
  }, [id])

  if (error) return <p className="error">{error}</p>
  if (!questions) return <p className="hint">불러오는 중…</p>

  return (
    <div>
      <header className="page-header">
        <Link to={`/edu/chapters/${id}`}>←</Link>
        <h1>챕터 종합퀴즈</h1>
      </header>
      <p className="hint">80점 이상이면 통과! 통과 시 +50 XP (최초 1회)</p>
      <QuizRunner
        questions={questions}
        submit={(answers) =>
          api(`/edu/chapters/${id}/final`, { method: 'POST', body: { answers } })
        }
        onDone={refresh}
      />
    </div>
  )
}
