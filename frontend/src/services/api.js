import axios from 'axios'
import { emitToast } from '../context/ToastContext'

// ── Buat Axios Instance dengan baseURL dari .env ──────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, // Timeout 15 detik untuk mendeteksi jaringan lambat
})

// ── Request Interceptor: tambahkan JWT token ke setiap request ──
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('sipaku_token') || localStorage.getItem('sipaku_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Helper untuk mengekstrak pesan error secara aman (menghindari React child crash jika detail berupa array/objek dari FastAPI/Pydantic)
const formatErrorMessage = (data, fallback = 'Terjadi kesalahan pada sistem.') => {
  if (!data) return fallback
  if (typeof data === 'string') return data
  if (typeof data.detail === 'string') return data.detail
  if (Array.isArray(data.detail)) {
    // Format error validasi Pydantic / FastAPI: [{ loc: [...], msg: "..." }]
    return data.detail
      .map((item) => {
        const field = item.loc ? item.loc[item.loc.length - 1] : ''
        return field ? `${field}: ${item.msg}` : item.msg
      })
      .join('; ')
  }
  if (typeof data.message === 'string') return data.message
  if (typeof data.error === 'string') return data.error
  return fallback
}

// ── Response Interceptor: Global Error Handling & 401 Handler ──
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // 1. Tangani Timeout Request (ECONNABORTED)
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      emitToast(
        'Permintaan ke server memakan waktu terlalu lama (timeout). Silakan periksa jaringan Anda atau coba sesaat lagi.',
        'warning',
        'Batas Waktu Habis'
      )
      return Promise.reject(error)
    }

    // 2. Tangani Koneksi Terputus / Network Error / Server Down
    if (!error.response || error.code === 'ERR_NETWORK') {
      emitToast(
        'Gagal terhubung ke server backend (http://localhost:8000). Pastikan server backend FastAPI sedang aktif.',
        'error',
        'Koneksi Server Terputus'
      )
      return Promise.reject(error)
    }

    const { status, data } = error.response
    const errorMessage = formatErrorMessage(data, '')

    // 3. Tangani Token Kedaluwarsa / Unauthorized (401)
    if (status === 401) {
      // Bersihkan seluruh token & session dari storage
      sessionStorage.removeItem('sipaku_token')
      sessionStorage.removeItem('sipaku_user')
      localStorage.removeItem('sipaku_token')
      localStorage.removeItem('sipaku_user')

      // Sinkronkan state React AuthContext via event
      window.dispatchEvent(new CustomEvent('sipaku-logout'))

      const isLoginUrl = error.config?.url?.includes('/login')

      if (!isLoginUrl) {
        emitToast(
          'Sesi otentikasi Anda telah berakhir atau token tidak valid. Mengalihkan ke halaman login...',
          'warning',
          'Sesi Kedaluwarsa (401)'
        )

        // Simpan path aktif saat ini agar user bisa kembali setelah login
        const currentPath = window.location.pathname + window.location.search
        setTimeout(() => {
          if (window.location.pathname !== '/login') {
            const redirectQuery = currentPath && currentPath !== '/' ? `?redirect=${encodeURIComponent(currentPath)}` : ''
            window.location.href = `/login${redirectQuery}`
          }
        }, 900)
      } else {
        emitToast(
          errorMessage || 'Username atau password yang Anda masukkan tidak sesuai.',
          'error',
          'Autentikasi Gagal'
        )
      }

      return Promise.reject(error)
    }

    // 4. Tangani 400 Bad Request
    if (status === 400) {
      emitToast(
        errorMessage || 'Permintaan tidak valid atau data formulir tidak lengkap.',
        'error',
        'Bad Request (400)'
      )
      return Promise.reject(error)
    }

    // 5. Tangani 403 Forbidden (Pelanggaran RBAC)
    if (status === 403) {
      emitToast(
        errorMessage || 'Akses ditolak. Akun Anda tidak memiliki izin untuk mengakses resource ini.',
        'error',
        'Akses Ditolak (403)'
      )
      return Promise.reject(error)
    }

    // 6. Tangani 404 Not Found
    if (status === 404) {
      emitToast(
        errorMessage || 'Data atau endpoint API yang diminta tidak ditemukan.',
        'error',
        'Tidak Ditemukan (404)'
      )
      return Promise.reject(error)
    }

    // 7. Tangani 422 Unprocessable Entity (Validasi Backend FastAPI)
    if (status === 422) {
      emitToast(
        errorMessage || 'Format input formulir tidak sesuai dengan ketentuan backend.',
        'error',
        'Validasi Data Gagal (422)'
      )
      return Promise.reject(error)
    }

    // 8. Tangani 500+ Internal Server Error / Server Crash
    if (status >= 500) {
      emitToast(
        errorMessage || 'Terjadi gangguan internal pada server (HTTP 500). Silakan hubungi admin atau coba lagi.',
        'error',
        `Server Bermasalah (${status})`
      )
      return Promise.reject(error)
    }

    // Error HTTP lainnya
    if (errorMessage) {
      emitToast(errorMessage, 'error', `Informasi (${status})`)
    }

    return Promise.reject(error)
  }
)

export default api

