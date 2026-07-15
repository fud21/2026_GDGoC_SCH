import { useEffect, useState, useCallback } from 'react'
import { api, getToken, setToken, clearToken } from '../api/client'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      setUser(await api('/auth/me'))
    } catch {
      clearToken()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = useCallback(
    async (email, password) => {
      const { token } = await api('/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      setToken(token)
      await refresh()
    },
    [refresh],
  )

  const register = useCallback(
    async (form) => {
      const { token } = await api('/auth/register', {
        method: 'POST',
        body: form,
      })
      setToken(token)
      await refresh()
    },
    [refresh],
  )

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}
