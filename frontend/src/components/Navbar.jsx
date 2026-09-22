import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_LINKS = {
  pembeli: [
    { to: '/pembeli',         label: 'Dasbor Harga' },
    { to: '/pembeli/lapor',   label: 'Lapor Harga' },
    { to: '/pembeli/riwayat', label: 'Riwayat Saya' },
  ],
  penjual: [
    { to: '/penjual',         label: 'Katalog Toko' },
  ],
  admin: [
    { to: '/admin',            label: 'Dasbor' },
    { to: '/admin/survei-nlp', label: 'Survei Suara (NLP)' },
    { to: '/admin/verifikasi', label: 'Verifikasi Laporan' },
    { to: '/admin/peta',       label: 'Peta Disparitas' },
  ],
}

const PUBLIC_LINKS = [
  { to: '/pembeli',         label: '📊 Komparasi & Harga Pasar' },
  { to: '/pembeli/lapor',   label: '📢 Lapor Harga' },
  { to: '/pembeli/riwayat', label: '📋 Riwayat Laporan Warga' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const links = user ? (NAV_LINKS[user.role] ?? []) : PUBLIC_LINKS

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 28px', background:'#1e293b', color:'#f8fafc', borderBottom:'1px solid #334155' }}>
      <div style={{ display:'flex', alignItems:'center', gap:28 }}>
        <Link to="/" style={{ fontWeight:800, fontSize:19, color:'#38bdf8', textDecoration:'none', display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:22 }}>🏗️</span> SIPAKU
        </Link>
        <div style={{ display:'flex', gap:18 }}>
          {links.map((l) => (
            <Link key={l.to} to={l.to} style={{ color:'#cbd5e1', textDecoration:'none', fontSize:13, fontWeight:500 }}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      {user ? (
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          {user.role === 'admin' && (
            <Link to="/pembeli" style={{ fontSize:12, color:'#38bdf8', textDecoration:'none', background:'rgba(56,189,248,0.1)', padding:'4px 10px', borderRadius:6, border:'1px solid rgba(56,189,248,0.3)' }}>
              👁️ Lihat Sisi Pembeli
            </Link>
          )}
          <span style={{ fontSize:13, color:'#94a3b8' }}>
            <strong style={{ color:'#f1f5f9' }}>{user.nama_lengkap}</strong> ({user.role})
          </span>
          <button onClick={handleLogout} style={{ background:'#ef4444', color:'#fff', border:'none', borderRadius:6, padding:'6px 14px', cursor:'pointer', fontSize:13, fontWeight:600 }}>
            Logout
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:12, color:'#64748b' }}>Warga/Pembeli (Akses Terbuka)</span>
          <Link
            to="/login"
            id="btn-login-nav"
            style={{
              background: '#0284c7',
              color: '#ffffff',
              textDecoration: 'none',
              borderRadius: 8,
              padding: '7px 16px',
              fontSize: 13,
              fontWeight: 600,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              transition: 'background 0.2s'
            }}
          >
            🔑 Login Petugas / Toko
          </Link>
        </div>
      )}
    </nav>
  )
}
