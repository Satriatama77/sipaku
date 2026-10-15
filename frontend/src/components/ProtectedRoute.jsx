import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { emitToast } from '../context/ToastContext'
import { useRef, useEffect } from 'react'

/**
 * Normalisasi string role agar fleksibel (mendukung 'admin'/'Admin PU', 'penjual'/'Penjual', 'pembeli'/'warga'/'Warga').
 */
export const normalizeRole = (role) => {
  if (!role) return 'guest'
  const r = String(role).trim().toLowerCase()
  if (r.includes('admin')) return 'admin'
  if (r.includes('penjual') || r.includes('toko') || r.includes('seller')) return 'penjual'
  if (r.includes('warga') || r.includes('pembeli') || r.includes('buyer')) return 'pembeli'
  return r
}

/**
 * Mendapatkan rute dasbor resmi pengguna berdasarkan role otoritasnya.
 */
export const getDefaultDashboard = (role) => {
  const norm = normalizeRole(role)
  switch (norm) {
    case 'admin':
      return '/admin'
    case 'penjual':
      return '/penjual'
    case 'pembeli':
      return '/pembeli'
    default:
      return '/login'
  }
}

/**
 * Komponen RouteGuard / ProtectedRoute Tingkat Tinggi:
 * - Memvalidasi status autentikasi token JWT.
 * - Memblokir upaya manipulasi URL browser (misal Warga mengetik URL /admin di address bar).
 * - Menampilkan notifikasi visual akses ditolak (403 Forbidden).
 * - Mengembalikan pengguna secara otomatis ke dasbor resmi hak otoritas mereka.
 *
 * @param {React.ReactNode} children - Komponen yang dilindungi
 * @param {string[]} allowedRoles - Daftar role yang memiliki hak akses (misal: ['admin'], ['penjual', 'admin'], ['pembeli'])
 * @param {string} redirectTo - (Opsional) Kustom halaman pengalihan jika otorisasi ditolak
 */
export default function ProtectedRoute({ children, allowedRoles, redirectTo }) {
  const { user, isLoggedIn } = useAuth()
  const location = useLocation()
  const lastAlertPath = useRef(null)

  // 1. Verifikasi Status Autentikasi (Belum Login)
  const token = typeof window !== 'undefined'
    ? (sessionStorage.getItem('sipaku_token') || localStorage.getItem('sipaku_token'))
    : null

  if (!isLoggedIn || !token || !user) {
    const isWargaLapor = location.pathname.startsWith('/pembeli/lapor')

    const redirectState = {
      from: location.pathname + location.search,
      redirectTo: location.pathname + location.search,
    }

    // Jika warga belum login dan ingin lapor harga atau cek riwayat, tampilkan alert akses terbatas kanal pengaduan
    if (isWargaLapor) {
      redirectState.tab = 'pembeli'
      redirectState.title = 'Akses Terbatas Kanal Pengaduan'
      redirectState.message = 'Silakan login terlebih dahulu untuk mengakses formulir pengaduan harga material.'
    }

    return (
      <Navigate
        to="/login"
        state={redirectState}
        replace
      />
    )
  }



  // 2. Verifikasi Otorisasi Role (RBAC Protection)
  if (allowedRoles && allowedRoles.length > 0) {
    const userRoleNormalized = normalizeRole(user.role)
    const normalizedAllowed = allowedRoles.map(normalizeRole)

    const isAuthorized = normalizedAllowed.includes(userRoleNormalized)

    if (!isAuthorized) {
      // Tentukan halaman tujuan yang sah untuk role pengguna saat ini
      const safeDashboard = redirectTo || getDefaultDashboard(user.role)

      // Berikan notifikasi keamanan bahwa ada upaya akses ilegal
      if (lastAlertPath.current !== location.pathname) {
        lastAlertPath.current = location.pathname
        emitToast(
          `Akses Ditolak (403 Forbidden): Akun Anda memiliki role '${user.role || 'Pengguna'}', dan tidak memiliki izin mengakses rute '${location.pathname}'. Anda dialihkan ke halaman utama Anda.`,
          'error',
          'Pelanggaran Hak Akses (RBAC)'
        )
      }

      // Hindari loop redirect jika halaman tujuan sama dengan pathname saat ini
      if (location.pathname === safeDashboard) {
        return <Navigate to="/login" replace />
      }

      return <Navigate to={safeDashboard} replace />
    }
  }

  // 3. Izin Terverifikasi dan Sah
  return children
}

// Alias RouteGuard untuk kemudahan penamaan standar keamanan
export { ProtectedRoute as RouteGuard }
