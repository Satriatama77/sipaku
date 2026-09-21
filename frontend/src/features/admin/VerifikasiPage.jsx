import { useEffect, useState } from 'react'
import { getLaporanAdmin, updateStatusLaporan } from '../../services/adminService'
import StatusBadge from '../../components/StatusBadge'

const WRAP = { padding: '24px 32px', maxWidth: 1100, margin: '0 auto' }
const STATUS_LIST = ['Pending', 'Tindak Lanjut', 'Selesai']

export default function VerifikasiPage() {
  const [data, setData]     = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = (status = '') => {
    setLoading(true)
    getLaporanAdmin(status || null).then((res) => setData(res.data.data)).catch(() => setData([])).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const handleStatus = async (id, status) => {
    await updateStatusLaporan(id, status)
    fetchData(filter)
  }

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#f8fafc' }}>
      <div style={WRAP}>
        <h1 style={{ color: '#38bdf8' }}>Verifikasi Laporan Harga</h1>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['', ...STATUS_LIST].map((s) => (
            <button key={s} onClick={() => { setFilter(s); fetchData(s) }}
              style={{ padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: filter === s ? 700 : 400, background: filter === s ? '#0ea5e9' : '#1e293b', color: filter === s ? '#fff' : '#94a3b8' }}>
              {s || 'Semua'}
            </button>
          ))}
        </div>

        {loading ? <p style={{ color: '#64748b' }}>Memuat...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, background: '#1e293b', borderRadius: 12, overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                {['#', 'Material', 'Toko', 'Kecamatan', 'Harga Temuan', 'Disparitas', 'Status', 'Aksi'].map((h) => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#475569' }}>Tidak ada laporan</td></tr>}
              {data.map((l) => (
                <tr key={l.id_laporan} style={{ borderTop: '1px solid #0f172a' }}>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>{l.id_laporan}</td>
                  <td style={{ padding: '10px 14px' }}>{l.nama_material}</td>
                  <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{l.nama_toko}</td>
                  <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{l.nama_kecamatan}</td>
                  <td style={{ padding: '10px 14px', color: '#34d399' }}>Rp {Number(l.harga_temuan).toLocaleString('id-ID')}</td>
                  <td style={{ padding: '10px 14px', color: Math.abs(l.persentase_disparitas) >= 20 ? '#f87171' : '#fbbf24' }}>{l.persentase_disparitas?.toFixed(1)}%</td>
                  <td style={{ padding: '10px 14px' }}><StatusBadge status={l.status} /></td>
                  <td style={{ padding: '10px 14px' }}>
                    <select onChange={(e) => handleStatus(l.id_laporan, e.target.value)} defaultValue={l.status}
                      style={{ background: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: 6, padding: '4px 8px', fontSize: 12 }}>
                      {STATUS_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
