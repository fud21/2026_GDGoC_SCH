import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const THIS_YEAR = new Date().getFullYear()

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    birthYear: '',
    gender: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await register({
        email: form.email,
        password: form.password,
        name: form.name,
        birthYear: form.birthYear ? Number(form.birthYear) : undefined,
        gender: form.gender || undefined,
      })
      navigate('/onboarding/survey')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <h1>회원가입</h1>
      <form onSubmit={onSubmit} className="form">
        <label>
          이메일
          <input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            required
          />
        </label>
        <label>
          비밀번호 (8자 이상)
          <input
            type="password"
            value={form.password}
            minLength={8}
            onChange={(e) => set('password', e.target.value)}
            required
          />
        </label>
        <label>
          이름
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
          />
        </label>
        <label>
          출생연도 (선택)
          <input
            type="number"
            min="1900"
            max={THIS_YEAR}
            placeholder="예: 2004"
            value={form.birthYear}
            onChange={(e) => set('birthYear', e.target.value)}
          />
        </label>
        <label>
          성별 (선택)
          <select value={form.gender} onChange={(e) => set('gender', e.target.value)}>
            <option value="">선택 안 함</option>
            <option value="M">남성</option>
            <option value="F">여성</option>
            <option value="X">기타</option>
          </select>
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={busy}>
          {busy ? '가입 중…' : '가입하고 성향 진단하기'}
        </button>
      </form>
      <p className="hint">
        이미 계정이 있나요? <Link to="/login">로그인</Link>
      </p>
    </div>
  )
}
