import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { getDataSSH } from '../../services/hargaService'
import {
  IconStore,
  IconShield,
  IconPackage,
  IconCheck,
  IconRefresh,
  IconPlus,
  IconAlertTriangle,
  IconX,
  IconEdit,
  IconFileText,
  IconUsers,
  IconCart,
  IconTruck
} from '../../components/Icons'

const PRESET_BAHAN = [
  { nama: 'Semen Gresik 40kg', satuan: 'zak' },
  { nama: 'Semen Tiga Roda 40kg', satuan: 'zak' },
  { nama: 'Besi Beton Polos Ø8mm', satuan: 'batang' },
  { nama: 'Besi Beton Polos Ø10mm', satuan: 'batang' },
  { nama: 'Pasir Pasang', satuan: 'm3' },
  { nama: 'Pasir Urug', satuan: 'm3' },
  { nama: 'Batu Bata Merah', satuan: 'buah' },
  { nama: 'Batako Pres', satuan: 'buah' },
  { nama: 'Keramik Lantai 40x40 Polos', satuan: 'm2' },
  { nama: 'Triplek 9mm 122x244', satuan: 'lembar' },
  { nama: 'Baja Ringan Canal C75 (0.75mm)', satuan: 'batang' },
  { nama: 'Cat Tembok 5kg', satuan: 'kaleng' },
  { nama: 'Paku 5cm', satuan: 'kg' },
]

