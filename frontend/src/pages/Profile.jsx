import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { api } from '../api/client'

export default function Profile() {
  const { user } = useAuth()
  const [chapters, setChapters] = useState(null)
  const [attempts, setAttempts] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api('/edu/chapters'), api('/judgment/history')])
      .then(([chapterData, judgmentData]) => {
        setChapters(chapterData)
        setAttempts(judgmentData.attempts)
      })
      .catch((err) => setError(err.message))
  }, [])

  const xpPct = user
    ? Math.min(100, Math.round((user.xp / user.nextLevelXp) * 100))
    : 0

  const passedFinals = chapters?.filter((c) => c.final_passed).length ?? 0
  const completedLessons = chapters?.reduce((sum, c) => sum + c.completed_lessons, 0) ?? 0
  const totalLessons = chapters?.reduce((sum, c) => sum + c.total_lessons, 0) ?? 0

  const attemptCount = attempts?.length ?? 0
  const avgScore = attemptCount
    ? Math.round(attempts.reduce((sum, a) => sum + a.totalScore, 0) / attemptCount)
    : null

  return (
    <div className="profile-page">
      <header className="page-header">
        <Link to="/">←</Link>
        <h1>내 정보</h1>
      </header>

      <section className="profile-summary">
        <h2>{user?.name}</h2>
        <p className="hint">{user?.email}</p>
        <p className="hint">
          {user?.risk_type ? `투자 성향: ${user.risk_type}` : '아직 성향 진단을 하지 않았어요'}
        </p>
      </section>

      <section className="level-card">
        <p>
          Lv.{user?.level} · XP {user?.xp} / {user?.nextLevelXp}
        </p>
        <div className="xp-bar">
          <div className="xp-fill" style={{ width: `${xpPct}%` }} />
        </div>
      </section>

      {error && <p className="error">{error}</p>}

      <section>
        <div className="chapter-head">
          <h2>학습 현황</h2>
          <Link to="/edu" className="hint">교육으로 이동 →</Link>
        </div>
        {!chapters && !error && <p className="hint">불러오는 중…</p>}
        {chapters && (
          <p className="progress-label">
            레슨 {completedLessons} / {totalLessons}개 완료 · 종합퀴즈 {passedFinals} / {chapters.length}개 통과
          </p>
        )}
      </section>

      <section>
        <div className="chapter-head">
          <h2>투자 판단 훈련</h2>
          <Link to="/judgment/history" className="hint">전체 기록 →</Link>
        </div>
        {!attempts && !error && <p className="hint">불러오는 중…</p>}
        {attempts && attemptCount === 0 && <p className="hint">아직 완료한 훈련이 없습니다.</p>}
        {attemptCount > 0 && (
          <>
            <p className="progress-label">
              {attemptCount}회 훈련 · 평균 {avgScore}점
            </p>
            <div className="history-list">
              {attempts.slice(0, 3).map((attempt) => (
                <Link to={`/judgment/results/${attempt.id}`} key={attempt.id}>
                  <div><strong>{attempt.scenarioId}</strong><span>{attempt.holdingPeriod}</span></div>
                  <div>
                    <b>{attempt.totalScore}점</b>
                    <span className={attempt.afterReturn >= 0 ? 'positive' : 'negative'}>
                      {attempt.afterReturn >= 0 ? '+' : ''}{attempt.afterReturn}%
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
