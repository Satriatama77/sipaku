import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { getDataSSH } from '../../services/hargaService'
import {
  IconStore,
  IconShield,
  IconPackage,
  IconScale,
  IconCart,
  IconCheck,
  IconSearch,
  IconRefresh,
  IconPlus,
  IconUsers,
  IconLock,
  IconFileText,
  IconAlertTriangle,
  IconCpu,
  IconGlobe,
  IconAward,
  IconTrendingUp,
  IconX,
  IconDesktop
} from '../../components/Icons'

// Spesifikasi SNI standar baku dinas berdasarkan nama material
const SNI_SPECS = {
  'semen gresik ppc 50kg': 'SNI 15-7064-2004 • Kategori: Portland Pozzolan',
  'semen gresik 40kg': 'SNI 15-7064-2004 • Kategori: Portland Pozzolan',
  'semen tiga roda 40kg': 'SNI 15-2049-2004 • Tipe Portland Komposit',
  'semen holcim 40kg': 'SNI 15-7064-2004 • Formula Ramah Lingkungan',
  'besi beton polos 10mm sni (12m)': 'SNI 2052:2017 • Toleransi Diameter ±0.2mm',
  'besi beton polos 10mm sni': 'SNI 2052:2017 • Toleransi Diameter ±0.2mm',
  'besi beton polos ø10mm': 'SNI 2052:2017 • Toleransi Diameter ±0.2mm',
  'besi beton polos ø8mm': 'SNI 2052:2017 • Toleransi Diameter ±0.2mm',
  'besi beton polos ø12mm': 'SNI 2052:2017 • Baja Tulangan Sirip SNI',
  'pasir pasang lumajang (m3)': 'SNI 03-2834-2000 • Gradasi Kasar & Bebas Lumpur',
  'pasir pasang': 'SNI 03-2834-2000 • Gradasi Sedang untuk Mortar',
  'pasir beton': 'SNI 03-2834-2000 • Agregat Halus Beton Struktural',
  'bata merah press tikung': 'Spesifikasi Lokal Kab. Lamongan • Ukuran Standar PU',
  'batu bata merah': 'SNI 15-2094-2000 • Mutu Tingkat I Pembakaran Sempurna',
  'genteng karangpilang good year': 'SNI 03-2095-1998 • Presisi Kedap Air & Tahan Beban',
  'cat tembok weathershield 5kg': 'SNI 3564:2014 • Cat Tembok Emulsi Tahan Cuaca',
  'pipa pvc 4" aw sni': 'SNI 06-0084-2002 • Tekanan Kerja 10 kg/cm²',
  'baja ringan canal c75 (0.75mm)': 'SNI 8399:2017 • Profil Galvalume Baja Hi-Ten',
  'keramik lantai 40x40 polos': 'SNI ISO 13006:2014 • Kualitas Grade A Glossy',
  'kayu kaso 5x7 meranti': 'Standar PU Konstruksi Kelas II • Kering Alami',
}

