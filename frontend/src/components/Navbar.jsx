import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { IconStore, IconUsers, IconLogout } from './Icons'
import ProfileModal from './ProfileModal'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

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

  // ── Determine role context ──
  const isAdmin = user?.role === 'admin' || location.pathname.startsWith('/admin')
  const isPenjual = user?.role === 'penjual'

  // Role display info
  let roleBadgeClass = 'nav-role-badge--verified'
  let roleBadgeText = 'BSSN TERVERIFIKASI'
  let avatarClass = 'nav-avatar--warga'
  let avatarContent = <IconUsers size={16} color="#0f172a" />
  let userName = user?.nama_lengkap || 'Pengguna'
  let userRoleText = 'Warga'
  let userRoleColor = '#0284c7'

  if (isAdmin) {
    roleBadgeClass = 'nav-role-badge--admin'
    roleBadgeText = 'ADMINISTRATOR PU'
    avatarClass = 'nav-avatar--admin'
    avatarContent = 'AD'
    userName = user?.nama_lengkap || 'Administrator PU'
    userRoleText = 'Pengawas / Dinas PU'
    userRoleColor = '#0284c7'
  } else if (isPenjual) {
    avatarClass = 'nav-avatar--penjual'
    avatarContent = <IconStore size={16} color="#2563eb" />
    userName = user?.nama_lengkap || 'Mitra Penjual'
    userRoleText = 'Pangkalan Resmi BMCK'
    userRoleColor = '#15803d'
  }

  // Home link based on role
  const homeLink = isAdmin ? '/admin' : isPenjual ? '/penjual' : '/pembeli'

  // ── Mobile navigation links ──
  let mobileLinks = []
  if (isAdmin) {
    mobileLinks = [
      { to: '/admin', label: 'Pusat Pengendali' },
      { to: '/admin/verifikasi', label: 'Verifikasi Dinas PU' },
      { to: '/admin/survei-nlp', label: 'Survei NLP Suara' },
      { to: '/admin/toko', label: 'Manajemen Toko' },
      { to: '/admin/peta', label: 'Peta Disparitas' },
    ]
  } else if (isPenjual) {
    mobileLinks = [
      { to: '/penjual', label: 'Beranda' },
      { to: '/penjual/katalog', label: 'Katalog Toko' },
    ]
  } else {
    mobileLinks = [
      { to: '/pembeli', label: 'Beranda' },
      { to: '/pembeli/lapor', label: 'Kanal Pengaduan' },
      { to: '/pembeli/riwayat', label: 'Riwayat Laporan' },
    ]
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

  return (
    <header className="sipaku-topbar">
      <div className="topbar-inner">
        {/* Mobile: Hamburger */}
        <HamburgerIcon isOpen={mobileMenuOpen} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} />

        {/* Left: Logo (visible on mobile, hidden on desktop where sidebar shows it) */}
        <div className="topbar-brand-mobile">
          <Link to={homeLink} className="nav-brand-link">
            <img src="/logo.jpg" alt="Logo SIPAKU" className="nav-logo" />
            <div className="nav-brand-text">
              <div className="nav-brand-title-row">
                <span className="nav-brand-name">SIPAKU</span>
                <span className={`nav-role-badge ${roleBadgeClass}`}>{roleBadgeText}</span>
              </div>
              <div className="nav-brand-subtitle">
                Dinas PU Bina Marga &amp; Cipta Karya Lamongan
              </div>
            </div>
          </Link>
        </div>

        {/* Desktop: Page context title */}
        <div className="topbar-context">
          <span className="topbar-context-title">
            Dinas Pekerjaan Umum Bina Marga &amp; Cipta Karya Kab. Lamongan
          </span>
        </div>

        {/* Right: User info + Logout */}
        <div className="topbar-right">
          {user ? (
            <>
              <div
                className="nav-user-info"
                onClick={() => setIsProfileModalOpen(true)}
                title="Klik untuk melihat Profil & Pengaturan Akun"
              >
                <div className={`nav-avatar ${avatarClass}`}>{avatarContent}</div>
                <div className="nav-user-meta">
                  <div className="nav-user-name">{userName}</div>
                  <div className="nav-user-role" style={{ color: userRoleColor }}>{userRoleText}</div>
                </div>
              </div>
              <button onClick={handleLogout} className="nav-logout-btn" title="Keluar / Logout">
                <IconLogout size={13} color="#ffffff" />
                <span>Keluar</span>
              </button>
            </>
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
      </div>

      {/* Mobile Overlay Menu */}
      {mobileMenuOpen && (
        <>
          <div className="nav-mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
          <div className="nav-mobile-drawer">
            <div className="nav-drawer-links">
              {mobileLinks.map((item) => (
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
                  <div
                    className="nav-user-info"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      setIsProfileModalOpen(true)
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={`nav-avatar ${avatarClass}`}>{avatarContent}</div>
                    <div className="nav-user-meta">
                      <div className="nav-user-name">{userName}</div>
                      <div className="nav-user-role" style={{ color: userRoleColor }}>{userRoleText}</div>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="nav-drawer-logout-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <IconLogout size={14} color="#ffffff" />
                    <span>Keluar</span>
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

      {user && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={user}
          onLogout={handleLogout}
        />
      )}
    </header>
  )
}
