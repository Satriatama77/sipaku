import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_LINKS = {
  pembeli: [
    { to: '/pembeli',        label: 'Dasbor Harga' },
    { to: '/pembeli/lapor',  label: 'Lapor Harga' },
    { to: '/pembeli/riwayat', label: 'Riwayat Saya' },
  ],
  penjual: [
    { to: '/penjual',        label: 'Katalog Saya' },
    { to: '/penjual/voice',  label: 'Input Suara' },
  ],
  admin: [
    { to: '/admin',          label: 'Dasbor' },
    { to: '/admin/verifikasi', label: 'Verifikasi Laporan' },
    { to: '/admin/peta',     label: 'Peta Disparitas' },
  ],
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const links = user ? (NAV_LINKS[user.role] ?? []) : []

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 24px', background:'#1e293b', color:'#f8fafc' }}>
      <Link to="/" style={{ fontWeight:700, fontSize:18, color:'#38bdf8', textDecoration:'none' }}>SIPAKU</Link>
      <div style={{ display:'flex', gap:20 }}>
        {links.map((l) => (
          <Link key={l.to} to={l.to} style={{ color:'#cbd5e1', textDecoration:'none', fontSize:14 }}>{l.label}</Link>
        ))}
      </div>
      {user && (
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:13, color:'#94a3b8' }}>{user.nama_lengkap} · {user.role}</span>
          <button onClick={handleLogout} style={{ background:'#ef4444', color:'#fff', border:'none', borderRadius:6, padding:'6px 14px', cursor:'pointer', fontSize:13 }}>Logout</button>
        </div>
      )}
    </nav>
  )
}