export default function PenjualDashboard() {
  const { user } = useAuth()

  // State Data Toko & Katalog
  const [daftarToko, setDaftarToko] = useState([])
  const [selectedTokoId, setSelectedTokoId] = useState(3) // Default toko TB Jaya Makmur Babat (id 3)
  const [tokoAktif, setTokoAktif] = useState(null)
  const [katalog, setKatalog] = useState([])
  const [sshData, setSshData] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [activeKategoriTab, setActiveKategoriTab] = useState('Semua')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('edit')
  const [formNama, setFormNama] = useState('')
  const [formHarga, setFormHarga] = useState('')
  const [formSatuan, setFormSatuan] = useState('zak')
  const [formStok, setFormStok] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('')

  // 1. Ambil Data Toko & SSH
  useEffect(() => {
    Promise.all([
      api.get('/api/katalog/toko/semua').catch(() => ({ data: { data: [] } })),
      getDataSSH().catch(() => ({ data: { data: [] } }))
    ]).then(([resToko, resSSH]) => {
      const listToko = resToko.data?.data || []
      setDaftarToko(listToko)
      setSshData(resSSH.data?.data || [])

      let matched = null
      if (user?.id_toko) {
        matched = listToko.find((t) => t.id_toko === Number(user.id_toko))
      } else if (user?.nama_lengkap) {
        matched = listToko.find((t) =>
          t.nama_toko.toLowerCase().includes(user.nama_lengkap.toLowerCase()) ||
          user.nama_lengkap.toLowerCase().includes(t.nama_toko.toLowerCase())
        )
      }
      if (!matched) {
        matched = listToko.find((t) => t.id_toko === 3) || listToko[0]
      }

      if (matched) {
        setSelectedTokoId(matched.id_toko)
        setTokoAktif(matched)
      }
    })
  }, [user])

  // 2. Fetch Katalog Toko
  const fetchKatalog = (id) => {
    if (!id) return
    setLoading(true)
    api.get(`/api/katalog/${id}`)
      .then((res) => {
        setKatalog(res.data.data || [])
      })
      .catch((err) => console.error(err))
      .finally(() => {
        setLoading(false)
        setRefreshing(false)
      })
  }

  useEffect(() => {
    fetchKatalog(selectedTokoId)
    const t = daftarToko.find((x) => x.id_toko === Number(selectedTokoId))
    if (t) setTokoAktif(t)
    setCurrentPage(1)
  }, [selectedTokoId, daftarToko])

  // 3. Helper Batas HAP
  const getBatasHAP = (namaMaterial) => {
    if (!namaMaterial) return 70000
    const lower = namaMaterial.toLowerCase().trim()
    const exact = sshData.find((s) => s.nama_material.toLowerCase() === lower)
    if (exact) return exact.harga_ssh

    if (lower.includes('semen gresik ppc 50kg') || lower.includes('semen gresik') || lower.includes('semen')) return 63500
    if (lower.includes('besi beton polos 10mm') || lower.includes('besi beton 10mm') || lower.includes('besi')) return 82000
    if (lower.includes('pasir pasang lumajang') || lower.includes('pasir pasang') || lower.includes('pasir')) return 285000
    if (lower.includes('bata merah press tikung') || lower.includes('bata')) return 850
    if (lower.includes('genteng')) return 4500
    if (lower.includes('cat tembok') || lower.includes('cat')) return 125000
    if (lower.includes('pipa')) return 95000
    if (lower.includes('baja ringan')) return 88000
    if (lower.includes('keramik')) return 65000
    if (lower.includes('kayu')) return 35000

    return 75000
  }

  // 4. Spesifikasi SNI Helper
  const getSNISpec = (namaMaterial) => {
    if (!namaMaterial) return 'Standar Industri Indonesia (SII / SNI Terdaftar)'
    const lower = namaMaterial.toLowerCase().trim()
    for (const [key, spec] of Object.entries(SNI_SPECS)) {
      if (lower.includes(key) || key.includes(lower)) {
        return spec
      }
    }
    return 'Standar Konstruksi Dinas PU Bina Marga Kab. Lamongan'
  }

  // 5. Kategori Parser
  const getKategoriMaterial = (namaMaterial) => {
    const lower = (namaMaterial || '').toLowerCase()
    if (lower.includes('semen')) return 'Semen & Pengikat'
    if (lower.includes('besi') || lower.includes('baja') || lower.includes('wiremesh')) return 'Besi & Baja'
    if (lower.includes('pasir') || lower.includes('kerikil') || lower.includes('agregat') || lower.includes('batu pecah')) return 'Agregat & Pasir'
    if (lower.includes('bata') || lower.includes('batako') || lower.includes('genteng')) return 'Bata & Dinding'
    return 'Kayu & Lainnya'
  }

  // 6. Enrichment Data Katalog
  const enrichedKatalog = useMemo(() => {
    return katalog.map((item) => {
      const batasHap = getBatasHAP(item.nama_material)
      const harga = Number(item.harga_jual)
      const diff = harga - batasHap
      const persenDiff = batasHap > 0 ? ((diff / batasHap) * 100).toFixed(1) : '0.0'
      const sniSpec = getSNISpec(item.nama_material)
      const kategori = getKategoriMaterial(item.nama_material)

      let statusGuardrail = 'sesuai'
      let badgeLabel = ''

      if (harga < batasHap) {
        statusGuardrail = 'sesuai'
        badgeLabel = `Sesuai HAP (${persenDiff}%)`
      } else if (harga === batasHap) {
        statusGuardrail = 'presisi'
        badgeLabel = `Presisi HAP`
      } else {
        statusGuardrail = 'overpricing'
        badgeLabel = `Melebihi HAP (+${persenDiff}%)`
      }

      return {
        ...item,
        batasHap,
        diff,
        persenDiff,
        sniSpec,
        kategori,
        statusGuardrail,
        badgeLabel,
      }
    })
  }, [katalog, sshData])

  // 7. Hitung Metrik Ringkasan
  const totalItem = enrichedKatalog.length
  const violatingItems = enrichedKatalog.filter((x) => x.harga_jual > x.batasHap).length
  const kepatuhanPersen = totalItem > 0 ? (((totalItem - violatingItems) / totalItem) * 100).toFixed(1) : '100.0'

  // 8. Filter & Pencarian
  const filteredKatalog = useMemo(() => {
    return enrichedKatalog.filter((item) => {
      const matchSearch = item.nama_material.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sniSpec.toLowerCase().includes(searchQuery.toLowerCase())
      const matchKategori = activeKategoriTab === 'Semua' || item.kategori === activeKategoriTab
      return matchSearch && matchKategori
    })
  }, [enrichedKatalog, searchQuery, activeKategoriTab])

  // Pagination calculation
  const totalPages = Math.ceil(filteredKatalog.length / itemsPerPage) || 1
  const displayedKatalog = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredKatalog.slice(start, start + itemsPerPage)
  }, [filteredKatalog, currentPage])

  // 9. Handlers
  const handleSinkronisasi = () => {
    setRefreshing(true)
    fetchKatalog(selectedTokoId)
  }

  const openEditModal = (item) => {
    setModalMode('edit')
    setFormNama(item.nama_material)
    setFormHarga(item.harga_jual)
    setFormSatuan(item.satuan || 'zak')
    setFormStok(Boolean(item.stok_tersedia))
    setIsModalOpen(true)
    setSaveSuccessMsg('')
  }

  const openAddModal = () => {
    setModalMode('add')
    setFormNama('')
    setFormHarga('')
    setFormSatuan('zak')
    setFormStok(true)
    setIsModalOpen(true)
    setSaveSuccessMsg('')
  }

  const modalBatasHAP = useMemo(() => {
    return getBatasHAP(formNama)
  }, [formNama, sshData])

  const numericFormHarga = Number(formHarga) || 0
  const isOverpricingModal = numericFormHarga > modalBatasHAP && modalBatasHAP > 0
  const modalPersenDiff = modalBatasHAP > 0
    ? (((numericFormHarga - modalBatasHAP) / modalBatasHAP) * 100).toFixed(1)
    : '0.0'

  const handleSubmitModal = async (e) => {
    e.preventDefault()
    if (isOverpricingModal) {
      alert('Sistem Guardrail: Harga melebihi Batas Atas HAP SK Bupati! Penyesuaian ditolak otomatis.')
      return
    }
    if (!formNama.trim() || numericFormHarga <= 0) {
      alert('Mohon isi nama komoditas dan harga jual dengan benar.')
      return
    }

    setSubmitting(true)
    try {
      await api.put(`/api/katalog/${selectedTokoId}`, {
        nama_material: formNama.trim(),
        harga_jual: numericFormHarga,
        satuan: formSatuan,
        stok_tersedia: formStok
      })
      setSaveSuccessMsg('Data komoditas berhasil disinkronisasi ke katalog!')
      fetchKatalog(selectedTokoId)
      setTimeout(() => {
        setIsModalOpen(false)
        setSaveSuccessMsg('')
      }, 1200)
    } catch (err) {
      alert(err.response?.data?.detail || 'Gagal menyimpan perubahan katalog.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="sipaku-page" style={{ background: '#f8fafc', minHeight: '100vh', color: '#0f172a', paddingBottom: 60, fontFamily: 'var(--sans)' }}>
      <div className="sipaku-page-inner" style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 24px' }}>

        {/* ════════════ HEADER SHOWCASE & SPESIFIKASI ════════════ */}
        <div style={{ marginBottom: 28 }}>
          {/* Top Badges Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <span style={{
              background: '#0b1329',
              color: '#ffffff',
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: '0.04em',
              padding: '4px 10px',
              borderRadius: 6,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}>
              <IconLock size={12} color="#ffffff" />
              <span>SIPAKU MERCHANT SUITE</span>
            </span>
            <span style={{
              background: '#e0f2fe',
              color: '#0369a1',
              fontSize: 10.5,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid #bae6fd'
            }}>
              DPU BMCK &amp; ASOSIASI PANGKALAN
            </span>
            <span style={{
              background: '#dcfce7',
              color: '#15803d',
              fontSize: 10.5,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid #bbf7d0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5
            }}>
              <IconCheck size={12} color="#15803d" />
              <span>INTEGRASI E-KATALOG DESA</span>
            </span>
            <span style={{
              background: '#ffedd5',
              color: '#c2410c',
              fontSize: 10.5,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid #fed7aa',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5
            }}>
              <IconFileText size={12} color="#c2410c" />
              <span>DOKUMEN RESMI</span>
            </span>
          </div>

          {/* Title & Subtitle */}
          <h1 className="sipaku-page-title" style={{
            fontSize: 24,
            fontWeight: 850,
            color: '#0f172a',
            margin: '0 0 8px',
            letterSpacing: '-0.02em',
            lineHeight: 1.25
          }}>
            Dasbor Operasional Penjual &amp; Katalog Toko
          </h1>
          <p style={{
            color: '#64748b',
            fontSize: 13,
            margin: 0,
            lineHeight: 1.55,
            maxWidth: 1080
          }}>
            Portal resmi mitra pangkalan dan toko bahan bangunan Kabupaten Lamongan. Kelola etalase komoditas, lakukan penyesuaian harga riil sesuai HAP Pemkab Lamongan, dan aktifkan integrasi pengadaan APBDes.
          </p>

          {/* 3 Info Highlights Pill Bar */}
          <div className="penjual-highlight-grid">
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}>
              <div style={{
                background: '#eff6ff',
                color: '#2563eb',
                width: 36,
                height: 36,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <IconUsers size={18} color="#2563eb" />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  TARGET PENGGUNA
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', marginTop: 1 }}>
                  Pangkalan &amp; Toko Material se-27 Kecamatan Lamongan
                </div>
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}>
              <div style={{
                background: '#f0fdf4',
                color: '#16a34a',
                width: 36,
                height: 36,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <IconShield size={18} color="#16a34a" />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  FITUR FOKUS
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', marginTop: 1 }}>
                  Katalog Toko &amp; Guardrail HET Mandiri <span style={{ fontWeight: 500, color: '#64748b', fontSize: 11 }}>(Enforcement Dinas PU)</span>
                </div>
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}>
              <div style={{
                background: '#f0fdfa',
                color: '#0d9488',
                width: 36,
                height: 36,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <IconRefresh size={18} color="#0d9488" />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  STATUS INTEGRASI
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', marginTop: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
                  Live Staging E-Katalog APBDes
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════ MAIN 2-COLUMN WORKSPACE ════════════ */}
        {/* ════════════ MAIN WORKSPACE (RESPONSIVE GRID) ════════════ */}
        <div className="penjual-main-grid">

          {/* ════════════ LEFT COLUMN: DESKTOP MOCKUP PRATINJAU ════════════ */}
          <div>
            {/* Header Panel Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <IconDesktop size={17} color="#0284c7" />
                <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Panel Interaktif Pengelolaan Toko &amp; Etalase
                </h2>
              </div>
              <span style={{
                background: '#e0f2fe',
                color: '#0284c7',
                fontSize: 10,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 4,
                border: '1px solid #bae6fd',
                flexShrink: 0
              }}>
                LIVE WORKSPACE
              </span>
            </div>

            {/* Desktop Mockup Browser Container */}
            <div className="penjual-browser-container">
              {/* Browser Chrome Header */}
              <div className="penjual-browser-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flexShrink: 0 }}>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}></span>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}></span>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                  </div>
                  <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, display: 'inline-block', whiteSpace: 'nowrap' }}>
                    Portal Mitra Bisnis SIPAKU
                  </span>
                </div>

                <div className="penjual-browser-url">
                  <IconLock size={11} color="#94a3b8" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    https://sipaku.lamongankab.go.id/seller/katalog?store_id=LM-088
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', flexShrink: 0 }}>
                  <span style={{ width: 12, height: 1, background: '#64748b', display: 'inline-block' }}></span>
                  <span style={{ width: 8, height: 8, border: '1px solid #64748b', display: 'inline-block' }}></span>
                </div>
              </div>

              {/* Browser Body Inner Content */}
              <div className="penjual-browser-body">

                {/* ── STORE PROFILE HEADER ── */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 16,
                  paddingBottom: 20,
                  borderBottom: '1px solid #f1f5f9'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 52,
                      height: 52,
                      background: '#eff6ff',
                      borderRadius: 12,
                      border: '1px solid #dbeafe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2563eb',
                      flexShrink: 0
                    }}>
                      <IconStore size={26} color="#2563eb" />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                          {tokoAktif?.nama_toko || 'TB Makmur Jaya Babat'}
                        </h3>
                        <span style={{
                          background: '#dcfce7',
                          color: '#15803d',
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 4,
                          border: '1px solid #bbf7d0',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          <IconCheck size={11} color="#15803d" />
                          <span>TOKO AMANAH BMCK</span>
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span>NIB: <strong>9120034182</strong></span>
                        <span>•</span>
                        <span>Wilayah: <strong>Kec. {tokoAktif?.nama_kecamatan || 'Babat'}, Kab. Lamongan</strong></span>
                        <span>•</span>
                        <span style={{ color: '#0284c7', fontWeight: 600 }}>Aktif Sejak Nov 2023</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Switcher */}
                  <div className="penjual-store-actions">
                    {daftarToko.length > 1 && (
                      <select
                        value={selectedTokoId}
                        onChange={(e) => setSelectedTokoId(Number(e.target.value))}
                        title="Pilih Toko untuk Simulasi Dasbor"
                        style={{
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: 8,
                          padding: '7px 10px',
                          fontSize: 12,
                          color: '#334155',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {daftarToko.map((t) => (
                          <option key={t.id_toko} value={t.id_toko}>
                            {t.nama_toko} ({t.nama_kecamatan || 'Lamongan'})
                          </option>
                        ))}
                      </select>
                    )}

                    <button
                      onClick={handleSinkronisasi}
                      disabled={refreshing}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: 8,
                        padding: '7px 12px',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer'
                      }}
                    >
                      <IconRefresh size={13} color="#334155" style={{ transform: refreshing ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s' }} />
                      <span>{refreshing ? 'Sinkronisasi...' : 'Sinkronisasi E-Katalog'}</span>
                    </button>

                    <button
                      onClick={openAddModal}
                      style={{
                        background: '#0f172a',
                        border: 'none',
                        borderRadius: 8,
                        padding: '7px 14px',
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer'
                      }}
                    >
                      <IconPlus size={13} color="#ffffff" />
                      <span>Tambah Komoditas</span>
                    </button>
                  </div>
                </div>

                {/* ── 3 METRICS STATS CARDS (RESPONSIVE) ── */}
                <div className="penjual-metrics-grid">
                  {/* Metric 1 */}
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: '14px 16px',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        TOTAL KOMODITAS
                      </div>
                      <IconPackage size={18} color="#64748b" />
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 850, color: '#0f172a', margin: '4px 0' }}>
                      {totalItem} <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>Item</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <IconCheck size={12} color="#16a34a" />
                      <span>100% Terverifikasi Standar SNI</span>
                    </div>
                  </div>

                  {/* Metric 2 */}
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: '14px 16px',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        INDEKS KEPATUHAN HET
                      </div>
                      <IconScale size={18} color="#d97706" />
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 850, color: '#0f172a', margin: '4px 0' }}>
                      {kepatuhanPersen}%
                    </div>
                    <div style={{ fontSize: 11, color: '#b45309', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <IconScale size={12} color="#b45309" />
                      <span>{violatingItems === 0 ? 'Nol Pelanggaran Batas Atas HAP' : `${violatingItems} Item Melebihi HAP`}</span>
                    </div>
                  </div>

                  {/* Metric 3 */}
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: '14px 16px',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        STATUS E-KATALOG DESA
                      </div>
                      <IconCart size={18} color="#0f766e" />
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 850, color: '#0f766e', margin: '4px 0' }}>
                      Terhubung
                    </div>
                    <div style={{ fontSize: 11, color: '#0f766e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <IconCart size={12} color="#0f766e" />
                      <span>24 Transaksi TPK Bulan Berjalan</span>
                    </div>
                  </div>
                </div>

                {/* ── FILTER TABS & SEARCH BAR ── */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                  marginBottom: 16
                }}>
                  {/* Category Chips */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[
                      { key: 'Semua', label: `Semua (${totalItem})` },
                      { key: 'Semen & Pengikat', label: 'Semen & Pengikat' },
                      { key: 'Besi & Baja', label: 'Besi & Baja' },
                      { key: 'Agregat & Pasir', label: 'Agregat & Pasir' },
                      { key: 'Bata & Dinding', label: 'Bata & Dinding' },
                      { key: 'Kayu & Lainnya', label: 'Lainnya' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => { setActiveKategoriTab(tab.key); setCurrentPage(1) }}
                        style={{
                          background: activeKategoriTab === tab.key ? '#0f172a' : '#f1f5f9',
                          color: activeKategoriTab === tab.key ? '#ffffff' : '#475569',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 12px',
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Search Input */}
                  <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180, maxWidth: '100%' }}>
                    <input
                      type="text"
                      placeholder="Cari nama bahan/SNI..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                      style={{
                        width: '100%',
                        padding: '7px 32px 7px 12px',
                        borderRadius: 8,
                        border: '1px solid #cbd5e1',
                        fontSize: 12.5,
                        color: '#0f172a',
                        background: '#ffffff',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', pointerEvents: 'none' }}>
                      <IconSearch size={14} color="#94a3b8" />
                    </span>
                  </div>
                </div>

                {/* ── TABLE KATALOG HARGA & GUARDRAIL ── */}
                <div style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  overflowX: 'auto',
                  background: '#ffffff'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                        <th style={{ padding: '10px 14px', fontWeight: 700, fontSize: 10.5, letterSpacing: '0.03em' }}>
                          NAMA KOMODITAS &amp; SPESIFIKASI SNI
                        </th>
                        <th style={{ padding: '10px 14px', fontWeight: 700, fontSize: 10.5, letterSpacing: '0.03em' }}>
                          SATUAN
                        </th>
                        <th style={{ padding: '10px 14px', fontWeight: 700, fontSize: 10.5, letterSpacing: '0.03em' }}>
                          HARGA TOKO (RIIL)
                        </th>
                        <th style={{ padding: '10px 14px', fontWeight: 700, fontSize: 10.5, letterSpacing: '0.03em' }}>
                          BATAS HAP PU
                        </th>
                        <th style={{ padding: '10px 14px', fontWeight: 700, fontSize: 10.5, letterSpacing: '0.03em' }}>
                          STATUS GUARDRAIL HAP
                        </th>
                        <th style={{ padding: '10px 14px', fontWeight: 700, fontSize: 10.5, letterSpacing: '0.03em', textAlign: 'center' }}>
                          AKSI
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
                            Memuat data katalog toko dan guardrail HAP...
                          </td>
                        </tr>
                      ) : displayedKatalog.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
                            Tidak ada komoditas yang cocok dengan filter atau pencarian.
                          </td>
                        </tr>
                      ) : (
                        displayedKatalog.map((item, idx) => (
                          <tr
                            key={item.id_katalog || idx}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              background: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                            }}
                          >
                            <td style={{ padding: '11px 14px' }}>
                              <div style={{ fontWeight: 750, color: '#0f172a', fontSize: 13 }}>
                                {item.nama_material}
                              </div>
                              <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>
                                {item.sniSpec}
                              </div>
                            </td>

                            <td style={{ padding: '11px 14px', color: '#334155', fontWeight: 600 }}>
                              {item.satuan ? item.satuan.charAt(0).toUpperCase() + item.satuan.slice(1) : '-'}
                            </td>

                            <td style={{ padding: '11px 14px', fontWeight: 800, color: '#0f172a' }}>
                              Rp {Number(item.harga_jual).toLocaleString('id-ID')}
                            </td>

                            <td style={{ padding: '11px 14px', color: '#64748b', fontWeight: 600 }}>
                              Rp {Number(item.batasHap).toLocaleString('id-ID')}
                            </td>

                            <td style={{ padding: '11px 14px' }}>
                              {item.statusGuardrail === 'sesuai' && (
                                <span style={{
                                  background: '#dcfce7',
                                  color: '#15803d',
                                  fontSize: 10.5,
                                  fontWeight: 750,
                                  padding: '3px 8px',
                                  borderRadius: 4,
                                  border: '1px solid #bbf7d0',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5
                                }}>
                                  <IconShield size={11} color="#15803d" />
                                  <span>{item.badgeLabel}</span>
                                </span>
                              )}
                              {item.statusGuardrail === 'presisi' && (
                                <span style={{
                                  background: '#fef3c7',
                                  color: '#b45309',
                                  fontSize: 10.5,
                                  fontWeight: 750,
                                  padding: '3px 8px',
                                  borderRadius: 4,
                                  border: '1px solid #fde68a',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}>
                                  <span style={{ fontSize: 9 }}>▲</span> Presisi HAP
                                </span>
                              )}
                              {item.statusGuardrail === 'overpricing' && (
                                <span style={{
                                  background: '#fee2e2',
                                  color: '#b91c1c',
                                  fontSize: 10.5,
                                  fontWeight: 750,
                                  padding: '3px 8px',
                                  borderRadius: 4,
                                  border: '1px solid #fecaca',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5
                                }}>
                                  <IconAlertTriangle size={11} color="#b91c1c" />
                                  <span>Melebihi HAP (+{item.persenDiff}%)</span>
                                </span>
                              )}
                            </td>

                            <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                              <button
                                onClick={() => openEditModal(item)}
                                style={{
                                  background: '#f0f9ff',
                                  border: '1px solid #bae6fd',
                                  color: '#0284c7',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '4px 10px',
                                  borderRadius: 5,
                                  cursor: 'pointer'
                                }}
                              >
                                Ubah
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                  marginTop: 12,
                  padding: '8px 4px',
                  fontSize: 11.5,
                  color: '#64748b'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Status Publikasi E-Katalog :</span>
                    <strong style={{ color: '#0f172a' }}>
                      Aktif di 14 Desa Sekitar Kec. {tokoAktif?.nama_kecamatan || 'Babat'} &amp; Pucuk
                    </strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span>Halaman {currentPage} dari {totalPages}</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: 4,
                          padding: '2px 8px',
                          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                          color: currentPage === 1 ? '#cbd5e1' : '#334155'
                        }}
                      >
                        &lt;
                      </button>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: 4,
                          padding: '2px 8px',
                          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                          color: currentPage === totalPages ? '#cbd5e1' : '#334155'
                        }}
                      >
                        &gt;
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── NOTICE BOX GUARDRAIL ── */}
                <div style={{
                  background: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: 10,
                  padding: '12px 16px',
                  marginTop: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, maxWidth: 560 }}>
                    <div style={{
                      background: '#ffedd5',
                      color: '#ea580c',
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <IconShield size={18} color="#ea580c" />
                    </div>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: '#9a3412' }}>
                        Mekanisme Real-Time HAP Guardrail
                      </div>
                      <div style={{ fontSize: 11, color: '#9a3412', marginTop: 2, lineHeight: 1.4 }}>
                        Apabila toko memasukkan harga di atas batas SK Bupati (misal Semen PPC &gt; Rp 63.500), tombol simpan otomatis terkunci dan menampilkan peringatan audit.
                      </div>
                    </div>
                  </div>

                  <span style={{
                    background: '#ecfeff',
                    color: '#0e7490',
                    fontSize: 11,
                    fontWeight: 750,
                    padding: '5px 12px',
                    borderRadius: 6,
                    border: '1px solid #a5f3fc',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <IconLock size={12} color="#0e7490" />
                    <span>Overpricing Blocked: ON</span>
                  </span>
                </div>

              </div>{/* end browser body */}
            </div>{/* end browser container */}
          </div>

          {/* ════════════ RIGHT COLUMN: PILAR FITUR & ALUR PENJUAL ════════════ */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header Sidebar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconFileText size={16} color="#0f172a" />
                <h3 style={{ fontSize: 14.5, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Pilar Fitur &amp; Alur Penjual
                </h3>
              </div>
              <span style={{
                background: '#f1f5f9',
                color: '#475569',
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 4,
                border: '1px solid #e2e8f0'
              }}>
                BMCK SPECS
              </span>
            </div>

            {/* FITUR 01 CARD */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '16px 18px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{
                  background: '#0f172a',
                  color: '#ffffff',
                  fontSize: 9.5,
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: 4,
                  letterSpacing: '0.04em'
                }}>
                  FITUR 01
                </span>
                <IconShield size={18} color="#b45309" />
              </div>
              <h4 style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                Guardrail HET Otomatis &amp; Validasi SK Bupati
              </h4>
              <p style={{ fontSize: 11.5, color: '#64748b', margin: '0 0 10px', lineHeight: 1.5 }}>
                Penjual terhindar dari sanksi overpricing dan diskualifikasi tender publik karena sistem menolak secara otomatis input harga komoditas di atas pagu HAP Dinas PU Lamongan.
              </p>
              <div style={{ fontSize: 10.5, color: '#0284c7', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                <IconLock size={12} color="#0284c7" />
                <span>Proteksi Sanksi Pidana Tipikor APBDes</span>
              </div>
            </div>

            {/* FITUR 02 CARD */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '16px 18px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{
                  background: '#0f766e',
                  color: '#ffffff',
                  fontSize: 9.5,
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: 4,
                  letterSpacing: '0.04em'
                }}>
                  FITUR 02
                </span>
                <IconStore size={18} color="#0f766e" />
              </div>
              <h4 style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                Integrasi Pengadaan APBDes (E-Katalog Desa)
              </h4>
              <p style={{ fontSize: 11.5, color: '#64748b', margin: '0 0 10px', lineHeight: 1.5 }}>
                Mempermudah Tim Pengelola Kegiatan (TPK) desa langsung memilih toko terpercaya. Nota transaksi otomatis sinkron dengan format LPJ keuangan desa resmi.
              </p>
              <div style={{ fontSize: 10.5, color: '#0f766e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                <IconTrendingUp size={12} color="#0f766e" />
                <span>Peluang Omzet Pengadaan APBDes</span>
              </div>
            </div>

            {/* FITUR 03 CARD */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '16px 18px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{
                  background: '#c2410c',
                  color: '#ffffff',
                  fontSize: 9.5,
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: 4,
                  letterSpacing: '0.04em'
                }}>
                  FITUR 03
                </span>
                <IconAward size={18} color="#d97706" />
              </div>
              <h4 style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                Badge Toko Amanah &amp; Reputasi Bisnis
              </h4>
              <p style={{ fontSize: 11.5, color: '#64748b', margin: '0 0 10px', lineHeight: 1.5 }}>
                Sertifikasi kepatuhan berkala dari Dinas PU BMCK Lamongan meningkatkan daya tawar toko terhadap proyek infrastruktur swasta dan BUMDes.
              </p>
              <div style={{ fontSize: 10.5, color: '#b45309', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                <IconAward size={12} color="#b45309" />
                <span>Reputasi Akuntabel Inspektorat</span>
              </div>
            </div>

            {/* CARD ALUR OPERASIONAL TOKO */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '18px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <IconRefresh size={15} color="#0f172a" />
                <h4 style={{ fontSize: 13, fontWeight: 850, color: '#0f172a', margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                  ALUR OPERASIONAL TOKO
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: '#0f172a',
                    color: '#ffffff',
                    fontSize: 11,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    1
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 750, color: '#0f172a' }}>
                      Pendaftaran Komoditas SNI
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 1, lineHeight: 1.4 }}>
                      Pilih komoditas dari database baku dinas (Semen, Besi, Agregat).
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: '#0f172a',
                    color: '#ffffff',
                    fontSize: 11,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    2
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 750, color: '#0f172a' }}>
                      Penyesuaian Harga Riil Pasar
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 1, lineHeight: 1.4 }}>
                      Input harga jual toko berdasarkan modal dan logistik lokal.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: '#f59e0b',
                    color: '#ffffff',
                    fontSize: 11,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    3
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 750, color: '#0f172a' }}>
                      Validasi Guardrail Otomatis
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 1, lineHeight: 1.4 }}>
                      Sistem mencocokkan harga vs SK Bupati Lamongan secara instan.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: '#06b6d4',
                    color: '#ffffff',
                    fontSize: 11,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    4
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 750, color: '#0f172a' }}>
                      Publikasi E-Katalog APBDes
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 1, lineHeight: 1.4 }}>
                      Barang langsung tayang dan dapat dipesan oleh Tim Pelaksana Kegiatan (TPK) desa.
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </aside>
        </div>

        {/* ════════════ BOTTOM TECHNICAL ARCHITECTURE BANNER ════════════ */}
        <div style={{
          background: 'linear-gradient(135deg, #0b1329 0%, #111e3b 60%, #0d172e 100%)',
          borderRadius: 14,
          padding: '24px 28px',
          color: '#ffffff',
          border: '1px solid #1e293b',
          boxShadow: '0 12px 30px rgba(11, 19, 41, 0.4)',
          marginTop: 28
        }}>
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <IconCpu size={18} color="#38bdf8" />
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Karakteristik &amp; Arsitektur Teknis Integrasi SIPAKU Merchant
                </h3>
              </div>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, maxWidth: 840, lineHeight: 1.5 }}>
                Modul Katalog Penjual sengaja didesain ringan, bebas konfigurasi rumit NLP (karena NLP audit dikonsolidasikan terpusat di Server Dinas PU BMCK Lamongan) agar toko material tingkat kecamatan dapat mengoperasikannya melalui browser HP maupun komputer kasir sederhana.
              </p>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                background: '#1e293b',
                color: '#38bdf8',
                fontSize: 10.5,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid #334155',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}>
                <IconGlobe size={12} color="#38bdf8" />
                <span>REST API v2.4 JSON</span>
              </span>
              <span style={{
                background: '#1e293b',
                color: '#a7f3d0',
                fontSize: 10.5,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid #334155',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}>
                <IconFileText size={12} color="#a7f3d0" />
                <span>OCDS Format APBDes</span>
              </span>
              <span style={{
                background: '#1e293b',
                color: '#fed7aa',
                fontSize: 10.5,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid #334155',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}>
                <IconShield size={12} color="#fed7aa" />
                <span>ISO 37001 Anti-Bribery</span>
              </span>
            </div>
          </div>

          {/* 4 Technical Feature Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid #1e293b',
              borderRadius: 8,
              padding: '12px 14px'
            }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                PROTOKOL KEAMANAN DATA
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', marginTop: 4 }}>
                Enkripsi SHA-256 &amp; BSSN Validated
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid #1e293b',
              borderRadius: 8,
              padding: '12px 14px'
            }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                SINKRONISASI PAGU HAP
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', marginTop: 4 }}>
                Tiap Triwulan via SK Bupati
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid #1e293b',
              borderRadius: 8,
              padding: '12px 14px'
            }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                AKURASI VALIDASI HARGA
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
                Real-Time Zero Overpricing Block
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid #1e293b',
              borderRadius: 8,
              padding: '12px 14px'
            }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                PENGAWAS SISTEM
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', marginTop: 4 }}>
                Inspektorat &amp; DPU BMCK Lamongan
              </div>
            </div>
          </div>
        </div>

        {/* ════════════ OFFICIAL FOOTER SIPAKU ════════════ */}
        <footer style={{
          marginTop: 48,
          paddingTop: 32,
          borderTop: '1px solid #e2e8f0',
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
                  v2.4 STABLE
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
                <span>• Standar Harga Satuan HAP</span>
                <span>• Verifikasi Bukti Nota &amp; Invoice</span>
                <span>• Protokol Whistleblowing</span>
                <span>• Statistik Komoditas Wilayah</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
                PUSAT PENGADUAN
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
              © 2025 Pemerintah Kabupaten Lamongan. Dinas Pekerjaan Umum Bina Marga &amp; Cipta Karya. Hak Cipta Dilindungi.
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <span>Portal Civic Tech Terpadu</span>
              <span>•</span>
              <span>ISO 27001 Certified</span>
            </div>
          </div>
        </footer>

      </div>

      {/* ════════════ INTERACTIVE MODAL GUARDRAIL (UBAH / TAMBAH) ════════════ */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 14,
            width: '100%',
            maxWidth: 520,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              background: '#0f172a',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#ffffff'
            }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>
                  {modalMode === 'edit' ? 'Ubah Harga Komoditas Toko' : 'Tambah Komoditas Baru ke Etalase'}
                </h3>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                  Toko: <strong>{tokoAktif?.nama_toko}</strong> • Validasi Guardrail Mandiri
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  padding: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <IconX size={18} color="#94a3b8" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitModal} style={{ padding: 20 }}>
              {saveSuccessMsg && (
                <div style={{
                  background: '#dcfce7',
                  color: '#15803d',
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 700,
                  marginBottom: 14,
                  border: '1px solid #bbf7d0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <IconCheck size={14} color="#15803d" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {/* Input Nama Material */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Nama Komoditas (SNI)
                </label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Semen Gresik PPC 50kg, Besi Beton 10mm SNI"
                  disabled={modalMode === 'edit'}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    fontSize: 13,
                    background: modalMode === 'edit' ? '#f8fafc' : '#ffffff',
                    color: '#0f172a'
                  }}
                />
                <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 3 }}>
                  Spesifikasi: {getSNISpec(formNama)}
                </div>
              </div>

              {/* Input Satuan */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Satuan Material
                </label>
                <select
                  value={formSatuan}
                  onChange={(e) => setFormSatuan(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    fontSize: 13,
                    background: '#ffffff',
                    color: '#0f172a'
                  }}
                >
                  <option value="zak">Zak</option>
                  <option value="batang">Batang</option>
                  <option value="m3">M³</option>
                  <option value="biji">Biji / Buah</option>
                  <option value="pail">Pail / Kaleng</option>
                  <option value="dus">Dus</option>
                  <option value="kg">Kg</option>
                </select>
              </div>

              {/* Input Harga Jual Toko */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155' }}>
                    Harga Jual Toko (Riil)
                  </label>
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                    Batas Pagu HAP: <strong style={{ color: '#0f172a' }}>Rp {modalBatasHAP.toLocaleString('id-ID')}</strong>
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#64748b', fontSize: 13 }}>
                    Rp
                  </span>
                  <input
                    type="number"
                    value={formHarga}
                    onChange={(e) => setFormHarga(e.target.value)}
                    placeholder="Masukkan harga riil toko..."
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 36px',
                      borderRadius: 6,
                      border: isOverpricingModal ? '2px solid #ef4444' : '1px solid #cbd5e1',
                      fontSize: 14,
                      fontWeight: 700,
                      color: isOverpricingModal ? '#b91c1c' : '#0f172a',
                      background: isOverpricingModal ? '#fef2f2' : '#ffffff'
                    }}
                  />
                </div>
              </div>

              {/* ── REAL-TIME GUARDRAIL WARNING BOX ── */}
              {isOverpricingModal ? (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  padding: '12px 14px',
                  marginBottom: 18,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10
                }}>
                  <IconAlertTriangle size={20} color="#b91c1c" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#b91c1c' }}>
                      OVERPRICING TERDETEKSI! (+{modalPersenDiff}%)
                    </div>
                    <div style={{ fontSize: 11, color: '#991b1b', marginTop: 2, lineHeight: 1.4 }}>
                      Harga <strong>Rp {numericFormHarga.toLocaleString('id-ID')}</strong> melebihi Batas Tertinggi HAP SK Bupati (Rp {modalBatasHAP.toLocaleString('id-ID')}).
                      Sistem mengunci tombol simpan untuk menjaga integritas pengadaan APBDes dan mencegah sanksi diskualifikasi.
                    </div>
                  </div>
                </div>
              ) : numericFormHarga > 0 ? (
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 8,
                  padding: '10px 14px',
                  marginBottom: 18,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}>
                  <IconCheck size={16} color="#166534" />
                  <div style={{ fontSize: 11.5, color: '#166534', fontWeight: 600 }}>
                    Harga aman dan mematuhi batas HAP SK Bupati ({modalPersenDiff}% di bawah HAP). Guardrail Valid!
                  </div>
                </div>
              ) : null}

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isOverpricingModal || submitting}
                  style={{
                    background: isOverpricingModal ? '#ef4444' : '#0f172a',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 18px',
                    fontSize: 12,
                    fontWeight: 750,
                    color: '#ffffff',
                    cursor: isOverpricingModal || submitting ? 'not-allowed' : 'pointer',
                    opacity: isOverpricingModal ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {submitting ? (
                    'Menyimpan...'
                  ) : isOverpricingModal ? (
                    <>
                      <IconLock size={12} color="#ffffff" />
                      <span>Simpan Terkunci (Overpricing)</span>
                    </>
                  ) : (
                    <>
                      <IconCheck size={12} color="#ffffff" />
                      <span>Simpan Penyesuaian Harga</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
