import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import ProtectedRoute from '../components/ProtectedRoute'
import Navbar from '../components/Navbar'

// ── Auth ──────────────────────────────────────────────────
import LoginPage from '../features/auth/LoginPage'
import RegisterPage from '../features/auth/RegisterPage'

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
import ManajemenTokoPage from '../features/admin/ManajemenTokoPage'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          {/* ── Root Mengarah ke Login ───────────────────── */}
          <Route path="/"                element={<Navigate to="/login" replace />} />

          {/* ── Otentikasi (Login & Register Warga) ──────── */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ── Publik (Warga / Pembeli) ────────────────── */}
          <Route path="/pembeli"         element={<PembeliDashboard />} />
          <Route path="/pembeli/riwayat" element={<RiwayatLaporan />} />

          {/* ── Lapor Harga Khusus Warga/Pembeli Terdaftar ──────── */}
          <Route path="/pembeli/lapor"   element={<ProtectedRoute allowedRoles={['pembeli']}><LaporHargaPage /></ProtectedRoute>} />

          <Route path="/unauthorized" element={
            <div style={{ padding: '60px 20px', textAlign: 'center', background: '#0f172a', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#f8fafc' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⛔</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#f87171', margin: '0 0 8px' }}>Akses Ditolak (RBAC)</h2>
              <p style={{ color: '#94a3b8', fontSize: 14, maxWidth: 420, margin: '0 0 24px', lineHeight: 1.5 }}>
                Role akun Anda saat ini tidak memiliki izin untuk mengakses fitur ini. Setiap fitur hanya dapat diakses oleh role yang berwenang.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <a href="/login" style={{ background: '#0284c7', color: '#ffffff', textDecoration: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                  Ganti Akun Login
                </a>
                <a href="/pembeli" style={{ background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', textDecoration: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                  Dasbor Publik Warga
                </a>
              </div>
            </div>
          } />

          {/* ── Penjual (Hanya Toko / Penjual) ───────────── */}
          <Route path="/penjual"         element={<ProtectedRoute allowedRoles={['penjual']}><PenjualDashboard /></ProtectedRoute>} />
          <Route path="/penjual/katalog" element={<ProtectedRoute allowedRoles={['penjual']}><KatalogHargaPage /></ProtectedRoute>} />
          <Route path="/penjual/voice"   element={<Navigate to="/penjual" replace />} />


          {/* ── Admin ──────────────────────────────────── */}
          <Route path="/admin"              element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/toko"         element={<ProtectedRoute allowedRoles={['admin']}><ManajemenTokoPage /></ProtectedRoute>} />
          <Route path="/admin/survei-nlp"   element={<ProtectedRoute allowedRoles={['admin']}><AdminSurveiPage /></ProtectedRoute>} />
          <Route path="/admin/verifikasi"   element={<ProtectedRoute allowedRoles={['admin']}><VerifikasiPage /></ProtectedRoute>} />
          <Route path="/admin/peta"         element={<ProtectedRoute allowedRoles={['admin']}><PetaDisparitasPage /></ProtectedRoute>} />

          {/* ── Catch All ──────────────────────────────── */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

