import { useEffect, useState } from 'react'
import { getDataSSH } from '../../services/hargaService'

const WRAP = { padding: '24px 32px', maxWidth: 1100, margin: '0 auto' }
const CARD = { background: '#1e293b', borderRadius: 12, padding: 24, marginBottom: 24 }

export default function PembeliDashboard() {
  const [sshData, setSshData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDataSSH()
      .then((res) => setSshData(res.data.data))
      .catch(() => setSshData([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#f8fafc' }}>
      <div style={WRAP}>
        <h1 style={{ color: '#38bdf8', marginBottom: 4 }}>Dasbor Komparasi Harga</h1>
        <p style={{ color: '#64748b', marginBottom: 32 }}>Data Standar Satuan Harga (SSH) Kabupaten Lamongan 2025</p>

        <div style={CARD}>
          <h2 style={{ color: '#e2e8f0', marginTop: 0, marginBottom: 16 }}>Daftar Harga Acuan SSH</h2>
          {loading ? (
            <p style={{ color: '#64748b' }}>Memuat data...</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  {['Material', 'Satuan', 'Harga SSH (Rp)'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#94a3b8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sshData.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '10px 12px' }}>{item.nama_material}</td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{item.satuan}</td>
                    <td style={{ padding: '10px 12px', color: '#34d399', fontWeight: 600 }}>
                      Rp {item.harga_ssh.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