export default function PenjualDashboard() {
  const { user } = useAuth()

  // State Data Toko & Katalog
  const [daftarToko, setDaftarToko] = useState([])
  const [selectedTokoId, setSelectedTokoId] = useState(2) // Default TB Berkah Abadi
  const [tokoAktif, setTokoAktif] = useState(null)
  const [katalog, setKatalog] = useState([])
  const [sshData, setSshData] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Modal Tambah Cepat
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formNama, setFormNama] = useState('')
  const [formHarga, setFormHarga] = useState('')
  const [formSatuan, setFormSatuan] = useState('zak')
  const [formStok, setFormStok] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('')

  const isPenjual = user?.role === 'penjual'
  const penjualTokoId = isPenjual && user?.id_toko ? Number(user.id_toko) : null

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
      if (penjualTokoId) {
        matched = listToko.find((t) => t.id_toko === penjualTokoId)
      } else if (user?.id_toko) {
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
        const finalId = penjualTokoId || matched.id_toko
        setSelectedTokoId(finalId)
        setTokoAktif(matched)
      }
    })
  }, [user, penjualTokoId])

  // 2. Fetch Katalog Toko
  const fetchKatalog = (id) => {
    const targetId = penjualTokoId || id
    if (!targetId) return
    setLoading(true)
    api.get(`/api/katalog/${targetId}`)
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
    const targetId = penjualTokoId || selectedTokoId
    fetchKatalog(targetId)
    const t = daftarToko.find((x) => x.id_toko === Number(targetId))
    if (t) setTokoAktif(t)
  }, [selectedTokoId, daftarToko, penjualTokoId])

  // Helper Batas Acuan HAP
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

  // Perkaya data katalog dengan acuan harga
  const enrichedKatalog = useMemo(() => {
    return katalog.map((item) => {
      const batasHap = getBatasHAP(item.nama_material)
      const harga = Number(item.harga_jual)
      const diff = harga - batasHap
      const persenDiff = batasHap > 0 ? ((diff / batasHap) * 100).toFixed(1) : '0.0'
      const isOver = harga > batasHap

      return {
        ...item,
        batasHap,
        diff,
        persenDiff,
        isOver
      }
    })
  }, [katalog, sshData])

  // Metrik Statistik
  const totalItem = enrichedKatalog.length
  const itemSesuai = enrichedKatalog.filter((x) => !x.isOver).length
  const itemPerhatian = enrichedKatalog.filter((x) => x.isOver)
  const itemTersedia = enrichedKatalog.filter((x) => x.stok_tersedia).length
  const kepatuhanPersen = totalItem > 0 ? Math.round((itemSesuai / totalItem) * 100) : 100

  // 5 Komoditas Terakhir Diperbarui untuk preview beranda
  const previewKomoditas = useMemo(() => {
    return enrichedKatalog.slice(0, 5)
  }, [enrichedKatalog])

  // Modal Handlers
  const openAddModal = () => {
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

  const handleSubmitModal = async (e) => {
    e.preventDefault()
    if (!formNama.trim() || numericFormHarga <= 0) {
      alert('Mohon isi nama bahan bangunan dan harga jual dengan benar.')
      return
    }

    setSubmitting(true)
    const finalTargetId = penjualTokoId || selectedTokoId
    try {
      await api.put(`/api/katalog/${finalTargetId}`, {
        nama_material: formNama.trim(),
        harga_jual: numericFormHarga,
        satuan: formSatuan,
        stok_tersedia: formStok
      })
      setSaveSuccessMsg('Komoditas baru berhasil ditambahkan!')
      fetchKatalog(finalTargetId)
      setTimeout(() => {
        setIsModalOpen(false)
        setSaveSuccessMsg('')
      }, 900)
    } catch (err) {
      alert(err.response?.data?.detail || 'Gagal menyimpan komoditas.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', color: '#0f172a', paddingBottom: 60, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>

        {/* ── BANNER SAMBUTAN BERANDA TOKO (Modern Navy) ── */}
        <div style={{
          background: 'linear-gradient(135deg, #0b1528 0%, #112240 55%, #18335c 100%)',
          borderRadius: 16,
          padding: '26px 30px',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          marginBottom: 24,
          boxShadow: '0 10px 25px -5px rgba(11, 21, 40, 0.28), 0 4px 10px -2px rgba(11, 21, 40, 0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
            <div style={{ maxWidth: 720 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, marginBottom: 12, letterSpacing: '0.04em', color: '#f8fafc' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px rgba(52, 211, 153, 0.8)' }} />
                PORTAL MITRA RESMI SIPAKU
              </div>

              <h1 style={{ fontSize: 'clamp(20px, 3.5vw, 24px)', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em', lineHeight: 1.25, color: '#ffffff' }}>
                Selamat Datang, {tokoAktif?.nama_pemilik || user?.nama_lengkap || 'Mitra Toko'}
              </h1>
              <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0, lineHeight: 1.55 }}>
                Dasbor operasional toko <strong>{tokoAktif?.nama_toko || 'Toko Bangunan'}</strong>. Pantau stabilitas harga bahan bangunan, cek kesesuaian standar pagu daerah, dan kelola ketersediaan etalase Anda.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, fontSize: 12, color: '#94a3b8', flexWrap: 'wrap' }}>
                <span>Wilayah: <strong style={{ color: '#ffffff' }}>Kec. {tokoAktif?.nama_kecamatan || 'Lamongan'}</strong></span>
                <span>•</span>
                <span>Kode Mitra: <strong style={{ color: '#ffffff' }}>LM-00{tokoAktif?.id_toko || '2'}</strong></span>
                <span>•</span>
                <span style={{ color: '#6ee7b7', fontWeight: 600 }}>Toko Terdaftar Resmi</span>
              </div>
            </div>

            {/* Aksi Cepat di Header */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => setIsModalOpen(true)}
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  border: '1px solid #38bdf8',
                  borderRadius: 8,
                  padding: '9px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
                  transition: 'all 0.15s ease'
                }}
              >
                Tambah Bahan
              </button>

              <Link
                to="/penjual/katalog"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 8,
                  padding: '9px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                  backdropFilter: 'blur(4px)',
                  transition: 'all 0.15s ease'
                }}
              >
                Kelola Etalase Lengkap
              </Link>
            </div>
          </div>
        </div>

        {/* ── 4 KARTU STATISTIK & METRIK UTAMA ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 24
        }}>
          {/* Card 1: Total Bahan */}
          <div style={{
            background: '#ffffff',
            borderRadius: 14,
            padding: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Komoditas
              </span>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconPackage size={17} color="#475569" />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 850, color: '#0f172a', margin: '8px 0 2px' }}>
              {totalItem} <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>Item Bahan</span>
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Tampil di pencarian pembeli dan proyek desa
            </div>
          </div>

          {/* Card 2: Kepatuhan Standar Acuan */}
          <div style={{
            background: '#ffffff',
            borderRadius: 14,
            padding: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Kepatuhan Standar HAP
              </span>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: itemPerhatian.length === 0 ? '#f0fdf4' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconShield size={17} color={itemPerhatian.length === 0 ? '#16a34a' : '#b45309'} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 850, color: itemPerhatian.length > 0 ? '#b45309' : '#16a34a', margin: '8px 0 2px' }}>
              {kepatuhanPersen}%
            </div>
            <div style={{ fontSize: 12, color: itemPerhatian.length > 0 ? '#b45309' : '#16a34a', fontWeight: 600 }}>
              {itemPerhatian.length > 0 ? `${itemPerhatian.length} barang di atas batas acuan` : 'Semua harga sesuai standar pagu daerah'}
            </div>
          </div>

          {/* Card 3: Stok Siap Jual */}
          <div style={{
            background: '#ffffff',
            borderRadius: 14,
            padding: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Ketersediaan Stok
              </span>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconCheck size={17} color="#16a34a" />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 850, color: '#0f172a', margin: '8px 0 2px' }}>
              {itemTersedia} <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>Barang Siap</span>
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              {totalItem - itemTersedia > 0 ? `${totalItem - itemTersedia} barang sedang kosong` : 'Seluruh barang tersedia untuk pembeli'}
            </div>
          </div>

          {/* Card 4: Keterhubungan Desa */}
          <div style={{
            background: '#ffffff',
            borderRadius: 14,
            padding: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Jangkauan Wilayah
              </span>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconTruck size={17} color="#2563eb" />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 850, color: '#0f172a', margin: '8px 0 2px' }}>
              Aktif
            </div>
            <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 600 }}>
              Terhubung di Kec. {tokoAktif?.nama_kecamatan || 'Lamongan'}
            </div>
          </div>
        </div>

        {/* ── 2 KOLOM INFORMASI: PENGUMUMAN RESMI & MONITORING PERHATIAN ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20,
          marginBottom: 24
        }}>
          {/* Kolom Kiri: Papan Informasi Resmi Dinas PU Lamongan */}
          <div style={{
            background: '#ffffff',
            borderRadius: 14,
            padding: '22px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconFileText size={16} color="#0284c7" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                  Pusat Informasi &amp; Kebijakan Dinas PU
                </h3>
                <span style={{ fontSize: 11, color: '#64748b' }}>Pembaruan resmi Pemkab Lamongan</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>EDIKSI TRIWULAN</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Berlaku Aktif</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                  Pemberlakuan Standar Satuan Harga (SSH) Bahan Bangunan
                </div>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Dinas PU Bina Marga &amp; Cipta Karya Lamongan menetapkan batas acuan harga untuk menjaga stabilitas pasar dan keterjangkauan proyek desa. Pastikan etalase toko selalu merujuk pada standar yang wajar.
                </p>
              </div>

              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                  HIMBAUAN KEMITRAAN
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                  Ketersediaan Stok Bahan Utama (Semen, Besi &amp; Pasir)
                </div>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Toko dianjurkan memperbarui status stok secara realtime agar warga maupun pelaksana proyek desa dapat melakukan pemesanan tanpa kendala ketersediaan barang.
                </p>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Sorotan Status Harga Toko (Price Watch) */}
          <div style={{
            background: '#ffffff',
            borderRadius: 14,
            padding: '22px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: itemPerhatian.length > 0 ? '#fee2e2' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconShield size={16} color={itemPerhatian.length > 0 ? '#b91c1c' : '#16a34a'} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                  Monitoring Standar Acuan
                </h3>
                <span style={{ fontSize: 11, color: '#64748b' }}>Evaluasi harga terhadap pagu HAP</span>
              </div>
            </div>

            {itemPerhatian.length > 0 ? (
              <div>
                <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 10px', lineHeight: 1.5 }}>
                  Ditemukan <strong>{itemPerhatian.length} bahan</strong> dengan harga di atas batas acuan standar daerah. Disarankan untuk disesuaikan agar transaksi lancar:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {itemPerhatian.slice(0, 3).map((item, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px 12px',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: 8,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 12
                      }}
                    >
                      <div>
                        <strong style={{ color: '#0f172a', display: 'block' }}>{item.nama_material}</strong>
                        <span style={{ color: '#64748b', fontSize: 11 }}>Acuan HAP: Rp {Number(item.batasHap).toLocaleString('id-ID')}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ color: '#b91c1c', display: 'block' }}>
                          Rp {Number(item.harga_jual).toLocaleString('id-ID')}
                        </strong>
                        <span style={{ fontSize: 10, color: '#b91c1c', fontWeight: 700 }}>
                          +{item.persenDiff}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{
                padding: '24px 16px',
                textAlign: 'center',
                background: '#f0fdf4',
                borderRadius: 10,
                border: '1px solid #bbf7d0'
              }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', marginBottom: 10 }}>
                  <IconCheck size={24} color="#16a34a" />
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#15803d', marginBottom: 4 }}>
                  Semua Harga Aman &amp; Wajar
                </div>
                <p style={{ fontSize: 12, color: '#166534', margin: 0, lineHeight: 1.5 }}>
                  Seluruh komoditas toko Anda berada di bawah atau pas dengan batas acuan standar HAP Dinas PU Lamongan.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── CUPLIKAN ETALASE TERAKHIR & LINK KATALOG LENGKAP ── */}
        <div style={{
          background: '#ffffff',
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '18px 22px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Cuplikan Bahan Bangunan di Etalase
              </h2>
              <span style={{ fontSize: 12, color: '#64748b' }}>Menampilkan 5 komoditas terbaru toko Anda</span>
            </div>

            <Link
              to="/penjual/katalog"
              style={{
                background: '#0f172a',
                color: '#ffffff',
                textDecoration: 'none',
                padding: '7px 16px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 700
              }}
            >
              Buka Halaman Katalog Lengkap
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
              Memuat data etalase...
            </div>
          ) : previewKomoditas.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
              Belum ada komoditas di etalase toko. Tekan tombol <strong>Tambah Bahan</strong> untuk menambahkan.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '12px 18px' }}>Nama Bahan Bangunan</th>
                    <th style={{ padding: '12px 14px' }}>Satuan</th>
                    <th style={{ padding: '12px 14px' }}>Harga Toko Anda</th>
                    <th style={{ padding: '12px 14px' }}>Standar Acuan (HAP)</th>
                    <th style={{ padding: '12px 14px' }}>Status Harga</th>
                    <th style={{ padding: '12px 14px' }}>Ketersediaan</th>
                  </tr>
                </thead>
                <tbody>
                  {previewKomoditas.map((item, idx) => (
                    <tr
                      key={item.id_katalog || idx}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: idx % 2 === 0 ? '#ffffff' : '#fafbfc'
                      }}
                    >
                      <td style={{ padding: '12px 18px', fontWeight: 700, color: '#0f172a' }}>
                        {item.nama_material}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#475569', fontWeight: 600 }}>
                        {item.satuan}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <strong style={{ color: '#0f172a' }}>
                          Rp {Number(item.harga_jual).toLocaleString('id-ID')}
                        </strong>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748b' }}>
                        Rp {Number(item.batasHap).toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {!item.isOver ? (
                          <span style={{
                            background: '#f0fdf4',
                            color: '#15803d',
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 6,
                            border: '1px solid #bbf7d0',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            <IconCheck size={11} color="#15803d" />
                            <span>Sesuai Acuan</span>
                          </span>
                        ) : (
                          <span style={{
                            background: '#fef2f2',
                            color: '#b91c1c',
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 6,
                            border: '1px solid #fecaca',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            <IconAlertTriangle size={11} color="#b91c1c" />
                            <span>Di Atas Acuan (+{item.persenDiff}%)</span>
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: 11.5,
                          fontWeight: 600,
                          color: item.stok_tersedia ? '#15803d' : '#94a3b8',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5
                        }}>
                          <span style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            background: item.stok_tersedia ? '#16a34a' : '#cbd5e1'
                          }} />
                          {item.stok_tersedia ? 'Tersedia' : 'Kosong'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Cuplikan */}
          <div style={{
            padding: '12px 22px',
            background: '#f8fafc',
            borderTop: '1px solid #f1f5f9',
            fontSize: 12,
            color: '#64748b'
          }}>
            <span>Menampilkan 5 komoditas teratas. Untuk pencarian detail, filter kategori, dan pengeditan harga seluruh bahan, gunakan tombol <strong>Buka Halaman Katalog Lengkap</strong> di atas.</span>
          </div>
        </div>
      </div>

      {/* ── MODAL TAMBAH CEPAT ── */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.5)',
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
            maxWidth: 480,
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                Tambah Komoditas Baru
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}
              >
                <IconX size={18} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleSubmitModal} style={{ padding: '20px 22px' }}>
              {saveSuccessMsg && (
                <div style={{
                  background: '#f0fdf4',
                  color: '#15803d',
                  border: '1px solid #bbf7d0',
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 600,
                  marginBottom: 16
                }}>
                  {saveSuccessMsg}
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Nama Bahan Bangunan
                </label>
                <input
                  type="text"
                  required
                  list="saran-bahan-beranda"
                  placeholder="Contoh: Semen Gresik 40kg"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 13,
                    color: '#0f172a',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
                <datalist id="saran-bahan-beranda">
                  {PRESET_BAHAN.map((b, i) => (
                    <option key={i} value={b.nama} />
                  ))}
                </datalist>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                    Harga Jual Toko (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    placeholder="Contoh: 59000"
                    value={formHarga}
                    onChange={(e) => setFormHarga(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#0f172a',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                    Satuan
                  </label>
                  <select
                    value={formSatuan}
                    onChange={(e) => setFormSatuan(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      color: '#0f172a',
                      boxSizing: 'border-box',
                      outline: 'none',
                      background: '#ffffff'
                    }}
                  >
                    <option value="zak">zak</option>
                    <option value="m3">m3</option>
                    <option value="batang">batang</option>
                    <option value="buah">buah</option>
                    <option value="kg">kg</option>
                    <option value="lembar">lembar</option>
                    <option value="kaleng">kaleng</option>
                    <option value="m2">m2</option>
                    <option value="dus">dus</option>
                    <option value="roll">roll</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={formStok}
                    onChange={(e) => setFormStok(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <span>Stok Tersedia (Siap Dijual ke Pembeli)</span>
                </label>
              </div>

              {formNama && (
                <div style={{
                  background: isOverpricingModal ? '#fef2f2' : '#f8fafc',
                  border: `1px solid ${isOverpricingModal ? '#fecaca' : '#e2e8f0'}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  marginBottom: 18,
                  fontSize: 12
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ color: '#64748b' }}>Batas Acuan Standar Pemkab:</span>
                    <strong style={{ color: '#0f172a' }}>Rp {Number(modalBatasHAP).toLocaleString('id-ID')}</strong>
                  </div>
                  {isOverpricingModal && (
                    <div style={{ color: '#b91c1c', fontSize: 11.5, marginTop: 4 }}>
                      Perhatian: Harga yang Anda masukkan melebihi batas acuan daerah. Disarankan menggunakan harga yang wajar agar transaksi lancar.
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#0f172a',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Bahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
