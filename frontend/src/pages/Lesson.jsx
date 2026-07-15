import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import QuizRunner from '../components/QuizRunner'

export default function Lesson() {
  const { id } = useParams()
  const { refresh } = useAuth()
  const [lesson, setLesson] = useState(null)
  const [error, setError] = useState('')
  const [completing, setCompleting] = useState(false)
  const [xpMsg, setXpMsg] = useState('')

  useEffect(() => {
    setLesson(null)
    api(`/edu/lessons/${id}`).then(setLesson).catch((e) => setError(e.message))
  }, [id])

  if (error) return <p className="error">{error}</p>
  if (!lesson) return <p className="hint">불러오는 중…</p>

  async function complete() {
    setCompleting(true)
    try {
      const r = await api(`/edu/lessons/${id}/complete`, { method: 'POST' })
      if (r.xpAwarded > 0) setXpMsg(`+${r.xpAwarded} XP 획득!`)
      setLesson({ ...lesson, completed: 1 })
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setCompleting(false)
    }
  }

  return (
    <div>
      <header className="page-header">
        <Link to={`/edu/chapters/${lesson.chapter_id}`}>←</Link>
        <h1>{lesson.title}</h1>
      </header>

      <article className="lesson-content">
        <ReactMarkdown>{lesson.content}</ReactMarkdown>
      </article>

      {!lesson.completed ? (
        <button onClick={complete} disabled={completing}>
          {completing ? '처리 중…' : `학습 완료 (+${lesson.xp_reward} XP)`}
        </button>
      ) : (
        <p className="ok">✓ 완료한 레슨입니다 {xpMsg}</p>
      )}

      {lesson.questions?.length > 0 && (
        <section className="lesson-quiz">
          <h2>확인 퀴즈</h2>
          <QuizRunner
            questions={lesson.questions}
            submit={(answers) =>
              api(`/edu/lessons/${id}/quiz`, { method: 'POST', body: { answers } })
            }
            onDone={refresh}
          />
        </section>
      )}
    </div>
  )
}
