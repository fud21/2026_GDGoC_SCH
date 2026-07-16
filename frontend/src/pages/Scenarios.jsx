import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'

export default function Scenarios() {
  const navigate = useNavigate()
  const [scenarios, setScenarios] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/sim/scenarios').then(setScenarios).catch((e) => setError(e.message))
  }, [])

  async function start(s) {
    if (s.activeSessionId) {
      navigate(`/sim/replay/${s.activeSessionId}`)
      return
    }
    try {
      const r = await api('/sim/sessions', {
        method: 'POST',
        body: { mode: 'historical', scenarioId: s.id },
      })
      navigate(`/sim/replay/${r.sessionId}`)
    } catch (e) {
      setError(e.message)
    }
  }

  if (error) return <p className="error">{error}</p>
  if (!scenarios) return <p className="hint">불러오는 중…</p>

  return (
    <div>
      <header className="page-header">
        <Link to="/">←</Link>
        <h1>과거로 가는 시뮬레이션</h1>
      </header>
      <p className="hint">
        실제 과거 시세를 압축 재생합니다. 종목명은 끝날 때까지 비밀이에요 —
        결과를 알고 하는 투자는 연습이 안 되니까요.
      </p>
      <div className="chapter-list">
        {scenarios.map((s) => (
          <div key={s.id} className={s.locked ? 'chapter-card locked' : 'chapter-card'}>
            <div className="chapter-head">
              <h2>{s.title}</h2>
              {s.completed && <span className="badge">완료</span>}
            </div>
            <p className="hint">{s.description}</p>
            {s.locked ? (
              <p className="hint">🔒 레벨 {s.minLevel}부터 도전할 수 있어요</p>
            ) : (
              <button type="button" onClick={() => start(s)}>
                {s.activeSessionId ? '이어서 하기' : '도전하기 (완주 +30 XP)'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
