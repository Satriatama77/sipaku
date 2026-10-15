import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { login as apiLogin, logout as apiLogout, register as apiRegister, getCurrentUser } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getCurrentUser())

  // Sinkronkan logout otomatis dari Axios interceptor (misal saat error 401)
  useEffect(() => {
    const handleLogoutEvent = () => {
      setUser(null)
    }
    window.addEventListener('sipaku-logout', handleLogoutEvent)
    return () => {
      window.removeEventListener('sipaku-logout', handleLogoutEvent)
    }
  }, [])

  const login = useCallback(async (username, password, expectedRole = null) => {
    const data = await apiLogin(username, password, expectedRole)
    setUser({ role: data.role, nama_lengkap: data.nama_lengkap, username, id_toko: data.id_toko })
    return data
  }, [])

  const register = useCallback(async (nama_lengkap, username, password) => {
    const data = await apiRegister(nama_lengkap, username, password)
    setUser({ role: data.role, nama_lengkap: data.nama_lengkap, username, id_toko: data.id_toko })
    return data
  }, [])

  const logout = useCallback(() => {
    apiLogout()
    setUser(null)
  }, [])


  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}


// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>')
  return ctx
}
