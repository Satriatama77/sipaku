import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { IconStore, IconUsers, IconShield, IconFileText, IconCpu, IconGlobe, IconScale, IconSearch } from './Icons'

// ── Sidebar Icons ──
function IconDashboard({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function IconClipboard({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  )
}

function IconMic({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

function IconMap({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  )
}

function IconMegaphone({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l18-5v12L3 13v-2z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  )
}

function IconHistory({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function IconTag({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.83z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  )
}

// ── Navigation configs per role ──
const adminLinks = [
  { to: '/admin', label: 'Pusat Pengendali', icon: IconDashboard, exact: true },
  { to: '/admin/verifikasi', label: 'Verifikasi Dinas PU', icon: IconClipboard },
  { to: '/admin/survei-nlp', label: 'Survei NLP Suara', icon: IconMic },
  { to: '/admin/toko', label: 'Manajemen Toko', icon: IconStore },
  { to: '/admin/peta', label: 'Peta Disparitas', icon: IconMap },
]

const penjualLinks = [
  { to: '/penjual', label: 'Beranda', icon: IconDashboard, exact: true },
  { to: '/penjual/katalog', label: 'Katalog Toko', icon: IconTag },
]

const pembeliLinks = [
  { to: '/pembeli', label: 'Beranda', icon: IconDashboard, exact: true },
  { to: '/pembeli/lapor', label: 'Kanal Pengaduan', icon: IconMegaphone },
  { to: '/pembeli/riwayat', label: 'Riwayat Laporan', icon: IconHistory },
]

export default function Sidebar() {
  const { user } = useAuth()
  const location = useLocation()

  // Don't render sidebar on auth pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null
  }

  // Determine role and links
  let links = pembeliLinks
  let sectionLabel = 'MENU UTAMA'
  let roleColor = '#0284c7'

  if (user?.role === 'admin' || location.pathname.startsWith('/admin')) {
    links = adminLinks
    sectionLabel = 'MODUL ADMIN'
    roleColor = '#1d4ed8'
  } else if (user?.role === 'penjual') {
    links = penjualLinks
    sectionLabel = 'MENU TOKO'
    roleColor = '#15803d'
  }

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.to
    return location.pathname === item.to || location.pathname.startsWith(item.to + '/')
  }

  return (
    <aside className="sipaku-sidebar">
      {/* Sidebar Header / Logo */}
      <div className="sidebar-header">
        <Link to={links[0]?.to || '/'} className="sidebar-brand-link">
          <img src="/logo.jpg" alt="Logo SIPAKU" className="sidebar-logo" />
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">SIPAKU</span>
            <span className="sidebar-brand-sub">Dinas PU BMCK</span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">{sectionLabel}</div>
        <ul className="sidebar-menu">
          {links.map((item) => {
            const active = isActive(item)
            const IconComp = item.icon
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={`sidebar-menu-link ${active ? 'active' : ''}`}
                  style={active ? { '--active-color': roleColor } : undefined}
                >
                  <span className="sidebar-menu-icon">
                    <IconComp size={18} color={active ? roleColor : '#64748b'} />
                  </span>
                  <span className="sidebar-menu-label">{item.label}</span>
                  {active && <span className="sidebar-active-indicator" style={{ background: roleColor }} />}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
          <IconShield size={13} color="#94a3b8" />
          <span>SIPAKU • Kab. Lamongan</span>
        </div>
      </div>
    </aside>
  )
}
