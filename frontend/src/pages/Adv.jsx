import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'

export default function Adv() {
  const [materials, setMaterials] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/adv/materials').then(setMaterials).catch((e) => setError(e.message))
  }, [])

  if (error) return <p className="error">{error}</p>
  if (!materials) return <p className="hint">불러오는 중…</p>

  return (
    <div>
      <header className="page-header">
        <Link to="/">←</Link>
        <h1>심화 교육</h1>
      </header>
      <p className="hint">
        기사, 리포트, 재무제표를 직접 읽고 해석하는 실전 독해 훈련입니다.
        통과 시 +30 XP.
      </p>
      <div className="chapter-list">
        {materials.map((m) => (
          <Link
            key={m.id}
            to={m.locked ? '#' : `/adv/${m.id}`}
            className={m.locked ? 'chapter-card locked' : 'chapter-card'}
            onClick={(e) => m.locked && e.preventDefault()}
          >
            <div className="chapter-head">
              <h2>{m.title}</h2>
              {m.passed && <span className="badge">통과</span>}
            </div>
            <p className="hint">
              {m.typeLabel}
              {m.locked && ` · 🔒 레벨 ${m.minLevel}부터`}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
