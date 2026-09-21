import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const ROLE_HOME = { pembeli: '/pembeli', penjual: '/penjual', admin: '/admin' }

const DEMO_ACCOUNTS = [
  {
    roleName: 'Admin',
    subtitle: 'Dinas PU / Pengawas',
    username: 'admin',
    password: 'admin123',
    icon: '🛡️',
    color: '#38bdf8',
    bg: 'rgba(14, 165, 233, 0.12)',
    border: '#0284c7'
  },
  {
    roleName: 'Pembeli',
    subtitle: 'Warga / Pelapor',
    username: 'pembeli1',
    password: 'pembeli123',
    icon: '🛒',
    color: '#34d399',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: '#059669'
  },
  {
    roleName: 'Penjual',
    subtitle: 'Pemilik Toko Bangunan',
    username: 'penjual1',
    password: 'penjual123',
    icon: '🏬',
    color: '#fbbf24',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: '#d97706'
  }
]

export default function LoginPage() {
  const [form, setForm]       = useState({ username: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const { login }             = useAuth()
  const navigate              = useNavigate()

  const doLogin = async (username, password) => {
    setError('')
    setLoading(true)
    try {
      const data = await login(username, password)
      const role = data.role?.toLowerCase()
      navigate(ROLE_HOME[role] ?? '/')
    } catch {
      setError('Username atau password salah. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await doLogin(form.username, form.password)
  }

  const handleQuickLogin = async (account) => {
    setForm({ username: account.username, password: account.password })
    await doLogin(account.username, account.password)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0f172a', padding: 20 }}>
      <div style={{ background:'#1e293b', padding:36, borderRadius:16, width:'100%', maxWidth:420, boxShadow:'0 25px 50px rgba(0,0,0,0.5)', border:'1px solid #334155' }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <h1 style={{ color:'#38bdf8', margin:'0 0 6px', fontSize:26, letterSpacing:'-0.5px' }}>SIPAKU</h1>
          <p style={{ color:'#94a3b8', margin:0, fontSize:13 }}>
            Sistem Informasi Komparasi & Pengaduan Harga Konstruksi
          </p>
        </div>

        {error && (
          <div style={{ background:'#450a0a', border:'1px solid #7f1d1d', color:'#fca5a5', padding:'10px 14px', borderRadius:8, marginBottom:18, fontSize:13 }}>
            {error}
          </div>
        )}

        {/* Demo Login Buttons Per Role */}
        <div style={{ marginBottom:22 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <span style={{ color:'#cbd5e1', fontSize:12, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>
              ⚡ Demo Login Cepat (Pilih Role):
            </span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10 }}>
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.username}
                id={`btn-demo-${acc.roleName.toLowerCase()}`}
                type="button"
                onClick={() => handleQuickLogin(acc)}
                disabled={loading}
                title={`Login langsung sebagai ${acc.roleName} (${acc.username})`}
                style={{
                  background: acc.bg,
                  border: `1px solid ${acc.border}`,
                  borderRadius: 10,
                  padding: '12px 6px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 0.2s ease',
                  opacity: loading ? 0.6 : 1
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <span style={{ fontSize: 20 }}>{acc.icon}</span>
                <span style={{ color: '#f8fafc', fontSize: 13, fontWeight: 600 }}>{acc.roleName}</span>
                <span style={{ color: acc.color, fontSize: 11, fontWeight: 500 }}>{acc.username}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', margin:'18px 0', color:'#475569', fontSize:12 }}>
          <div style={{ flex:1, height:1, background:'#334155' }} />
          <span style={{ padding:'0 10px', color:'#64748b' }}>atau login manual</span>
          <div style={{ flex:1, height:1, background:'#334155' }} />
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ color:'#94a3b8', fontSize:13 }}>Username</label>
          <input
            id="username"
            type="text"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="e.g. admin, pembeli1, penjual1"
            style={{ width:'100%', padding:'10px 12px', marginTop:6, marginBottom:16, background:'#0f172a', border:'1px solid #334155', borderRadius:8, color:'#f8fafc', fontSize:14, boxSizing:'border-box' }}
            required
          />

          <label style={{ color:'#94a3b8', fontSize:13 }}>Password</label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Masukkan password"
            style={{ width:'100%', padding:'10px 12px', marginTop:6, marginBottom:22, background:'#0f172a', border:'1px solid #334155', borderRadius:8, color:'#f8fafc', fontSize:14, boxSizing:'border-box' }}
            required
          />

          <button
            id="btn-login"
            type="submit"
            disabled={loading}
            style={{
              width:'100%',
              padding:'12px',
              background:'#0ea5e9',
              color:'#fff',
              border:'none',
              borderRadius:8,
              fontSize:15,
              fontWeight:600,
              cursor:'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'background 0.2s'
            }}
          >
            {loading ? 'Memproses Masuk...' : 'Masuk ke Sistem'}
          </button>
        </form>
      </div>
    </div>
  )
}
