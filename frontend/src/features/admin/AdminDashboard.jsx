import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getStatistik } from '../../services/adminService'

const WRAP = { padding: '24px 32px', maxWidth: 1100, margin: '0 auto' }
const CARD = { background: '#1e293b', borderRadius: 12, padding: 24 }

export default function AdminDashboard() {
  const [stat, setStat]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStatistik().then((res) => setStat(res.data.data)).catch(() => setStat(null)).finally(() => setLoading(false))
  }, [])

  const metrics = stat ? [
    { label: 'Total Laporan',   value: stat.total_laporan,           color: '#38bdf8' },
    { label: 'Pending',         value: stat.per_status?.Pending ?? 0, color: '#a78bfa' },
    { label: 'Tindak Lanjut',   value: stat.per_status?.['Tindak Lanjut'] ?? 0, color: '#fbbf24' },
    { label: 'Zona Merah',      value: stat.total_zona_merah,         color: '#f87171' },
  ] : []

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#f8fafc' }}>
      <div style={WRAP}>
        <h1 style={{ color: '#38bdf8' }}>Dasbor Admin — Dinas PU</h1>
        <p style={{ color: '#64748b', marginBottom: 32 }}>Ringkasan pengawasan harga material Kabupaten Lamongan</p>

        {loading ? <p style={{ color: '#64748b' }}>Memuat statistik...</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
            {metrics.map((m) => (
              <div key={m.label} style={{ ...CARD, textAlign: 'center' }}>
                <div style={{ fontSize: 40, fontWeight: 700, color: m.color }}>{m.value}</div>
                <div style={{ color: '#64748b', marginTop: 8, fontSize: 13 }}>{m.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          <Link to="/admin/survei-nlp" style={{ ...CARD, textDecoration: 'none', color: '#f8fafc', display: 'block', border: '1px solid #0284c7', background: 'linear-gradient(180deg, #1e293b 0%, rgba(2, 132, 199, 0.08) 100%)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎙️</div>
            <h3 style={{ margin: 0, color: '#38bdf8' }}>Survei Suara (NLP)</h3>
            <p style={{ color: '#94a3b8', marginTop: 8, fontSize: 13 }}>Survei lapangan harga toko & update katalog via perintah suara AI</p>
          </Link>
          <Link to="/admin/verifikasi" style={{ ...CARD, textDecoration: 'none', color: '#f8fafc', display: 'block', border: '1px solid #334155' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
            <h3 style={{ margin: 0 }}>Verifikasi Laporan</h3>
            <p style={{ color: '#64748b', marginTop: 8, fontSize: 13 }}>Tinjau dan tindak lanjuti laporan disparitas dari warga</p>
          </Link>
          <Link to="/admin/peta" style={{ ...CARD, textDecoration: 'none', color: '#f8fafc', display: 'block', border: '1px solid #334155' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🗺️</div>
            <h3 style={{ margin: 0 }}>Peta Disparitas</h3>
            <p style={{ color: '#64748b', marginTop: 8, fontSize: 13 }}>Visualisasi titik anomali harga material per kecamatan</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
