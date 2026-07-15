import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'

export default function Chapter() {
  const { id } = useParams()
  const [lessons, setLessons] = useState(null)
  const [chapter, setChapter] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api(`/edu/chapters/${id}/lessons`).then(setLessons).catch((e) => setError(e.message))
    api('/edu/chapters')
      .then((cs) => setChapter(cs.find((c) => c.id === Number(id))))
      .catch(() => {})
  }, [id])

  if (error) return <p className="error">{error}</p>
  if (!lessons) return <p className="hint">불러오는 중…</p>

  const allDone = lessons.length > 0 && lessons.every((l) => l.completed)

  return (
    <div>
      <header className="page-header">
        <Link to="/edu">←</Link>
        <h1>{chapter?.title ?? '챕터'}</h1>
      </header>
      <div className="lesson-list">
        {lessons.map((l) => (
          <Link key={l.id} to={`/edu/lessons/${l.id}`} className="lesson-item">
            <span className={l.completed ? 'check done' : 'check'}>
              {l.completed ? '✓' : ''}
            </span>
            <span className="lesson-title">{l.title}</span>
            <span className="hint">+{l.xp_reward} XP</span>
          </Link>
        ))}
      </div>
      <div className="final-cta">
        <Link to={`/edu/chapters/${id}/final`} className="menu-card highlight">
          <h2>챕터 종합퀴즈 {chapter?.final_passed && '✓'}</h2>
          <p>
            {allDone
              ? '모든 레슨을 끝냈어요! 80점 이상이면 +50 XP'
              : '레슨을 다 끝내지 않아도 도전할 수 있어요 (80점 이상 통과)'}
          </p>
        </Link>
      </div>
    </div>
  )
}
