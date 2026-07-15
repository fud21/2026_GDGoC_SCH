import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'

export default function EduHub() {
  const [chapters, setChapters] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/edu/chapters').then(setChapters).catch((e) => setError(e.message))
  }, [])

  if (error) return <p className="error">{error}</p>
  if (!chapters) return <p className="hint">불러오는 중…</p>

  return (
    <div>
      <header className="page-header">
        <Link to="/">←</Link>
        <h1>투자 교육</h1>
      </header>
      <p className="hint">원하는 챕터를 골라 자유롭게 학습하세요.</p>
      <div className="chapter-list">
        {chapters.map((c) => {
          const pct = c.total_lessons
            ? Math.round((c.completed_lessons / c.total_lessons) * 100)
            : 0
          return (
            <Link key={c.id} to={`/edu/chapters/${c.id}`} className="chapter-card">
              <div className="chapter-head">
                <h2>{c.title}</h2>
                {c.final_passed && <span className="badge">종합퀴즈 통과</span>}
              </div>
              <p className="hint">{c.description}</p>
              <div className="xp-bar">
                <div className="xp-fill" style={{ width: `${pct}%` }} />
              </div>
              <p className="progress-label">
                {c.completed_lessons} / {c.total_lessons} 레슨 완료
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
