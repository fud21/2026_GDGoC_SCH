import { useEffect, useState } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

function App() {
  const [users, setUsers] = useState([])
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const loadUsers = async () => {
    const res = await fetch(`${API_BASE}/api/users`)
    const data = await res.json()
    setUsers(data)
  }

  useEffect(() => {
    loadUsers().catch(() => setError('백엔드 서버에 연결할 수 없습니다.'))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const res = await fetch(`${API_BASE}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || '사용자 생성에 실패했습니다.')
      return
    }
    setEmail('')
    setName('')
    await loadUsers()
  }

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Frontend + Backend + DB 연동 확인</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit">추가</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <ul>
        {users.map((u) => (
          <li key={u.id}>
            {u.email} {u.name ? `(${u.name})` : ''}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
