import axios from 'axios'

// ── Buat Axios Instance dengan baseURL dari .env ──────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

// ── Request Interceptor: tambahkan JWT token ke setiap request ──
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sipaku_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response Interceptor: tangani error 401 (token expired) ──
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/login')) {
      localStorage.removeItem('sipaku_token')
      localStorage.removeItem('sipaku_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
