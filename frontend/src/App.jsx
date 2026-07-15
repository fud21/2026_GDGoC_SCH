import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Survey from './pages/Survey'
import Home from './pages/Home'
import Placeholder from './pages/Placeholder'
import './App.css'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <p className="hint center">불러오는 중…</p>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <Protected>
              <Home />
            </Protected>
          }
        />
        <Route
          path="/onboarding/survey"
          element={
            <Protected>
              <Survey />
            </Protected>
          }
        />
        <Route
          path="/edu"
          element={
            <Protected>
              <Placeholder title="투자 교육" note="P1에서 구현 예정" />
            </Protected>
          }
        />
        <Route
          path="/sim"
          element={
            <Protected>
              <Placeholder title="모의투자" note="P2에서 구현 예정" />
            </Protected>
          }
        />
        <Route
          path="/glossary"
          element={
            <Protected>
              <Placeholder title="용어 사전" note="P1에서 구현 예정" />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
