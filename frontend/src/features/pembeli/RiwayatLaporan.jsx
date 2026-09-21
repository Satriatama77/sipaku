import { useEffect, useState } from 'react'
import { getLaporan } from '../../services/laporanService'
import StatusBadge from '../../components/StatusBadge'

const WRAP = { padding: '24px 32px', maxWidth: 1000, margin: '0 auto' }

export default function RiwayatLaporan() {
  const [data, setData]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLaporan().then((res) => setData(res.data.data)).catch(() => setData([])).finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#f8fafc' }}>
      <div style={WRAP}>
        <h1 style={{ color: '#38bdf8' }}>Riwayat Laporan Saya</h1>
        {loading ? <p style={{ color: '#64748b' }}>Memuat...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, background: '#1e293b', borderRadius: 12, overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                {['Material', 'Toko', 'Kecamatan', 'Harga Temuan', 'Disparitas', 'Status'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#475569' }}>Belum ada laporan</td></tr>}
              {data.map((l) => (
                <tr key={l.id_laporan} style={{ borderTop: '1px solid #1e293b' }}>
                  <td style={{ padding: '12px 16px' }}>{l.nama_material}</td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{l.nama_toko}</td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{l.nama_kecamatan}</td>
                  <td style={{ padding: '12px 16px', color: '#34d399' }}>Rp {Number(l.harga_temuan).toLocaleString('id-ID')}</td>
                  <td style={{ padding: '12px 16px', color: l.persentase_disparitas > 20 ? '#f87171' : '#fbbf24' }}>{l.persentase_disparitas?.toFixed(1)}%</td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={l.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
