import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'

// 모의투자 화면의 AI 어시스턴트 패널 (접이식)
export default function AssistantPanel({ sessionId, riskType }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [nudge, setNudge] = useState(null)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  // 넛지: 포트폴리오 상태 기반 상황 코멘트 (30초마다 갱신)
  useEffect(() => {
    if (!sessionId) return
    let stop = false
    async function poll() {
      try {
        const r = await api(`/assistant/nudge?sessionId=${sessionId}`)
        if (!stop) setNudge(r.nudge)
      } catch {
        /* 넛지는 부가 기능: 실패해도 조용히 넘어간다 */
      }
    }
    poll()
    const t = setInterval(poll, 30_000)
    return () => {
      stop = true
      clearInterval(t)
    }
  }, [sessionId])

  useEffect(() => {
    if (open) {
      api('/assistant/history')
        .then(setMessages)
        .catch(() => {})
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  async function send(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    setError('')
    setBusy(true)
    setMessages((m) => [...m, { id: `tmp-${Date.now()}`, role: 'user', content: text }])
    try {
      const r = await api('/assistant/chat', {
        method: 'POST',
        body: { message: text, simSessionId: sessionId },
      })
      setMessages((m) => [
        ...m,
        { id: `tmp-r-${Date.now()}`, role: 'assistant', content: r.reply },
      ])
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {nudge && (
        <div className="nudge-banner" role="status">
          <span>💬 {nudge.message}</span>
          <button type="button" className="chip" onClick={() => setNudge(null)}>
            닫기
          </button>
        </div>
      )}

      <button
        type="button"
        className="assistant-fab"
        onClick={() => setOpen(!open)}
        aria-label="AI 어시스턴트 열기"
      >
        {open ? '✕' : '🤝'}
      </button>

      {open && (
        <div className="assistant-panel">
          <div className="assistant-head">
            <strong>AI 코치</strong>
            <span className="hint">
              {riskType ? `${riskType} 맞춤` : '성향 진단 전'}
            </span>
          </div>
          <div className="assistant-messages">
            {messages.length === 0 && (
              <p className="hint">
                투자 용어, 지금 포트폴리오에 대한 고민 등 무엇이든 물어보세요.
              </p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={m.role === 'user' ? 'bubble user' : 'bubble bot'}
              >
                {m.content}
              </div>
            ))}
            {busy && <div className="bubble bot hint">생각 중…</div>}
            <div ref={bottomRef} />
          </div>
          {error && <p className="error">{error}</p>}
          <form onSubmit={send} className="assistant-input">
            <input
              type="text"
              value={input}
              maxLength={500}
              placeholder="질문을 입력하세요"
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" disabled={busy || !input.trim()}>
              전송
            </button>
          </form>
        </div>
      )}
    </>
  )
}
