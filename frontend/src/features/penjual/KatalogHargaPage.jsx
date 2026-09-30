import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const WRAP = { padding: '24px 32px', maxWidth: 900, margin: '0 auto' }
const CARD = { background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' }

export default function KatalogHargaPage() {
  const { user } = useAuth()
  const [daftarToko, setDaftarToko] = useState([])
  const [selectedTokoId, setSelectedTokoId] = useState(2) // Default TB Berkah Abadi untuk akun demo penjual1
  const [tokoAktif, setTokoAktif] = useState(null)
  const [katalog, setKatalog] = useState([])
  const [loading, setLoading] = useState(true)

  // Ambil data toko
  useEffect(() => {
    api.get('/api/katalog/toko/semua')
      .then((res) => {
        const list = res.data?.data || []
        setDaftarToko(list)
        if (user?.id_toko) {
          const match = list.find((t) => t.id_toko === Number(user.id_toko))
          if (match) {
            setSelectedTokoId(match.id_toko)
            setTokoAktif(match)
            return
          }
        }
        if (user?.nama_lengkap) {
          const match = list.find((t) =>
            t.nama_toko.toLowerCase().includes(user.nama_lengkap.toLowerCase()) ||
            user.nama_lengkap.toLowerCase().includes(t.nama_toko.toLowerCase())
          )
          if (match) {
            setSelectedTokoId(match.id_toko)
            setTokoAktif(match)
            return
          }
        }
        const defaultMatch = list.find((t) => t.id_toko === 2) || list[0]
        if (defaultMatch) {
          setSelectedTokoId(defaultMatch.id_toko)
          setTokoAktif(defaultMatch)
        }
      })
      .catch((err) => console.error(err))
  }, [user])

  const fetchKatalog = (id) => {
    if (!id) return
    setLoading(true)
    api.get(`/api/katalog/${id}`)
      .then((res) => setKatalog(res.data.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchKatalog(selectedTokoId)
    const t = daftarToko.find((x) => x.id_toko === Number(selectedTokoId))
    if (t) setTokoAktif(t)
  }, [selectedTokoId, daftarToko])

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#f8fafc', paddingBottom: 40 }}>
      <div style={WRAP}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <h1 style={{ color: '#38bdf8', margin: '0 0 6px', fontSize: 24 }}>Katalog Harga Toko Saya</h1>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: 13.5 }}>
              Daftar harga material yang tercatat di sistem e-governance SIPAKU hasil survei berkala oleh <strong>Petugas Admin Dinas PU (Voice NLP)</strong>.
            </p>
          </div>
          {daftarToko.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {user?.role === 'admin' ? (
                <>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>Supervisi Toko:</span>
                  <select
                    value={selectedTokoId}
                    onChange={(e) => setSelectedTokoId(Number(e.target.value))}
                    style={{
                      background: '#1e293b',
                      color: '#f8fafc',
                      border: '1px solid #334155',
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 13
                    }}
                  >
                    {daftarToko.map((t) => (
                      <option key={t.id_toko} value={t.id_toko}>
                        {t.nama_toko} ({t.nama_kecamatan || 'Lamongan'})
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <div style={{
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid #0284c7',
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#38bdf8'
                }}>
                  🏪 {tokoAktif?.nama_toko || 'Toko Terdaftar'}
                </div>
              )}

              <button
                onClick={() => fetchKatalog(selectedTokoId)}
                title="Muat ulang data terbaru"
                style={{
                  background: '#0ea5e9',
                  border: 'none',
                  color: '#fff',
                  borderRadius: 8,
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600
                }}
              >
                🔄 Refresh
              </button>
            </div>
          )}
        </div>

        {tokoAktif && (
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: '12px 18px', marginBottom: 20, display: 'flex', gap: 24, fontSize: 13 }}>
            <div><span style={{ color: '#64748b' }}>Toko: </span><strong style={{ color: '#38bdf8' }}>{tokoAktif.nama_toko}</strong></div>
            <div><span style={{ color: '#64748b' }}>Pemilik: </span><span style={{ color: '#cbd5e1' }}>{tokoAktif.nama_pemilik || '-'}</span></div>
            <div><span style={{ color: '#64748b' }}>Kecamatan: </span><span style={{ color: '#cbd5e1' }}>{tokoAktif.nama_kecamatan || '-'}</span></div>
          </div>
        )}

        <div style={CARD}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, color: '#e2e8f0' }}>Daftar Material Terdaftar</h3>
            <span style={{ fontSize: 12, color: '#38bdf8', background: '#0f172a', padding: '4px 10px', borderRadius: 6 }}>
              {katalog.length} Material
            </span>
          </div>

          {loading ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: 24 }}>Memuat katalog toko...</p>
          ) : katalog.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
              <p>Belum ada data material untuk toko Anda.</p>
              <p style={{ fontSize: 13, color: '#475569' }}>Petugas Dinas PU akan memperbarui data harga saat survei lapangan berikutnya.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#94a3b8', textAlign: 'left', borderBottom: '1px solid #334155' }}>
                    <th style={{ padding: '12px 14px' }}>Nama Material</th>
                    <th style={{ padding: '12px 14px' }}>Harga Jual</th>
                    <th style={{ padding: '12px 14px' }}>Satuan</th>
                    <th style={{ padding: '12px 14px' }}>Status</th>
                    <th style={{ padding: '12px 14px' }}>Terakhir Disurvei</th>
                  </tr>
                </thead>
                <tbody>
                  {katalog.map((item, idx) => (
                    <tr key={item.id_katalog || idx} style={{ borderBottom: '1px solid #334155', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#f1f5f9' }}>{item.nama_material}</td>
                      <td style={{ padding: '12px 14px', color: '#34d399', fontWeight: 600, fontSize: 14 }}>
                        Rp {Number(item.harga_jual).toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>{item.satuan}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ color: item.stok_tersedia ? '#34d399' : '#f87171' }}>
                          {item.stok_tersedia ? '● Tersedia' : '○ Kosong'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 12 }}>
                        {item.terakhir_diperbarui ? new Date(item.terakhir_diperbarui).toLocaleString('id-ID') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
