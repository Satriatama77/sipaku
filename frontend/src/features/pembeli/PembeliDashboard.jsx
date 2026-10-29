import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getDataSSH, getSemuaKatalogPasar } from '../../services/hargaService'
import kecamatanData from '../../data/kecamatan_lamongan.json'
import Pagination from '../../components/ui/Pagination'

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

// Kategori populer untuk mempermudah pencarian warga
const KATEGORI_PILIHAN = [
  { label: 'Semua Material', value: '' },
  { label: 'Semen', value: 'Semen' },
  { label: 'Besi Beton', value: 'Besi' },
  { label: 'Pasir & Batu', value: 'Pasir' },
  { label: 'Bata & Genteng', value: 'Bata' },
  { label: 'Baja Ringan', value: 'Baja' },
  { label: 'Pipa PVC', value: 'Pipa' },
  { label: 'Cat Tembok', value: 'Cat' },
]

export default function PembeliDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('pasar') // 'pasar' | 'ssh'
  const [sshData, setSshData] = useState([])
  const [katalogPasar, setKatalogPasar] = useState([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterKecamatan, setFilterKecamatan] = useState('')
  const [selectedKategori, setSelectedKategori] = useState('')

  const [pagePasar, setPagePasar] = useState(1)
  const [pageSSH, setPageSSH] = useState(1)
  const pageSize = 10

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

    let status = 'Wajar'
    let color = '#047857'
    let bg = '#ecfdf5'
    let border = '#a7f3d0'

    if (diff > 0) {
      if (persen > 5.0) {
        status = 'Di Atas Standar'
        color = '#b91c1c'
        bg = '#fef2f2'
        border = '#fecaca'
      } else {
        status = 'Toleransi Wajar'
        color = '#b45309'
        bg = '#fffbeb'
        border = '#fde68a'
      }
    }

    return { hargaAcuan, diff, persen, status, color, bg, border }
  }

  // Filter katalog pasar berdasarkan pencarian, kategori, dan kecamatan
  const filteredKatalog = useMemo(() => {
    return katalogPasar.filter((item) => {
      const text = `${item.nama_material || ''} ${item.nama_toko || ''}`.toLowerCase()
      const matchSearch = !searchTerm || text.includes(searchTerm.toLowerCase())
      const matchKategori = !selectedKategori || text.includes(selectedKategori.toLowerCase())
      const matchKec = !filterKecamatan || item.nama_kecamatan === filterKecamatan
      return matchSearch && matchKategori && matchKec
    })
  }, [katalogPasar, searchTerm, selectedKategori, filterKecamatan])

  // Filter SSH acuan
  const filteredSSH = useMemo(() => {
    return sshData.filter((item) => {
      const text = (item.nama_material || '').toLowerCase()
      const matchSearch = !searchTerm || text.includes(searchTerm.toLowerCase())
      const matchKategori = !selectedKategori || text.includes(selectedKategori.toLowerCase())
      return matchSearch && matchKategori
    })
  }, [sshData, searchTerm, selectedKategori])

  const paginatedKatalog = useMemo(() => {
    const start = (pagePasar - 1) * pageSize
    return filteredKatalog.slice(start, start + pageSize)
  }, [filteredKatalog, pagePasar, pageSize])

  const paginatedSSH = useMemo(() => {
    const start = (pageSSH - 1) * pageSize
    return filteredSSH.slice(start, start + pageSize)
  }, [filteredSSH, pageSSH, pageSize])

  const handleLaporBaris = (item) => {
    const params = new URLSearchParams({
      kecamatan: item.nama_kecamatan || '',
      toko: item.nama_toko || '',
      material: item.nama_material || '',
      harga: item.harga_jual || '',
    })
    navigate(`/pembeli/lapor?${params.toString()}`)
  }

  const handleResetFilter = () => {
    setSearchTerm('')
    setSelectedKategori('')
    setFilterKecamatan('')
    setPagePasar(1)
    setPageSSH(1)
  }

  return (
    <div className="sipaku-page" style={{ background: '#f8fafc', minHeight: '100vh', color: '#0f172a', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div className="sipaku-page-inner" style={{ maxWidth: 1240, margin: '0 auto', padding: '24px 20px 60px' }}>

        {/* ── HEADER HALAMAN & AKSES PENGADUAN (Modern Navy) ── */}
        <section style={{
          background: 'linear-gradient(135deg, #0b1528 0%, #112240 55%, #18335c 100%)',
          borderRadius: 16,
          padding: '26px 30px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 10px 25px -5px rgba(11, 21, 40, 0.28), 0 4px 10px -2px rgba(11, 21, 40, 0.15)',
          marginBottom: 20,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ maxWidth: 760 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 750,
                  color: '#f8fafc',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '3px 10px',
                  borderRadius: 6,
                  letterSpacing: '0.04em'
                }}>
                  PORTAL INFORMASI PUBLIK
                </span>
                <span style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#6ee7b7',
                  fontSize: 11,
                  fontWeight: 650,
                  padding: '3px 10px',
                  borderRadius: 20,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px rgba(52, 211, 153, 0.8)' }} />
                  Terverifikasi Dinas PU
                </span>
                <span style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#cbd5e1',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: 6
                }}>
                  Perbup No. 188/2024
                </span>
              </div>

              <h1 style={{
                fontSize: 'clamp(20px, 3.5vw, 24px)',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.02em',
                margin: '0 0 6px',
                lineHeight: 1.25
              }}>
                Harga Material Bahan Bangunan Kabupaten Lamongan
              </h1>
              <p style={{
                fontSize: 13,
                color: '#cbd5e1',
                margin: 0,
                lineHeight: 1.55
              }}>
                Informasi harga material konstruksi terkini di seluruh toko bangunan. Bandingkan harga toko dengan standar pagu daerah (HAP) dan laporkan lonjakan harga tidak wajar dengan aman.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link
                to="/pembeli/lapor"
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  border: '1px solid #38bdf8',
                  padding: '9px 18px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 650,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
                  transition: 'all 0.15s ease'
                }}
              >
                Buat Pengaduan Harga
              </Link>

              <Link
                to="/pembeli/riwayat"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '9px 18px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                  backdropFilter: 'blur(4px)',
                  transition: 'all 0.15s ease'
                }}
              >
                Riwayat Pengaduan
              </Link>
            </div>
          </div>
        </section>

        {/* ── 3 LANGKAH PANDUAN WARGA (USER-FRIENDLY GUIDE) ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 12,
          marginBottom: 20
        }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12
          }}>
            <div style={{
              background: '#eff6ff',
              color: '#0284c7',
              fontWeight: 800,
              fontSize: 13,
              width: 28,
              height: 28,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              1
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 750, color: '#0f172a', marginBottom: 2 }}>Cari Bahan Bangunan</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.45 }}>Pilih kategori material atau filter kecamatan tempat toko bangunan berada.</div>
            </div>
          </div>

          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12
          }}>
            <div style={{
              background: '#f0fdf4',
              color: '#16a34a',
              fontWeight: 800,
              fontSize: 13,
              width: 28,
              height: 28,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              2
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 750, color: '#0f172a', marginBottom: 2 }}>Bandingkan Harga Acuan</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.45 }}>Cek apakah harga toko masih dalam batas standar acuan (HAP Perbup).</div>
            </div>
          </div>

          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12
          }}>
            <div style={{
              background: '#fef2f2',
              color: '#dc2626',
              fontWeight: 800,
              fontSize: 13,
              width: 28,
              height: 28,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              3
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 750, color: '#0f172a', marginBottom: 2 }}>Lapor Bila Melebihi Batas</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.45 }}>Gunakan tombol Lapor jika terjadi lonjakan harga untuk verifikasi petugas.</div>
            </div>
          </div>
        </div>

        {/* ── STATISTIK RESMI PEMANTAUAN ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          marginBottom: 20
        }}>
          {[
            { label: 'Cakupan Wilayah', value: '27 Kecamatan', sub: 'Kabupaten Lamongan', color: '#0f172a' },
            { label: 'Plafon Semen PPC 50kg', value: 'Rp 61.500', sub: 'Standar HAP Resmi', color: '#0284c7' },
            { label: 'Toleransi Maksimal', value: '5.0%', sub: 'Ambang Batas Wajar Disparitas', color: '#d97706' },
            { label: 'Waktu Respon Aduan', value: '< 24 Jam', sub: 'Tindak Lanjut Tim Sidak', color: '#047857' },
          ].map((card, i) => (
            <div key={i} style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '14px 16px'
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>{card.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: card.color }}>{card.value}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* ── KATEGORI CEPAT MATERIAL (PILL CHIPS) ── */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          padding: '14px 16px',
          marginBottom: 14
        }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Pilih Kategori Material
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {KATEGORI_PILIHAN.map((kat) => {
              const isSelected = selectedKategori === kat.value
              return (
                <button
                  key={kat.label}
                  type="button"
                  onClick={() => setSelectedKategori(isSelected ? '' : kat.value)}
                  style={{
                    background: isSelected ? '#0f172a' : '#f8fafc',
                    color: isSelected ? '#ffffff' : '#475569',
                    border: '1px solid',
                    borderColor: isSelected ? '#0f172a' : '#e2e8f0',
                    borderRadius: 20,
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.12s ease'
                  }}
                >
                  {kat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── TAB & SEARCH BAR ── */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          padding: '14px 16px',
          marginBottom: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          {/* Tab Navigasi */}
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
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Daftar Harga Material
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
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Standar Acuan Resmi (SSH)
            </button>
          </div>

          {/* Form Pencarian & Filter Kecamatan */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Cari material atau toko..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: 220,
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 12.5,
                color: '#0f172a',
                boxSizing: 'border-box'
              }}
            />

            {activeTab === 'pasar' && (
              <select
                value={filterKecamatan}
                onChange={(e) => setFilterKecamatan(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 12.5,
                  color: '#0f172a',
                  background: '#ffffff'
                }}
              >
                <option value="">Semua Kecamatan</option>
                {kecamatanData.map((k) => (
                  <option key={k.id_kecamatan} value={k.nama_kecamatan}>
                    Kec. {k.nama_kecamatan}
                  </option>
                ))}
              </select>
            )}

            {(searchTerm || filterKecamatan || selectedKategori) && (
              <button
                type="button"
                onClick={handleResetFilter}
                style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 12,
                  fontWeight: 650,
                  cursor: 'pointer'
                }}
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* ── TAB 1: HARGA PASAR TOKO BANGUNAN ── */}
        {activeTab === 'pasar' && (
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: 20
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '0 0 2px' }}>
                  Daftar Harga di Toko Bangunan
                </h3>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                  Menampilkan harga aktual dari mitra pangkalan bahan bangunan terdaftar di Kabupaten Lamongan.
                </p>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                {filteredKatalog.length} material ditemukan
              </div>
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                Memuat data katalog toko...
              </div>
            ) : filteredKatalog.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Tidak ada data yang sesuai</div>
                <div style={{ fontSize: 12, marginBottom: 14 }}>Coba ubah kata kunci pencarian atau reset pilihan kecamatan dan kategori.</div>
                <button
                  type="button"
                  onClick={handleResetFilter}
                  style={{
                    background: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Tampilkan Semua Data
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                      <th style={{ padding: '12px 14px', fontWeight: 750 }}>Material</th>
                      <th style={{ padding: '12px 14px', fontWeight: 750 }}>Toko Bangunan</th>
                      <th style={{ padding: '12px 14px', fontWeight: 750 }}>Kecamatan</th>
                      <th style={{ padding: '12px 14px', fontWeight: 750 }}>Harga Toko</th>
                      <th style={{ padding: '12px 14px', fontWeight: 750 }}>Batas Acuan (HAP)</th>
                      <th style={{ padding: '12px 14px', fontWeight: 750 }}>Status Harga</th>
                      <th style={{ padding: '12px 14px', fontWeight: 750, textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedKatalog.map((item, idx) => {
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
                            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                              Satuan: {item.satuan || 'unit'}
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', color: '#334155', fontWeight: 600 }}>
                            {item.nama_toko}
                          </td>
                          <td style={{ padding: '12px 14px', color: '#475569', fontWeight: 500 }}>
                            Kec. {item.nama_kecamatan || '-'}
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
                              border: `1px solid ${disp.border}`,
                              fontSize: 11,
                              fontWeight: 750,
                              padding: '3px 8px',
                              borderRadius: 6,
                              display: 'inline-block'
                            }}>
                              {disp.status} ({disp.diff > 0 ? `+${disp.persen}%` : `${disp.persen}%`})
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleLaporBaris(item)}
                              title="Laporkan ketidaksesuaian harga material ini"
                              style={{
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                color: '#b91c1c',
                                padding: '6px 14px',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.12s ease'
                              }}
                            >
                              Lapor
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filteredKatalog.length > 0 && (
              <Pagination
                currentPage={pagePasar}
                totalItems={filteredKatalog.length}
                pageSize={pageSize}
                onPageChange={setPagePasar}
                itemLabel="material"
              />
            )}
          </div>
        )}

        {/* ── TAB 2: STANDAR HARGA PEMKAB (SSH) ── */}
        {activeTab === 'ssh' && (
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: 20
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '0 0 2px' }}>
                  Standar Satuan Harga (SSH) Resmi
                </h3>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                  Batas acuan tertinggi yang ditetapkan pemerintah daerah berdasarkan Perbup Lamongan No. 188/2024.
                </p>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                {filteredSSH.length} standar material
              </div>
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                Memuat data SSH acuan...
              </div>
            ) : filteredSSH.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Data standar tidak ditemukan</div>
                <div style={{ fontSize: 12, marginBottom: 14 }}>Coba ubah kata kunci pencarian material.</div>
                <button
                  type="button"
                  onClick={handleResetFilter}
                  style={{
                    background: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Tampilkan Semua Data
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                      <th style={{ padding: '12px 14px', fontWeight: 750 }}>Kode Standar</th>
                      <th style={{ padding: '12px 14px', fontWeight: 750 }}>Nama Material Konstruksi</th>
                      <th style={{ padding: '12px 14px', fontWeight: 750 }}>Satuan</th>
                      <th style={{ padding: '12px 14px', fontWeight: 750 }}>Harga Acuan (Termasuk Pajak)</th>
                      <th style={{ padding: '12px 14px', fontWeight: 750 }}>Dasar Hukum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSSH.map((item, idx) => (
                      <tr
                        key={item.id_ssh || idx}
                        style={{ borderBottom: '1px solid #f1f5f9' }}
                      >
                        <td style={{ padding: '12px 14px', color: '#64748b', fontWeight: 600, fontSize: 12 }}>
                          {item.kode_material || `SSH-${String(idx + 1).padStart(3, '0')}`}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>
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

            {!loading && filteredSSH.length > 0 && (
              <Pagination
                currentPage={pageSSH}
                totalItems={filteredSSH.length}
                pageSize={pageSize}
                onPageChange={setPageSSH}
                itemLabel="standar acuan"
              />
            )}
          </div>
        )}

        {/* ── FOOTER RESMI ── */}
        <footer style={{
          marginTop: 40,
          borderTop: '1px solid #e2e8f0',
          paddingTop: 24,
          color: '#64748b'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 24,
            marginBottom: 20
          }}>
            <div style={{ maxWidth: 480 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>SIPAKU</div>
              <p style={{ fontSize: 12, lineHeight: 1.6, margin: 0, color: '#64748b' }}>
                Sistem Informasi Pengawasan &amp; Akuntabilitas Komoditas Konstruksi — Dinas Pekerjaan Umum Bina Marga &amp; Cipta Karya Kabupaten Lamongan.
              </p>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Layanan Warga</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                <Link to="/pembeli" style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 650 }}>Beranda &amp; Komparasi Harga</Link>
                <Link to="/pembeli/lapor" style={{ color: '#64748b', textDecoration: 'none' }}>Kanal Pengaduan Harga</Link>
                <Link to="/pembeli/riwayat" style={{ color: '#64748b', textDecoration: 'none' }}>Status Riwayat Laporan</Link>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Kontak Layanan</div>
              <div style={{ fontSize: 12, lineHeight: 1.6, color: '#64748b' }}>
                <div>Dinas PU Bina Marga, Kab. Lamongan</div>
                <div>Layanan Aduan: (0322) 321045</div>
              </div>
            </div>
          </div>

          <div style={{
            borderTop: '1px solid #f1f5f9',
            paddingTop: 14,
            fontSize: 11,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8
          }}>
            <div>© 2026 Pemerintah Kabupaten Lamongan. Hak cipta dilindungi.</div>
            <div style={{ color: '#94a3b8' }}>SIPAKU v2.5</div>
          </div>
        </footer>

      </div>
    </div>
  )
}
