import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // ── Sembunyikan Navbar di halaman Otentikasi (Login & Register) ──
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null
  }

  // ══════════════════════════════════════════════════════════
  // 1. NAVBAR KHUSUS ADMIN (Hanya fitur Admin, Mode Switch Dihapus)
  // ══════════════════════════════════════════════════════════
  if (user?.role === 'admin' || location.pathname.startsWith('/admin')) {
    const adminLinks = [
      { to: '/admin', label: 'Pusat Pengendali Lamongan', icon: '🏢' },
      { to: '/admin/verifikasi', label: 'Verifikasi Dinas PU', icon: '📋' },
      { to: '/admin/survei-nlp', label: 'Survei NLP Suara', icon: '🎙️' },
      { to: '/admin/toko', label: 'Manajemen Toko', icon: '🏬' },
      { to: '/admin/peta', label: 'Skema & Peta Disparitas', icon: '🗺️' },
    ]

    return (
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {/* Main Header Row */}
        <div style={{
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: 1280,
          margin: '0 auto'
        }}>
          {/* Left: Logo & Government Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/admin" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src="/logo.jpg"
                alt="Logo SIPAKU"
                style={{
                  width: 38,
                  height: 38,
                  objectFit: 'contain',
                  borderRadius: 8,
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    SIPAKU
                  </span>
                  <span style={{
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 4,
                    border: '1px solid #bfdbfe'
                  }}>
                    ADMINISTRATOR PU
                  </span>
                </div>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 500 }}>
                  Dinas Pekerjaan Umum Bina Marga &amp; Cipta Karya Kab. Lamongan
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Center: HANYA FITUR ADMIN */}
          <div className="nav-desktop-modules" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {adminLinks.map((item) => {
              const isActive = location.pathname === item.to
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  style={{
                    background: isActive ? '#0f172a' : '#f8fafc',
                    color: isActive ? '#ffffff' : '#334155',
                    border: '1px solid',
                    borderColor: isActive ? '#0f172a' : '#e2e8f0',
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Desktop Right: Profile Admin & Logout (Tanpa Mode Switch) */}
          <div className="nav-desktop-actions" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 12 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 13
              }}>
                AD
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>
                  {user?.nama_lengkap || 'Administrator PU'}
                </div>
                <div style={{ fontSize: 10, color: '#0284c7', fontWeight: 600 }}>
                  Role: Pengawas / Dinas PU
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Keluar / Logout"
                style={{
                  background: '#fee2e2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  padding: '5px 10px',
                  borderRadius: 6,
                  fontSize: 11.5,
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Keluar
              </button>
            </div>
          </div>

          {/* Mobile Right Controls: Hamburger Button */}
          <div className="nav-mobile-toggle" style={{ display: 'none', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Fast-Scroll Module Bar (Hanya Admin) */}
        <div className="nav-mobile-scroll-bar" style={{
          display: 'none',
          padding: '6px 14px 10px',
          borderTop: '1px solid #f1f5f9',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          gap: 6
        }}>
          {adminLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: location.pathname === item.to ? '#0f172a' : '#f8fafc',
                color: location.pathname === item.to ? '#ffffff' : '#334155',
                border: '1px solid',
                borderColor: location.pathname === item.to ? '#0f172a' : '#e2e8f0',
                padding: '5px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                textDecoration: 'none',
                flexShrink: 0
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Mobile Dropdown Drawer Menu */}
        {mobileMenuOpen && (
          <div style={{
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            boxShadow: '0 8px 16px rgba(0,0,0,0.06)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {adminLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: location.pathname === item.to ? '#0284c7' : '#0f172a',
                    textDecoration: 'none',
                    background: location.pathname === item.to ? '#f0f9ff' : '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{user?.nama_lengkap || 'Administrator'}</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>Role: Admin PU</div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </header>
    )
  }

  // ══════════════════════════════════════════════════════════
  // 2. NAVBAR KHUSUS PENJUAL (Hanya fitur Penjual Toko)
  // ══════════════════════════════════════════════════════════
  if (user?.role === 'penjual') {
    const penjualLinks = [
      { to: '/penjual', label: 'Dasbor Toko Saya', icon: '🏪' },
      { to: '/penjual/katalog', label: 'Katalog Harga Toko', icon: '📋' },
    ]

    return (
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 28px',
        background: '#1e293b',
        color: '#f8fafc',
        borderBottom: '1px solid #334155'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link to="/penjual" style={{ fontWeight: 800, fontSize: 18, color: '#fbbf24', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/logo.jpg"
              alt="Logo SIPAKU"
              style={{
                width: 32,
                height: 32,
                objectFit: 'contain',
                borderRadius: 6,
                background: '#ffffff'
              }}
            />
            <span>SIPAKU — PORTAL PENJUAL</span>
          </Link>
          <div style={{ display: 'flex', gap: 12 }}>
            {penjualLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                style={{
                  color: location.pathname === l.to ? '#fbbf24' : '#cbd5e1',
                  background: location.pathname === l.to ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
                  padding: '6px 12px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>{l.icon}</span>
                <span>{l.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
            <span style={{ color: '#94a3b8' }}>Toko:</span>
            <strong style={{ color: '#fbbf24' }}>{user.nama_lengkap}</strong>
            <span style={{ fontSize: 10, background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
              PENJUAL
            </span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600
            }}
          >
            Logout
          </button>
        </div>
      </nav>
    )
  }

  // ══════════════════════════════════════════════════════════
  // 3. NAVBAR WARGA / PEMBELI & PUBLIK (Tanpa link ke Admin)
  // ══════════════════════════════════════════════════════════
  const linksWarga = [
    { to: '/pembeli', label: '📊 Komparasi & Harga Pasar' },
    { to: '/pembeli/lapor', label: '📢 Lapor Harga' },
    { to: '/pembeli/riwayat', label: '📋 Riwayat Laporan' },
  ]

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 28px',
      background: '#1e293b',
      color: '#f8fafc',
      borderBottom: '1px solid #334155'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <Link to="/pembeli" style={{ fontWeight: 800, fontSize: 19, color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src="/logo.jpg"
            alt="Logo SIPAKU"
            style={{
              width: 32,
              height: 32,
              objectFit: 'contain',
              borderRadius: 6,
              background: '#ffffff'
            }}
          />
          <span>SIPAKU</span>
        </Link>
        <div style={{ display: 'flex', gap: 14 }}>
          {linksWarga.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              style={{
                color: location.pathname === l.to ? '#38bdf8' : '#cbd5e1',
                background: location.pathname === l.to ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                padding: '6px 12px',
                borderRadius: 6,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 500
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12.5, color: '#94a3b8' }}>
              👤 <strong style={{ color: '#38bdf8' }}>{user.nama_lengkap}</strong>{' '}
              <span style={{ fontSize: 10, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', fontWeight: 700 }}>
                {user.role}
              </span>
            </span>
            <button
              onClick={handleLogout}
              style={{
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link
              to="/register"
              id="btn-register-nav"
              style={{
                color: '#38bdf8',
                border: '1px solid #0284c7',
                textDecoration: 'none',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 12.5,
                fontWeight: 600
              }}
            >
              📝 Daftar Akun
            </Link>
            <Link
              to="/login"
              id="btn-login-nav"
              style={{
                background: '#0284c7',
                color: '#ffffff',
                textDecoration: 'none',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 12.5,
                fontWeight: 600,
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              🔑 Masuk
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
