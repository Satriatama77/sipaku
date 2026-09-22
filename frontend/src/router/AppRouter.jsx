import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import ProtectedRoute from '../components/ProtectedRoute'
import Navbar from '../components/Navbar'

// ── Auth ──────────────────────────────────────────────────
import LoginPage from '../features/auth/LoginPage'

// ── Pembeli ───────────────────────────────────────────────
import PembeliDashboard from '../features/pembeli/PembeliDashboard'
import LaporHargaPage   from '../features/pembeli/LaporHargaPage'
import RiwayatLaporan   from '../features/pembeli/RiwayatLaporan'

// ── Penjual ───────────────────────────────────────────────
import PenjualDashboard  from '../features/penjual/PenjualDashboard'
import KatalogHargaPage  from '../features/penjual/KatalogHargaPage'

// ── Admin ─────────────────────────────────────────────────
import AdminDashboard    from '../features/admin/AdminDashboard'
import AdminSurveiPage   from '../features/admin/AdminSurveiPage'
import VerifikasiPage    from '../features/admin/VerifikasiPage'
import PetaDisparitasPage from '../features/admin/PetaDisparitasPage'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          {/* ── Publik (Warga / Pembeli) ────────────────── */}
          <Route path="/"                element={<Navigate to="/pembeli" replace />} />
          <Route path="/pembeli"         element={<PembeliDashboard />} />
          <Route path="/pembeli/lapor"   element={<LaporHargaPage />} />
          <Route path="/pembeli/riwayat" element={<RiwayatLaporan />} />

          {/* ── Otentikasi Khusus Admin & Penjual ────────── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<div style={{ padding: 40, textAlign: 'center' }}><h2>⛔ Akses Ditolak</h2><p>Role kamu tidak memiliki izin di halaman ini.</p></div>} />

          {/* ── Penjual ────────────────────────────────── */}
          <Route path="/penjual"       element={<ProtectedRoute allowedRoles={['penjual']}><PenjualDashboard /></ProtectedRoute>} />
          <Route path="/penjual/katalog" element={<ProtectedRoute allowedRoles={['penjual']}><KatalogHargaPage /></ProtectedRoute>} />
          <Route path="/penjual/voice" element={<Navigate to="/penjual" replace />} />

          {/* ── Admin ──────────────────────────────────── */}
          <Route path="/admin"              element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/survei-nlp"   element={<ProtectedRoute allowedRoles={['admin']}><AdminSurveiPage /></ProtectedRoute>} />
          <Route path="/admin/verifikasi"   element={<ProtectedRoute allowedRoles={['admin']}><VerifikasiPage /></ProtectedRoute>} />
          <Route path="/admin/peta"         element={<ProtectedRoute allowedRoles={['admin']}><PetaDisparitasPage /></ProtectedRoute>} />

          {/* ── Catch All ──────────────────────────────── */}
          <Route path="*" element={<Navigate to="/pembeli" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
