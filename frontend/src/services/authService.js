import api from './api'

export const login = async (username, password) => {
  const res = await api.post('/api/auth/login', { username, password })
  const { access_token, role, nama_lengkap } = res.data
  // Simpan token dan info user ke localStorage
  localStorage.setItem('sipaku_token', access_token)
  localStorage.setItem('sipaku_user', JSON.stringify({ role, nama_lengkap, username }))
  return res.data
}

export const logout = () => {
  localStorage.removeItem('sipaku_token')
  localStorage.removeItem('sipaku_user')
}

export const getCurrentUser = () => {
  const raw = localStorage.getItem('sipaku_user')
  return raw ? JSON.parse(raw) : null
}
