import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const ROLE_HOME = {
  penjual: '/penjual',
  admin: '/admin',
  pembeli: '/pembeli'
}

export default function LoginPage() {
  const [form, setForm]                 = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab]       = useState('admin') // 'admin' | 'penjual' | 'pembeli'
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)
  const { login }                       = useAuth()
  const navigate                        = useNavigate()

  const doLogin = async (username, password) => {
    setError('')
    setLoading(true)
    try {
      const data = await login(username, password)
      const role = data.role?.toLowerCase()
      navigate(ROLE_HOME[role] ?? '/pembeli')
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    await doLogin(form.username, form.password)
  }

  // Placeholder dinamis berdasarkan tab yang dipilih
  const getUsernamePlaceholder = () => {
    if (activeTab === 'admin') return 'Masukkan username Admin PU / Pegawai'
    if (activeTab === 'penjual') return 'Masukkan username Toko Bangunan'
    return 'Masukkan username Pembeli / Warga'
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
      {/* Decorative Radar/Concentric Rings Accent (Subtle Background seperti mockup) */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 720,
        height: 720,
        borderRadius: '50%',
        border: '1px dashed rgba(148, 163, 184, 0.28)',
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
        border: '1px solid rgba(148, 163, 184, 0.15)',
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

            {/* Pill Banner Kedinasan */}
            <div>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#334155',
                fontSize: 10,
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: 9999,
                letterSpacing: '0.02em'
              }}>
                <span>🏛️</span>
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

          {/* Role Switcher Tabs (Admin PU, Toko Bangunan, Publik/Warga) */}
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            padding: 3,
            borderRadius: 9,
            gap: 3,
            marginBottom: 20
          }}>
            {[
              { id: 'admin', label: 'Admin PU / Verlap', icon: '👤' },
              { id: 'penjual', label: 'Toko Bangunan', icon: '🏬' },
              { id: 'pembeli', label: 'Publik / Warga', icon: '👥' },
            ].map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    padding: '7px 4px',
                    fontSize: 11.5,
                    fontWeight: isActive ? 700 : 600,
                    color: isActive ? '#0f172a' : '#64748b',
                    background: isActive ? '#ffffff' : 'transparent',
                    border: 'none',
                    borderRadius: 7,
                    boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: 12 }}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Error Alert */}
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '10px 14px',
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 12.5,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form Login: User & Password */}
          <form onSubmit={handleSubmit}>
            {/* Input Username */}
            <div style={{ marginBottom: 14 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6
              }}>
                <label
                  htmlFor="username"
                  style={{
                    color: '#334155',
                    fontSize: 12.5,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span>📇</span>
                  <span>Username Akun</span>
                </label>
                <span style={{ fontSize: 11, color: '#0284c7', fontWeight: 600 }}>
                  Akses Sistem
                </span>
              </div>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{
                  position: 'absolute',
                  left: 12,
                  fontSize: 14,
                  color: '#94a3b8',
                  pointerEvents: 'none'
                }}>
                  👤
                </span>
                <input
                  id="username"
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder={getUsernamePlaceholder()}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    color: '#0f172a',
                    fontSize: 13.5,
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.15s, background-color 0.15s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0284c7'
                    e.target.style.backgroundColor = '#ffffff'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#cbd5e1'
                    e.target.style.backgroundColor = '#f8fafc'
                  }}
                  required
                />
              </div>
            </div>

            {/* Input Password */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6
              }}>
                <label
                  htmlFor="password"
                  style={{
                    color: '#334155',
                    fontSize: 12.5,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span>🔑</span>
                  <span>Kata Sandi / Password</span>
                </label>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                  Aman & Terenkripsi
                </span>
              </div>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{
                  position: 'absolute',
                  left: 12,
                  fontSize: 14,
                  color: '#94a3b8',
                  pointerEvents: 'none'
                }}>
                  🔒
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Masukkan kata sandi Anda"
                  style={{
                    width: '100%',
                    padding: '10px 38px 10px 36px',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    color: '#0f172a',
                    fontSize: 13.5,
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.15s, background-color 0.15s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0284c7'
                    e.target.style.backgroundColor = '#ffffff'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#cbd5e1'
                    e.target.style.backgroundColor = '#f8fafc'
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                  style={{
                    position: 'absolute',
                    right: 8,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 14,
                    color: '#64748b',
                    padding: '4px 6px'
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

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
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#059669', fontWeight: 600 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                Audit Log Aktif
              </span>
            </div>

            {/* Tombol Utama: Masuk ke Sistem SIPAKU */}
            <button
              id="btn-login"
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '11px 16px',
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.75 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
                transition: 'background 0.15s, transform 0.1s'
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#1e293b' }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#0f172a' }}
            >
              <span>{loading ? 'Memproses Masuk...' : 'Masuk ke Sistem SIPAKU'}</span>
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
              justifyContent: 'space-between',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>📊</span>
              <span>Buka Dasbor Pembeli (Tanpa Login)</span>
            </div>
            <span style={{ color: '#64748b', fontSize: 13 }}>↗</span>
          </button>

          {/* Security Status Box (Sesuai Mockup) */}
          <div style={{
            marginTop: 18,
            padding: '10px 12px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#334155' }}>
              <span style={{ color: '#0284c7' }}>🔒</span>
              <span style={{ fontWeight: 600 }}>Enkripsi TLS 1.3 End-to-End</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#059669', fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              <span>Node Lamongan: Aktif</span>
            </div>
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

      {/* Outside Footer Info (Sesuai Mockup) */}
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
        <span>🏛️ Dinas PU Bina Marga & Cipta Karya Kab. Lamongan</span>
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
