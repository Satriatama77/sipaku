import { useEffect, useState, useMemo, useRef } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { submitLaporan } from '../../services/laporanService'
import { getDataSSH, getSemuaTokoPublik } from '../../services/hargaService'
import { useToast } from '../../context/ToastContext'
import kecamatanData from '../../data/kecamatan_lamongan.json'
import sshDataLokal from '../../data/ssh_lamongan'
import {
  IconShield,
  IconCheck,
  IconAlertTriangle,
  IconStore,
  IconScale,
  IconFileText,
  IconMapPin,
  IconPackage,
  IconCamera,
  IconUpload
} from '../../components/Icons'
import AlertBox from '../../components/ui/AlertBox'

export default function LaporHargaPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()

  const prefill = location.state || {}
  const qKecamatan = searchParams.get('kecamatan')
  const qToko = searchParams.get('toko')
  const qMaterial = searchParams.get('material')
  const qHarga = searchParams.get('harga')

  // Master Data
  const [sshList, setSshList] = useState(sshDataLokal)
  const [tokoList, setTokoList] = useState([])

  // Form State
  const [idKecamatan, setIdKecamatan] = useState(() => {
    if (prefill.id_kecamatan) return String(prefill.id_kecamatan)
    if (qKecamatan) {
      const match = kecamatanData.find(k => k.nama_kecamatan?.toLowerCase() === qKecamatan.toLowerCase())
      if (match) return String(match.id_kecamatan)
    }
    return ''
  })

  const [namaToko, setNamaToko] = useState(prefill.nama_toko || qToko || '')
  const [namaMaterial, setNamaMaterial] = useState(prefill.nama_material || qMaterial || '')
  const [hargaTemuan, setHargaTemuan] = useState(prefill.harga_temuan ? String(prefill.harga_temuan) : (qHarga || ''))
  const [namaPelapor, setNamaPelapor] = useState('Warga Anonim')

  // Photo Upload State
  const [fotoBukti, setFotoBukti] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  // Form Validation State & Error Tracking
  const [formErrors, setFormErrors] = useState({})
  const [touched, setTouched] = useState({})

  // UI Status
  const [loading, setLoading] = useState(false)
  const [sukses, setSukses] = useState(false)
  const [tiketLaporan, setTiketLaporan] = useState('')
  const [error, setError] = useState('')

  // Photo Upload Handlers
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

  const handleFileSelect = (file) => {
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFormErrors(prev => ({ ...prev, fotoBukti: 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP.' }))
      setTouched(prev => ({ ...prev, fotoBukti: true }))
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setFormErrors(prev => ({ ...prev, fotoBukti: 'Ukuran file terlalu besar. Maksimal 5MB.' }))
      setTouched(prev => ({ ...prev, fotoBukti: true }))
      return
    }

    setFotoBukti(file)
    setFormErrors(prev => ({ ...prev, fotoBukti: '' }))
    const reader = new FileReader()
    reader.onload = (e) => setFotoPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleRemovePhoto = () => {
    setFotoBukti(null)
    setFotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Fungsi Validasi Field per Field
  const validateField = (name, value) => {
    let err = ''
    if (name === 'idKecamatan') {
      if (!value) err = 'Wilayah kecamatan wajib dipilih.'
    } else if (name === 'namaToko') {
      if (!value || !value.trim()) err = 'Nama toko bangunan wajib diisi.'
      else if (value.trim().length < 3) err = 'Nama toko minimal 3 karakter.'
    } else if (name === 'namaMaterial') {
      if (!value) err = 'Komoditas material wajib dipilih.'
    } else if (name === 'hargaTemuan') {
      if (!value || String(value).trim() === '') err = 'Harga temuan tagihan toko wajib diisi.'
      else if (isNaN(Number(value)) || Number(value) <= 0) err = 'Harga harus berupa angka lebih besar dari 0.'
    } else if (name === 'fotoBukti') {
      if (!value) err = 'Bukti foto (nota/struk) wajib dilampirkan.'
    }
    return err
  }

  // Load Data Master
  useEffect(() => {
    getDataSSH()
      .then(res => {
        if (res.data?.data?.length > 0) {
          setSshList(res.data.data)
        }
      })
      .catch(() => {})

    getSemuaTokoPublik()
      .then(res => {
        if (res.data?.data?.length > 0) {
          setTokoList(res.data.data)
        }
      })
      .catch(() => {})
  }, [])

  // Filter toko berdasarkan kecamatan yang dipilih
  const tokoDiKecamatan = useMemo(() => {
    if (!idKecamatan) return []
    return tokoList.filter(t => String(t.id_kecamatan) === String(idKecamatan))
  }, [tokoList, idKecamatan])

  // Material SSH yang terpilih
  const selectedSSH = useMemo(() => {
    if (!namaMaterial) return null
    return sshList.find(s => s.nama_material === namaMaterial)
  }, [sshList, namaMaterial])

  // Perhitungan Disparitas Real-Time
  const disparitas = useMemo(() => {
    const hargaInput = Number(hargaTemuan)
    const hargaAcuan = selectedSSH?.harga_ssh

    if (!hargaInput || !hargaAcuan) return null

    const selisih = hargaInput - hargaAcuan
    const persen = Number(((selisih / hargaAcuan) * 100).toFixed(1))

    let zona = 'Normal'
    let color = '#059669'
    let bg = '#ecfdf5'
    let border = '#a7f3d0'

    if (selisih > 0) {
      if (persen > 5.0) {
        zona = 'Pelanggaran HAP'
        color = '#dc2626'
        bg = '#fef2f2'
        border = '#fecaca'
      } else {
        zona = 'Waspada'
        color = '#d97706'
        bg = '#fffbeb'
        border = '#fef3c7'
      }
    }

    return { selisih, persen, zona, color, bg, border, hargaAcuan }
  }, [hargaTemuan, selectedSSH])

  const handleSubmit = async (e) => {
    e.preventDefault()

    // 1. Validasi seluruh field sebelum submit
    const errors = {
      idKecamatan: validateField('idKecamatan', idKecamatan),
      namaToko: validateField('namaToko', namaToko),
      namaMaterial: validateField('namaMaterial', namaMaterial),
      hargaTemuan: validateField('hargaTemuan', hargaTemuan),
      fotoBukti: validateField('fotoBukti', fotoBukti),
    }

    const activeErrors = Object.fromEntries(
      Object.entries(errors).filter(([_, v]) => Boolean(v))
    )

    // Tandai semua field sebagai touched agar pesan error muncul
    setTouched({
      idKecamatan: true,
      namaToko: true,
      namaMaterial: true,
      hargaTemuan: true,
      fotoBukti: true,
    })
    setFormErrors(activeErrors)

    // 2. Mencegah submit jika ada input kosong atau format salah
    if (Object.keys(activeErrors).length > 0) {
      toast.warning(
        'Terdapat kolom formulir yang belum lengkap atau formatnya salah. Mohon periksa pesan di bawah input.',
        'Validasi Formulir'
      )
      return
    }

    setLoading(true)
    setError('')

    try {
      const payload = {
        id_kecamatan: Number(idKecamatan),
        nama_toko: namaToko.trim(),
        nama_material: namaMaterial,
        harga_temuan: Number(hargaTemuan),
        satuan: selectedSSH?.satuan || 'satuan',
        nama_pelapor: namaPelapor.trim() || 'Warga Anonim',
      }

      const res = await submitLaporan(payload, fotoBukti)
      const ticketNumber = res.data?.data?.kode_tiket || `SPK-${new Date().getFullYear()}-0001`
      setTiketLaporan(ticketNumber)
      setSukses(true)
      toast.success(
        `Laporan aduan berhasil dikirim dengan Nomor Tiket ${ticketNumber}`,
        'Pengaduan Berhasil'
      )
    } catch {
      setError('Gagal mengirimkan laporan pengaduan. Mohon periksa koneksi atau coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  // State salin kode tiket
  const [copied, setCopied] = useState(false)
  const handleCopyTicket = () => {
    if (tiketLaporan) {
      navigator.clipboard.writeText(tiketLaporan)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
      toast.success('Nomor tiket berhasil disalin ke clipboard!', 'Tersalin')
    }
  }

  // ── TAMPILAN SUKSES SETELAH KIRIM LAPORAN ────────────────────
  if (sukses) {
    return (
      <div style={{ background: '#f8fafc', minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '36px 32px',
          maxWidth: 540,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(15,23,42,0.06)'
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#ecfdf5',
            border: '2px solid #a7f3d0',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16
          }}>
            <IconCheck size={28} color="#059669" />
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
            Laporan Berhasil Terkirim
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 }}>
            Terima kasih atas partisipasi Anda dalam menjaga transparansi harga bahan bangunan di Kabupaten Lamongan.
          </p>

          <div style={{
            background: '#f8fafc',
            border: '1.5px dashed #cbd5e1',
            borderRadius: 12,
            padding: '18px 20px',
            marginBottom: 24,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 11, fontWeight: 750, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Nomor Registrasi / Kode Tiket Aduan
            </div>
            <div style={{
              fontSize: 24,
              fontWeight: 850,
              fontFamily: 'monospace',
              color: '#0284c7',
              letterSpacing: '0.05em',
              marginTop: 6,
              marginBottom: 10
            }}>
              {tiketLaporan}
            </div>
            
            <button
              type="button"
              onClick={handleCopyTicket}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: copied ? '#ecfdf5' : '#ffffff',
                color: copied ? '#059669' : '#0f172a',
                border: `1px solid ${copied ? '#a7f3d0' : '#cbd5e1'}`,
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {copied ? <IconCheck size={14} color="#059669" /> : null}
              <span>{copied ? 'Kode Tiket Tersalin!' : 'Salin Kode Tiket'}</span>
            </button>

            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <IconShield size={13} color="#059669" />
              <span>Simpan kode ini untuk melacak status penanganan aduan di menu Riwayat</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to={`/pembeli/riwayat?tiket=${encodeURIComponent(tiketLaporan)}`}
              style={{
                padding: '10px 18px',
                background: '#0284c7',
                color: '#ffffff',
                textDecoration: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                boxShadow: '0 2px 4px rgba(2,132,199,0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>Lacak Status Aduan Ini</span>
              <span>&rarr;</span>
            </Link>

            <button
              onClick={() => {
                setSukses(false)
                setHargaTemuan('')
                setTiketLaporan('')
                setCopied(false)
                handleRemovePhoto()
              }}
              style={{
                padding: '10px 18px',
                background: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Lapor Lagi
            </button>

            <Link
              to="/pembeli"
              style={{
                padding: '10px 18px',
                background: '#ffffff',
                color: '#475569',
                border: '1px solid #cbd5e1',
                textDecoration: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 650
              }}
            >
              Ke Beranda
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── FORM LAPOR HARGA CLEAN & SIMPLE ─────────────────────────
  return (
    <div className="sipaku-page" style={{ background: '#f8fafc', minHeight: '100vh', padding: '32px 20px 80px', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: '#0f172a' }}>
      <div className="sipaku-page-inner" style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Back Link */}
        <div style={{ marginBottom: 16 }}>
          <Link
            to="/pembeli"
            style={{
              color: '#64748b',
              textDecoration: 'none',
              fontSize: 12.5,
              fontWeight: 650,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>Kembali ke Beranda Komparasi</span>
          </Link>
        </div>

        {/* Card Form */}
        <div className="lapor-card">

          {/* Header Card */}
          <div className="lapor-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              <span style={{
                background: '#eff6ff',
                color: '#0284c7',
                fontSize: 10.5,
                fontWeight: 800,
                padding: '3px 9px',
                borderRadius: 6,
                border: '1px solid #bfdbfe',
                letterSpacing: '0.03em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}>
                <IconShield size={12} color="#0284c7" />
                KANAL PENGADUAN RESMI
              </span>
              <span style={{
                background: '#ecfdf5',
                color: '#047857',
                fontSize: 10.5,
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: 6,
                border: '1px solid #a7f3d0'
              }}>
                PERBUP NO. 188/2024
              </span>
              <span style={{
                background: '#f8fafc',
                color: '#64748b',
                fontSize: 10.5,
                fontWeight: 650,
                padding: '3px 8px',
                borderRadius: 6,
                border: '1px solid #e2e8f0'
              }}>
                DINAS PU BINA MARGA
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(20px, 4vw, 24px)',
              fontWeight: 850,
              color: '#0f172a',
              margin: '0 0 6px',
              letterSpacing: '-0.02em',
              lineHeight: 1.25
            }}>
              Lapor Disparitas Harga Material
            </h1>
            <p style={{
              fontSize: 13,
              color: '#64748b',
              margin: 0,
              lineHeight: 1.55,
              maxWidth: 600
            }}>
              Formulir pengaduan resmi warga &amp; TPK Desa atas indikasi lonjakan harga material konstruksi di luar ketentuan Standar Satuan Harga (SSH) Pemerintah Kabupaten Lamongan.
            </p>
          </div>

          <div className="lapor-card-body">
            {error && (
              <AlertBox
                variant="error"
                title="Gagal Mengirim Laporan"
                style={{ marginBottom: 20 }}
              >
                {error}
              </AlertBox>
            )}

            <form onSubmit={handleSubmit} noValidate>

              {/* 1. Kecamatan */}
              <div className="lapor-field-group">
                <label className="lapor-field-label">
                  <span className="lapor-step-badge">1</span>
                  <IconMapPin size={15} color="#0284c7" />
                  <span>Wilayah Kecamatan</span>
                  <span style={{ color: '#ef4444', fontWeight: 800 }}>*</span>
                </label>
                <select
                  value={idKecamatan}
                  onChange={(e) => {
                    const val = e.target.value
                    setIdKecamatan(val)
                    setNamaToko('')
                    if (touched.idKecamatan) {
                      setFormErrors((prev) => ({ ...prev, idKecamatan: validateField('idKecamatan', val), namaToko: '' }))
                    }
                  }}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, idKecamatan: true }))
                    setFormErrors((prev) => ({ ...prev, idKecamatan: validateField('idKecamatan', idKecamatan) }))
                  }}
                  className={`lapor-select ${touched.idKecamatan && formErrors.idKecamatan ? 'has-error' : ''}`}
                >
                  <option value="">-- Pilih Kecamatan di Lamongan --</option>
                  {kecamatanData.map((k) => (
                    <option key={k.id_kecamatan} value={k.id_kecamatan}>
                      {k.nama_kecamatan}
                    </option>
                  ))}
                </select>

                {/* Pesan Error di Bawah Input */}
                {touched.idKecamatan && formErrors.idKecamatan && (
                  <div style={{ color: '#dc2626', fontSize: 12, marginTop: 5, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
                    <IconAlertTriangle size={13} color="#dc2626" />
                    <span>{formErrors.idKecamatan}</span>
                  </div>
                )}
              </div>

              {/* 2. Nama Toko */}
              <div className="lapor-field-group">
                <label className="lapor-field-label">
                  <span className="lapor-step-badge">2</span>
                  <IconStore size={15} color="#0284c7" />
                  <span>Nama Toko Bangunan Terlapor</span>
                  <span style={{ color: '#ef4444', fontWeight: 800 }}>*</span>
                </label>
                
                <select
                  value={namaToko}
                  disabled={!idKecamatan}
                  onChange={(e) => {
                    const val = e.target.value
                    setNamaToko(val)
                    if (touched.namaToko) {
                      setFormErrors((prev) => ({ ...prev, namaToko: validateField('namaToko', val) }))
                    }
                  }}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, namaToko: true }))
                    setFormErrors((prev) => ({ ...prev, namaToko: validateField('namaToko', namaToko) }))
                  }}
                  style={{
                    background: !idKecamatan ? '#f1f5f9' : '#ffffff',
                    cursor: !idKecamatan ? 'not-allowed' : 'pointer'
                  }}
                  className={`lapor-select ${touched.namaToko && formErrors.namaToko ? 'has-error' : ''}`}
                >
                  {!idKecamatan ? (
                    <option value="">-- Pilih Kecamatan Terlebih Dahulu --</option>
                  ) : tokoDiKecamatan.length === 0 ? (
                    <option value="" disabled>-- Belum ada toko terdaftar di kecamatan ini --</option>
                  ) : (
                    <>
                      <option value="">-- Pilih Toko di Kecamatan Ini --</option>
                      {namaToko && !tokoDiKecamatan.some(t => t.nama_toko === namaToko) && (
                        <option value={namaToko}>{namaToko}</option>
                      )}
                      {tokoDiKecamatan.map((t, idx) => (
                        <option key={t.id_toko || idx} value={t.nama_toko}>
                          {t.nama_toko} {t.alamat ? `(${t.alamat})` : ''}
                        </option>
                      ))}
                    </>
                  )}
                </select>

                {/* Petunjuk jika belum pilih kecamatan atau toko kosong */}
                {!idKecamatan ? (
                  <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 5 }}>
                    Pilih wilayah kecamatan di atas terlebih dahulu untuk memuat daftar toko.
                  </div>
                ) : tokoDiKecamatan.length === 0 ? (
                  <div style={{ fontSize: 11.5, color: '#d97706', marginTop: 5, fontWeight: 500 }}>
                    Belum ada mitra toko yang terdaftar di kecamatan ini.
                  </div>
                ) : null}

                {/* Pesan Error di Bawah Input */}
                {touched.namaToko && formErrors.namaToko && (
                  <div style={{ color: '#dc2626', fontSize: 12, marginTop: 5, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
                    <IconAlertTriangle size={13} color="#dc2626" />
                    <span>{formErrors.namaToko}</span>
                  </div>
                )}
              </div>

              {/* 3. Komoditas Material */}
              <div className="lapor-field-group">
                <label className="lapor-field-label">
                  <span className="lapor-step-badge">3</span>
                  <IconPackage size={15} color="#0284c7" />
                  <span>Komoditas Material Konstruksi</span>
                  <span style={{ color: '#ef4444', fontWeight: 800 }}>*</span>
                </label>
                <select
                  value={namaMaterial}
                  onChange={(e) => {
                    const val = e.target.value
                    setNamaMaterial(val)
                    if (touched.namaMaterial) {
                      setFormErrors((prev) => ({ ...prev, namaMaterial: validateField('namaMaterial', val) }))
                    }
                  }}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, namaMaterial: true }))
                    setFormErrors((prev) => ({ ...prev, namaMaterial: validateField('namaMaterial', namaMaterial) }))
                  }}
                  className={`lapor-select ${touched.namaMaterial && formErrors.namaMaterial ? 'has-error' : ''}`}
                >
                  <option value="">-- Pilih Jenis Komoditas Material Bangunan --</option>
                  {sshList.map((s, idx) => (
                    <option key={s.id_ssh || idx} value={s.nama_material}>
                      {s.nama_material} ({s.satuan})
                    </option>
                  ))}
                </select>

                {/* Pesan Error di Bawah Input */}
                {touched.namaMaterial && formErrors.namaMaterial && (
                  <div style={{ color: '#dc2626', fontSize: 12, marginTop: 5, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
                    <IconAlertTriangle size={13} color="#dc2626" />
                    <span>{formErrors.namaMaterial}</span>
                  </div>
                )}

                {/* Harga SSH Acuan Box */}
                {selectedSSH && (
                  <div style={{
                    marginTop: 10,
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: 10,
                    padding: '10px 14px',
                    fontSize: 12.5,
                    color: '#0369a1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <IconCheck size={14} color="#0284c7" />
                      <span>Standar Plafon HAP / SSH Dinas PU:</span>
                    </div>
                    <strong style={{ fontSize: 14, color: '#0c4a6e', fontWeight: 850 }}>
                      Rp {Number(selectedSSH.harga_ssh).toLocaleString('id-ID')} / {selectedSSH.satuan}
                    </strong>
                  </div>
                )}
              </div>

              {/* 4. Harga Temuan di Lapangan */}
              <div className="lapor-field-group">
                <label className="lapor-field-label">
                  <span className="lapor-step-badge">4</span>
                  <IconScale size={15} color="#0284c7" />
                  <span>Harga Temuan di Toko (Rp)</span>
                  <span style={{ color: '#ef4444', fontWeight: 800 }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 13,
                    fontWeight: 750,
                    color: '#64748b'
                  }}>
                    Rp
                  </span>
                  <input
                    type="number"
                    value={hargaTemuan}
                    onChange={(e) => {
                      const val = e.target.value
                      setHargaTemuan(val)
                      if (touched.hargaTemuan) {
                        setFormErrors((prev) => ({ ...prev, hargaTemuan: validateField('hargaTemuan', val) }))
                      }
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, hargaTemuan: true }))
                      setFormErrors((prev) => ({ ...prev, hargaTemuan: validateField('hargaTemuan', hargaTemuan) }))
                    }}
                    placeholder="Contoh: 72000"
                    min="1"
                    className={`lapor-input ${touched.hargaTemuan && formErrors.hargaTemuan ? 'has-error' : ''}`}
                    style={{ paddingLeft: 42, fontWeight: 750 }}
                  />
                </div>

                {/* Pesan Error di Bawah Input */}
                {touched.hargaTemuan && formErrors.hargaTemuan && (
                  <div style={{ color: '#dc2626', fontSize: 12, marginTop: 5, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
                    <IconAlertTriangle size={13} color="#dc2626" />
                    <span>{formErrors.hargaTemuan}</span>
                  </div>
                )}

                {/* Live Indikator Disparitas */}
                {disparitas && (
                  <div style={{
                    marginTop: 10,
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: disparitas.bg,
                    border: `1px solid ${disparitas.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 10
                  }}>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 850, color: disparitas.color }}>
                        Status: Zona {disparitas.zona} ({disparitas.selisih > 0 ? `+${disparitas.persen}%` : `${disparitas.persen}%`} dari SSH)
                      </div>
                      <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                        Batas toleransi wajar sesuai Perbup No. 188/2024 adalah ±5.0%
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Selisih Nominal</div>
                      <div style={{ fontSize: 14, fontWeight: 850, color: disparitas.color }}>
                        {disparitas.selisih > 0 ? `+Rp ${disparitas.selisih.toLocaleString('id-ID')}` : `Rp ${disparitas.selisih.toLocaleString('id-ID')}`}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Bukti Foto (Nota/Struk Pembelian) */}
              <div className="lapor-field-group">
                <label className="lapor-field-label">
                  <span className="lapor-step-badge">5</span>
                  <IconCamera size={15} color="#0284c7" />
                  <span>Bukti Foto Nota / Struk Pembelian</span>
                  <span style={{ color: '#ef4444', fontWeight: 800 }}>*</span>
                </label>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10, lineHeight: 1.5 }}>
                  Lampirkan foto nota, kuitansi, atau bukti fisik harga material dari toko untuk keperluan verifikasi tim dinas.
                </div>

                {/* Drag & Drop / Click Area */}
                {!fotoPreview ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`lapor-dropzone ${touched.fotoBukti && formErrors.fotoBukti ? 'has-error' : ''} ${dragActive ? 'active' : ''}`}
                  >
                    <div style={{
                      width: 46,
                      height: 46,
                      borderRadius: 12,
                      background: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0284c7',
                      marginBottom: 4
                    }}>
                      <IconUpload size={22} color="#0284c7" />
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 750, color: '#0f172a' }}>
                      {dragActive ? 'Lepaskan berkas foto di sini...' : 'Klik atau seret foto bukti ke sini'}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748b' }}>
                      Format JPG, PNG, atau WebP • Ukuran maksimal 5MB
                    </div>
                    <div style={{
                      marginTop: 6,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: 6,
                      padding: '5px 12px',
                      fontSize: 11.5,
                      fontWeight: 650,
                      color: '#334155',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                    }}>
                      <IconCamera size={13} color="#64748b" />
                      <span>Pilih Foto dari Galeri / Kamera</span>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    position: 'relative',
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    boxShadow: '0 2px 8px rgba(15,23,42,0.04)'
                  }}>
                    <img
                      src={fotoPreview}
                      alt="Preview bukti"
                      style={{
                        width: '100%',
                        maxHeight: 280,
                        objectFit: 'contain',
                        display: 'block',
                        background: '#0f172a'
                      }}
                    />
                    <div style={{
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#ffffff',
                      borderTop: '1px solid #e2e8f0'
                    }}>
                      <div style={{ fontSize: 12, color: '#334155', fontWeight: 650, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {fotoBukti?.name} ({(fotoBukti?.size / 1024).toFixed(0)} KB)
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        style={{
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          borderRadius: 6,
                          padding: '5px 12px',
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                      >
                        Ganti Foto
                      </button>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  style={{ display: 'none' }}
                />

                {/* Error message */}
                {touched.fotoBukti && formErrors.fotoBukti && (
                  <div style={{ color: '#dc2626', fontSize: 12, marginTop: 5, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
                    <IconAlertTriangle size={13} color="#dc2626" />
                    <span>{formErrors.fotoBukti}</span>
                  </div>
                )}
              </div>

              {/* 6. Identitas Pelapor (Anonim / Samaran) */}
              <div className="lapor-field-group" style={{ marginBottom: 28 }}>
                <label className="lapor-field-label">
                  <span className="lapor-step-badge" style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}>6</span>
                  <IconShield size={15} color="#059669" />
                  <span>Identitas Pelapor (Opsional / Perlindungan BSSN)</span>
                </label>
                <input
                  type="text"
                  value={namaPelapor}
                  onChange={(e) => setNamaPelapor(e.target.value)}
                  placeholder="Contoh: Warga Anonim / TPK Desa Sukodadi (Boleh Dikosongkan)"
                  className="lapor-input"
                />
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 5, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconShield size={13} color="#16a34a" />
                  <span>Kerahasiaan data pelapor dilindungi undang-undang dan sistem verifikasi mandiri.</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: '1 1 200px',
                    padding: '13px 24px',
                    background: loading ? '#94a3b8' : '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  {loading ? 'Mengirimkan Pengaduan...' : 'Kirim Laporan Pengaduan'}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/pembeli')}
                  style={{
                    padding: '13px 20px',
                    background: '#f8fafc',
                    color: '#475569',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: 10,
                    fontSize: 13.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Batal
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* Small Notice */}
        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 11.5, color: '#94a3b8' }}>
          SIPAKU v2.5 • Layanan Terpadu Dinas PU Bina Marga &amp; Cipta Karya Kabupaten Lamongan
        </div>

      </div>
    </div>
  )
}
