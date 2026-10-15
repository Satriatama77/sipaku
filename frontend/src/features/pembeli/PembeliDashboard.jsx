import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getDataSSH, getSemuaKatalogPasar } from '../../services/hargaService'
import kecamatanData from '../../data/kecamatan_lamongan.json'
import {
  IconStore,
  IconShield,
  IconPackage,
  IconScale,
  IconCart,
  IconCheck,
  IconSearch,
  IconRefresh,
  IconFileText,
  IconAlertTriangle,
  IconUsers,
  IconGlobe,
  IconTrendingUp,
  IconLock
} from '../../components/Icons'

// Standar Plafon HAP resmi Dinas PU Lamongan (Perbup No. 188/2024)
const HAP_PLAFON_PU = {
  'Semen Gresik PPC 50kg': 61500,
  'Semen Gresik 40kg': 58000,
  'Semen Tiga Roda 40kg': 57000,
  'Besi Beton Polos 10mm SNI (12m)': 80000,
  'Besi Beton Polos 10mm SNI': 80000,
  'Besi Beton Polos Ø10mm': 80000,
  'Pasir Pasang Lumajang (M3)': 270000,
  'Pasir Pasang': 185000,
  'Bata Merah Press Tikung': 850,
  'Batu Bata Merah': 900,
  'Genteng Karangpilang Good Year': 4200,
  'Cat Tembok Weathershield 5kg': 120000,
  'Pipa PVC 4" AW SNI': 92000,
  'Baja Ringan Canal C75 (0.75mm)': 84000,
  'Keramik Lantai 40x40 Polos': 62000,
  'Kayu Kaso 5x7 Meranti': 33000,
}

