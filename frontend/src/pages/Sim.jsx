import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/useAuth'
import OrderSheet from '../components/OrderSheet'

const krw = (v) =>
  v == null ? '-' : Math.round(v).toLocaleString('ko-KR') + '원'
const pct = (v) =>
  v == null ? '-' : `${v >= 0 ? '+' : ''}${(v * 100).toFixed(2)}%`

export default function Sim() {
  const { user } = useAuth()
  const [rules, setRules] = useState(null)
  const [sessionId, setSessionId] = useState(undefined) // undefined=로딩, null=없음
  const [session, setSession] = useState(null)
  const [instruments, setInstruments] = useState([])
  const [tab, setTab] = useState('market')
  const [orderTarget, setOrderTarget] = useState(null) // 주문 시트 대상 종목
  const [orders, setOrders] = useState([])
  const [board, setBoard] = useState([])
  const [error, setError] = useState('')

  const loadSession = useCallback(async (id) => {
    if (!id) return
    try {
      setSession(await api(`/sim/sessions/${id}`))
    } catch (e) {
      setError(e.message)
    }
  }, [])

  const loadInstruments = useCallback(async () => {
    try {
      setInstruments(await api('/sim/instruments'))
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }, [])

  // 초기 로드
  useEffect(() => {
    api('/sim/rules').then(setRules).catch((e) => setError(e.message))
    api('/sim/sessions/active')
      .then((r) => setSessionId(r.sessionId))
      .catch((e) => setError(e.message))
    loadInstruments()
  }, [loadInstruments])

  // 세션/시세 폴링
  useEffect(() => {
    if (!sessionId) return
    loadSession(sessionId)
    const t = setInterval(() => {
      loadInstruments()
      loadSession(sessionId)
    }, 5000)
    return () => clearInterval(t)
  }, [sessionId, loadSession, loadInstruments])

  useEffect(() => {
    if (tab === 'orders' && sessionId) {
      api(`/sim/sessions/${sessionId}/orders`).then(setOrders).catch(() => {})
    }
    if (tab === 'rank') {
      api('/sim/leaderboard').then(setBoard).catch(() => {})
    }
  }, [tab, sessionId, session?.equity])

  async function start() {
    try {
      const r = await api('/sim/sessions', { method: 'POST' })
      setSessionId(r.sessionId)
    } catch (e) {
      setError(e.message)
    }
  }

  async function endSession() {
    if (!confirm('모의투자를 종료할까요? 수익률이 확정되고 리더보드에 기록됩니다.')) return
    try {
      await api(`/sim/sessions/${sessionId}/end`, { method: 'POST' })
      setSessionId(null)
      setSession(null)
    } catch (e) {
      setError(e.message)
    }
  }

  async function cancelOrder(orderId) {
    try {
      await api(`/sim/sessions/${sessionId}/orders/${orderId}`, { method: 'DELETE' })
      await loadSession(sessionId)
      setOrders(await api(`/sim/sessions/${sessionId}/orders`))
    } catch (e) {
      setError(e.message)
    }
  }

  if (sessionId === undefined) return <p className="hint">불러오는 중…</p>

  // 세션 없음 → 시작 화면
  if (!sessionId) {
    return (
      <div>
        <header className="page-header">
          <Link to="/">←</Link>
          <h1>모의투자</h1>
        </header>
        <div className="result-card">
          <p className="risk-type">시드머니 {krw(rules?.seedMoney)}</p>
          <p className="hint">
            현재 레벨 Lv.{rules?.level} 기준이에요. 교육을 진행해 레벨을 올리면
            시드머니가 늘어나고 지정가 주문(Lv3+)이 열립니다.
          </p>
          <p className="hint">
            실제 코인 시세(업비트)를 그대로 쓰지만, 돈은 100% 가상입니다.
          </p>
        </div>
        {error && <p className="error">{error}</p>}
        <button onClick={start}>모의투자 시작하기</button>
        <p className="disclaimer">
          본 서비스는 교육 목적의 모의투자이며 실제 투자 권유가 아닙니다.
        </p>
      </div>
    )
  }

  return (
    <div>
      <header className="page-header">
        <Link to="/">←</Link>
        <h1>모의투자</h1>
      </header>

      {session && (
        <section className="level-card sim-summary">
          <div className="sim-equity">
            <span>총 자산 {krw(session.equity)}</span>
            <strong className={session.returnRate >= 0 ? 'up' : 'down'}>
              {pct(session.returnRate)}
            </strong>
          </div>
          <p className="hint">
            현금 {krw(session.cash)}
            {session.lockedCash > 0 && ` · 주문 중 ${krw(session.lockedCash)}`}
          </p>
        </section>
      )}
      {error && <p className="error">{error}</p>}

      <div className="filter-row">
        {[
          ['market', '시세'],
          ['holdings', '보유'],
          ['orders', '주문'],
          ['rank', '랭킹'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={tab === key ? 'chip active' : 'chip'}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'market' && (
        <div className="term-list">
          {instruments.map((i) => (
            <button
              key={i.id}
              type="button"
              className="coin-row"
              onClick={() => setOrderTarget(i)}
            >
              <span className="coin-name">
                {i.displayName}
                <small className="hint"> {i.symbol}</small>
              </span>
              <span className="coin-price">
                {krw(i.price)}
                <small className={i.changeRate >= 0 ? 'up' : 'down'}>
                  {pct(i.changeRate)}
                </small>
              </span>
            </button>
          ))}
        </div>
      )}

      {tab === 'holdings' && session && (
        <div>
          <div className="term-list">
            {session.holdings.length === 0 && (
              <p className="hint">아직 보유한 코인이 없어요. 시세 탭에서 시작해보세요.</p>
            )}
            {session.holdings.map((h) => (
              <div key={h.instrumentId} className="term-card">
                <div className="term-head">
                  <strong>{h.displayName}</strong>
                  <span className={h.pnl >= 0 ? 'up' : 'down'}>
                    {krw(h.pnl)} ({pct(h.pnlRate)})
                  </span>
                </div>
                <p className="hint">
                  {h.qty}개 · 평단 {krw(h.avgPrice)} · 현재 {krw(h.currentPrice)} ·
                  평가 {krw(h.value)}
                </p>
              </div>
            ))}
          </div>
          <button className="ghost end-btn" onClick={endSession}>
            모의투자 종료 (수익률 확정)
          </button>
        </div>
      )}

      {tab === 'orders' && (
        <div className="term-list">
          {session?.openOrders?.map((o) => (
            <div key={o.id} className="term-card">
              <div className="term-head">
                <strong>
                  {o.side === 'BUY' ? '매수' : '매도'} 대기 · {o.display_name}
                </strong>
                <button type="button" className="chip" onClick={() => cancelOrder(o.id)}>
                  취소
                </button>
              </div>
              <p className="hint">
                {o.qty}개 @ {krw(o.price)} (지정가)
              </p>
            </div>
          ))}
          {orders
            .filter((o) => o.status !== 'open')
            .map((o) => (
              <div key={o.id} className="term-card">
                <div className="term-head">
                  <strong>
                    {o.side === 'BUY' ? '매수' : '매도'} · {o.display_name}
                  </strong>
                  <span className="badge">{o.status === 'filled' ? '체결' : '취소'}</span>
                </div>
                <p className="hint">
                  {o.qty}개 @ {krw(o.executed_price ?? o.price)} ·{' '}
                  {new Date(o.created_at).toLocaleString('ko-KR')}
                </p>
              </div>
            ))}
          {orders.length === 0 && !session?.openOrders?.length && (
            <p className="hint">주문 내역이 없습니다.</p>
          )}
        </div>
      )}

      {tab === 'rank' && (
        <div className="term-list">
          {board.map((r) => (
            <div key={r.rank} className={r.mine ? 'term-card mine' : 'term-card'}>
              <div className="term-head">
                <strong>
                  {r.rank}위 {r.name} {r.mine && '(나)'}
                </strong>
                <span className={r.returnRate >= 0 ? 'up' : 'down'}>
                  {pct(r.returnRate)}
                </span>
              </div>
              <p className="hint">{r.status === 'active' ? '진행 중' : '종료'}</p>
            </div>
          ))}
          {board.length === 0 && <p className="hint">아직 기록이 없습니다.</p>}
        </div>
      )}

      {orderTarget && session && (
        <OrderSheet
          instrument={orderTarget}
          session={session}
          rules={rules}
          holdings={session.holdings}
          onClose={() => setOrderTarget(null)}
          onDone={async () => {
            setOrderTarget(null)
            await loadSession(sessionId)
          }}
        />
      )}

      <p className="disclaimer">
        본 서비스는 교육 목적의 모의투자이며 실제 투자 권유가 아닙니다.
        {user?.risk_type && ` · 내 성향: ${user.risk_type}`}
      </p>
    </div>
  )
}
