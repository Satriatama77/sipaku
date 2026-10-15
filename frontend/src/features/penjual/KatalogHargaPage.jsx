import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
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
  IconEdit,
  IconLock,
  IconAlertTriangle,
  IconTruck,
  IconX
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

export default function KatalogHargaPage() {
  const { user } = useAuth()

  // State Data Toko & Katalog
  const [daftarToko, setDaftarToko] = useState([])
  const [selectedTokoId, setSelectedTokoId] = useState(2) // Default TB Berkah Abadi / match user
  const [tokoAktif, setTokoAktif] = useState(null)
  const [katalog, setKatalog] = useState([])
  const [sshData, setSshData] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [activeKategoriTab, setActiveKategoriTab] = useState('Semua')
  const [filterStok, setFilterStok] = useState('semua') // 'semua' | 'tersedia' | 'kosong'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('edit')
  const [formNama, setFormNama] = useState('')
  const [formHarga, setFormHarga] = useState('')
  const [formSatuan, setFormSatuan] = useState('zak')
  const [formStok, setFormStok] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('')

  // 1. Fetch Toko & Data SSH
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
        matched = listToko.find((t) => t.id_toko === 2) || listToko[0]
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

  // 4. SNI Spec & Kategori
  const getSNISpec = (namaMaterial) => {
    if (!namaMaterial) return 'Standar Industri Indonesia (SII / SNI Terdaftar)'
    const lower = namaMaterial.toLowerCase().trim()
    for (const [key, spec] of Object.entries(SNI_SPECS)) {
      if (lower.includes(key) || key.includes(lower)) return spec
    }
    return 'Standar Konstruksi Dinas PU Bina Marga Kab. Lamongan'
  }

  const getKategoriMaterial = (namaMaterial) => {
    const lower = (namaMaterial || '').toLowerCase()
    if (lower.includes('semen')) return 'Semen & Pengikat'
    if (lower.includes('besi') || lower.includes('baja') || lower.includes('wiremesh')) return 'Besi & Baja'
    if (lower.includes('pasir') || lower.includes('kerikil') || lower.includes('agregat') || lower.includes('batu pecah')) return 'Agregat & Pasir'
    if (lower.includes('bata') || lower.includes('batako') || lower.includes('genteng')) return 'Bata & Dinding'
    return 'Kayu & Lainnya'
  }

  // 5. Enriched Katalog Data
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

  // Metrik Statistik
  const totalItem = enrichedKatalog.length
  const violatingItems = enrichedKatalog.filter((x) => x.harga_jual > x.batasHap).length
  const tersediaCount = enrichedKatalog.filter((x) => x.stok_tersedia).length
  const kepatuhanPersen = totalItem > 0 ? (((totalItem - violatingItems) / totalItem) * 100).toFixed(1) : '100.0'

  // Filter & Search Result
  const filteredKatalog = useMemo(() => {
    return enrichedKatalog.filter((item) => {
      const matchSearch = item.nama_material.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sniSpec.toLowerCase().includes(searchQuery.toLowerCase())
      const matchKategori = activeKategoriTab === 'Semua' || item.kategori === activeKategoriTab
      const matchStok = filterStok === 'semua'
        ? true
        : filterStok === 'tersedia'
        ? Boolean(item.stok_tersedia)
        : !item.stok_tersedia

      return matchSearch && matchKategori && matchStok
    })
  }, [enrichedKatalog, searchQuery, activeKategoriTab, filterStok])

  // Modal Handlers
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
      alert('Sistem Guardrail: Harga melebihi Batas Atas HAP SK Bupati! Penyesuaian ditolak.')
      return
    }
    if (!formNama.trim() || numericFormHarga <= 0) {
      alert('Mohon isi nama material dan harga jual yang valid.')
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
      setSaveSuccessMsg('Data komoditas berhasil diperbarui ke database!')
      fetchKatalog(selectedTokoId)
      setTimeout(() => {
        setIsModalOpen(false)
        setSaveSuccessMsg('')
      }, 1000)
    } catch (err) {
      alert(err.response?.data?.detail || 'Gagal menyimpan perubahan katalog.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="sipaku-page" style={{ background: '#f8fafc', minHeight: '100vh', color: '#0f172a', paddingBottom: 60, fontFamily: 'var(--sans)' }}>
      <div className="sipaku-page-inner" style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 24px' }}>

        {/* ── BREADCRUMB & HEADER 1 HALAMAN PENUH ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 12, color: '#64748b' }}>
              <Link to="/penjual" style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}>Beranda</Link>
              <span>/</span>
              <span style={{ color: '#0f172a', fontWeight: 700 }}>Katalog Harga Toko</span>
            </div>
            <h1 className="sipaku-page-title" style={{ fontSize: 24, fontWeight: 850, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
              Katalog Komoditas &amp; Etalase Harga Toko
            </h1>
            <p style={{ color: '#64748b', fontSize: 13.5, margin: 0 }}>
              Kelola daftar material, penyesuaian harga riil pasar, dan status ketersediaan barang dengan validasi otomatis Guardrail HAP Dinas PU Lamongan.
            </p>
          </div>

          {/* Store Switcher & Refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {daftarToko.length > 1 && (
              <select
                value={selectedTokoId}
                onChange={(e) => setSelectedTokoId(Number(e.target.value))}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: '#334155',
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
              onClick={() => { setRefreshing(true); fetchKatalog(selectedTokoId) }}
              disabled={refreshing}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 12.5,
                fontWeight: 600,
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer'
              }}
            >
              <IconRefresh size={13} color="#334155" style={{ transform: refreshing ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s' }} />
              <span>{refreshing ? 'Memuat...' : 'Refresh'}</span>
            </button>

            <button
              onClick={openAddModal}
              style={{
                background: '#0f172a',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 12.5,
                fontWeight: 750,
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

        {/* ── PROFILE TOKO BANNER (LEBAR 100%) ── */}
        <div style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          padding: '16px 20px',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48,
              height: 48,
              background: '#eff6ff',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb',
              border: '1px solid #dbeafe',
              flexShrink: 0
            }}>
              <IconStore size={24} color="#2563eb" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {tokoAktif?.nama_toko || 'TB Berkah Abadi'}
                </h2>
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
                  <span>PANGKALAN TERDAFTAR RESMI BMCK</span>
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 3, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span>Pemilik: <strong>{tokoAktif?.nama_pemilik || '-'}</strong></span>
                <span>•</span>
                <span>Wilayah: <strong>Kec. {tokoAktif?.nama_kecamatan || 'Lamongan'}, Kab. Lamongan</strong></span>
                <span>•</span>
                <span>ID Toko: <strong>LM-00{tokoAktif?.id_toko || '2'}</strong></span>
              </div>
            </div>
          </div>

          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 12,
            color: '#334155',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <div>
              <span style={{ color: '#64748b' }}>Status Guardrail: </span>
              <strong style={{ color: '#16a34a' }}>● Real-Time Active</strong>
            </div>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <div>
              <span style={{ color: '#64748b' }}>E-Katalog Desa: </span>
              <strong style={{ color: '#0284c7' }}>Terhubung TPK</strong>
            </div>
          </div>
        </div>

        {/* ── 4 RINGKASAN METRIK TOKO (LEBAR 100%) ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 20
        }}>
          {/* Card 1 */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 18px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Komoditas</span>
              <IconPackage size={18} color="#64748b" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 850, color: '#0f172a', margin: '4px 0' }}>
              {totalItem} <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Jenis Material</span>
            </div>
            <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <IconCheck size={12} color="#16a34a" />
              <span>Terdaftar di Database Resmi Dinas PU</span>
            </div>
          </div>

          {/* Card 2 */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 18px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Kepatuhan Pagu HAP</span>
              <IconScale size={18} color="#64748b" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 850, color: '#0f172a', margin: '4px 0' }}>
              {kepatuhanPersen}%
            </div>
            <div style={{ fontSize: 11, color: violatingItems === 0 ? '#16a34a' : '#b91c1c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              {violatingItems === 0 ? (
                <>
                  <IconCheck size={12} color="#16a34a" />
                  <span>Nol Pelanggaran Batas Atas HAP</span>
                </>
              ) : (
                <>
                  <IconAlertTriangle size={12} color="#b91c1c" />
                  <span>{violatingItems} Item Melebihi Batas HAP</span>
                </>
              )}
            </div>
          </div>

          {/* Card 3 */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 18px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Stok Siap Kirim</span>
              <IconTruck size={18} color="#0f766e" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 850, color: '#0f766e', margin: '4px 0' }}>
              {tersediaCount} <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Material Tersedia</span>
            </div>
            <div style={{ fontSize: 11, color: '#0f766e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <IconCart size={12} color="#0f766e" />
              <span>Siap dipesan TPK Proyek Desa</span>
            </div>
          </div>

          {/* Card 4 */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 18px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Proteksi Overpricing</span>
              <IconShield size={18} color="#0284c7" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 850, color: '#0284c7', margin: '4px 0' }}>
              Aktif (ON)
            </div>
            <div style={{ fontSize: 11, color: '#0284c7', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <IconLock size={12} color="#0284c7" />
              <span>Pencegahan Pidana Tipikor APBDes</span>
            </div>
          </div>
        </div>

        {/* ── FILTER CHIPS, SEARCH & STATUS BAR (LEBAR 100%) ── */}
        <div style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          padding: '16px 20px',
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14
        }}>
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { key: 'Semua', label: `Semua Material (${totalItem})` },
              { key: 'Semen & Pengikat', label: 'Semen & Pengikat' },
              { key: 'Besi & Baja', label: 'Besi & Baja' },
              { key: 'Agregat & Pasir', label: 'Agregat & Pasir' },
              { key: 'Bata & Dinding', label: 'Bata & Dinding' },
              { key: 'Kayu & Lainnya', label: 'Lainnya' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveKategoriTab(tab.key)}
                style={{
                  background: activeKategoriTab === tab.key ? '#0f172a' : '#f1f5f9',
                  color: activeKategoriTab === tab.key ? '#ffffff' : '#475569',
                  border: 'none',
                  borderRadius: 6,
                  padding: '7px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Stock Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <select
              value={filterStok}
              onChange={(e) => setFilterStok(e.target.value)}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: 12,
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              <option value="semua">Semua Status Stok</option>
              <option value="tersedia">Hanya Tersedia</option>
              <option value="kosong">Hanya Kosong</option>
            </select>

            <div style={{ position: 'relative', width: 240 }}>
              <input
                type="text"
                placeholder="Cari material / spesifikasi SNI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 32px 7px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 12.5,
                  color: '#0f172a',
                  outline: 'none'
                }}
              />
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
                <IconSearch size={14} color="#94a3b8" />
              </span>
            </div>
          </div>
        </div>

        {/* ── TABEL FULL-WIDTH KATALOG TOKO (1 HALAMAN PENUH) ── */}
        <div style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 750, fontSize: 11, letterSpacing: '0.04em' }}>
                    NAMA KOMODITAS &amp; SPESIFIKASI SNI
                  </th>
                  <th style={{ padding: '12px 14px', fontWeight: 750, fontSize: 11, letterSpacing: '0.04em' }}>
                    KATEGORI
                  </th>
                  <th style={{ padding: '12px 14px', fontWeight: 750, fontSize: 11, letterSpacing: '0.04em' }}>
                    SATUAN
                  </th>
                  <th style={{ padding: '12px 16px', fontWeight: 750, fontSize: 11, letterSpacing: '0.04em' }}>
                    HARGA TOKO (RIIL)
                  </th>
                  <th style={{ padding: '12px 16px', fontWeight: 750, fontSize: 11, letterSpacing: '0.04em' }}>
                    BATAS HAP PU
                  </th>
                  <th style={{ padding: '12px 16px', fontWeight: 750, fontSize: 11, letterSpacing: '0.04em' }}>
                    STATUS GUARDRAIL
                  </th>
                  <th style={{ padding: '12px 14px', fontWeight: 750, fontSize: 11, letterSpacing: '0.04em' }}>
                    STATUS STOK
                  </th>
                  <th style={{ padding: '12px 16px', fontWeight: 750, fontSize: 11, letterSpacing: '0.04em', textAlign: 'center' }}>
                    AKSI
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                      Memuat katalog komoditas toko...
                    </td>
                  </tr>
                ) : filteredKatalog.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>Tidak ada komoditas yang cocok</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>Coba ubah kata kunci pencarian atau filter kategori.</div>
                    </td>
                  </tr>
                ) : (
                  filteredKatalog.map((item, idx) => (
                    <tr
                      key={item.id_katalog || idx}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* Nama & Spesifikasi */}
                      <td style={{ padding: '13px 18px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 13.5 }}>
                          {item.nama_material}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                          {item.sniSpec}
                        </div>
                      </td>

                      {/* Kategori */}
                      <td style={{ padding: '13px 14px', color: '#475569', fontSize: 12 }}>
                        <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>
                          {item.kategori}
                        </span>
                      </td>

                      {/* Satuan */}
                      <td style={{ padding: '13px 14px', color: '#334155', fontWeight: 600 }}>
                        {item.satuan ? item.satuan.charAt(0).toUpperCase() + item.satuan.slice(1) : '-'}
                      </td>

                      {/* Harga Jual Toko */}
                      <td style={{ padding: '13px 16px', fontWeight: 850, color: '#0f172a', fontSize: 14 }}>
                        Rp {Number(item.harga_jual).toLocaleString('id-ID')}
                      </td>

                      {/* Batas HAP PU */}
                      <td style={{ padding: '13px 16px', color: '#64748b', fontWeight: 600, fontSize: 13 }}>
                        Rp {Number(item.batasHap).toLocaleString('id-ID')}
                      </td>

                      {/* Status Guardrail HAP */}
                      <td style={{ padding: '13px 16px' }}>
                        {item.statusGuardrail === 'sesuai' && (
                          <span style={{
                            background: '#dcfce7',
                            color: '#15803d',
                            fontSize: 11,
                            fontWeight: 750,
                            padding: '3px 9px',
                            borderRadius: 5,
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
                            fontSize: 11,
                            fontWeight: 750,
                            padding: '3px 9px',
                            borderRadius: 5,
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
                            fontSize: 11,
                            fontWeight: 750,
                            padding: '3px 9px',
                            borderRadius: 5,
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

                      {/* Status Stok */}
                      <td style={{ padding: '13px 14px' }}>
                        <span style={{
                          color: item.stok_tersedia ? '#16a34a' : '#ef4444',
                          fontWeight: 700,
                          fontSize: 12,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5
                        }}>
                          {item.stok_tersedia ? '● Tersedia' : '○ Habis'}
                        </span>
                      </td>

                      {/* Aksi Ubah */}
                      <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => openEditModal(item)}
                          style={{
                            background: '#0f172a',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: 11.5,
                            fontWeight: 700,
                            padding: '6px 14px',
                            borderRadius: 6,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5
                          }}
                        >
                          <IconEdit size={12} color="#ffffff" />
                          <span>Ubah</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Bottom Meta Bar */}
          <div style={{
            padding: '12px 18px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
            color: '#64748b',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div>
              Menampilkan <strong>{filteredKatalog.length}</strong> dari total <strong>{totalItem}</strong> komoditas terdaftar di toko ini.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Standar Pagu HAP Berdasarkan:</span>
              <strong style={{ color: '#0f172a' }}>SK Bupati Lamongan Triwulan Berjalan</strong>
            </div>
          </div>
        </div>

        {/* ── NOTICE BOX GUARDRAIL 1 HALAMAN PENUH ── */}
        <div style={{
          background: '#fff7ed',
          border: '1px solid #fed7aa',
          borderRadius: 12,
          padding: '14px 20px',
          marginTop: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 840 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: '#ffedd5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <IconShield size={20} color="#ea580c" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#9a3412' }}>
                Proteksi Hukum &amp; Kepatuhan Tender APBDes
              </div>
              <div style={{ fontSize: 11.5, color: '#9a3412', marginTop: 2, lineHeight: 1.4 }}>
                Sistem SIPAKU menjaga etalase toko Anda tetap memenuhi pagu HAP. Toko yang mematuhi batas harga secara konsisten memperoleh status prioritas pengadaan langsung untuk proyek desa dan sertifikasi mitra amanah dari Dinas PU BMCK.
              </div>
            </div>
          </div>

          <span style={{
            background: '#ffffff',
            color: '#ea580c',
            fontSize: 11.5,
            fontWeight: 800,
            padding: '6px 14px',
            borderRadius: 6,
            border: '1px solid #fed7aa'
          }}>
            Terhubung E-Katalog 27 Kecamatan
          </span>
        </div>

      </div>

      {/* ── MODAL UBAH / TAMBAH DENGAN GUARDRAIL ── */}
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
            {/* Header */}
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
                  {modalMode === 'edit' ? 'Ubah Harga & Stok Komoditas' : 'Tambah Komoditas Baru ke Toko'}
                </h3>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                  Toko: <strong>{tokoAktif?.nama_toko}</strong> • Validasi Guardrail Otomatis
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

            {/* Form */}
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

              {/* Nama Material */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Nama Komoditas
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
                  Standar SNI: {getSNISpec(formNama)}
                </div>
              </div>

              {/* Satuan & Stok */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Satuan
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

                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Status Ketersediaan
                  </label>
                  <select
                    value={formStok ? 'tersedia' : 'kosong'}
                    onChange={(e) => setFormStok(e.target.value === 'tersedia')}
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
                    <option value="tersedia">● Stok Tersedia</option>
                    <option value="kosong">○ Stok Kosong</option>
                  </select>
                </div>
              </div>

              {/* Harga Jual */}
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

              {/* Guardrail Box */}
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
                      Tombol simpan dikunci demi integritas pengadaan publik APBDes.
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

              {/* Actions */}
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
                      <span>Simpan Perubahan</span>
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
