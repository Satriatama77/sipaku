import api from './api'

export const login = async (username, password, expected_role = null) => {
  const payload = { username, password }
  if (expected_role) {
    payload.expected_role = expected_role
  }
  const res = await api.post('/api/auth/login', payload)
  const { access_token, role, nama_lengkap, id_toko } = res.data
  // Simpan token dan info user ke sessionStorage (otomatis terhapus saat tab/browser ditutup)
  sessionStorage.setItem('sipaku_token', access_token)
  sessionStorage.setItem('sipaku_user', JSON.stringify({ role, nama_lengkap, username, id_toko }))
  // Hapus residu localStorage lama jika ada
  localStorage.removeItem('sipaku_token')
  localStorage.removeItem('sipaku_user')
  return res.data
}

export const register = async (nama_lengkap, username, password) => {
  const res = await api.post('/api/auth/register', { nama_lengkap, username, password })
  const { access_token, role, id_toko } = res.data
  // Otomatis simpan session setelah registrasi berhasil
  if (access_token) {
    sessionStorage.setItem('sipaku_token', access_token)
    sessionStorage.setItem('sipaku_user', JSON.stringify({ role, nama_lengkap, username, id_toko }))
    localStorage.removeItem('sipaku_token')
    localStorage.removeItem('sipaku_user')
  }
  return res.data
}

export const logout = () => {
  sessionStorage.removeItem('sipaku_token')
  sessionStorage.removeItem('sipaku_user')
  localStorage.removeItem('sipaku_token')
  localStorage.removeItem('sipaku_user')
}

export const getCurrentUser = () => {
  const raw = sessionStorage.getItem('sipaku_user')
  if (raw) return JSON.parse(raw)
  // Bersihkan residu lama di localStorage jika tersisa
  localStorage.removeItem('sipaku_token')
  localStorage.removeItem('sipaku_user')
  return null
}

