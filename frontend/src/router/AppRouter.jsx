import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { ToastProvider } from '../context/ToastContext'
import ProtectedRoute, { RouteGuard } from '../components/ProtectedRoute'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'

// ── Auth ──────────────────────────────────────────────────
import LoginPage from '../features/auth/LoginPage'
import RegisterPage from '../features/auth/RegisterPage'

// ── Pembeli (Warga) ───────────────────────────────────────
import PembeliDashboard from '../features/pembeli/PembeliDashboard'
import LaporHargaPage   from '../features/pembeli/LaporHargaPage'
import RiwayatLaporan   from '../features/pembeli/RiwayatLaporan'

// ── Penjual (Toko Bangunan) ───────────────────────────────
import PenjualDashboard  from '../features/penjual/PenjualDashboard'
import KatalogHargaPage  from '../features/penjual/KatalogHargaPage'

// ── Admin PU (Pengawas Dinas) ─────────────────────────────
import AdminDashboard    from '../features/admin/AdminDashboard'
import AdminSurveiPage   from '../features/admin/AdminSurveiPage'
import VerifikasiPage    from '../features/admin/VerifikasiPage'
import PetaDisparitasPage from '../features/admin/PetaDisparitasPage'
import ManajemenTokoPage from '../features/admin/ManajemenTokoPage'

// ── Layout Wrapper ────────────────────────────────────────
function AppLayout() {
  const location = useLocation()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    )
  }

  return (
    <div className="sipaku-app-layout">
      <Sidebar />
      <div className="sipaku-main-wrapper">
        <Navbar />
        <div className="sipaku-content-area">
          <Routes>
            {/* ── Root Mengarah ke Login ───────────────────── */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* ── Halaman Warga / Pembeli ──────────────────── */}
            <Route path="/pembeli" element={<PembeliDashboard />} />
            <Route
              path="/pembeli/lapor"
              element={
                <RouteGuard allowedRoles={['pembeli', 'warga', 'Warga']}>
                  <LaporHargaPage />
                </RouteGuard>
              }
            />
            <Route path="/pembeli/riwayat" element={<RiwayatLaporan />} />

            {/* ── Halaman Penjual (Toko Bangunan) ──────────── */}
            <Route
              path="/penjual"
              element={
                <RouteGuard allowedRoles={['penjual', 'Penjual', 'admin', 'Admin PU']}>
                  <PenjualDashboard />
                </RouteGuard>
              }
            />
            <Route
              path="/penjual/katalog"
              element={
                <RouteGuard allowedRoles={['penjual', 'Penjual', 'admin', 'Admin PU']}>
                  <KatalogHargaPage />
                </RouteGuard>
              }
            />
            <Route path="/penjual/voice" element={<Navigate to="/penjual" replace />} />

            {/* ── Halaman Admin PU (Dinas PU) ──────────────── */}
            <Route
              path="/admin"
              element={
                <RouteGuard allowedRoles={['admin', 'Admin PU']}>
                  <AdminDashboard />
                </RouteGuard>
              }
            />
            <Route
              path="/admin/toko"
              element={
                <RouteGuard allowedRoles={['admin', 'Admin PU']}>
                  <ManajemenTokoPage />
                </RouteGuard>
              }
            />
            <Route
              path="/admin/survei-nlp"
              element={
                <RouteGuard allowedRoles={['admin', 'Admin PU']}>
                  <AdminSurveiPage />
                </RouteGuard>
              }
            />
            <Route
              path="/admin/verifikasi"
              element={
                <RouteGuard allowedRoles={['admin', 'Admin PU']}>
                  <VerifikasiPage />
                </RouteGuard>
              }
            />
            <Route
              path="/admin/peta"
              element={
                <RouteGuard allowedRoles={['admin', 'Admin PU']}>
                  <PetaDisparitasPage />
                </RouteGuard>
              }
            />

            {/* ── Fallback Halaman Tidak Ditemukan ─────────── */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppLayout />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
