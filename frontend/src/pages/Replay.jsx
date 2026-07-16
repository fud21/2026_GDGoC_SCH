import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/useAuth'
import OrderSheet from '../components/OrderSheet'

const krw = (v) =>
  v == null ? '-' : Math.round(v).toLocaleString('ko-KR') + '원'
const pct = (v) =>
  v == null ? '-' : `${v >= 0 ? '+' : ''}${(v * 100).toFixed(2)}%`
const dateStr = (v) => (v ? new Date(v).toLocaleDateString('ko-KR') : '-')

export default function Replay() {
  const { id } = useParams()
  const { refresh } = useAuth()
  const [session, setSession] = useState(null)
  const [rules, setRules] = useState(null)
  const [report, setReport] = useState(null)
  const [orderTarget, setOrderTarget] = useState(null)
  const [candles, setCandles] = useState(null)
  const [auto, setAuto] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const autoRef = useRef(null)

  const load = useCallback(async () => {
    try {
      const s = await api(`/sim/sessions/${id}`)
      setSession(s)
      if (s.status === 'ended' && !report) {
        setReport(await api(`/sim/sessions/${id}/report`))
      }
      return s
    } catch (e) {
      setError(e.message)
    }
  }, [id, report])

  useEffect(() => {
    load()
    api('/sim/rules').then(setRules).catch(() => {})
  }, [load])

  const tick = useCallback(
    async (days) => {
      if (busy) return
      setBusy(true)
      setError('')
      try {
        const r = await api(`/sim/sessions/${id}/tick`, {
          method: 'POST',
          body: { days },
        })
        if (r.ended) {
          setAuto(false)
          setReport(r.report)
          await refresh() // XP 반영
        }
        await load()
      } catch (e) {
        setError(e.message)
        setAuto(false)
      } finally {
        setBusy(false)
      }
    },
    [id, busy, load, refresh],
  )

  // 자동 재생: 1.5초마다 하루씩
  useEffect(() => {
    if (!auto) return
    autoRef.current = setInterval(() => tick(1), 1500)
    return () => clearInterval(autoRef.current)
  }, [auto, tick])

  async function openOrder(inst) {
    try {
      const cs = await api(`/sim/sessions/${id}/scenario-candles?instrumentId=${inst.id}`)
      setCandles(cs)
      setOrderTarget(inst)
    } catch (e) {
      setError(e.message)
    }
  }

  if (!session) return <p className="hint">{error || '불러오는 중…'}</p>

  const ended = session.status === 'ended'

  return (
    <div>
      <header className="page-header">
        <Link to="/sim/scenarios">←</Link>
        <h1>{session.scenario?.title ?? '시나리오'}</h1>
      </header>

      <section className="level-card sim-summary">
        <div className="sim-equity">
          <span>총 자산 {krw(session.equity)}</span>
          <strong className={session.returnRate >= 0 ? 'up' : 'down'}>
            {pct(session.returnRate)}
          </strong>
        </div>
        <p className="hint">
          시뮬레이션 날짜 <strong>{dateStr(session.simClock)}</strong> · 현금{' '}
          {krw(session.cash)}
        </p>
        <div className="xp-bar">
          <div className="xp-fill" style={{ width: `${(session.progress ?? 0) * 100}%` }} />
        </div>
      </section>

      {error && <p className="error">{error}</p>}

      {!ended && (
        <div className="filter-row">
          <button type="button" className="chip" disabled={busy} onClick={() => tick(1)}>
            +1일
          </button>
          <button type="button" className="chip" disabled={busy} onClick={() => tick(7)}>
            +7일
          </button>
          <button
            type="button"
            className={auto ? 'chip active' : 'chip'}
            onClick={() => setAuto(!auto)}
          >
            {auto ? '⏸ 정지' : '▶ 자동 재생'}
          </button>
        </div>
      )}

      {!ended && (
        <div className="term-list">
          {session.instruments?.map((i) => {
            const h = session.holdings.find((x) => x.instrumentId === i.id)
            return (
              <button
                key={i.id}
                type="button"
                className="coin-row"
                onClick={() => openOrder(i)}
              >
                <span className="coin-name">
                  {i.displayName}
                  {h && <small className="hint"> 보유 {h.qty}개</small>}
                </span>
                <span className="coin-price">
                  {krw(i.price)}
                  {h && (
                    <small className={h.pnlRate >= 0 ? 'up' : 'down'}>
                      {pct(h.pnlRate)}
                    </small>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {!ended && session.articles?.length > 0 && (
        <section>
          <h2 className="news-title">📰 지금 시장에서는</h2>
          <div className="term-list">
            {session.articles.map((a) => (
              <div key={a.id} className="term-card">
                <div className="term-head">
                  <strong>{a.title}</strong>
                  <span className="hint">{dateStr(a.published_at)}</span>
                </div>
                <p className="hint">{a.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {ended && report && (
        <section>
          <div className="result-card">
            <p className="risk-type">{pct(report.finalReturn)}</p>
            <p className="hint">
              {dateStr(report.period.start)} ~ {dateStr(report.period.end)} ·
              체결 {report.trades}건 (매수 {report.buys} / 매도 {report.sells})
            </p>
          </div>
          <h2 className="news-title">종목 공개 & 그냥 들고만 있었다면?</h2>
          <div className="term-list">
            {report.benchmarks.map((b) => (
              <div key={b.displayName} className="term-card">
                <div className="term-head">
                  <strong>
                    {b.displayName} = {b.realName}
                  </strong>
                  <span className={b.buyHoldReturn >= 0 ? 'up' : 'down'}>
                    {pct(b.buyHoldReturn)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="hint">
            내 수익률과 매수후보유(B&H)를 비교해보세요. 잦은 매매가 나았는지,
            기다림이 나았는지가 이번 복기의 핵심입니다.
          </p>
          <Link to="/sim/scenarios">
            <button type="button" className="end-btn">다른 시나리오 도전하기</button>
          </Link>
        </section>
      )}

      {orderTarget && (
        <OrderSheet
          instrument={orderTarget}
          session={session}
          rules={rules ?? { orderTypes: ['MARKET'] }}
          holdings={session.holdings}
          candleData={candles}
          onClose={() => setOrderTarget(null)}
          onDone={async () => {
            setOrderTarget(null)
            await load()
          }}
        />
      )}

      <p className="disclaimer">
        과거 데이터 기반 학습용 시뮬레이션입니다. 과거 수익률은 미래를 보장하지 않습니다.
      </p>
    </div>
  )
}
