import { useEffect, useState } from 'react'
import { api } from '../api/client'

const krw = (v) =>
  v == null ? '-' : Math.round(v).toLocaleString('ko-KR') + '원'

// 시세 미니 차트 — 라이브: 최근 48시간(1시간봉), 시나리오: 시작~현재 시점 일봉(미래 미노출)
function Sparkline({ symbol, candleData }) {
  const [points, setPoints] = useState(null)
  useEffect(() => {
    if (candleData) {
      setPoints(candleData.map((c) => c.close))
      return
    }
    api(`/sim/candles?symbol=${symbol}&unit=60&count=48`)
      .then((cs) => setPoints(cs.map((c) => c.close)))
      .catch(() => setPoints([]))
  }, [symbol, candleData])

  if (!points) return <div className="sparkline hint">차트 로딩…</div>
  if (points.length === 0) return null

  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const W = 280
  const H = 60
  const path = points
    .map(
      (p, i) =>
        `${(i / (points.length - 1)) * W},${H - ((p - min) / range) * H}`
    )
    .join(' ')
  const rising = points[points.length - 1] >= points[0]

  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="최근 48시간 가격 추이"
    >
      <polyline
        points={path}
        fill="none"
        stroke={rising ? '#16a34a' : '#dc2626'}
        strokeWidth="2"
      />
    </svg>
  )
}

export default function OrderSheet({
  instrument,
  session,
  rules,
  holdings,
  onClose,
  onDone,
  candleData = null, // 시나리오 모드: 시작~현재까지의 일봉 (라이브면 null)
}) {
  const [side, setSide] = useState('BUY')
  const [orderType, setOrderType] = useState('MARKET')
  const [amountKrw, setAmountKrw] = useState('')
  const [qty, setQty] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const canLimit = rules?.orderTypes?.includes('LIMIT')
  const held = holdings.find((h) => h.instrumentId === instrument.id)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const body = { instrumentId: instrument.id, side, orderType }
      if (orderType === 'LIMIT') body.price = Number(price)
      if (side === 'BUY' && orderType === 'MARKET') {
        body.amountKrw = Number(amountKrw)
      } else if (side === 'BUY' && orderType === 'LIMIT') {
        if (amountKrw) body.amountKrw = Number(amountKrw)
        else body.qty = Number(qty)
      } else {
        body.qty = Number(qty)
      }
      const r = await api(`/sim/sessions/${session.id}/orders`, {
        method: 'POST',
        body,
      })
      if (r.status === 'open') {
        alert('지정가 주문이 등록됐어요. 가격이 도달하면 체결됩니다.')
      }
      await onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="term-head">
          <strong>
            {instrument.displayName} {krw(instrument.price)}
          </strong>
          <button type="button" className="chip" onClick={onClose}>
            닫기
          </button>
        </div>
        <Sparkline symbol={instrument.symbol} candleData={candleData} />

        <div className="filter-row">
          <button
            type="button"
            className={side === 'BUY' ? 'chip active' : 'chip'}
            onClick={() => setSide('BUY')}
          >
            매수
          </button>
          <button
            type="button"
            className={side === 'SELL' ? 'chip active' : 'chip'}
            onClick={() => setSide('SELL')}
          >
            매도
          </button>
          <button
            type="button"
            className={orderType === 'MARKET' ? 'chip active' : 'chip'}
            onClick={() => setOrderType('MARKET')}
          >
            시장가
          </button>
          <button
            type="button"
            className={orderType === 'LIMIT' ? 'chip active' : 'chip'}
            disabled={!canLimit}
            title={canLimit ? '' : '레벨 3부터 사용 가능'}
            onClick={() => canLimit && setOrderType('LIMIT')}
          >
            지정가{!canLimit && ' 🔒'}
          </button>
        </div>

        <form onSubmit={submit} className="form">
          {orderType === 'LIMIT' && (
            <label>
              지정가 (원)
              <input
                type="number"
                min="0"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </label>
          )}
          {side === 'BUY' ? (
            <label>
              매수 금액 (원) — 보유 현금 {krw(session.cash)}
              <input
                type="number"
                min="0"
                step="any"
                value={amountKrw}
                onChange={(e) => setAmountKrw(e.target.value)}
                placeholder="예: 100000"
                required
              />
            </label>
          ) : (
            <label>
              매도 수량 — 보유 {held ? held.qty : 0}개
              <input
                type="number"
                min="0"
                step="any"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                required
              />
              {held && (
                <span className="filter-row">
                  {[25, 50, 100].map((p) => (
                    <button
                      key={p}
                      type="button"
                      className="chip"
                      onClick={() => setQty(String((held.qty * p) / 100))}
                    >
                      {p}%
                    </button>
                  ))}
                </span>
              )}
            </label>
          )}
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={busy}>
            {busy ? '주문 중…' : side === 'BUY' ? '매수하기' : '매도하기'}
          </button>
          <p className="hint">수수료 0.05% · 시장가는 현재가로 즉시 체결됩니다.</p>
        </form>
      </div>
    </div>
  )
}
