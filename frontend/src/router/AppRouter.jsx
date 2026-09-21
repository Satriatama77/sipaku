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
import VoiceInputPage    from '../features/penjual/VoiceInputPage'

// ── Admin ─────────────────────────────────────────────────
import AdminDashboard    from '../features/admin/AdminDashboard'
import VerifikasiPage    from '../features/admin/VerifikasiPage'
import PetaDisparitasPage from '../features/admin/PetaDisparitasPage'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          {/* ── Publik ─────────────────────────────────── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/"      element={<Navigate to="/login" replace />} />
          <Route path="/unauthorized" element={<div style={{ padding: 40, textAlign: 'center' }}><h2>⛔ Akses Ditolak</h2><p>Role kamu tidak memiliki izin di halaman ini.</p></div>} />

          {/* ── Pembeli ────────────────────────────────── */}
          <Route path="/pembeli" element={<ProtectedRoute allowedRoles={['pembeli', 'admin']}><PembeliDashboard /></ProtectedRoute>} />
          <Route path="/pembeli/lapor"   element={<ProtectedRoute allowedRoles={['pembeli']}><LaporHargaPage /></ProtectedRoute>} />
          <Route path="/pembeli/riwayat" element={<ProtectedRoute allowedRoles={['pembeli']}><RiwayatLaporan /></ProtectedRoute>} />

          {/* ── Penjual ────────────────────────────────── */}
          <Route path="/penjual"       element={<ProtectedRoute allowedRoles={['penjual']}><PenjualDashboard /></ProtectedRoute>} />
          <Route path="/penjual/katalog" element={<ProtectedRoute allowedRoles={['penjual']}><KatalogHargaPage /></ProtectedRoute>} />
          <Route path="/penjual/voice"   element={<ProtectedRoute allowedRoles={['penjual']}><VoiceInputPage /></ProtectedRoute>} />

          {/* ── Admin ──────────────────────────────────── */}
          <Route path="/admin"              element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/verifikasi"   element={<ProtectedRoute allowedRoles={['admin']}><VerifikasiPage /></ProtectedRoute>} />
          <Route path="/admin/peta"         element={<ProtectedRoute allowedRoles={['admin']}><PetaDisparitasPage /></ProtectedRoute>} />

          {/* ── Catch All ──────────────────────────────── */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
