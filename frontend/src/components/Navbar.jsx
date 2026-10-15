import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { IconStore, IconUsers } from './Icons'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  const handleLogout = () => {
    setMobileMenuOpen(false)
    navigate('/login', { replace: true, state: { logout: true } })
    logout()
  }

  // ── Sembunyikan Navbar di halaman Otentikasi (Login & Register) ──
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null
  }

  // ── Hamburger Icon Component ──
  const HamburgerIcon = ({ isOpen, onClick }) => (
    <button
      className="nav-hamburger-btn"
      onClick={onClick}
      aria-label="Toggle menu"
      aria-expanded={isOpen}
    >
      <div className={`hamburger-lines ${isOpen ? 'open' : ''}`}>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </button>
  )

  // ══════════════════════════════════════════════════════════
  // 1. NAVBAR KHUSUS ADMIN
  // ══════════════════════════════════════════════════════════
  if (user?.role === 'admin' || location.pathname.startsWith('/admin')) {
    const adminLinks = [
      { to: '/admin', label: 'Pusat Pengendali' },
      { to: '/admin/verifikasi', label: 'Verifikasi Dinas PU' },
      { to: '/admin/survei-nlp', label: 'Survei NLP Suara' },
      { to: '/admin/toko', label: 'Manajemen Toko' },
      { to: '/admin/peta', label: 'Peta Disparitas' },
    ]

    return (
      <header className="sipaku-navbar">
        <div className="nav-inner">
          {/* Left: Logo & Government Identity */}
          <div className="nav-brand">
            <Link to="/admin" className="nav-brand-link">
              <img src="/logo.jpg" alt="Logo SIPAKU" className="nav-logo" />
              <div className="nav-brand-text">
                <div className="nav-brand-title-row">
                  <span className="nav-brand-name">SIPAKU</span>
                  <span className="nav-role-badge nav-role-badge--admin">ADMINISTRATOR PU</span>
                </div>
                <div className="nav-brand-subtitle">
                  Dinas Pekerjaan Umum Bina Marga &amp; Cipta Karya Kab. Lamongan
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Center: Admin Module Links */}
          <div className="nav-desktop-links">
            <div className="nav-pill-group">
              {adminLinks.map((item) => {
                const isActive = location.pathname === item.to
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`nav-pill-link ${isActive ? 'active' : ''}`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Desktop Right: Profile Admin & Logout */}
          <div className="nav-desktop-user">
            <div className="nav-user-info">
              <div className="nav-avatar nav-avatar--admin">AD</div>
              <div className="nav-user-meta">
                <div className="nav-user-name">{user?.nama_lengkap || 'Administrator PU'}</div>
                <div className="nav-user-role" style={{ color: '#0284c7' }}>Role: Pengawas / Dinas PU</div>
              </div>
            </div>
            <button onClick={handleLogout} className="nav-logout-btn" title="Keluar / Logout">
              Keluar
            </button>
          </div>

          {/* Mobile: Hamburger */}
          <HamburgerIcon isOpen={mobileMenuOpen} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
        </div>

        {/* Mobile Horizontal Fast-Scroll Module Bar */}
        <div className="nav-mobile-scroll-bar">
          {adminLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-scroll-chip ${location.pathname === item.to ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Mobile Overlay Menu */}
        {mobileMenuOpen && (
          <>
            <div className="nav-mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
            <div className="nav-mobile-drawer">
              <div className="nav-drawer-links">
                {adminLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`nav-drawer-link ${location.pathname === item.to ? 'active' : ''}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="nav-drawer-footer">
                <div>
                  <div className="nav-user-name">{user?.nama_lengkap || 'Administrator'}</div>
                  <div className="nav-user-role" style={{ color: '#64748b' }}>Role: Admin PU</div>
                </div>
                <button onClick={handleLogout} className="nav-drawer-logout-btn">
                  Logout
                </button>
              </div>
            </div>
          </>
        )}
      </header>
    )
  }

  // ══════════════════════════════════════════════════════════
  // 2. NAVBAR KHUSUS PENJUAL
  // ══════════════════════════════════════════════════════════
  if (user?.role === 'penjual') {
    const penjualLinks = [
      { to: '/penjual', label: 'Beranda' },
      { to: '/penjual/katalog', label: 'Katalog Toko' },
    ]

    return (
      <header className="sipaku-navbar">
        <div className="nav-inner">
          {/* Brand Identity */}
          <div className="nav-brand">
            <Link to="/penjual" className="nav-brand-link">
              <img src="/logo.jpg" alt="Logo SIPAKU" className="nav-logo" />
              <div className="nav-brand-text">
                <div className="nav-brand-title-row">
                  <span className="nav-brand-name">SIPAKU</span>
                  <span className="nav-role-badge nav-role-badge--verified">BSSN TERVERIFIKASI</span>
                </div>
                <div className="nav-brand-subtitle">
                  Dinas PU Bina Marga &amp; Cipta Karya Lamongan
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="nav-desktop-links">
            {penjualLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`nav-link ${location.pathname === item.to ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop User Info & Logout */}
          <div className="nav-desktop-user">
            <div className="nav-user-info">
              <div className="nav-avatar nav-avatar--penjual">
                <IconStore size={16} color="#2563eb" />
              </div>
              <div className="nav-user-meta">
                <div className="nav-user-name">{user.nama_lengkap || 'Mitra Penjual'}</div>
                <div className="nav-user-role" style={{ color: '#15803d' }}>Pangkalan Resmi BMCK</div>
              </div>
            </div>
            <button onClick={handleLogout} className="nav-logout-btn">
              Keluar
            </button>
          </div>

          {/* Mobile: Hamburger */}
          <HamburgerIcon isOpen={mobileMenuOpen} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
        </div>

        {/* Mobile Overlay Menu */}
        {mobileMenuOpen && (
          <>
            <div className="nav-mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
            <div className="nav-mobile-drawer">
              <div className="nav-drawer-links">
                {penjualLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`nav-drawer-link ${location.pathname === item.to ? 'active' : ''}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="nav-drawer-footer">
                <div className="nav-user-info">
                  <div className="nav-avatar nav-avatar--penjual">
                    <IconStore size={16} color="#2563eb" />
                  </div>
                  <div className="nav-user-meta">
                    <div className="nav-user-name">{user.nama_lengkap || 'Mitra Penjual'}</div>
                    <div className="nav-user-role" style={{ color: '#15803d' }}>Pangkalan Resmi BMCK</div>
                  </div>
                </div>
                <button onClick={handleLogout} className="nav-drawer-logout-btn">
                  Logout
                </button>
              </div>
            </div>
          </>
        )}
      </header>
    )
  }

  // ══════════════════════════════════════════════════════════
  // 3. NAVBAR WARGA / PEMBELI & PUBLIK
  // ══════════════════════════════════════════════════════════
  const linksWarga = [
    { to: '/pembeli', label: 'Beranda' },
    { to: '/pembeli/lapor', label: 'Kanal Pengaduan' },
    { to: '/pembeli/riwayat', label: 'Riwayat Laporan' },
  ]

  return (
    <header className="sipaku-navbar">
      <div className="nav-inner">
        {/* Brand Identity */}
        <div className="nav-brand">
          <Link to="/pembeli" className="nav-brand-link">
            <img src="/logo.jpg" alt="Logo SIPAKU" className="nav-logo" />
            <div className="nav-brand-text">
              <div className="nav-brand-title-row">
                <span className="nav-brand-name">SIPAKU</span>
                <span className="nav-role-badge nav-role-badge--verified">BSSN TERVERIFIKASI</span>
              </div>
              <div className="nav-brand-subtitle">
                Dinas PU Bina Marga &amp; Cipta Karya Lamongan
              </div>
            </div>
          </Link>
        </div>

        {/* Desktop Center Nav Links */}
        <div className="nav-desktop-links">
          {linksWarga.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-link ${location.pathname === item.to ? 'active' : ''} ${item.to === '/pembeli/lapor' ? 'nav-link--pengaduan' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Desktop User Info & Controls */}
        <div className="nav-desktop-user">
          {user ? (
            <div className="nav-user-info">
              <div className="nav-avatar nav-avatar--warga">
                <IconUsers size={16} color="#0f172a" />
              </div>
              <div className="nav-user-meta">
                <div className="nav-user-name">{user.nama_lengkap}</div>
                <div className="nav-user-role" style={{ color: '#0284c7', textTransform: 'uppercase' }}>
                  Warga / {user.role}
                </div>
              </div>
              <button onClick={handleLogout} className="nav-logout-btn" style={{ marginLeft: 6 }}>
                Keluar
              </button>
            </div>
          ) : (
            <div className="nav-auth-buttons">
              <Link to="/register" id="btn-register-nav" className="nav-btn-register">
                Daftar Akun
              </Link>
              <Link to="/login" id="btn-login-nav" className="nav-btn-login">
                Masuk
              </Link>
            </div>
          )}
        </div>

        {/* Mobile: Hamburger */}
        <HamburgerIcon isOpen={mobileMenuOpen} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
      </div>

      {/* Mobile Overlay Menu */}
      {mobileMenuOpen && (
        <>
          <div className="nav-mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
          <div className="nav-mobile-drawer">
            <div className="nav-drawer-links">
              {linksWarga.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`nav-drawer-link ${location.pathname === item.to ? 'active' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="nav-drawer-footer">
              {user ? (
                <>
                  <div className="nav-user-info">
                    <div className="nav-avatar nav-avatar--warga">
                      <IconUsers size={16} color="#0f172a" />
                    </div>
                    <div className="nav-user-meta">
                      <div className="nav-user-name">{user.nama_lengkap}</div>
                      <div className="nav-user-role" style={{ color: '#0284c7' }}>Warga</div>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="nav-drawer-logout-btn">
                    Logout
                  </button>
                </>
              ) : (
                <div className="nav-drawer-auth">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="nav-btn-login" style={{ flex: 1, textAlign: 'center' }}>
                    Masuk
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="nav-btn-register" style={{ flex: 1, textAlign: 'center' }}>
                    Daftar Akun
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  )
}
