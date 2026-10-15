import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { IconShield } from '../../components/Icons'
import AlertBox from '../../components/ui/AlertBox'
import FormField from '../../components/ui/FormField'
import { useFormValidation, validators } from '../../hooks/useFormValidation'

const ROLE_HOME = {
  penjual: '/penjual',
  admin: '/admin',
  pembeli: '/pembeli'
}

export default function LoginPage() {
  const location = useLocation()
  const [activeTab, setActiveTab]   = useState(location.state?.tab || 'admin') // 'admin' | 'penjual' | 'pembeli'
  const [infoNotice, setInfoNotice] = useState(() => {
    if (location.state?.logout) return ''
    return location.state?.message || ''
  })
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const { login }                   = useAuth()
  const navigate                    = useNavigate()

  // Sinkronkan state navigasi jika ada pengalihan baru
  useEffect(() => {
    if (location.state?.logout) {
      setInfoNotice('')
    } else if (location.state?.message) {
      setInfoNotice(location.state.message)
    }
    if (location.state?.tab) {
      setActiveTab(location.state.tab)
    }
  }, [location.state])


  // Ambil redirect param (misal dari interceptor 401 saat sesi kedaluwarsa)
  const searchParams = new URLSearchParams(location.search)
  const redirectParam = searchParams.get('redirect')

  // Inisialisasi useFormValidation
  const {
    isSubmitting,
    handleSubmit,
    getFieldProps,
  } = useFormValidation(
    {
      username: '',
      password: '',
    },
    {
      username: [validators.required('Username wajib diisi')],
      password: [validators.required('Password wajib diisi')],
    }
  )

  const doLogin = async (vals) => {
    setError('')
    setLoading(true)
    try {
      // Kirim activeTab sebagai expected_role agar divalidasi ketat oleh Backend
      const data = await login(vals.username.trim(), vals.password, activeTab)
      const role = data.role?.toLowerCase()

      // Jika ada redirect url dari 401 interceptor
      if (redirectParam && redirectParam.startsWith('/')) {
        navigate(redirectParam)
        return
      }

      // Navigasi tegas sesuai peran akun (RBAC):
      if (role === 'admin') {
        navigate('/admin')
      } else if (role === 'penjual') {
        navigate('/penjual')
      } else if (role === 'pembeli') {
        if (location.state?.redirectTo && location.state.redirectTo.startsWith('/pembeli')) {
          navigate(location.state.redirectTo)
        } else {
          navigate('/pembeli')
        }
      } else {
        navigate(ROLE_HOME[role] ?? '/pembeli')
      }
    } catch (err) {
      if (!err.response) {
        setError('Gagal terhubung ke server backend (http://localhost:8000). Pastikan backend FastAPI aktif.')
      } else {
        setError(err.response?.data?.detail || 'Username atau password salah. Silakan coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }


  // Placeholder dinamis berdasarkan tab yang dipilih
  const getUsernamePlaceholder = () => {
    if (activeTab === 'admin') return 'Masukkan username admin'
    if (activeTab === 'penjual') return 'Masukkan username pemilik toko'
    return 'Masukkan username publik/warga'
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f1f5f9',
      backgroundImage: `
        radial-gradient(circle at center, rgba(14, 165, 233, 0.04) 0%, transparent 65%),
        linear-gradient(to right, rgba(226, 232, 240, 0.6) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(226, 232, 240, 0.6) 1px, transparent 1px)
      `,
      backgroundSize: '100% 100%, 36px 36px, 36px 36px',
      padding: '40px 16px',
      position: 'relative',
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
    }}>
      {/* Decorative Radar/Concentric Rings Accent (Subtle Background) */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 720,
        height: 720,
        borderRadius: '50%',
        border: '1px dashed rgba(148, 163, 184, 0.25)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 960,
        height: 960,
        borderRadius: '50%',
        border: '1px solid rgba(148, 163, 184, 0.12)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Main Card Container */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: 480,
        background: '#ffffff',
        borderRadius: 16,
        boxShadow: '0 20px 45px -12px rgba(15, 23, 42, 0.12), 0 4px 16px -2px rgba(15, 23, 42, 0.04)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        {/* Top Dark Navy Header Strip */}
        <div style={{
          height: 6,
          background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0369a1 100%)'
        }} />

        <div style={{ padding: '32px 32px 28px' }}>
          {/* Header Branding */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            {/* Top Logo & Dinas PU Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <img
                src="/logo.jpg"
                alt="Logo SIPAKU"
                style={{
                  width: 44,
                  height: 44,
                  objectFit: 'contain',
                  borderRadius: 10,
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)'
                }}
              />
              <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    SIPAKU
                  </span>
                  <span style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    color: '#059669',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    padding: '2px 6px',
                    borderRadius: 4
                  }}>
                    DINAS PU
                  </span>
                </div>
                <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>
                  KABUPATEN LAMONGAN
                </div>
              </div>
            </div>

            {/* Pill Banner Kedinasan (Clean tanpa emoji) */}
            <div>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#475569',
                fontSize: 10,
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: 9999,
                letterSpacing: '0.04em'
              }}>
                PEMERINTAH KABUPATEN LAMONGAN • DINAS PU BM & CK
              </span>
            </div>

            {/* Title & Subtitle */}
            <h1 style={{
              margin: '14px 0 4px',
              fontSize: 22,
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.02em'
            }}>
              Masuk ke Sistem SIPAKU
            </h1>
            <p style={{
              margin: 0,
              fontSize: 12.5,
              color: '#64748b',
              lineHeight: 1.45
            }}>
              Sistem Informasi Komparasi & Pengaduan Harga Konstruksi
            </p>
          </div>

          {/* Akses Dibatasi Alert (Jika redirect dari Kanal Pengaduan) */}
          {infoNotice && (
            <AlertBox
              variant="info"
              title={location.state?.title || "Akses Terbatas Kanal Pengaduan"}
              style={{ marginBottom: 16 }}
            >
              {infoNotice}
            </AlertBox>
          )}


          {/* Role Switcher Tabs (admin, pemilik toko, publik/warga - clean tanpa icon) */}
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            padding: 3,
            borderRadius: 9,
            gap: 3,
            marginBottom: 20
          }}>
            {[
              { id: 'admin', label: 'admin' },
              { id: 'penjual', label: 'pemilik toko' },
              { id: 'pembeli', label: 'publik/warga' },
            ].map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id)
                    if (tab.id !== 'pembeli') {
                      setInfoNotice('')
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 600,
                    color: isActive ? '#0f172a' : '#64748b',
                    background: isActive ? '#ffffff' : 'transparent',
                    border: 'none',
                    borderRadius: 7,
                    boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Error Alert */}
          {error && (
            <AlertBox
              variant="forbidden"
              title="Otorisasi Gagal"
              style={{ marginBottom: 16 }}
              actions={
                <div>
                  {error.includes('Publik/Warga') && activeTab !== 'pembeli' && (
                    <button
                      type="button"
                      onClick={() => { setActiveTab('pembeli'); setError('') }}
                      style={{
                        background: '#dc2626',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 14px',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-block'
                      }}
                    >
                      Buka Tab Publik/Warga →
                    </button>
                  )}
                  {error.includes('Pemilik Toko') && activeTab !== 'penjual' && (
                    <button
                      type="button"
                      onClick={() => { setActiveTab('penjual'); setError('') }}
                      style={{
                        background: '#dc2626',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 14px',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-block'
                      }}
                    >
                      Buka Tab Pemilik Toko →
                    </button>
                  )}
                  {error.includes('Administrator PU') && activeTab !== 'admin' && (
                    <button
                      type="button"
                      onClick={() => { setActiveTab('admin'); setError('') }}
                      style={{
                        background: '#dc2626',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 14px',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-block'
                      }}
                    >
                      Buka Tab Admin →
                    </button>
                  )}
                </div>
              }
            >
              <span>{error}</span>
            </AlertBox>
          )}

          {/* Form Login: User & Password */}
          <form onSubmit={handleSubmit(doLogin)} noValidate>
            <FormField
              label="Username"
              placeholder={getUsernamePlaceholder()}
              required
              {...getFieldProps('username')}
            />

            <FormField
              label="Password"
              type="password"
              placeholder="Masukkan password Anda"
              required
              {...getFieldProps('password')}
            />

            {/* Checkbox Sesi & Status Audit */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18,
              fontSize: 11.5,
              color: '#475569'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  defaultChecked
                  style={{ borderRadius: 4, cursor: 'pointer', accentColor: '#0f172a' }}
                />
                <span>Ingat sesi di perangkat ini</span>
              </label>
              <span style={{ color: '#059669', fontWeight: 600 }}>
                Audit Log Aktif
              </span>
            </div>

            {/* Tombol Utama: Masuk ke Sistem SIPAKU */}
            <button
              id="btn-login"
              type="submit"
              disabled={loading || isSubmitting}
              style={{
                width: '100%',
                padding: '11px 16px',
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
                cursor: (loading || isSubmitting) ? 'not-allowed' : 'pointer',
                opacity: (loading || isSubmitting) ? 0.75 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
                transition: 'background 0.15s, transform 0.1s'
              }}
              onMouseEnter={(e) => { if (!loading && !isSubmitting) e.currentTarget.style.background = '#1e293b' }}
              onMouseLeave={(e) => { if (!loading && !isSubmitting) e.currentTarget.style.background = '#0f172a' }}
            >
              <span>{loading || isSubmitting ? 'Memproses Masuk...' : 'Masuk ke Sistem SIPAKU'}</span>
              <span style={{ fontSize: 15 }}>→</span>
            </button>
          </form>


          {/* Divider "ATAU MASUK TERPADU" */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '18px 0 14px',
            color: '#94a3b8',
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.08em'
          }}>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            <span style={{ padding: '0 12px', color: '#64748b' }}>ATAU MASUK TERPADU</span>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>

          {/* Akses Warga Langsung: Buka Dasbor Pembeli Tanpa Login */}
          <button
            type="button"
            id="btn-lihat-harga"
            onClick={() => navigate('/pembeli')}
            style={{
              width: '100%',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#0f172a',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f8fafc'
              e.currentTarget.style.borderColor = '#94a3b8'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff'
              e.currentTarget.style.borderColor = '#cbd5e1'
            }}
          >
            <span>Buka Dasbor Pembeli (Tanpa Login)</span>
          </button>

          {/* Security Status Box (Clean tanpa emoji) */}
          <div style={{
            marginTop: 18,
            padding: '10px 14px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11
          }}>
            <span style={{ color: '#475569', fontWeight: 600 }}>Enkripsi TLS 1.3 End-to-End</span>
            <span style={{ color: '#059669', fontWeight: 600 }}>Node Lamongan: Aktif</span>
          </div>

          {/* Link Daftar Akun Baru */}
          <div style={{ marginTop: 18, textAlign: 'center', fontSize: 12.5, color: '#64748b' }}>
            Belum punya akun warga?{' '}
            <Link to="/register" style={{ color: '#0284c7', fontWeight: 700, textDecoration: 'none' }}>
              Daftar Sekarang
            </Link>
          </div>
        </div>
      </div>

      {/* Outside Footer Info */}
      <div style={{
        marginTop: 18,
        textAlign: 'center',
        fontSize: 11,
        color: '#64748b',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
        justifyContent: 'center',
        zIndex: 1
      }}>
        <span>Dinas PU Bina Marga & Cipta Karya Kab. Lamongan</span>
        <span>•</span>
        <span>Panduan Teknis</span>
        <span>•</span>
        <span>Kebijakan Privasi</span>
        <span>•</span>
        <span style={{ fontWeight: 600, color: '#475569' }}>v2.4.0</span>
      </div>
    </div>
  )
}