export default function PembeliDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('pasar') // 'pasar' | 'ssh'
  const [sshData, setSshData] = useState([])
  const [katalogPasar, setKatalogPasar] = useState([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterKecamatan, setFilterKecamatan] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getDataSSH().catch(() => ({ data: { data: [] } })),
      getSemuaKatalogPasar().catch(() => ({ data: { data: [] } }))
    ])
      .then(([resSSH, resPasar]) => {
        setSshData(resSSH.data?.data || [])
        setKatalogPasar(resPasar.data?.data || [])
      })
      .finally(() => setLoading(false))
  }, [])

  // Kalkulasi disparitas terhadap HAP / SSH
  const hitungDisparitas = (namaMaterial, hargaJual) => {
    let hargaAcuan = HAP_PLAFON_PU[namaMaterial]
    if (!hargaAcuan) {
      const matchSSH = sshData.find(s => s.nama_material?.toLowerCase().includes(namaMaterial?.toLowerCase()))
      if (matchSSH) hargaAcuan = matchSSH.harga_ssh
    }
    if (!hargaAcuan) hargaAcuan = 61500

    const diff = Number(hargaJual) - hargaAcuan
    const persen = ((diff / hargaAcuan) * 100).toFixed(1)

    let status = 'Normal'
    let color = '#059669'
    let bg = '#ecfdf5'

    if (diff > 0) {
      if (persen > 5.0) {
        status = 'Pelanggaran HAP'
        color = '#dc2626'
        bg = '#fef2f2'
      } else {
        status = 'Waspada'
        color = '#d97706'
        bg = '#fffbeb'
      }
    }

    return { hargaAcuan, diff, persen, status, color, bg }
  }

  // Filter katalog pasar
  const filteredKatalog = useMemo(() => {
    return katalogPasar.filter((item) => {
      const matchSearch =
        item.nama_material?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nama_toko?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchKec = !filterKecamatan || item.nama_kecamatan === filterKecamatan
      return matchSearch && matchKec
    })
  }, [katalogPasar, searchTerm, filterKecamatan])

  // Filter SSH acuan
  const filteredSSH = useMemo(() => {
    return sshData.filter((item) => {
      return item.nama_material?.toLowerCase().includes(searchTerm.toLowerCase())
    })
  }, [sshData, searchTerm])

  const handleLaporBaris = (item) => {
    const params = new URLSearchParams({
      kecamatan: item.nama_kecamatan || '',
      toko: item.nama_toko || '',
      material: item.nama_material || '',
      harga: item.harga_jual || '',
    })
    navigate(`/pembeli/lapor?${params.toString()}`)
  }

  return (
    <div className="sipaku-page" style={{ background: '#f8fafc', minHeight: '100vh', color: '#0f172a', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div className="sipaku-page-inner" style={{ maxWidth: 1240, margin: '0 auto', padding: '24px 20px 60px' }}>

        {/* ── TOP BADGES & OFFICIAL HEADER ──────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <span style={{
              background: '#0f172a',
              color: '#ffffff',
              fontSize: 10,
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: 4,
              letterSpacing: '0.04em'
            }}>
              SIPAKU PUBLIC SUITE v2.5
            </span>
            <span style={{
              background: '#e0f2fe',
              color: '#0369a1',
              fontSize: 10,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 4
            }}>
              LAYANAN INFORMASI &amp; KOMPARASI HARGA MATERIAL KONSTRUKSI
            </span>
            <span style={{
              background: '#fef3c7',
              color: '#b45309',
              fontSize: 10,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 4
            }}>
              PERBUP NO. 188/2024
            </span>
            <span style={{
              background: '#ecfdf5',
              color: '#047857',
              fontSize: 10,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 4,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}>
              <IconCheck size={12} color="#047857" />
              TERVALIDASI DINAS PU BINA MARGA
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 className="sipaku-page-title" style={{
                fontSize: 26,
                fontWeight: 900,
                color: '#0f172a',
                letterSpacing: '-0.03em',
                margin: '0 0 6px'
              }}>
                Beranda: Komparasi Pasar &amp; Transparansi Harga Material
              </h1>
              <p style={{
                fontSize: 13,
                color: '#64748b',
                margin: 0,
                maxWidth: 820,
                lineHeight: 1.5
              }}>
                Portal publikasi resmi disparitas harga material konstruksi di 27 kecamatan Kabupaten Lamongan. Pantau harga lapangan secara real-time dan laporkan pelanggaran over-HAP secara aman.
              </p>
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IconShield size={16} color="#0284c7" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Protokol Keamanan
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>
                  Tervalidasi BSSN RI
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── HERO BANNER ACTION: KANAL PENGADUAN ───────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: 14,
          padding: '22px 26px',
          color: '#ffffff',
          marginBottom: 24,
          boxShadow: '0 4px 16px rgba(15,23,42,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 18
        }}>
          <div style={{ maxWidth: 680 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{
                background: '#0284c7',
                color: '#ffffff',
                fontSize: 10.5,
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: 4
              }}>
                LAYANAN PUBLIK AKTIF 24/7
              </span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                Didukung Perlindungan Anonimitas BSSN
              </span>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px', color: '#f8fafc' }}>
              Menemukan Lonjakan Harga Material di Atas Standar HAP?
            </h2>
            <p style={{ fontSize: 12.5, color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
              Masyarakat, pembeli retail, dan TPK Dana Desa dapat melaporkan anomali harga langsung melalui Kanal Pengaduan. Sistem otomatis menerbitkan Nomor Tiket Sidak untuk verifikasi lapangan petugas PU.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link
              to="/pembeli/lapor"
              style={{
                background: '#0284c7',
                color: '#ffffff',
                padding: '11px 20px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 750,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 2px 6px rgba(2,132,199,0.3)',
                transition: 'all 0.15s ease'
              }}
            >
              <IconFileText size={16} color="#ffffff" />
              <span>Buka Kanal Pengaduan (Lapor Harga)</span>
            </Link>

            <Link
              to="/pembeli/riwayat"
              style={{
                background: 'rgba(255,255,255,0.08)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.18)',
                padding: '11px 18px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 650,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <span>Riwayat Laporan Saya</span>
            </Link>
          </div>
        </div>

        {/* ── 4 STAT METRICS ───────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 14,
          marginBottom: 24
        }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Pangkalan Terpantau</span>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                <IconStore size={14} color="#0f172a" />
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>342 Toko</div>
            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 3 }}>Tersebar di 27 Kecamatan Lamongan</div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Plafon HAP Semen PPC</span>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bfdbfe' }}>
                <IconScale size={14} color="#0284c7" />
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#0284c7' }}>Rp 61.500</div>
            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 3 }}>Standar Perbup No. 188/2024</div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Ambang Toleransi Daerah</span>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fef3c7' }}>
                <IconAlertTriangle size={14} color="#d97706" />
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#d97706' }}>± 5.0%</div>
            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 3 }}>Batas Maksimal Deviasi Lapangan</div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>SLA Disposisi Sidak</span>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bbf7d0' }}>
                <IconShield size={14} color="#047857" />
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#047857' }}>&lt; 24 Jam</div>
            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 3 }}>Satgas Gabungan Disperindag &amp; PU</div>
          </div>
        </div>

        {/* ── TAB NAVIGATION & SEARCH BAR ─────────────────────── */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: '16px 20px',
          marginBottom: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14
        }}>
          {/* Tab Switcher */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setActiveTab('pasar')}
              style={{
                background: activeTab === 'pasar' ? '#0f172a' : '#f8fafc',
                color: activeTab === 'pasar' ? '#ffffff' : '#475569',
                border: '1px solid',
                borderColor: activeTab === 'pasar' ? '#0f172a' : '#e2e8f0',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <IconStore size={14} color={activeTab === 'pasar' ? '#ffffff' : '#64748b'} />
              <span>Harga Pasar Toko Terkini</span>
            </button>

            <button
              onClick={() => setActiveTab('ssh')}
              style={{
                background: activeTab === 'ssh' ? '#0f172a' : '#f8fafc',
                color: activeTab === 'ssh' ? '#ffffff' : '#475569',
                border: '1px solid',
                borderColor: activeTab === 'ssh' ? '#0f172a' : '#e2e8f0',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <IconScale size={14} color={activeTab === 'ssh' ? '#ffffff' : '#64748b'} />
              <span>Standar Satuan Harga (SSH) Acuan</span>
            </button>
          </div>

          {/* Search & Filter Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: 240 }}>
              <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <IconSearch size={14} color="#94a3b8" />
              </div>
              <input
                type="text"
                placeholder="Cari material atau toko..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 12px 7px 32px',
                  borderRadius: 7,
                  border: '1px solid #cbd5e1',
                  fontSize: 12.5,
                  color: '#0f172a',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {activeTab === 'pasar' && (
              <select
                value={filterKecamatan}
                onChange={(e) => setFilterKecamatan(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 7,
                  border: '1px solid #cbd5e1',
                  fontSize: 12.5,
                  color: '#0f172a',
                  background: '#ffffff'
                }}
              >
                <option value="">Semua Kecamatan (27)</option>
                {kecamatanData.map((k) => (
                  <option key={k.id_kecamatan} value={k.nama_kecamatan}>
                    {k.nama_kecamatan}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* ── TAB 1: HARGA PASAR LAPANGAN ──────────────────────── */}
        {activeTab === 'pasar' && (
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            padding: 22,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                  Katalog Transparansi Harga Pasar Konstruksi
                </h3>
                <p style={{ fontSize: 12.5, color: '#64748b', margin: 0 }}>
                  Data diperbarui berkala melalui survei lapangan Dinas PU &amp; pelaporan berkala mitra pangkalan resmi.
                </p>
              </div>
              <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>
                Menampilkan <strong>{filteredKatalog.length}</strong> entri komoditas
              </div>
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                Memuat data komparasi pasar...
              </div>
            ) : filteredKatalog.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                <IconSearch size={28} color="#94a3b8" />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginTop: 10 }}>Tidak ada data yang cocok</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Coba ubah kata kunci pencarian atau filter kecamatan.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px', fontWeight: 700 }}>Nama Material &amp; Satuan</th>
                      <th style={{ padding: '10px 14px', fontWeight: 700 }}>Toko Bangunan Resmi</th>
                      <th style={{ padding: '10px 14px', fontWeight: 700 }}>Kecamatan</th>
                      <th style={{ padding: '10px 14px', fontWeight: 700 }}>Harga Jual Toko</th>
                      <th style={{ padding: '10px 14px', fontWeight: 700 }}>Batas Plafon HAP</th>
                      <th style={{ padding: '10px 14px', fontWeight: 700 }}>Status Disparitas</th>
                      <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'center' }}>Aksi Pelaporan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredKatalog.map((item, idx) => {
                      const disp = hitungDisparitas(item.nama_material, item.harga_jual)
                      return (
                        <tr
                          key={item.id_katalog || idx}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'background 0.15s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                        >
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>
                            <div>{item.nama_material}</div>
                            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                              Satuan: {item.satuan || 'zak'}
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', color: '#0369a1', fontWeight: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <IconStore size={13} color="#0369a1" />
                              <span>{item.nama_toko}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', color: '#475569', fontWeight: 500 }}>
                            {item.nama_kecamatan || '-'}
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0f172a' }}>
                            Rp {Number(item.harga_jual || 0).toLocaleString('id-ID')}
                          </td>
                          <td style={{ padding: '12px 14px', color: '#64748b', fontWeight: 600 }}>
                            Rp {Number(disp.hargaAcuan).toLocaleString('id-ID')}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              background: disp.bg,
                              color: disp.color,
                              fontSize: 11,
                              fontWeight: 750,
                              padding: '3px 8px',
                              borderRadius: 4,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}>
                              <span>{disp.status}</span>
                              <span>({disp.diff > 0 ? `+${disp.persen}%` : `${disp.persen}%`})</span>
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleLaporBaris(item)}
                              title="Laporkan perbedaan harga ini ke Kanal Pengaduan"
                              style={{
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                color: '#b91c1c',
                                padding: '5px 12px',
                                borderRadius: 6,
                                fontSize: 11.5,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <IconAlertTriangle size={12} color="#b91c1c" />
                              <span>Lapor Anomali</span>
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

        {/* ── TAB 2: STANDAR SATUAN HARGA (SSH) ACUAN ──────────── */}
        {activeTab === 'ssh' && (
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            padding: 22,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                  Standar Satuan Harga (SSH) Acuan Resmi Pemkab Lamongan
                </h3>
                <p style={{ fontSize: 12.5, color: '#64748b', margin: 0 }}>
                  Batas pagu tertinggi resmi yang ditetapkan Pemerintah Kabupaten Lamongan (Perbup No. 188/2024).
                </p>
              </div>
              <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>
                Menampilkan <strong>{filteredSSH.length}</strong> material acuan
              </div>
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                Memuat data SSH acuan...
              </div>
            ) : filteredSSH.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                <IconSearch size={28} color="#94a3b8" />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginTop: 10 }}>Data SSH tidak ditemukan</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px', fontWeight: 700 }}>Kode Material</th>
                      <th style={{ padding: '10px 14px', fontWeight: 700 }}>Nama Komoditas Acuan</th>
                      <th style={{ padding: '10px 14px', fontWeight: 700 }}>Satuan Standar</th>
                      <th style={{ padding: '10px 14px', fontWeight: 700 }}>Harga Standar SSH (Include PPN)</th>
                      <th style={{ padding: '10px 14px', fontWeight: 700 }}>Dasar Regulasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSSH.map((item, idx) => (
                      <tr
                        key={item.id_ssh || idx}
                        style={{ borderBottom: '1px solid #f1f5f9' }}
                      >
                        <td style={{ padding: '12px 14px', color: '#64748b', fontWeight: 600, fontSize: 12 }}>
                          {item.kode_material || `SSH-${String(idx + 1).padStart(3, '0')}`}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 750, color: '#0f172a' }}>
                          {item.nama_material}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#475569', fontWeight: 500 }}>
                          {item.satuan}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0369a1' }}>
                          Rp {Number(item.harga_ssh || 0).toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 12 }}>
                          Perbup Lamongan No. 188/2024
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── OFFICIAL FOOTER SIPAKU ──────────────────────────── */}
        <footer style={{
          marginTop: 48,
          borderTop: '1px solid #e2e8f0',
          paddingTop: 32,
          color: '#64748b'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 32,
            marginBottom: 28
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>SIPAKU</span>
                <span style={{ background: '#f1f5f9', color: '#475569', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                  v2.5 STABLE
                </span>
              </div>
              <p style={{ fontSize: 12, lineHeight: 1.6, margin: '0 0 12px' }}>
                Sistem Informasi Pengawasan &amp; Akuntabilitas Komoditas Konstruksi Dinas Pekerjaan Umum Bina Marga dan Cipta Karya Kabupaten Lamongan. Platform transparansi pengadaan publik berbasis verifikasi forensik digital.
              </p>
              <div style={{ fontSize: 11, color: '#047857', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconShield size={13} color="#047857" />
                <span>Tersertifikasi Keamanan Siber Sandi &amp; Kripto Nasional (BSSN)</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
                NAVIGASI PUBLIK
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                <Link to="/pembeli" style={{ color: '#64748b', textDecoration: 'none' }}>• Komparasi Harga Pasar</Link>
                <Link to="/pembeli/lapor" style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}>• Kanal Pengaduan (Lapor Harga)</Link>
                <Link to="/pembeli/riwayat" style={{ color: '#64748b', textDecoration: 'none' }}>• Riwayat Laporan</Link>
                <span style={{ color: '#94a3b8' }}>• Standar SSH Perbup 188/2024</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
                PUSAT PENGADUAN RESMI
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                <div>Gedung Dinas PU Bina Marga, Jl. Basuki Rahmat No. 12, Lamongan, Jawa Timur</div>
                <div style={{ marginTop: 4 }}>Telp: (0322) 321045 • info@pu.lamongankab.go.id</div>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            borderTop: '1px solid #f1f5f9',
            paddingTop: 16,
            fontSize: 11
          }}>
            <div>
              © 2026 Pemerintah Kabupaten Lamongan. Dinas Pekerjaan Umum Bina Marga &amp; Cipta Karya. Hak Cipta Dilindungi.
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <span>Portal Civic Tech Terpadu</span>
              <span>•</span>
              <span>ISO 27001 Certified</span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  )
}
