import { useEffect, useState, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getStatistik, getLaporanAdmin, updateStatusLaporan, getSemuaToko } from '../../services/adminService'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// Koordinat kecamatan utama untuk mini-map
const KOORDINAT_KECAMATAN = {
  "Babat": [-7.1038, 112.2100],
  "Brondong": [-6.8984, 112.2804],
  "Tikung": [-7.2100, 112.3200],
  "Paciran": [-6.8766, 112.3146],
  "Lamongan": [-7.1164, 112.4159],
  "Sukodadi": [-7.1900, 112.2800],
}

export default function AdminDashboard() {
  const [stat, setStat] = useState(null)
  const [laporanDb, setLaporanDb] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalToko, setTotalToko] = useState(142)

  // Filter & Search State
  const [activeFilterTab, setActiveFilterTab] = useState('Semua') // 'Semua' | 'Anomali' | 'Klir'
  const [searchQuery, setSearchQuery] = useState('')
  const [activeQuickFilter, setActiveQuickFilter] = useState(null)

  // Interactive Case Status States
  const [case1Status, setCase1Status] = useState('PERLU TINDAK LANJUT LAPANGAN')
  const [case3Status, setCase3Status] = useState('DISPARITAS MODERAT (7.5%)')

  // Audio Playback Simulation State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [audioProgress, setAudioProgress] = useState(4)
  const audioIntervalRef = useRef(null)

  // Modals state
  const [modalType, setModalType] = useState(null)
  const [modalData, setModalData] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)

  // Fetch real backend data
  useEffect(() => {
    setLoading(true)
    Promise.all([
      getStatistik().then((res) => res.data?.data).catch(() => null),
      getLaporanAdmin().then((res) => res.data?.data || []).catch(() => []),
      getSemuaToko().then((res) => res.data?.data?.length || 142).catch(() => 142),
    ])
      .then(([statData, laporanData, tokoCount]) => {
        if (statData) setStat(statData)
        if (laporanData) setLaporanDb(laporanData)
        if (tokoCount) setTotalToko(tokoCount)
      })
      .finally(() => setLoading(false))
  }, [])

  // Audio player simulation
  const togglePlayAudio = () => {
    if (isPlayingAudio) {
      clearInterval(audioIntervalRef.current)
      setIsPlayingAudio(false)
    } else {
      setIsPlayingAudio(true)
      let count = 0
      audioIntervalRef.current = setInterval(() => {
        count += 1
        setAudioProgress(count % 6)
        if (count >= 5) {
          clearInterval(audioIntervalRef.current)
          setIsPlayingAudio(false)
        }
      }, 700)
    }
  }

  // Toast feedback helper
  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Quick filter tags click handler
  const handleQuickFilter = (tag) => {
    if (activeQuickFilter === tag) {
      setActiveQuickFilter(null)
      setSearchQuery('')
    } else {
      setActiveQuickFilter(tag)
      if (tag === 'Semen Gresik 50kg (3 Kasus)') setSearchQuery('Semen Gresik')
      else if (tag === 'Kec. Babat') setSearchQuery('Babat')
      else if (tag === 'Disparitas >10%') {
        setActiveFilterTab('Anomali')
        setSearchQuery('')
      }
      else if (tag === 'Besi 10mm SNI') setSearchQuery('Besi')
    }
  }

  // Handle case 1 status change
  const handleTutupKasus = async () => {
    setCase1Status('KLIR / SELESAI')
    if (laporanDb.length > 0) {
      try {
        await updateStatusLaporan(laporanDb[0].id_laporan, 'Selesai', 'Diselesaikan manual oleh Admin')
      } catch (err) {
        console.log('Update status db silent fallback:', err)
      }
    }
    showToast('✅ Kasus TB Makmur Jaya berhasil ditutup dan berstatus Klir!')
  }

  // Handle case 3 approval
  const handleSetujuiVarian = () => {
    setCase3Status('DISETUJUI (VARIAN JARAK - RESMI)')
    showToast('✅ Varian jarak ongkir 15 KM untuk UD Hasil Bumi disetujui!')
  }

  // Counts for tabs
  const tabCounts = useMemo(() => {
    const total = 16 + (laporanDb.length > 3 ? laporanDb.length - 3 : 0)
    const anomali = 7 + (laporanDb.filter(l => Math.abs(l.persentase_disparitas || 0) >= 10).length)
    const klir = total - anomali
    return { total, anomali, klir }
  }, [laporanDb])

  // Filter matching for case 1, 2, 3
  const showCase1 = useMemo(() => {
    if (activeFilterTab === 'Klir' && case1Status !== 'KLIR / SELESAI') return false
    if (activeFilterTab === 'Anomali' && case1Status === 'KLIR / SELESAI') return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const match = 'tb makmur jaya babat semen gresik 50kg smn-grs-50'.includes(q)
      if (!match) return false
    }
    return true
  }, [activeFilterTab, case1Status, searchQuery])

  const showCase2 = useMemo(() => {
    if (activeFilterTab === 'Anomali') return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const match = 'tb sumber abadi paciran besi beton 10mm bsi-10-sni'.includes(q)
      if (!match) return false
    }
    return true
  }, [activeFilterTab, searchQuery])

  const showCase3 = useMemo(() => {
    if (activeFilterTab === 'Klir' && case3Status.includes('MODERAT')) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const match = 'ud hasil bumi lamongan tikung pasir pasang lumajang psr-psg-m3'.includes(q)
      if (!match) return false
    }
    return true
  }, [activeFilterTab, case3Status, searchQuery])

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', color: '#1e293b', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: 76,
          right: 20,
          background: '#0f172a',
          color: '#ffffff',
          padding: '12px 18px',
          borderRadius: 8,
          boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
          fontSize: 13,
          fontWeight: 600,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          border: '1px solid #334155',
          maxWidth: '90vw'
        }}>
          {toastMessage}
        </div>
      )}

      {/* Main Container */}
      <div className="dash-container">

        {/* ── 1. HERO BANNER: SIPAKU AUDIT HUB (Dark Navy Card) ── */}
        <section className="hero-banner-box">
          {/* Top Metadata Row & Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                background: '#ea580c',
                color: '#ffffff',
                fontSize: 11,
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: 4,
                letterSpacing: '0.04em'
              }}>
                SIPAKU AUDIT HUB
              </span>
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                • ID Sesi: PU-LMG-20250518-A7 •
              </span>
              <span style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: 20,
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                Live Sync Whisper-v3
              </span>
            </div>

            {/* Action Buttons Top Right */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => setModalType('ekspor')}
                style={{
                  background: '#ffffff',
                  color: '#0f172a',
                  border: 'none',
                  borderRadius: 7,
                  padding: '8px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                }}
              >
                <span>⤓</span> Ekspor Berita Acara
              </button>
              <button
                onClick={() => setModalType('regulasi')}
                style={{
                  background: '#f59e0b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 7,
                  padding: '8px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)'
                }}
              >
                <span>📄</span> Regulasi &amp; SK Standar
              </button>
            </div>
          </div>

          {/* Banner Title & Subtitle */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, maxWidth: 920, marginBottom: 20 }}>
            <img
              src="/logo.jpg"
              alt="Logo SIPAKU"
              style={{
                width: 48,
                height: 48,
                objectFit: 'contain',
                borderRadius: 10,
                background: '#ffffff',
                border: '2px solid rgba(255,255,255,0.15)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                flexShrink: 0
              }}
            />
            <div>
              <h1 style={{
                fontSize: 'clamp(20px, 4vw, 26px)',
                fontWeight: 800,
                color: '#ffffff',
                margin: '0 0 8px',
                letterSpacing: '-0.02em',
                lineHeight: 1.25
              }}>
                Pusat Pengawasan &amp; Verifikasi Stabilitas Harga Material
              </h1>
              <p style={{
                fontSize: 'clamp(12px, 2.5vw, 13px)',
                color: '#94a3b8',
                margin: 0,
                lineHeight: 1.55
              }}>
                Dinas Pekerjaan Umum Bina Marga &amp; Cipta Karya Kabupaten Lamongan — Audit silang data input suara pedagang (NLP Speech Recognition) terhadap laporan pembeli lapangan secara real-time.
              </p>
            </div>
          </div>

          {/* Search Bar Container */}
          <div className="dash-search-container">
            <span style={{ fontSize: 16, color: '#64748b', marginRight: 8 }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari toko bangunan, nomor SKU, kwitansi warga, atau nama kecamatan..."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: 13,
                color: '#1e293b',
                background: 'transparent'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginRight: 8, fontSize: 13 }}
              >
                ✕
              </button>
            )}
            <button
              onClick={() => showToast(`🔍 Memfilter audit dengan kata kunci: "${searchQuery || 'Semua'}"`)}
              style={{
                background: 'linear-gradient(135deg, #ea580c, #f97316)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 7,
                padding: '9px 18px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>🔍</span> Cari Audit
            </button>
          </div>

          {/* Quick Filters Row (Touch Scrollable on Small Screens) */}
          <div className="horizontal-scroll-touch" style={{ marginTop: 14, alignItems: 'center', fontSize: 11 }}>
            <span style={{ color: '#64748b', fontWeight: 600, flexShrink: 0 }}>Filter Cepat:</span>
            {[
              'Semen Gresik 50kg (3 Kasus)',
              'Kec. Babat',
              'Disparitas >10%',
              'Besi 10mm SNI'
            ].map((tag) => {
              const active = activeQuickFilter === tag
              return (
                <button
                  key={tag}
                  onClick={() => handleQuickFilter(tag)}
                  style={{
                    background: active ? '#ea580c' : 'rgba(255,255,255,0.08)',
                    color: active ? '#ffffff' : '#cbd5e1',
                    border: '1px solid',
                    borderColor: active ? '#ea580c' : 'rgba(255,255,255,0.15)',
                    borderRadius: 20,
                    padding: '3px 12px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  {tag}
                </button>
              )
            })}
            {activeQuickFilter && (
              <button
                onClick={() => { setActiveQuickFilter(null); setSearchQuery('') }}
                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 11, textDecoration: 'underline', flexShrink: 0 }}
              >
                Reset
              </button>
            )}
          </div>
        </section>

        {/* ── 2. METRICS ROW: 4 WHITE CLEAN STAT CARDS ── */}
        <section className="dash-metrics-grid">
          {/* Card 1: Cakupan Penyedia */}
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            padding: '18px 20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', letterSpacing: '0.04em' }}>
                CAKUPAN PENYEDIA
              </span>
              <span style={{ fontSize: 16 }}>🏪</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {totalToko} Toko
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
              Tersebar di 27 Kecamatan Lamongan
            </div>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 4
                }}>
                  Terdata di DB
                </span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Aktif</span>
              </div>
              <Link
                to="/admin/toko"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#0284c7',
                  textDecoration: 'none'
                }}
              >
                Kelola Toko &rarr;
              </Link>
            </div>
          </div>


          {/* Card 2: Aktivitas Suara NLP */}
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            padding: '18px 20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', letterSpacing: '0.04em' }}>
                AKTIVITAS SUARA NLP
              </span>
              <div style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#064e3b',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11
              }}>
                🎙️
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>
              89 Update
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
              Laporan Suara NLP Hari Ini
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>↗</span> Tingkat Akurasi Entitas: 98.4%
            </div>
          </div>

          {/* Card 3: Disparitas Tertunda */}
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            padding: '18px 20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#dc2626', letterSpacing: '0.04em' }}>
                DISPARITAS TERTUNDA
              </span>
              <span style={{ color: '#ef4444', fontSize: 16 }}>⚠️</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#dc2626', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {stat?.per_status?.Pending ?? 7} Temuan
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
              Laporan Warga Menunggu Audit
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: '#dc2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>!</span> 4 Perlu Sidak Lapangan
            </div>
          </div>

          {/* Card 4: Indeks Stabilitas */}
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            padding: '18px 20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', letterSpacing: '0.04em' }}>
                INDEKS STABILITAS
              </span>
              <span style={{ fontSize: 15, color: '#0284c7' }}>🔄</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  94.2%
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
                  Indeks Material Lamongan
                </div>
              </div>
              <div style={{ position: 'relative', width: 40, height: 40 }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="3.5"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10b981"
                    strokeDasharray="94.2, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>✔</span> Terkendali wajar SK Bupati
            </div>
          </div>
        </section>

        {/* ── 3. MAIN WORKSPACE: 2 COLUMNS RESPONSIVE ── */}
        <div className="dash-main-grid">

          {/* ════════════ LEFT COLUMN: CROSS-CHECK MATRIX ════════════ */}
          <main>
            {/* Header Matrix & Tabs */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: 12
            }}>
              <div style={{ borderLeft: '3px solid #0f172a', paddingLeft: 10 }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '0 0 2px' }}>
                  Tabel Verifikasi Silang (Cross-Check Matrix)
                </h2>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                  Sinkronisasi Suara Pedagang NLP vs Kwitansi &amp; Bukti Lapangan Warga
                </p>
              </div>

              {/* Saring Filter Tabs */}
              <div className="horizontal-scroll-touch" style={{ alignItems: 'center', fontSize: 12 }}>
                <span style={{ color: '#64748b', fontWeight: 600, flexShrink: 0 }}>Saring:</span>
                <button
                  onClick={() => setActiveFilterTab('Semua')}
                  style={{
                    background: activeFilterTab === 'Semua' ? '#0f172a' : '#ffffff',
                    color: activeFilterTab === 'Semua' ? '#ffffff' : '#475569',
                    border: '1px solid',
                    borderColor: activeFilterTab === 'Semua' ? '#0f172a' : '#cbd5e1',
                    borderRadius: 20,
                    padding: '4px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Semua ({tabCounts.total})
                </button>
                <button
                  onClick={() => setActiveFilterTab('Anomali')}
                  style={{
                    background: activeFilterTab === 'Anomali' ? '#0f172a' : '#ffffff',
                    color: activeFilterTab === 'Anomali' ? '#ffffff' : '#475569',
                    border: '1px solid',
                    borderColor: activeFilterTab === 'Anomali' ? '#0f172a' : '#cbd5e1',
                    borderRadius: 20,
                    padding: '4px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Anomali ({tabCounts.anomali})
                </button>
                <button
                  onClick={() => setActiveFilterTab('Klir')}
                  style={{
                    background: activeFilterTab === 'Klir' ? '#0f172a' : '#ffffff',
                    color: activeFilterTab === 'Klir' ? '#ffffff' : '#475569',
                    border: '1px solid',
                    borderColor: activeFilterTab === 'Klir' ? '#0f172a' : '#cbd5e1',
                    borderRadius: 20,
                    padding: '4px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Klir ({tabCounts.klir})
                </button>
              </div>
            </div>

            {/* Empty state if search doesn't match */}
            {!showCase1 && !showCase2 && !showCase3 && (
              <div style={{ background: '#ffffff', borderRadius: 12, padding: 36, textAlign: 'center', border: '1px dashed #cbd5e1' }}>
                <p style={{ color: '#64748b', fontSize: 14 }}>Tidak ada kasus audit yang cocok dengan filter / pencarian "{searchQuery}".</p>
                <button
                  onClick={() => { setSearchQuery(''); setActiveFilterTab('Semua') }}
                  style={{ marginTop: 10, background: '#0f172a', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
                >
                  Tampilkan Semua Kasus
                </button>
              </div>
            )}

            {/* ── CARD 1: KASUS ANOMALI (TB Makmur Jaya - Semen Gresik) ── */}
            {showCase1 && (
              <div style={{
                background: '#ffffff',
                borderRadius: 12,
                border: case1Status === 'KLIR / SELESAI' ? '1px solid #e2e8f0' : '1px solid #fecaca',
                padding: '16px 18px',
                marginBottom: 20,
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}>
                {/* Card 1 Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: '#fee2e2',
                      color: '#dc2626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 15,
                      flexShrink: 0
                    }}>
                      🏪
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>TB Makmur Jaya</span>
                        <span style={{ background: '#f1f5f9', color: '#475569', fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4 }}>
                          Kec. Babat
                        </span>
                        <span style={{ background: '#eff6ff', color: '#1e40af', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>
                          SKU: SMN-GRS-50
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                        Material Diaudit: <strong>Semen Gresik 50kg (Portland Type 1)</strong>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    <span style={{
                      background: case1Status === 'KLIR / SELESAI' ? '#dcfce7' : '#fee2e2',
                      color: case1Status === 'KLIR / SELESAI' ? '#15803d' : '#b91c1c',
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '4px 9px',
                      borderRadius: 4,
                      letterSpacing: '0.03em',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: case1Status === 'KLIR / SELESAI' ? '#15803d' : '#b91c1c' }} />
                      {case1Status}
                    </span>
                  </div>
                </div>

                {/* Responsive Split Comparison: Pedagang NLP vs Warga Pembeli */}
                <div className="dash-split-comparison">
                  {/* Box Left: KLAIM PEDAGANG (NLP VOICE) */}
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: 10,
                    padding: 14,
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#475569', letterSpacing: '0.03em' }}>
                          🎙️ KLAIM PEDAGANG (NLP)
                        </span>
                        <span style={{ background: '#0f172a', color: '#ffffff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                          Whisper Conf. 99%
                        </span>
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
                        Rp 60.000 <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>/ zak</span>
                      </div>

                      {/* Interactive Audio Player Bar */}
                      <div style={{
                        marginTop: 10,
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        padding: '6px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}>
                        <button
                          onClick={togglePlayAudio}
                          title={isPlayingAudio ? 'Jeda' : 'Putar rekaman'}
                          style={{
                            background: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '50%',
                            width: 26,
                            height: 26,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: 11,
                            flexShrink: 0
                          }}
                        >
                          {isPlayingAudio ? '⏸' : '▶'}
                        </button>
                        {/* Audio Waveform Bars */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1, height: 18, overflow: 'hidden' }}>
                          {[6, 12, 18, 14, 8, 16, 10, 14, 6, 10, 15, 18, 12, 8, 14].map((h, i) => (
                            <span
                              key={i}
                              style={{
                                width: 3,
                                height: isPlayingAudio ? `${Math.max(4, (h * (audioProgress + 1)) % 18 + 4)}px` : `${h}px`,
                                background: isPlayingAudio ? '#0284c7' : '#38bdf8',
                                borderRadius: 2,
                                transition: 'height 0.15s ease',
                                flexShrink: 0
                              }}
                            />
                          ))}
                        </div>
                        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>0:04</span>
                      </div>

                      <p style={{
                        margin: '10px 0 0',
                        fontSize: 11.5,
                        color: '#475569',
                        fontStyle: 'italic',
                        background: '#ffffff',
                        padding: '8px 10px',
                        borderRadius: 6,
                        border: '1px dashed #cbd5e1',
                        lineHeight: 1.45
                      }}>
                        "...stok Semen Gresik seket kilo enem puluh ewu per zak ready Babat..."
                      </p>
                    </div>

                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10.5, color: '#64748b', flexWrap: 'wrap', gap: 4 }}>
                      <span>Input: 18 Mei, 08:14 WIB</span>
                      <span style={{ color: '#0d9488', fontWeight: 700 }}>✔ Sah Terverifikasi</span>
                    </div>
                  </div>

                  {/* Box Right: LAPORAN PEMBELI WARGA */}
                  <div style={{
                    background: '#fef2f2',
                    borderRadius: 10,
                    padding: 14,
                    border: '1px solid #fee2e2',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#991b1b', letterSpacing: '0.03em' }}>
                          📄 LAPORAN PEMBELI
                        </span>
                        <span style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                          OCR Match 97%
                        </span>
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626' }}>
                        Rp 70.000 <span style={{ fontSize: 13, fontWeight: 500, color: '#991b1b' }}>/ zak</span>
                      </div>

                      {/* Receipt Photo Card Snippet */}
                      <div
                        onClick={() => { setModalData({ toko: 'TB Makmur Jaya', material: 'Semen Gresik 50kg', harga: 70000 }); setModalType('struk') }}
                        style={{
                          marginTop: 10,
                          background: '#ffffff',
                          borderRadius: 8,
                          border: '1px solid #fecaca',
                          padding: 8,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{
                          width: 38,
                          height: 38,
                          borderRadius: 6,
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          flexShrink: 0
                        }}>
                          🧾
                        </div>
                        <div style={{ fontSize: 11, lineHeight: 1.3, overflow: 'hidden' }}>
                          <strong style={{ color: '#0f172a', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            struk_kasir_180525_babat.jpg
                          </strong>
                          <span style={{ color: '#64748b', fontSize: 10.5 }}>
                            Kasir: Siti • Cap Basah TB MJ
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10.5, color: '#991b1b', flexWrap: 'wrap', gap: 4 }}>
                      <span>Pelapor: Ahmad Z. (Babat)</span>
                      <span style={{ fontWeight: 600 }}>Dilaporkan 10:20 WIB</span>
                    </div>
                  </div>
                </div>

                {/* Disparity Alert Banner */}
                <div style={{
                  background: '#fff1f2',
                  border: '1px solid #ffe4e6',
                  borderRadius: 8,
                  padding: '10px 12px',
                  marginBottom: 14,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 240 }}>
                    <span style={{ fontSize: 16, color: '#e11d48', flexShrink: 0 }}>📈</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#be123c' }}>
                        Selisih Disparitas: +Rp 10.000 (16.7% Deviasi Tidak Wajar)
                      </div>
                      <div style={{ fontSize: 11, color: '#9f1239', marginTop: 1 }}>
                        Melebihi toleransi regional PU (Maks. 5.0%). Indikasi markup harga eceran.
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#475569',
                    background: '#ffffff',
                    padding: '3px 8px',
                    borderRadius: 6,
                    border: '1px solid #fecdd3',
                    flexShrink: 0
                  }}>
                    Pagu Standar: Rp 61.500
                  </div>
                </div>

                {/* Footer Tools & Action Buttons Responsive */}
                <div className="dash-card-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, flexWrap: 'wrap' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Alat:</span>
                    <button
                      onClick={() => { setModalData({ toko: 'TB Makmur Jaya', material: 'Semen Gresik 50kg' }); setModalType('struk') }}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: 6,
                        padding: '5px 10px',
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#334155',
                        cursor: 'pointer'
                      }}
                    >
                      👁️ Lihat Struk
                    </button>
                    <button
                      onClick={() => { setModalData({ toko: 'TB Makmur Jaya' }); setModalType('suara') }}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: 6,
                        padding: '5px 10px',
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#334155',
                        cursor: 'pointer'
                      }}
                    >
                      🎧 Dengar Suara
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      onClick={handleTutupKasus}
                      style={{
                        background: '#ffffff',
                        color: '#475569',
                        border: '1px solid #cbd5e1',
                        borderRadius: 6,
                        padding: '6px 12px',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Tutup Kasus
                    </button>
                    <button
                      onClick={() => { setModalData({ toko: 'TB Makmur Jaya', material: 'Semen Gresik 50kg', selisih: 10000 }); setModalType('teguran') }}
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 12px',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(234, 88, 12, 0.25)'
                      }}
                    >
                      ✉️ Kirim Teguran
                    </button>
                    <button
                      onClick={() => { setModalData({ toko: 'TB Makmur Jaya', kecamatan: 'Babat' }); setModalType('disposisi') }}
                      style={{
                        background: '#0f172a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 12px',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      📋 Tugaskan Petugas
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── CARD 2: KASUS KLIR (TB Sumber Abadi - Besi Beton 10mm SNI) ── */}
            {showCase2 && (
              <div style={{
                background: '#ffffff',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                padding: '16px 18px',
                marginBottom: 20,
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: '#eff6ff',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      flexShrink: 0
                    }}>
                      ✔
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>TB Sumber Abadi</span>
                        <span style={{ background: '#f1f5f9', color: '#475569', fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4 }}>
                          Kec. Paciran
                        </span>
                        <span style={{ background: '#eff6ff', color: '#1e40af', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>
                          SKU: BSI-10-SNI
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        Material Diaudit: <strong>Besi Beton 10mm SNI Polos (12 Meter)</strong>
                      </div>
                    </div>
                  </div>

                  <span style={{
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    border: '1px solid #bfdbfe',
                    fontSize: 10.5,
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: 4
                  }}>
                    ● KLIR &amp; SESUAI STANDARD
                  </span>
                </div>

                {/* 3-Column Compact Comparison Responsive */}
                <div className="dash-triple-stats">
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Suara Penjual (NLP)</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                      Rp 80.000 <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>/ batang</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#0d9488', marginTop: 2 }}>Audio ID #VOC-819 • Akurat</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Laporan Pembeli</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                      Rp 80.000 <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>/ batang</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#0284c7', marginTop: 2 }}>Struk OCR Terkonfirmasi (100%)</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Selisih Disparitas</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#16a34a', marginTop: 2 }}>
                      Rp 0 <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>(0.0%)</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Audit Otomatis Tersertifikasi</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10.5, color: '#64748b', flexWrap: 'wrap', gap: 6 }}>
                  <span>Auditor Otomatis: System Rule #PU-MAT-2025</span>
                  <span style={{ color: '#0d9488', fontWeight: 700 }}>✔ Tersertifikasi Berita Acara Mingguan</span>
                </div>
              </div>
            )}

            {/* ── CARD 3: KASUS DISPARITAS MODERAT (UD Hasil Bumi Lamongan - Pasir Pasang) ── */}
            {showCase3 && (
              <div style={{
                background: '#ffffff',
                borderRadius: 12,
                border: '1px solid #fed7aa',
                padding: '16px 18px',
                marginBottom: 24,
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: '#fff7ed',
                      color: '#ea580c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      flexShrink: 0
                    }}>
                      🏗️
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>UD Hasil Bumi Lamongan</span>
                        <span style={{ background: '#f1f5f9', color: '#475569', fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4 }}>
                          Kec. Tikung
                        </span>
                        <span style={{ background: '#eff6ff', color: '#1e40af', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>
                          SKU: PSR-PSG-M3
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        Material Diaudit: <strong>Pasir Pasang Lumajang (Grade A)</strong>
                      </div>
                    </div>
                  </div>

                  <span style={{
                    background: case3Status.includes('MODERAT') ? '#ffedd5' : '#dcfce7',
                    color: case3Status.includes('MODERAT') ? '#c2410c' : '#15803d',
                    fontSize: 10.5,
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: 4
                  }}>
                    {case3Status}
                  </span>
                </div>

                <div className="dash-triple-stats">
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Klaim Suara Pedagang</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                      Rp 320.000 <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>/ M3</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Transkrip: "Pasir pasang..."</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Faktur Pembeli</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                      Rp 345.000 <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>/ M3</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Delivery Note #1102</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Selisih &amp; Ongkir</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#d97706', marginTop: 2 }}>
                      +Rp 25.000 <span style={{ fontSize: 10, color: '#64748b', fontWeight: 500 }}>(Toleransi)</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Radius: 15 KM</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, fontSize: 11 }}>
                  <span style={{ color: '#64748b' }}>
                    Konfirmasi radius armada toko dari lokasi proyek
                  </span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => showToast('📞 Notifikasi klarifikasi ongkir telah dikirim ke UD Hasil Bumi')}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: 6,
                        padding: '5px 10px',
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#334155',
                        cursor: 'pointer'
                      }}
                    >
                      Klarifikasi Ongkir
                    </button>
                    <button
                      onClick={handleSetujuiVarian}
                      style={{
                        background: '#0f172a',
                        border: 'none',
                        borderRadius: 6,
                        padding: '5px 10px',
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      Setujui Varian Jarak
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── 4. BUKTI FISIK TERUNGGAH PENGAWAS LAPANGAN ── */}
            <section style={{
              background: '#ffffff',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              padding: '16px 18px',
              marginTop: 10
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>📸</span>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>
                    Bukti Fisik Terunggah Pengawas Lapangan
                  </span>
                </div>
                <button
                  onClick={() => setModalType('galeri')}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: '#0284c7',
                    cursor: 'pointer'
                  }}
                >
                  Lihat Arsip Galeri (48 File) →
                </button>
              </div>

              {/* Responsive 4-Photo Grid */}
              <div className="dash-gallery-grid">
                {[
                  {
                    title: 'Struk Kasir Asli Babat',
                    subtitle: 'Verif OCR: TB Makmur Jaya',
                    icon: '🧾',
                    bg: '#f1f5f9',
                    tag: 'Kwitansi Toko'
                  },
                  {
                    title: 'Stok Besi Beton SNI',
                    subtitle: 'TB Sumber Abadi Paciran',
                    icon: '🔩',
                    bg: '#e2e8f0',
                    tag: 'Gudang Paciran'
                  },
                  {
                    title: 'Armada Truk Pasir Pasang',
                    subtitle: 'UD Hasil Bumi Tikung',
                    icon: '🚛',
                    bg: '#fef3c7',
                    tag: 'Radius 15KM'
                  },
                  {
                    title: 'Etalase TB Makmur Jaya',
                    subtitle: 'Koridor Utama Babat',
                    icon: '🏢',
                    bg: '#ffedd5',
                    tag: 'Sidak Fisik'
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => { setModalData(item); setModalType('galeri') }}
                    style={{
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      height: 90,
                      background: item.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 32,
                      position: 'relative'
                    }}>
                      <span>{item.icon}</span>
                      <span style={{
                        position: 'absolute',
                        top: 6,
                        left: 6,
                        background: 'rgba(15, 23, 42, 0.75)',
                        color: '#ffffff',
                        fontSize: 9,
                        fontWeight: 700,
                        padding: '2px 5px',
                        borderRadius: 3
                      }}>
                        {item.tag}
                      </span>
                    </div>
                    <div style={{ padding: '8px 10px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </main>

          {/* ════════════ RIGHT COLUMN: SIDEBAR WIDGETS ════════════ */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* ── WIDGET 1: HEATMAP DISPARITAS WILAYAH ── */}
            <div style={{
              background: '#ffffff',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              padding: 16,
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', margin: '0 0 2px' }}>
                    Heatmap Disparitas Wilayah
                  </h3>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    27 Kecamatan • Update 10 Mnt Lalu
                  </div>
                </div>
                <Link to="/admin/peta" style={{ fontSize: 16, textDecoration: 'none', color: '#64748b' }}>
                  🗺️
                </Link>
              </div>

              {/* Interactive Mini Leaflet Map Container */}
              <div style={{
                borderRadius: 8,
                overflow: 'hidden',
                height: 180,
                border: '1px solid #e2e8f0',
                position: 'relative',
                marginBottom: 12
              }}>
                <MapContainer
                  center={[-7.1038, 112.28]}
                  zoom={10}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                  attributionControl={false}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {Object.entries(KOORDINAT_KECAMATAN).map(([kec, coords]) => {
                    const isRed = kec === 'Babat' || kec === 'Brondong'
                    const isYellow = kec === 'Tikung'
                    const color = isRed ? '#ef4444' : isYellow ? '#f59e0b' : '#10b981'
                    return (
                      <CircleMarker
                        key={kec}
                        center={coords}
                        radius={isRed ? 10 : 6}
                        pathOptions={{ color, fillColor: color, fillOpacity: 0.8 }}
                      >
                        <Popup>
                          <strong>Kec. {kec}</strong><br />
                          Status: {isRed ? 'Zona Merah (+14%)' : isYellow ? 'Zona Kuning' : 'Normal'}
                        </Popup>
                      </CircleMarker>
                    )
                  })}
                </MapContainer>

                {/* Hotspot Floating Callout */}
                <div style={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  zIndex: 400,
                  background: 'rgba(255,255,255,0.95)',
                  padding: '4px 8px',
                  borderRadius: 6,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  fontSize: 10,
                  fontWeight: 800,
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626' }} />
                  Hotspot: Babat &amp; Brondong
                </div>
              </div>

              {/* 3 Status Zone Cards Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 14 }}>
                <div style={{ background: '#dcfce7', borderRadius: 6, padding: '7px 4px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: '#166534' }}>● Hijau</div>
                  <div style={{ fontSize: 9, color: '#15803d', marginTop: 1 }}>19 Kec</div>
                </div>
                <div style={{ background: '#fef3c7', borderRadius: 6, padding: '7px 4px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: '#92400e' }}>● Kuning</div>
                  <div style={{ fontSize: 9, color: '#b45309', marginTop: 1 }}>6 Kec</div>
                </div>
                <div style={{ background: '#fee2e2', borderRadius: 6, padding: '7px 4px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: '#991b1b' }}>● Merah</div>
                  <div style={{ fontSize: 9, color: '#b91c1c', marginTop: 1 }}>2 Kec</div>
                </div>
              </div>

              {/* Tingkat Disparitas Tertinggi List */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '0.04em', marginBottom: 6 }}>
                  TINGKAT DISPARITAS TERTINGGI:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { rank: '1. Kec. Babat', val: '+14.8%', color: '#dc2626', zone: 'Zona Merah', desc: 'Semen & Besi' },
                    { rank: '2. Kec. Brondong', val: '+11.2%', color: '#dc2626', zone: 'Zona Merah', desc: 'Cat & Baja' },
                    { rank: '3. Kec. Tikung', val: '+7.5%', color: '#d97706', zone: 'Zona Kuning', desc: 'Agregat & Pasir' },
                    { rank: '4. Kec. Paciran', val: '+0.8%', color: '#16a34a', zone: 'Zona Hijau', desc: 'Bata Ringan' },
                  ].map((row, i) => (
                    <div
                      key={i}
                      onClick={() => setSearchQuery(row.rank.replace(/^[0-9.]+\s*Kec\.\s*/, ''))}
                      style={{
                        paddingBottom: 5,
                        borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0f172a' }}>{row.rank}</span>
                        <span style={{ fontSize: 11.5, fontWeight: 800, color: row.color }}>{row.val}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: '#64748b' }}>
                        <span>{row.desc}</span>
                        <span style={{ color: row.color, fontWeight: 600 }}>{row.zone}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── WIDGET 2: TIM VERLAP CIPTA KARYA SIAGA ── */}
            <div style={{
              background: '#ffffff',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              padding: 16,
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Tim Verlap Cipta Karya
                </h3>
                <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>
                  3 Tim Aktif
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                <div style={{
                  background: '#f8fafc',
                  borderRadius: 8,
                  padding: '8px 10px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 700 }}>
                      T01
                    </div>
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0f172a' }}>
                        Tim 01 • Hendra W.
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>
                        Koridor Babat - Sukodadi
                      </div>
                    </div>
                  </div>
                  <span style={{ background: '#ffedd5', color: '#c2410c', fontSize: 9.5, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                    Menuju Lokasi
                  </span>
                </div>

                <div style={{
                  background: '#f8fafc',
                  borderRadius: 8,
                  padding: '8px 10px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#0284c7', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 700 }}>
                      T02
                    </div>
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0f172a' }}>
                        Tim 02 • Dina M.
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>
                        Pantura Brondong - Paciran
                      </div>
                    </div>
                  </div>
                  <span style={{ background: '#f1f5f9', color: '#475569', fontSize: 9.5, fontWeight: 600, padding: '2px 6px', borderRadius: 4 }}>
                    Standby
                  </span>
                </div>
              </div>

              <button
                onClick={() => { setModalData({ team: 'Tim 03' }); setModalType('disposisi') }}
                style={{
                  width: '100%',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#1d4ed8',
                  borderRadius: 8,
                  padding: '8px',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <span>📋</span> Disposisi Penugasan Baru
              </button>
            </div>

            {/* ── WIDGET 3: RINGKASAN VALIDASI HARIAN ── */}
            <div style={{
              background: '#ffffff',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              padding: 16,
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>📊</span> Validasi Harian
                </h3>
                <span style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600 }}>18 Mei 2025</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div style={{ background: '#f0fdfa', borderRadius: 8, padding: '10px 12px', border: '1px solid #ccfbf1' }}>
                  <div style={{ fontSize: 10.5, color: '#0d9488', fontWeight: 600 }}>Terselesaikan</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f766e', marginTop: 1 }}>24 Kasus</div>
                  <div style={{ fontSize: 9.5, color: '#14b8a6', marginTop: 1 }}>82.7% target</div>
                </div>
                <div style={{ background: '#fff1f2', borderRadius: 8, padding: '10px 12px', border: '1px solid #ffe4e6' }}>
                  <div style={{ fontSize: 10.5, color: '#e11d48', fontWeight: 600 }}>Teguran Terbit</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#be123c', marginTop: 1 }}>3 Surat</div>
                  <div style={{ fontSize: 9.5, color: '#fb7185', marginTop: 1 }}>Babat &amp; Brondong</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10.5 }}>
                <span style={{ color: '#059669', fontWeight: 700 }}>● Sesi: Normal</span>
                <Link to="/admin/verifikasi" style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 700 }}>
                  Lihat Log →
                </Link>
              </div>
            </div>

          </aside>
        </div>

        {/* ── 4. FOOTER IDENTITAS RESMI ── */}
        <footer style={{
          marginTop: 40,
          paddingTop: 18,
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          fontSize: 11,
          color: '#64748b'
        }}>
          <div>
            <strong style={{ color: '#0f172a' }}>SIPAKU Kabupaten Lamongan</strong> — © 2024 Dinas Pekerjaan Umum Bina Marga &amp; Cipta Karya.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <span>FastAPI Core v2.4</span>
            <span>•</span>
            <span>NLP Engine v1.8</span>
            <span>•</span>
            <span style={{ color: '#0284c7', cursor: 'pointer' }} onClick={() => setModalType('regulasi')}>Dokumentasi OpenAPI</span>
          </div>
        </footer>

      </div>

      {/* ════════════ MODALS & POPUPS (RESPONSIVE) ════════════ */}

      {/* MODAL 1: EKSPOR BERITA ACARA */}
      {modalType === 'ekspor' && (
        <div style={MODAL_BACKDROP} onClick={() => setModalType(null)}>
          <div style={MODAL_BOX} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 15, color: '#0f172a' }}>
                📄 Cetak &amp; Ekspor Berita Acara Audit
              </h3>
              <button onClick={() => setModalType(null)} style={BTN_CLOSE}>✕</button>
            </div>
            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, lineHeight: 1.55, color: '#334155' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: 8, marginBottom: 10 }}>
                <strong style={{ fontSize: 13, color: '#0f172a', display: 'block' }}>PEMERINTAH KABUPATEN LAMONGAN</strong>
                <div style={{ fontSize: 10.5, fontWeight: 700 }}>DINAS PEKERJAAN UMUM BINA MARGA &amp; CIPTA KARYA</div>
                <div style={{ fontSize: 9.5, color: '#64748b' }}>BERITA ACARA AUDIT NO: BA-PU/LMG/2025/05-18</div>
              </div>
              <p style={{ margin: '6px 0' }}>Pada hari ini, 18 Mei 2025, telah dilakukan audit silang komparasi harga material konstruksi:</p>
              <ul style={{ paddingLeft: 18, margin: '6px 0' }}>
                <li>Total Toko Diaudit: <strong>{totalToko} Toko Bangunan</strong></li>
                <li>Temuan Disparitas &gt;5%: <strong>7 Kasus</strong></li>
                <li>Tingkat Kepatuhan Regional: <strong>94.2%</strong></li>
              </ul>
              <div style={{ marginTop: 12, textAlign: 'right' }}>
                <div>Lamongan, 18 Mei 2025</div>
                <div style={{ fontWeight: 700, marginTop: 24 }}>Ir. Budi Santoso</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>NIP. 19780312 200501 1 008</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button onClick={() => setModalType(null)} style={BTN_SECONDARY}>Tutup</button>
              <button
                onClick={() => { window.print(); setModalType(null) }}
                style={BTN_PRIMARY}
              >
                🖨️ Cetak / Unduh PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REGULASI & SK STANDAR */}
      {modalType === 'regulasi' && (
        <div style={MODAL_BACKDROP} onClick={() => setModalType(null)}>
          <div style={MODAL_BOX} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 15, color: '#0f172a' }}>
                📜 Regulasi SK Standar Satuan Harga (SSH)
              </h3>
              <button onClick={() => setModalType(null)} style={BTN_CLOSE}>✕</button>
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.55, color: '#334155' }}>
              <div style={{ background: '#eff6ff', padding: 10, borderRadius: 8, border: '1px solid #bfdbfe', marginBottom: 12 }}>
                <strong style={{ color: '#1e40af', fontSize: 12 }}>SK Bupati Lamongan No. 188/45/KEP/413.013/2024</strong>
                <p style={{ margin: '3px 0 0', fontSize: 11.5, color: '#1e3a8a' }}>
                  Pedoman Standar Harga Satuan Bahan Bangunan dan Konstruksi Pekerjaan Umum Daerah Kabupaten Lamongan TA 2024/2025.
                </p>
              </div>
              <h4 style={{ margin: '8px 0 4px', fontSize: 12.5, color: '#0f172a' }}>Aturan Ambang Batas Disparitas:</h4>
              <ul style={{ paddingLeft: 18, margin: 0, fontSize: 11.5 }}>
                <li><strong>Maksimal Deviasi Wajar:</strong> 5.0% di atas SSH kabupaten (transport normal).</li>
                <li><strong>Disparitas Moderat (5.0% - 9.9%):</strong> Wajib verifikasi komponen ongkir dan radius (&gt;10 KM).</li>
                <li><strong>Disparitas Signifikan (≥ 10.0%):</strong> Wajib terbit Teguran Digital dan Sidak Petugas Verlap.</li>
              </ul>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setModalType(null)} style={BTN_PRIMARY}>Mengerti</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: LIHAT STRUK KASIR ASLI */}
      {modalType === 'struk' && (
        <div style={MODAL_BACKDROP} onClick={() => setModalType(null)}>
          <div style={MODAL_BOX} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 15, color: '#0f172a' }}>
                🧾 Bukti Kwitansi / Struk Kasir
              </h3>
              <button onClick={() => setModalType(null)} style={BTN_CLOSE}>✕</button>
            </div>
            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                padding: '14px 16px',
                maxWidth: 290,
                margin: '0 auto',
                boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                fontFamily: 'monospace',
                fontSize: 11.5,
                textAlign: 'left'
              }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', borderBottom: '1px dashed #64748b', paddingBottom: 6 }}>
                  TB MAKMUR JAYA<br />
                  <span style={{ fontSize: 9.5, fontWeight: 'normal' }}>Jl. Raya Babat No. 112, Lamongan</span>
                </div>
                <div style={{ margin: '6px 0', fontSize: 10.5 }}>
                  No: #TRX-8821<br />
                  Tgl: 18/05/2025 10:14 WIB<br />
                  Kasir: Siti
                </div>
                <div style={{ borderTop: '1px dashed #64748b', borderBottom: '1px dashed #64748b', padding: '5px 0', margin: '6px 0' }}>
                  Semen Gresik 50kg (1 zak)<br />
                  <span style={{ float: 'right', fontWeight: 'bold' }}>Rp 70.000</span>
                  <div style={{ clear: 'both' }}></div>
                </div>
                <div style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  TOTAL: Rp 70.000
                </div>
                <div style={{ marginTop: 10, textAlign: 'center', fontSize: 9.5, color: '#059669', border: '1px solid #059669', padding: 3, borderRadius: 4 }}>
                  [CAP BASAH TB MAKMUR JAYA - LUNAS]
                </div>
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: '#64748b' }}>
                OCR Confidence: <strong>97.4% (Tervalidasi)</strong>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button onClick={() => setModalType(null)} style={BTN_SECONDARY}>Tutup</button>
              <button onClick={() => { showToast('📥 File struk berhasil diunduh.'); setModalType(null) }} style={BTN_PRIMARY}>
                📥 Unduh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DENGAR REKAMAN SUARA NLP */}
      {modalType === 'suara' && (
        <div style={MODAL_BACKDROP} onClick={() => setModalType(null)}>
          <div style={MODAL_BOX} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 15, color: '#0f172a' }}>
                🎙️ Audio Spektrogram &amp; Parsing NLP
              </h3>
              <button onClick={() => setModalType(null)} style={BTN_CLOSE}>✕</button>
            </div>
            <div style={{ background: '#0b1329', padding: 18, borderRadius: 10, color: '#ffffff', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🎧</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#38bdf8' }}>
                Klaim Pedagang TB Makmur Jaya
              </div>
              <p style={{ fontSize: 11.5, color: '#94a3b8', fontStyle: 'italic', margin: '6px 0 14px' }}>
                "...stok Semen Gresik seket kilo enem puluh ewu per zak ready Babat..."
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 3, height: 36, marginBottom: 14 }}>
                {[12, 24, 36, 18, 28, 38, 20, 32, 16, 26, 34, 18, 30].map((h, i) => (
                  <span key={i} style={{ width: 3.5, height: `${h}px`, background: '#38bdf8', borderRadius: 2 }} />
                ))}
              </div>
              <div style={{ fontSize: 11, background: 'rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: 6, display: 'inline-flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <span>Model: <strong>Whisper-v3 Regional</strong></span>
                <span>Confidence: <strong>99.1%</strong></span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <button onClick={() => setModalType(null)} style={BTN_PRIMARY}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: KIRIM TEGURAN DIGITAL */}
      {modalType === 'teguran' && (
        <div style={MODAL_BACKDROP} onClick={() => setModalType(null)}>
          <div style={MODAL_BOX} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 15, color: '#0f172a' }}>
                ✉️ Penerbitan Surat Teguran Digital
              </h3>
              <button onClick={() => setModalType(null)} style={BTN_CLOSE}>✕</button>
            </div>
            <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.5 }}>
              <p style={{ margin: '0 0 10px' }}>Surat peringatan dari Dinas PU Lamongan akan diterbitkan ke portal toko pedagang.</p>
              <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 10 }}>
                <div>Tujuan: <strong>TB Makmur Jaya (Kec. Babat)</strong></div>
                <div>Perihal: <strong>Peringatan Disparitas Harga Semen Gresik (+16.7%)</strong></div>
                <div>Batas: <strong>2 x 24 Jam Kerja</strong></div>
              </div>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Catatan Tambahan Petugas:</label>
              <textarea
                rows={3}
                defaultValue="Ditemukan perbedaan Rp 10.000 antara konfirmasi suara survei dengan bukti kwitansi transaksi langsung warga. Mohon lakukan kalibrasi harga kasir."
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11.5, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button onClick={() => setModalType(null)} style={BTN_SECONDARY}>Batal</button>
              <button
                onClick={() => {
                  setCase1Status('TEGURAN TERKIRIM (2x24 Jam)')
                  showToast('✉️ Surat Teguran Resmi PU berhasil diterbitkan!')
                  setModalType(null)
                }}
                style={{ ...BTN_PRIMARY, background: '#ea580c' }}
              >
                🚀 Terbitkan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: DISPOSISI PETUGAS VERLAP */}
      {modalType === 'disposisi' && (
        <div style={MODAL_BACKDROP} onClick={() => setModalType(null)}>
          <div style={MODAL_BOX} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 15, color: '#0f172a' }}>
                📋 Surat Tugas Verifikasi Lapangan (Verlap)
              </h3>
              <button onClick={() => setModalType(null)} style={BTN_CLOSE}>✕</button>
            </div>
            <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.5 }}>
              <p style={{ margin: '0 0 10px' }}>Tugaskan tim teknis Cipta Karya siaga untuk inspeksi fisik ke toko sasaran.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                <div>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: 3 }}>Pilih Tim Bertugas:</label>
                  <select style={{ width: '100%', padding: '7px 9px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11.5 }}>
                    <option>Tim 01 • Hendra W., ST (Babat)</option>
                    <option>Tim 02 • Dina Marlina, MT (Pantura)</option>
                    <option>Tim 03 • Aris Munandar, ST (Lamongan Pusat)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: 3 }}>Prioritas Sidak:</label>
                  <select style={{ width: '100%', padding: '7px 9px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11.5 }}>
                    <option>Tinggi (Hari Ini)</option>
                    <option>Sedang (1x24 Jam)</option>
                    <option>Rutin Mingguan</option>
                  </select>
                </div>
              </div>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 3 }}>Instruksi Sidak:</label>
              <input
                type="text"
                defaultValue="Periksa stok fisik Semen Gresik di gudang Babat & minta salinan faktur distributor."
                style={{ width: '100%', padding: '7px 9px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11.5, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button onClick={() => setModalType(null)} style={BTN_SECONDARY}>Batal</button>
              <button
                onClick={() => {
                  showToast('📋 Surat Perintah Tugas Verlap berhasil diterbitkan ke Tim 01!')
                  setModalType(null)
                }}
                style={BTN_PRIMARY}
              >
                Kirim Disposisi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: GALERI BUKTI FISIK LAPANGAN */}
      {modalType === 'galeri' && (
        <div style={MODAL_BACKDROP} onClick={() => setModalType(null)}>
          <div style={{ ...MODAL_BOX, maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 15, color: '#0f172a' }}>
                📸 Arsip Bukti Fisik Lapangan &amp; Geolokasi
              </h3>
              <button onClick={() => setModalType(null)} style={BTN_CLOSE}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div style={{ background: '#f1f5f9', borderRadius: 8, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60 }}>
                {modalData?.icon || '🏢'}
              </div>
              <div style={{ fontSize: 11.5, color: '#334155', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h4 style={{ margin: '0 0 4px', fontSize: 14, color: '#0f172a' }}>
                  {modalData?.title || 'Dokumentasi Sidak Pengawas'}
                </h4>
                <div style={{ color: '#64748b', marginBottom: 8 }}>
                  Lokasi: {modalData?.subtitle || 'Kabupaten Lamongan'}
                </div>
                <div style={{ background: '#f8fafc', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', lineHeight: 1.55 }}>
                  <div>GPS: <strong>-7.1038° S, 112.2100° E</strong></div>
                  <div>Timestamp: <strong>18 Mei 2025, 08:30 WIB</strong></div>
                  <div>Petugas: <strong>Tim 01 Verlap Cipta Karya</strong></div>
                  <div>Status: <strong style={{ color: '#059669' }}>Tervalidasi Digital</strong></div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <button onClick={() => setModalType(null)} style={BTN_PRIMARY}>Tutup Galeri</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ── INLINE STYLES FOR REUSABLE MODALS & BUTTONS ──
const MODAL_BACKDROP = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(15, 23, 42, 0.65)',
  backdropFilter: 'blur(3px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9990,
  padding: '16px'
}

const MODAL_BOX = {
  background: '#ffffff',
  borderRadius: 12,
  maxWidth: 520,
  width: '100%',
  maxHeight: '90vh',
  overflowY: 'auto',
  padding: '20px',
  boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
  border: '1px solid #e2e8f0',
  boxSizing: 'border-box'
}

const BTN_CLOSE = {
  background: 'none',
  border: 'none',
  fontSize: 16,
  color: '#64748b',
  cursor: 'pointer'
}

const BTN_PRIMARY = {
  background: '#0f172a',
  color: '#ffffff',
  border: 'none',
  borderRadius: 7,
  padding: '8px 16px',
  fontSize: 12.5,
  fontWeight: 700,
  cursor: 'pointer'
}

const BTN_SECONDARY = {
  background: '#ffffff',
  color: '#475569',
  border: '1px solid #cbd5e1',
  borderRadius: 7,
  padding: '8px 14px',
  fontSize: 12.5,
  fontWeight: 600,
  cursor: 'pointer'
}
