import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getDataSSH, getSemuaKatalogPasar } from '../../services/hargaService'
import StatusBadge from '../../components/StatusBadge'

const WRAP = { padding: '28px 32px', maxWidth: 1180, margin: '0 auto' }
const CARD = { background: '#1e293b', borderRadius: 14, padding: 24, border: '1px solid #334155', marginBottom: 24 }

export default function PembeliDashboard() {
  const navigate = useNavigate()
  const [sshData, setSshData] = useState([])
  const [katalogPasar, setKatalogPasar] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pasar') // 'pasar' | 'ssh'
  const [searchTerm, setSearchTerm] = useState('')
  const [filterKecamatan, setFilterKecamatan] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getDataSSH().catch(() => ({ data: { data: [] } })),
      getSemuaKatalogPasar().catch(() => ({ data: { data: [] } })),
    ])
      .then(([resSSH, resPasar]) => {
        setSshData(resSSH.data?.data || [])
        setKatalogPasar(resPasar.data?.data || [])
      })
      .finally(() => setLoading(false))
  }, [])

  // Cari daftar kecamatan unik dari data katalog pasar
  const kecamatanList = useMemo(() => {
    const setKec = new Set()
    katalogPasar.forEach((item) => {
      if (item.nama_kecamatan) setKec.add(item.nama_kecamatan)
    })
    return Array.from(setKec).sort()
  }, [katalogPasar])

  // Helper untuk mencari harga SSH dan menghitung disparitas
  const hitungDisparitas = (namaMaterial, hargaJual) => {
    if (!namaMaterial || !hargaJual) return null
    const normNama = namaMaterial.toLowerCase()
    const matchSSH = sshData.find((item) => {
      const s = item.nama_material.toLowerCase()
      return normNama.includes(s) || s.includes(normNama)
    })

    if (!matchSSH) {
      return { harga_ssh: null, persen: null, status: 'Normal' }
    }

    const diff = hargaJual - matchSSH.harga_ssh
    const persen = Math.round((diff / matchSSH.harga_ssh) * 100)
    let status = 'Normal'
    if (persen > 15) status = 'Merah'
    else if (persen > 5) status = 'Waspada'

    return {
      harga_ssh: matchSSH.harga_ssh,
      persen,
      status,
    }
  }

  // Filter katalog pasar
  const filteredKatalog = useMemo(() => {
    return katalogPasar.filter((item) => {
      const matchSearch =
        item.nama_material?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nama_toko?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchKec = filterKecamatan ? item.nama_kecamatan === filterKecamatan : true
      return matchSearch && matchKec
    })
  }, [katalogPasar, searchTerm, filterKecamatan])

  // Filter data SSH
  const filteredSSH = useMemo(() => {
    return sshData.filter((item) =>
      item.nama_material?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [sshData, searchTerm])

  const handleLaporBaris = (item, disparitas) => {
    navigate('/pembeli/lapor', {
      state: {
        nama_material: item.nama_material,
        nama_toko: item.nama_toko,
        id_kecamatan: item.id_kecamatan ? String(item.id_kecamatan) : '',
        harga_temuan: item.harga_jual,
        satuan: item.satuan,
      },
    })
  }

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#f8fafc', paddingBottom: 60 }}>
      <div style={WRAP}>
        {/* Banner Publik Hero */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0c4a6e 100%)',
          borderRadius: 16,
          padding: '28px 32px',
          marginBottom: 28,
          border: '1px solid #0284c7',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 20
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ background: '#0369a1', color: '#e0f2fe', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                KABUPATEN LAMONGAN
              </span>
              <span style={{ background: '#065f46', color: '#a7f3d0', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                🌐 AKSES PUBLIK BEBAS LOGIN
              </span>
            </div>
            <h1 style={{ color: '#f8fafc', margin: '0 0 8px', fontSize: 26, fontWeight: 800 }}>
              Sistem Informasi Komparasi & Pengawasan Harga Material
            </h1>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: 14, maxWidth: 650, lineHeight: 1.5 }}>
              Pantau harga bahan bangunan pasar hasil survei langsung <strong>Dinas PU</strong> dan bandingkan dengan <strong>Standar Satuan Harga (SSH)</strong> resmi. Laporkan toko yang menetapkan harga tidak wajar!
            </p>
          </div>
          <div>
            <Link
              to="/pembeli/lapor"
              style={{
                background: '#0ea5e9',
                color: '#fff',
                textDecoration: 'none',
                padding: '12px 22px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 14,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(14, 165, 233, 0.4)'
              }}
            >
              📢 Lapor Anomali Harga
            </Link>
          </div>
        </div>

        {/* Tab Navigasi */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <button
            onClick={() => setActiveTab('pasar')}
            style={{
              background: activeTab === 'pasar' ? '#0284c7' : '#1e293b',
              color: activeTab === 'pasar' ? '#fff' : '#94a3b8',
              border: '1px solid #334155',
              padding: '10px 20px',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s'
            }}
          >
            <span>🏪</span> Harga Pasar Hasil Survei Toko ({katalogPasar.length})
          </button>
          <button
            onClick={() => setActiveTab('ssh')}
            style={{
              background: activeTab === 'ssh' ? '#0284c7' : '#1e293b',
              color: activeTab === 'ssh' ? '#fff' : '#94a3b8',
              border: '1px solid #334155',
              padding: '10px 20px',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s'
            }}
          >
            <span>📋</span> Standar Satuan Harga (SSH) 2025 ({sshData.length})
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder={activeTab === 'pasar' ? "Cari nama material atau toko..." : "Cari material acuan SSH..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              minWidth: 260,
              padding: '10px 14px',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              color: '#f8fafc',
              fontSize: 14
            }}
          />
          {activeTab === 'pasar' && (
            <select
              value={filterKecamatan}
              onChange={(e) => setFilterKecamatan(e.target.value)}
              style={{
                padding: '10px 14px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 8,
                color: '#f8fafc',
                fontSize: 14
              }}
            >
              <option value="">Semua Kecamatan</option>
              {kecamatanList.map((kec) => (
                <option key={kec} value={kec}>{kec}</option>
              ))}
            </select>
          )}
        </div>

        {/* TAB 1: Harga Pasar Toko Bangunan */}
        {activeTab === 'pasar' && (
          <div style={CARD}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ color: '#e2e8f0', margin: '0 0 4px', fontSize: 18 }}>
                  Harga Pasar Bahan Bangunan (Survei Lapangan Dinas PU)
                </h2>
                <p style={{ color: '#94a3b8', margin: 0, fontSize: 13 }}>
                  Data harga diperbarui langsung oleh Petugas Dinas PU melalui survei lapangan dan input pengenalan suara AI (NLP).
                </p>
              </div>
            </div>

            {loading ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: 30 }}>Memuat harga pasar terkini...</p>
            ) : filteredKatalog.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
                <p style={{ fontSize: 15, margin: 0 }}>Tidak ada data harga pasar yang cocok.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                  <thead>
                    <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                      <th style={{ padding: '12px 14px' }}>Nama Material</th>
                      <th style={{ padding: '12px 14px' }}>Toko Bangunan</th>
                      <th style={{ padding: '12px 14px' }}>Kecamatan</th>
                      <th style={{ padding: '12px 14px' }}>Harga Toko</th>
                      <th style={{ padding: '12px 14px' }}>Acuan SSH</th>
                      <th style={{ padding: '12px 14px' }}>Status Disparitas</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredKatalog.map((item) => {
                      const disp = hitungDisparitas(item.nama_material, item.harga_jual)
                      return (
                        <tr key={item.id_katalog} style={{ borderBottom: '1px solid #334155', background: 'transparent' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 600, color: '#f8fafc' }}>
                            {item.nama_material}
                            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>Satuan: {item.satuan}</div>
                          </td>
                          <td style={{ padding: '12px 14px', color: '#38bdf8', fontWeight: 500 }}>
                            {item.nama_toko}
                          </td>
                          <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>
                            {item.nama_kecamatan || '-'}
                          </td>
                          <td style={{ padding: '12px 14px', color: '#34d399', fontWeight: 700, fontSize: 14 }}>
                            Rp {Number(item.harga_jual).toLocaleString('id-ID')}
                          </td>
                          <td style={{ padding: '12px 14px', color: '#94a3b8' }}>
                            {disp?.harga_ssh ? `Rp ${disp.harga_ssh.toLocaleString('id-ID')}` : '-'}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <StatusBadge status={disp?.status || 'Normal'} />
                              {disp?.persen !== null && (
                                <span style={{ fontSize: 11, color: disp.persen > 0 ? '#f87171' : '#34d399' }}>
                                  {disp.persen > 0 ? `+${disp.persen}%` : `${disp.persen}%`}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleLaporBaris(item, disp)}
                              title="Laporkan jika harga ini tidak sesuai dengan kondisi riil di lapangan"
                              style={{
                                background: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid #ef4444',
                                color: '#fca5a5',
                                borderRadius: 6,
                                padding: '6px 12px',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              🚨 Lapor Anomali
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Standar Satuan Harga (SSH) Acuan */}
        {activeTab === 'ssh' && (
          <div style={CARD}>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ color: '#e2e8f0', margin: '0 0 4px', fontSize: 18 }}>
                Standar Satuan Harga (SSH) Kabupaten Lamongan 2025
              </h2>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: 13 }}>
                Harga pagu tertinggi dan acuan resmi yang ditetapkan Pemerintah Kabupaten Lamongan sebagai batas toleransi harga proyek & material.
              </p>
            </div>

            {loading ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: 30 }}>Memuat data SSH...</p>
            ) : filteredSSH.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                <p>Tidak ada data material SSH yang cocok.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                      <th style={{ padding: '12px 14px' }}>Nama Material Acuan</th>
                      <th style={{ padding: '12px 14px' }}>Satuan</th>
                      <th style={{ padding: '12px 14px' }}>Harga Standar SSH (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSSH.map((item, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 600 }}>{item.nama_material}</td>
                        <td style={{ padding: '12px 14px', color: '#94a3b8' }}>{item.satuan}</td>
                        <td style={{ padding: '12px 14px', color: '#38bdf8', fontWeight: 700 }}>
                          Rp {item.harga_ssh.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
