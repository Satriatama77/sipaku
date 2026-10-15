import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { ToastProvider } from '../context/ToastContext'
import ProtectedRoute, { RouteGuard } from '../components/ProtectedRoute'
import Navbar from '../components/Navbar'

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

export default function AppRouter() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Navbar />
          <Routes>
            {/* ── Root Mengarah ke Login ───────────────────── */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* ── Otentikasi (Login & Register Warga) ──────── */}
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* ── Halaman Warga / Pembeli ──────────────────── */}
            {/* Katalog publik warga bebas dilihat */}
            <Route path="/pembeli" element={<PembeliDashboard />} />

            {/* Kanal Pengaduan Harga: Khusus Warga (Memblokir Admin & Penjual) */}
            <Route
              path="/pembeli/lapor"
              element={
                <RouteGuard allowedRoles={['pembeli', 'warga', 'Warga']}>
                  <LaporHargaPage />
                </RouteGuard>
              }
            />

            {/* Riwayat Laporan Pengaduan: Terbuka untuk publik warga */}
            <Route path="/pembeli/riwayat" element={<RiwayatLaporan />} />


            {/* ── Halaman Penjual (Toko Bangunan) ──────────── */}
            {/* Hanya Penjual dan Admin PU yang berwenang */}
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
            {/* Ketat hanya untuk Admin PU (Warga & Penjual diblokir otomatis) */}
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
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
