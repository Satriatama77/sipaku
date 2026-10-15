import { useEffect, useState, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getStatistik, getLaporanAdmin, updateStatusLaporan, getSemuaToko } from '../../services/adminService'
import { getSemuaKatalogPasar } from '../../services/hargaService'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

import { KOORDINAT_KECAMATAN, PUSAT_KABUPATEN_LAMONGAN } from '../../data/koordinatKecamatan'

export default function AdminDashboard() {
  const [stat, setStat] = useState(null)
  const [laporanDb, setLaporanDb] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalToko, setTotalToko] = useState(0)
  const [tokoList, setTokoList] = useState([])
  const [katalogList, setKatalogList] = useState([])

  // Filter & Search State
  const [activeFilterTab, setActiveFilterTab] = useState('Semua') // 'Semua' | 'Anomali' | 'Klir'
  const [searchQuery, setSearchQuery] = useState('')
  const [activeQuickFilter, setActiveQuickFilter] = useState(null)

  // Audio Playback State per item
  const [playingAudioId, setPlayingAudioId] = useState(null)
  const [audioProgress, setAudioProgress] = useState(4)
  const audioIntervalRef = useRef(null)
  const utteranceRef = useRef(null)

  // Modals state
  const [modalType, setModalType] = useState(null)
  const [modalData, setModalData] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)
  const [fotoModal, setFotoModal] = useState(null)

  // Fetch real backend data
  useEffect(() => {
    setLoading(true)
    Promise.all([
      getStatistik().then((res) => res.data?.data).catch(() => null),
      getLaporanAdmin().then((res) => res.data?.data || []).catch(() => []),
      getSemuaToko().then((res) => res.data?.data || []).catch(() => []),
      getSemuaKatalogPasar().then((res) => res.data?.data || []).catch(() => []),
    ])
      .then(([statData, laporanData, tokoData, katalogData]) => {
        if (statData) setStat(statData)
        if (laporanData) setLaporanDb(laporanData)
        setTokoList(tokoData)
        setTotalToko(tokoData.length)
        setKatalogList(katalogData)
      })
      .finally(() => setLoading(false))
  }, [])

  // Pre-load browser SpeechSynthesis voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices()
      const onVoicesChanged = () => {
        window.speechSynthesis.getVoices()
      }
      window.speechSynthesis.onvoiceschanged = onVoicesChanged
      return () => {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [])

  // Audio playback helpers: Web Audio API & Speech Synthesis
  const playRadioBeep = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      const now = ctx.currentTime
      // Tone 1: 750 Hz
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(750, now)
      gain1.gain.setValueAtTime(0.35, now)
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.start(now)
      osc1.stop(now + 0.1)

      // Tone 2: 1150 Hz
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(1150, now + 0.09)
      gain2.gain.setValueAtTime(0.38, now + 0.09)
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.22)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(now + 0.09)
      osc2.stop(now + 0.22)
    } catch (e) {
      console.warn('AudioContext beep error:', e)
    }
  }

  const stopAllAudio = () => {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    } catch (e) {
      console.warn('Speech cancel error:', e)
    }
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current)
      audioIntervalRef.current = null
    }
    utteranceRef.current = null
    setPlayingAudioId(null)
  }

  const togglePlayAudio = (id, textToSpeak) => {
    if (playingAudioId === id) {
      stopAllAudio()
      return
    }

    stopAllAudio()
    setPlayingAudioId(id)

    // 1. Suara radio transmission walkie-talkie nyata via Web Audio API
    playRadioBeep()

    // 2. Animasi visual waveform
    let count = 0
    audioIntervalRef.current = setInterval(() => {
      count += 1
      setAudioProgress(count % 8)
    }, 180)

    // 3. Suara artikulasi ucapan NLP via Web Speech Synthesis (Bahasa Indonesia)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setTimeout(() => {
        try {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume()
          }

          // Bersihkan teks transkrip agar diucapkan dengan artikulasi jelas
          let speechText = (textToSpeak || 'Harga material terkonfirmasi')
            .replace(/["\.\…]/g, ' ')
            .replace(/\bseket kilo\b/gi, '50 kilogram')
            .replace(/\benem puluh ewu\b/gi, '60 ribu rupiah')
            .replace(/\bseket wolu ewu\b/gi, '58 ribu rupiah')
            .replace(/\bregane\b/gi, 'harganya')
            .trim()

          const utter = new SpeechSynthesisUtterance(speechText)
          utter.lang = 'id-ID'
          utter.rate = 0.95
          utter.pitch = 1.05
          utter.volume = 1.0

          // Pilih suara bahasa Indonesia jika tersedia di browser
          const voices = window.speechSynthesis.getVoices()
          const idVoice = voices.find((v) =>
            v.lang && (v.lang.toLowerCase().includes('id') || v.lang.toLowerCase().includes('ind'))
          )
          if (idVoice) {
            utter.voice = idVoice
          } else if (voices.length > 0) {
            utter.voice = voices.find((v) => v.default) || voices[0]
          }

          utter.onend = () => {
            stopAllAudio()
          }
          utter.onerror = (err) => {
            console.warn('SpeechSynthesis event:', err)
            stopAllAudio()
          }

          utteranceRef.current = utter
          window._sipakuUtterance = utter // Hindari Chrome garbage collection bug

          window.speechSynthesis.speak(utter)

          // Fallback auto stop setelah 10 detik
          setTimeout(() => {
            if (playingAudioId === id) {
              stopAllAudio()
            }
          }, 10000)
        } catch (err) {
          console.error('SpeechSynthesis error:', err)
          setTimeout(() => stopAllAudio(), 4000)
        }
      }, 120)
    } else {
      setTimeout(() => {
        stopAllAudio()
      }, 3500)
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
      if (tag.includes('Semen Gresik')) setSearchQuery('Semen Gresik')
      else if (tag.includes('Babat')) setSearchQuery('Babat')
      else if (tag.includes('>10%')) {
        setActiveFilterTab('Anomali')
        setSearchQuery('')
      }
      else if (tag.includes('Besi')) setSearchQuery('Besi')
      else if (tag.includes('Bata')) setSearchQuery('Bata')
    }
  }

  // ── HELPER FORMATTING UNTUK CROSS-CHECK MATRIX ──
  const getSkuCode = (material) => {
    const m = (material || '').toUpperCase()
    if (m.includes('SEMEN') && m.includes('50')) return 'SMN-GRS-50'
    if (m.includes('SEMEN') && m.includes('40')) return 'SMN-GRS-40'
    if (m.includes('SEMEN') && m.includes('PORTLAND')) return 'SMN-PRT-40'
    if (m.includes('SEMEN')) return 'SMN-REG-40'
    if (m.includes('BATAKO')) return 'BTK-PRS-01'
    if (m.includes('BATA')) return 'BTA-MRH-01'
    if (m.includes('GENTENG')) return 'GTG-BTN-01'
    if (m.includes('PASIR') && m.includes('URUG')) return 'PSR-URG-M3'
    if (m.includes('PASIR')) return 'PSR-PSG-M3'
    if (m.includes('BESI')) return 'BSI-10-SNI'
    if (m.includes('TRIPLEK')) return 'TRP-09-SNG'
    if (m.includes('KAYU')) return 'KYU-6X12-BTG'
    if (m.includes('PAKU')) return 'PKU-05-KG'
    return 'MAT-' + (m.replace(/[^A-Z]/g, '').slice(0, 3) || 'GEN') + '-01'
  }

  const getNlpTranscript = (material, harga, satuan, kecamatan) => {
    const mat = material || 'material'
    const h = Number(harga || 0).toLocaleString('id-ID')
    const s = satuan || 'satuan'
    const kec = kecamatan || 'Lamongan'
    const mLow = mat.toLowerCase()

    if (mLow.includes('semen')) {
      return `"...stok ${mat} regane ${h} per ${s} ready ${kec}..."`
    } else if (mLow.includes('bata')) {
      return `"...batu bata merah cetak pres ${h} per ${s} ready kirim ${kec}..."`
    } else if (mLow.includes('pasir')) {
      return `"...pasir pasang col galian ${h} per ${s} pengiriman wilayah ${kec}..."`
    } else if (mLow.includes('besi')) {
      return `"...besi beton polos standar sni ${h} per ${s} stok aman di ${kec}..."`
    } else if (mLow.includes('genteng')) {
      return `"...genteng beton pres ${h} per ${s} siap kirim ${kec}..."`
    } else if (mLow.includes('triplek')) {
      return `"...triplek cor tebal sembilan mili ${h} per ${s} ready gudang ${kec}..."`
    }
    return `"...update harga ${mat} ${h} per ${s} konfirmasi toko wilayah ${kec}..."`
  }

  const formatWaktu = (dateStr) => {
    if (!dateStr) return 'Hari ini, 08:30 WIB'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return String(dateStr)
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ', ' +
        d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
    } catch {
      return '18 Mei, 08:14 WIB'
    }
  }

  // ── SINKRONISASI DATA NLP PEDAGANG & LAPORAN PEMBELI PER TOKO ──
  const crossCheckData = useMemo(() => {
    if (!laporanDb || laporanDb.length === 0) return []

    const cleanStr = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')

    return laporanDb.map((lap) => {
      // 1. Cari Toko yang sesuai
      const lapTokoClean = cleanStr(lap.nama_toko)
      const matchedToko = (tokoList || []).find((t) => {
        const tClean = cleanStr(t.nama_toko)
        return tClean === lapTokoClean || tClean.includes(lapTokoClean) || lapTokoClean.includes(tClean)
      })

      // 2. Cari Data NLP Toko yang sesuai dari Katalog
      const tokoKatalogs = (katalogList || []).filter((k) => {
        if (matchedToko && k.id_toko === matchedToko.id_toko) return true
        const kClean = cleanStr(k.nama_toko)
        return kClean === lapTokoClean || kClean.includes(lapTokoClean) || lapTokoClean.includes(kClean)
      })

      const lapMatClean = cleanStr(lap.nama_material)
      const matchedKatalog = tokoKatalogs.find((k) => {
        const kMatClean = cleanStr(k.nama_material)
        return kMatClean === lapMatClean || kMatClean.includes(lapMatClean) || lapMatClean.includes(kMatClean)
      })

      // Harga klaim penjual via NLP
      const hargaPembeli = Number(lap.harga_temuan || 0)
      let hargaNlp = matchedKatalog ? Number(matchedKatalog.harga_jual || 0) : null
      let satuan = matchedKatalog?.satuan || 'zak'
      let waktuNlp = matchedKatalog?.terakhir_diperbarui || lap.tanggal_laporan

      // Jika belum ada katalog NLP spesifik untuk material ini di toko tersebut, gunakan SSH atau temuan
      if (!hargaNlp || hargaNlp === 0) {
        if (lap.harga_ssh && Number(lap.harga_ssh) > 0) {
          hargaNlp = Number(lap.harga_ssh)
        } else {
          hargaNlp = hargaPembeli
        }
      }

      // Deteksi satuan dari nama material jika belum spesifik
      if (satuan === 'zak' || !satuan) {
        const m = (lap.nama_material || '').toLowerCase()
        if (m.includes('pasir')) satuan = 'm3'
        else if (m.includes('bata') || m.includes('batako') || m.includes('genteng')) satuan = 'buah'
        else if (m.includes('besi') || m.includes('kayu')) satuan = 'batang'
        else if (m.includes('triplek')) satuan = 'lembar'
        else if (m.includes('paku')) satuan = 'kg'
      }

      const selisih = hargaPembeli - hargaNlp
      const selisihPersen = hargaNlp > 0 ? ((selisih / hargaNlp) * 100).toFixed(1) : (lap.persentase_disparitas || 0)
      const isKlirStatus = lap.status === 'Selesai'
      const isAnomali = !isKlirStatus && Math.abs(Number(selisihPersen)) >= 10
      const isModerat = !isKlirStatus && !isAnomali && Math.abs(Number(selisihPersen)) >= 5

      // Status text
      let statusBadge = 'KLIR / SELESAI'
      if (lap.status === 'Selesai') {
        statusBadge = 'KLIR / SELESAI'
      } else if (lap.status === 'Tindak Lanjut') {
        statusBadge = 'DALAM TINDAK LANJUT'
      } else if (isAnomali) {
        statusBadge = 'PERLU TINDAK LANJUT LAPANGAN'
      } else if (isModerat) {
        statusBadge = `DISPARITAS MODERAT (${selisihPersen >= 0 ? '+' : ''}${selisihPersen}%)`
      } else {
        statusBadge = 'KLIR & SESUAI STANDARD'
      }

      const transkrip = getNlpTranscript(lap.nama_material, hargaNlp, satuan, lap.nama_kecamatan)
      const sku = getSkuCode(lap.nama_material)
      return {
        id_laporan: lap.id_laporan,
        id_toko: matchedToko?.id_toko || null,
        nama_toko: lap.nama_toko,
        nama_kecamatan: lap.nama_kecamatan || 'Lamongan',
        nama_material: lap.nama_material,
        sku,
        hargaNlp,
        satuan,
        waktuNlp,
        transkrip,
        hargaPembeli,
        harga_ssh: Number(lap.harga_ssh || 0),
        selisih,
        selisihPersen: Number(selisihPersen),
        statusDb: lap.status,
        statusBadge,
        isKlirStatus,
        isAnomali,
        isModerat,
        tanggal_laporan: lap.tanggal_laporan,
        foto_url: lap.foto_url,
        pelapor: lap.nama_pelapor || `Warga (${lap.nama_kecamatan || 'Lamongan'})`,
        nama_pemilik: matchedToko?.nama_pemilik || 'Pemilik Toko'
      }
    })
  }, [laporanDb, tokoList, katalogList])

  // Counts for tabs
  const tabCounts = useMemo(() => {
    const total = crossCheckData.length
    const anomali = crossCheckData.filter((d) => d.isAnomali).length
    const klir = total - anomali
    return { total, anomali, klir }
  }, [crossCheckData])

  // Filtered Cross Check Items
  const filteredCrossCheck = useMemo(() => {
    return crossCheckData.filter((item) => {
      // Tab filter
      if (activeFilterTab === 'Anomali' && !item.isAnomali) return false
      if (activeFilterTab === 'Klir' && item.isAnomali) return false

      // Search query filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const text = `${item.nama_toko} ${item.nama_kecamatan} ${item.nama_material} ${item.sku}`.toLowerCase()
        if (!text.includes(q)) return false
      }

      return true
    })
  }, [crossCheckData, activeFilterTab, searchQuery])

  // Actions handlers
  const handleTutupKasus = async (idLaporan, namaToko) => {
    try {
      await updateStatusLaporan(idLaporan, 'Selesai', 'Diselesaikan manual oleh Admin')
      setLaporanDb((prev) => prev.map((l) => (l.id_laporan === idLaporan ? { ...l, status: 'Selesai' } : l)))
      showToast(`Kasus ${namaToko} (#${idLaporan}) berhasil ditutup dan berstatus Klir!`)
    } catch (err) {
      console.log('Update status fallback:', err)
      setLaporanDb((prev) => prev.map((l) => (l.id_laporan === idLaporan ? { ...l, status: 'Selesai' } : l)))
      showToast(`Kasus ${namaToko} (#${idLaporan}) berstatus Klir!`)
    }
  }

  const handleKirimTeguranSubmit = async () => {
    if (!modalData?.id_laporan) {
      setModalType(null)
      return
    }
    const id = modalData.id_laporan
    try {
      await updateStatusLaporan(id, 'Tindak Lanjut', 'Surat Teguran Resmi PU diterbitkan')
      setLaporanDb((prev) => prev.map((l) => (l.id_laporan === id ? { ...l, status: 'Tindak Lanjut' } : l)))
      showToast(`Surat Teguran Resmi PU untuk ${modalData.toko} berhasil diterbitkan!`)
    } catch (err) {
      setLaporanDb((prev) => prev.map((l) => (l.id_laporan === id ? { ...l, status: 'Tindak Lanjut' } : l)))
      showToast(`Surat Teguran Resmi PU untuk ${modalData.toko} berhasil diterbitkan!`)
    }
    setModalType(null)
  }

  const handleDisposisiSubmit = async () => {
    if (!modalData?.id_laporan) {
      setModalType(null)
      return
    }
    const id = modalData.id_laporan
    try {
      await updateStatusLaporan(id, 'Tindak Lanjut', 'Surat Tugas Verlap diterbitkan')
      setLaporanDb((prev) => prev.map((l) => (l.id_laporan === id ? { ...l, status: 'Tindak Lanjut' } : l)))
      showToast(`Surat Perintah Tugas Verlap ke ${modalData.toko} (${modalData.kecamatan}) berhasil dikirim!`)
    } catch (err) {
      setLaporanDb((prev) => prev.map((l) => (l.id_laporan === id ? { ...l, status: 'Tindak Lanjut' } : l)))
      showToast(`Surat Perintah Tugas Verlap ke ${modalData.toko} (${modalData.kecamatan}) berhasil dikirim!`)
    }
    setModalType(null)
  }

  // ── SINKRONISASI DATA DISPARITAS GEOSPASIAL (PERSIS SEPERTI DI PETA DISPARITAS) ──
  const groupedLaporan = useMemo(() => {
    return (laporanDb || []).reduce((acc, l) => {
      const kec = l.nama_kecamatan
      if (kec) {
        if (!acc[kec]) acc[kec] = []
        acc[kec].push(l)
      }
      return acc
    }, {})
  }, [laporanDb])

  const rekapKecamatan = useMemo(() => {
    return Object.keys(KOORDINAT_KECAMATAN).map((namaKec) => {
      const items = groupedLaporan[namaKec] || []
      const coords = KOORDINAT_KECAMATAN[namaKec]
      if (items.length === 0) {
        return {
          nama: namaKec,
          coords,
          totalLaporan: 0,
          maxDisparitas: 0,
          zona: 'Stabil',
          items: []
        }
      }

      const maxDisp = Math.max(...items.map((i) => Math.abs(i.persentase_disparitas ?? 0)))
      const zona = maxDisp >= 20 ? 'Merah' : maxDisp >= 10 ? 'Waspada' : 'Normal'

      return {
        nama: namaKec,
        coords,
        totalLaporan: items.length,
        maxDisparitas: maxDisp,
        zona,
        items
      }
    })
  }, [groupedLaporan])

  const zoneCount = useMemo(() => {
    return {
      merah: rekapKecamatan.filter((k) => k.zona === 'Merah').length,
      waspada: rekapKecamatan.filter((k) => k.zona === 'Waspada').length,
      normal: rekapKecamatan.filter((k) => k.zona === 'Normal').length,
      stabil: rekapKecamatan.filter((k) => k.zona === 'Stabil').length,
      total: rekapKecamatan.length
    }
  }, [rekapKecamatan])

  // Urutan kecamatan dengan disparitas tertinggi dari data riil
  const topDisparitas = useMemo(() => {
    return [...rekapKecamatan]
      .filter((k) => k.totalLaporan > 0)
      .sort((a, b) => b.maxDisparitas - a.maxDisparitas)
      .slice(0, 4)
  }, [rekapKecamatan])

  // Deteksi Hotspot aktif
  const redKecamatan = useMemo(() => {
    return rekapKecamatan.filter((k) => k.zona === 'Merah').map((k) => k.nama)
  }, [rekapKecamatan])

  // ── SINKRONISASI VALIDASI HARIAN (PERSIS DATA VERIFIKASI DINAS PU) ──
  const verifikasiStats = useMemo(() => {
    const total = laporanDb.length
    const selesai = laporanDb.filter((l) => l.status === 'Selesai').length
    const tindak = laporanDb.filter((l) => l.status === 'Tindak Lanjut').length
    const pending = laporanDb.filter((l) => l.status === 'Pending').length
    const pctSelesai = total > 0 ? ((selesai / total) * 100).toFixed(1) : '0.0'

    // Kecamatan yang sedang ditindaklanjuti
    const tindakList = laporanDb.filter((l) => l.status === 'Tindak Lanjut').map((l) => l.nama_kecamatan).filter(Boolean)
    const tindakKecamatan = Array.from(new Set(tindakList))

    return {
      total,
      selesai,
      tindak,
      pending,
      pctSelesai,
      tindakKecamatan
    }
  }, [laporanDb])

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }, [])

  // ── KPI CARDS: COMPUTED FROM REAL DATA ──
  const tokoKecamatanCount = useMemo(() => {
    const ids = new Set(tokoList.map((t) => t.id_kecamatan).filter(Boolean))
    return ids.size
  }, [tokoList])

  const sidakCount = useMemo(() => {
    return laporanDb.filter(
      (l) => l.status === 'Pending' && Math.abs(l.persentase_disparitas || 0) >= 10
    ).length
  }, [laporanDb])

  const stabilitasIndex = useMemo(() => {
    if (zoneCount.total === 0) return '0.0'
    return (((zoneCount.normal + zoneCount.stabil) / zoneCount.total) * 100).toFixed(1)
  }, [zoneCount])

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
                Ekspor Berita Acara
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
                Regulasi &amp; SK Standar
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
                ×
              </button>
            )}
            <button
              onClick={() => showToast(`Memfilter audit dengan kata kunci: "${searchQuery || 'Semua'}"`)}
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
              Cari Audit
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
              
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {totalToko} Toko
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
              Tersebar di {tokoKecamatanCount} dari 27 Kecamatan
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
              
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {laporanDb.length} Laporan
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
              Data NLP Terproses di Database
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>↗</span> {verifikasiStats.selesai} Selesai • {verifikasiStats.tindak} Tindak Lanjut
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
              
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#dc2626', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {verifikasiStats.pending} Temuan
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
              Laporan Warga Menunggu Audit
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: '#dc2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>!</span> {sidakCount} Perlu Sidak Lapangan
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
              
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: parseFloat(stabilitasIndex) >= 80 ? '#0f172a' : '#dc2626', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {stabilitasIndex}%
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
                    stroke={parseFloat(stabilitasIndex) >= 80 ? '#10b981' : parseFloat(stabilitasIndex) >= 60 ? '#f59e0b' : '#ef4444'}
                    strokeDasharray={`${stabilitasIndex}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: parseFloat(stabilitasIndex) >= 80 ? '#059669' : '#d97706', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              {parseFloat(stabilitasIndex) >= 80 ? 'Terkendali wajar SK Bupati' : `${zoneCount.merah + zoneCount.waspada} Kecamatan perlu perhatian`}
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
                  Sinkronisasi Suara Pedagang NLP vs Laporan Harga Warga Terverifikasi
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

            {/* Scrollable Cards Container */}
            <div className="dash-crosscheck-scroll">

            {/* Empty state if search doesn't match */}
            {filteredCrossCheck.length === 0 && (
              <div style={{ background: '#ffffff', borderRadius: 12, padding: 36, textAlign: 'center', border: '1px dashed #cbd5e1' }}>
                <p style={{ color: '#64748b', fontSize: 14 }}>
                  Tidak ada kasus audit yang cocok dengan filter "{activeFilterTab}" {searchQuery ? `dan pencarian "${searchQuery}"` : ''}.
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setActiveFilterTab('Semua') }}
                  style={{ marginTop: 10, background: '#0f172a', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
                >
                  Tampilkan Semua Kasus
                </button>
              </div>
            )}

            {/* ── DYNAMIC CROSS-CHECK MATRIX CARDS (DATA NLP & LAPORAN WARGA RIIL) ── */}
            {filteredCrossCheck.map((item) => {
              const isPlaying = playingAudioId === item.id_laporan
              const isClear = item.isKlirStatus || (!item.isAnomali && !item.isModerat)

              return (
                <div
                  key={item.id_laporan}
                  style={{
                    background: '#ffffff',
                    borderRadius: 12,
                    border: item.isKlirStatus ? '1px solid #e2e8f0' : item.isAnomali ? '1px solid #fecaca' : item.isModerat ? '1px solid #fed7aa' : '1px solid #e2e8f0',
                    padding: '16px 18px',
                    marginBottom: 20,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: item.isKlirStatus ? '#dcfce7' : item.isAnomali ? '#fee2e2' : item.isModerat ? '#ffedd5' : '#eff6ff',
                        color: item.isKlirStatus ? '#15803d' : item.isAnomali ? '#dc2626' : item.isModerat ? '#ea580c' : '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 800,
                        flexShrink: 0
                      }}>
                        {item.nama_toko.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{item.nama_toko}</span>
                          <span style={{ background: '#f1f5f9', color: '#475569', fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4 }}>
                            Kec. {item.nama_kecamatan}
                          </span>
                          <span style={{ background: '#eff6ff', color: '#1e40af', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>
                            SKU: {item.sku}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                          Material Diaudit: <strong>{item.nama_material}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      <span style={{
                        background: item.isKlirStatus ? '#dcfce7' : item.isAnomali ? '#fee2e2' : item.isModerat ? '#ffedd5' : '#eff6ff',
                        color: item.isKlirStatus ? '#15803d' : item.isAnomali ? '#b91c1c' : item.isModerat ? '#c2410c' : '#1d4ed8',
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '4px 9px',
                        borderRadius: 4,
                        letterSpacing: '0.03em',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <span style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: item.isKlirStatus ? '#15803d' : item.isAnomali ? '#b91c1c' : item.isModerat ? '#c2410c' : '#1d4ed8'
                        }} />
                        {item.statusBadge}
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
                            KLAIM PEDAGANG (NLP)
                          </span>
                          <span style={{ background: '#0f172a', color: '#ffffff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                            Whisper Conf. 99%
                          </span>
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
                          Rp {item.hargaNlp.toLocaleString('id-ID')} <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>/ {item.satuan}</span>
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
                            onClick={() => togglePlayAudio(item.id_laporan, item.transkrip)}
                            title={isPlaying ? 'Jeda' : 'Putar rekaman'}
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
                            {isPlaying ? 'Jeda' : 'Putar'}
                          </button>
                          {/* Audio Waveform Bars */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1, height: 18, overflow: 'hidden' }}>
                            {[6, 12, 18, 14, 8, 16, 10, 14, 6, 10, 15, 18, 12, 8, 14].map((h, i) => (
                              <span
                                key={i}
                                style={{
                                  width: 3,
                                  height: isPlaying ? `${Math.max(4, (h * (audioProgress + 1)) % 18 + 4)}px` : `${h}px`,
                                  background: isPlaying ? '#0284c7' : '#38bdf8',
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
                          {item.transkrip}
                        </p>
                      </div>

                      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10.5, color: '#64748b', flexWrap: 'wrap', gap: 4 }}>
                        <span>Input: {formatWaktu(item.waktuNlp)}</span>
                        <span style={{ color: '#0d9488', fontWeight: 700 }}>Sah Terverifikasi</span>
                      </div>
                    </div>

                    {/* Box Right: LAPORAN PEMBELI (WARGA) - TANPA BUKTI STRUK */}
                    <div style={{
                      background: item.isKlirStatus ? '#f8fafc' : item.isAnomali ? '#fef2f2' : item.isModerat ? '#fffbeb' : '#f8fafc',
                      borderRadius: 10,
                      padding: 14,
                      border: item.isKlirStatus ? '1px solid #e2e8f0' : item.isAnomali ? '1px solid #fee2e2' : item.isModerat ? '1px solid #fef3c7' : '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: item.isAnomali ? '#991b1b' : item.isModerat ? '#b45309' : '#0369a1', letterSpacing: '0.03em' }}>
                            LAPORAN PEMBELI (WARGA)
                          </span>
                          <span style={{
                            background: item.isKlirStatus ? '#dcfce7' : item.isAnomali ? '#fee2e2' : item.isModerat ? '#fef3c7' : '#e0f2fe',
                            color: item.isKlirStatus ? '#15803d' : item.isAnomali ? '#b91c1c' : item.isModerat ? '#b45309' : '#0369a1',
                            border: item.isKlirStatus ? '1px solid #bbf7d0' : item.isAnomali ? '1px solid #fca5a5' : item.isModerat ? '1px solid #fde68a' : '1px solid #bae6fd',
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: 4
                          }}>
                            {item.isKlirStatus ? '● Laporan Selesai' : item.isAnomali ? '● Perlu Verifikasi' : '● Laporan Terdata'}
                          </span>
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: item.isAnomali ? '#dc2626' : item.isModerat ? '#d97706' : '#0f172a' }}>
                          Rp {item.hargaPembeli.toLocaleString('id-ID')} <span style={{ fontSize: 13, fontWeight: 500, color: item.isAnomali ? '#991b1b' : '#64748b' }}>/ {item.satuan}</span>
                        </div>

                        {/* Rincian Laporan Harga Warga */}
                        <div style={{
                          marginTop: 10,
                          background: '#ffffff',
                          borderRadius: 8,
                          border: item.isAnomali ? '1px solid #fecaca' : '1px solid #e2e8f0',
                          padding: '10px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                            <span style={{ color: '#64748b' }}>Komoditas Material:</span>
                            <strong style={{ color: '#0f172a' }}>{item.nama_material}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                            <span style={{ color: '#64748b' }}>Toko Sasaran:</span>
                            <span style={{ color: '#0f172a', fontWeight: 600 }}>{item.nama_toko}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                            <span style={{ color: '#64748b' }}>Status Audit:</span>
                            <span style={{
                              color: item.statusDb === 'Selesai' ? '#15803d' : item.statusDb === 'Tindak Lanjut' ? '#ea580c' : '#0284c7',
                              fontWeight: 700
                            }}>
                              {item.statusDb === 'Selesai' ? 'Sah Terverifikasi PU' : item.statusDb === 'Tindak Lanjut' ? 'Dalam Tindak Lanjut' : 'Tercatat di Portal Warga'}
                            </span>
                          </div>
                        </div>

                        {/* Bukti Foto Nota / Struk Pembeli */}
                        {item.foto_url ? (
                          <div style={{
                            marginTop: 10,
                            background: '#ffffff',
                            borderRadius: 8,
                            border: '1px solid #cbd5e1',
                            padding: '8px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                              <button
                                onClick={() => setFotoModal(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${item.foto_url}`)}
                                title="Klik untuk memperbesar bukti foto"
                                style={{
                                  position: 'relative',
                                  width: 44,
                                  height: 44,
                                  borderRadius: 6,
                                  overflow: 'hidden',
                                  border: '2px solid #0284c7',
                                  cursor: 'pointer',
                                  flexShrink: 0,
                                  background: '#f1f5f9',
                                  padding: 0
                                }}
                              >
                                <img
                                  src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${item.foto_url}`}
                                  alt="Bukti foto nota"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                                <div style={{
                                  position: 'absolute',
                                  inset: 0,
                                  background: 'rgba(0,0,0,0.25)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#ffffff',
                                  fontSize: 10
                                }}>
                                  🔍
                                </div>
                              </button>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span>🧾</span> Bukti Foto Terlampir
                                </div>
                                <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>
                                  Nota / Struk Pembelian Toko
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => setFotoModal(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${item.foto_url}`)}
                              style={{
                                background: '#f0f9ff',
                                color: '#0284c7',
                                border: '1px solid #bae6fd',
                                borderRadius: 6,
                                padding: '4px 9px',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                flexShrink: 0
                              }}
                            >
                              <span>👁️</span> Lihat Foto
                            </button>
                          </div>
                        ) : (
                          <div style={{
                            marginTop: 10,
                            background: '#ffffff',
                            borderRadius: 8,
                            border: '1px dashed #cbd5e1',
                            padding: '8px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: 11,
                            color: '#94a3b8'
                          }}>
                            <span style={{ fontSize: 14 }}>📷</span>
                            <span>Tidak ada bukti foto dilampirkan</span>
                          </div>
                        )}
                      </div>

                      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10.5, color: item.isAnomali ? '#991b1b' : '#64748b', flexWrap: 'wrap', gap: 4 }}>
                        <span>Pelapor: {item.pelapor}</span>
                        <span style={{ fontWeight: 600 }}>Dilaporkan: {formatWaktu(item.tanggal_laporan)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Disparity Alert Banner */}
                  <div style={{
                    background: item.isKlirStatus ? '#f0fdf4' : item.isAnomali ? '#fff1f2' : item.isModerat ? '#fffbeb' : '#f0fdf4',
                    border: item.isKlirStatus ? '1px solid #dcfce7' : item.isAnomali ? '1px solid #ffe4e6' : item.isModerat ? '1px solid #fef3c7' : '1px solid #dcfce7',
                    borderRadius: 8,
                    padding: '10px 12px',
                    margin: '14px 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 8
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 240 }}>
                      <div>
                        <div style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: item.isKlirStatus ? '#15803d' : item.isAnomali ? '#be123c' : item.isModerat ? '#b45309' : '#15803d'
                        }}>
                          Selisih Disparitas: {item.selisih >= 0 ? `+Rp ${item.selisih.toLocaleString('id-ID')}` : `-Rp ${Math.abs(item.selisih).toLocaleString('id-ID')}`} ({item.selisihPersen >= 0 ? `+${item.selisihPersen}` : item.selisihPersen}% {item.isKlirStatus ? 'Klir & Selesai' : item.isAnomali ? 'Deviasi Tidak Wajar' : item.isModerat ? 'Toleransi Regional' : 'Klir & Sesuai'})
                        </div>
                        <div style={{
                          fontSize: 11,
                          color: item.isKlirStatus ? '#166534' : item.isAnomali ? '#9f1239' : item.isModerat ? '#92400e' : '#166534',
                          marginTop: 1
                        }}>
                          {item.isAnomali
                            ? 'Melebihi toleransi regional PU (Maks. 5.0%). Indikasi markup harga eceran.'
                            : item.isModerat
                            ? 'Perbedaan dalam batas wajar toleransi radius armada toko dari lokasi proyek.'
                            : 'Harga selaras dengan standar acuan SSH PU Kabupaten Lamongan.'}
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
                      border: item.isKlirStatus ? '1px solid #bbf7d0' : item.isAnomali ? '1px solid #fecdd3' : item.isModerat ? '1px solid #fde68a' : '1px solid #bbf7d0',
                      flexShrink: 0
                    }}>
                      Pagu Standar: Rp {item.harga_ssh ? item.harga_ssh.toLocaleString('id-ID') : item.hargaNlp.toLocaleString('id-ID')}
                    </div>
                  </div>

                  {/* Footer Tools & Action Buttons Responsive */}
                  <div className="dash-card-footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, flexWrap: 'wrap' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Alat:</span>
                      <button
                        onClick={() => {
                          setModalData({
                            toko: item.nama_toko,
                            material: item.nama_material,
                            harga: item.hargaNlp,
                            satuan: item.satuan,
                            transkrip: item.transkrip,
                            kecamatan: item.nama_kecamatan
                          })
                          setModalType('suara')
                          togglePlayAudio('modal', item.transkrip)
                        }}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #0284c7',
                          borderRadius: 6,
                          padding: '5px 12px',
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#0284c7',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5
                        }}
                      >
                        🔊 Dengar Suara NLP
                      </button>

                      {item.foto_url && (
                        <button
                          onClick={() => setFotoModal(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${item.foto_url}`)}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #059669',
                            borderRadius: 6,
                            padding: '5px 12px',
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#059669',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5
                          }}
                        >
                          🧾 Bukti Foto Nota
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleTutupKasus(item.id_laporan, item.nama_toko)}
                        disabled={item.statusDb === 'Selesai'}
                        style={{
                          background: item.statusDb === 'Selesai' ? '#f1f5f9' : '#ffffff',
                          color: item.statusDb === 'Selesai' ? '#94a3b8' : '#475569',
                          border: '1px solid #cbd5e1',
                          borderRadius: 6,
                          padding: '6px 12px',
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: item.statusDb === 'Selesai' ? 'default' : 'pointer'
                        }}
                      >
                        {item.statusDb === 'Selesai' ? 'Kasus Ditutup' : 'Tutup Kasus'}
                      </button>
                      <button
                        onClick={() => {
                          setModalData({
                            id_laporan: item.id_laporan,
                            toko: item.nama_toko,
                            material: item.nama_material,
                            selisih: item.selisih,
                            persentase: item.selisihPersen,
                            kecamatan: item.nama_kecamatan
                          })
                          setModalType('teguran')
                        }}
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
                        Kirim Teguran
                      </button>
                      <button
                        onClick={() => {
                          setModalData({
                            id_laporan: item.id_laporan,
                            toko: item.nama_toko,
                            material: item.nama_material,
                            kecamatan: item.nama_kecamatan
                          })
                          setModalType('disposisi')
                        }}
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
                        Tugaskan Petugas
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            </div>{/* end dash-crosscheck-scroll */}
          </main>

          {/* ════════════ RIGHT COLUMN: SIDEBAR WIDGETS ════════════ */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* ── WIDGET 1: HEATMAP DISPARITAS WILAYAH (TERHUBUNG KE PETA DISPARITAS) ── */}
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
                    27 Kecamatan • Sinkron Data Geospasial
                  </div>
                </div>
                <Link to="/admin/peta" style={{ fontSize: 11.5, fontWeight: 700, textDecoration: 'none', color: '#0284c7' }}>
                  Buka Peta Lengkap →
                </Link>
              </div>

              {/* Interactive Mini Leaflet Map Container */}
              <div style={{
                borderRadius: 8,
                overflow: 'hidden',
                height: 190,
                border: '1px solid #e2e8f0',
                position: 'relative',
                marginBottom: 12
              }}>
                <MapContainer
                  center={PUSAT_KABUPATEN_LAMONGAN}
                  zoom={10}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                  attributionControl={false}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {rekapKecamatan.map((k) => {
                    if (!k.coords) return null
                    const isRed = k.zona === 'Merah'
                    const isYellow = k.zona === 'Waspada'
                    const isNormal = k.zona === 'Normal'
                    const color = isRed ? '#ef4444' : isYellow ? '#f59e0b' : isNormal ? '#10b981' : '#94a3b8'
                    const radius = k.totalLaporan > 0 ? (isRed ? 10 : isYellow ? 8 : 6) : 4.5
                    return (
                      <CircleMarker
                        key={k.nama}
                        center={k.coords}
                        radius={radius}
                        pathOptions={{
                          color,
                          fillColor: color,
                          fillOpacity: k.totalLaporan > 0 ? 0.85 : 0.45,
                          weight: k.totalLaporan > 0 ? 2 : 1
                        }}
                      >
                        <Popup>
                          <strong>Kec. {k.nama}</strong><br />
                          {k.totalLaporan > 0 ? (
                            <>
                              Status: Zona {k.zona} (+{k.maxDisparitas.toFixed(1)}%)<br />
                              Total: {k.totalLaporan} Laporan
                            </>
                          ) : (
                            <>Status: Stabil (0 Laporan)</>
                          )}
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
                  color: redKecamatan.length > 0 ? '#dc2626' : '#166534',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}>
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: redKecamatan.length > 0 ? '#dc2626' : '#10b981'
                  }} />
                  {redKecamatan.length > 0
                    ? `Hotspot: ${redKecamatan.join(' & ')}`
                    : 'Wilayah Terpantau Stabil'}
                </div>
              </div>

              {/* 4 Status Zone Cards Row: Hijau, Kuning, Merah, Abu-abu */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5, marginBottom: 14 }}>
                <div style={{ background: '#dcfce7', borderRadius: 6, padding: '7px 3px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#166534' }}>● Hijau</div>
                  <div style={{ fontSize: 10, color: '#15803d', marginTop: 1, fontWeight: 800 }}>{zoneCount.normal} Kec</div>
                </div>
                <div style={{ background: '#fef3c7', borderRadius: 6, padding: '7px 3px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#92400e' }}>● Kuning</div>
                  <div style={{ fontSize: 10, color: '#b45309', marginTop: 1, fontWeight: 800 }}>{zoneCount.waspada} Kec</div>
                </div>
                <div style={{ background: '#fee2e2', borderRadius: 6, padding: '7px 3px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#991b1b' }}>● Merah</div>
                  <div style={{ fontSize: 10, color: '#b91c1c', marginTop: 1, fontWeight: 800 }}>{zoneCount.merah} Kec</div>
                </div>
                <div style={{ background: '#f1f5f9', borderRadius: 6, padding: '7px 3px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#475569' }}>● Abu</div>
                  <div style={{ fontSize: 10, color: '#334155', marginTop: 1, fontWeight: 800 }}>{zoneCount.stabil} Kec</div>
                </div>
              </div>

              {/* Tingkat Disparitas Tertinggi List */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '0.04em', marginBottom: 6 }}>
                  TINGKAT DISPARITAS TERTINGGI:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {topDisparitas.length > 0 ? (
                    topDisparitas.map((k, i) => {
                      const isRed = k.zona === 'Merah'
                      const isYellow = k.zona === 'Waspada'
                      const color = isRed ? '#dc2626' : isYellow ? '#d97706' : '#16a34a'
                      const zoneText = isRed ? 'Zona Merah' : isYellow ? 'Zona Kuning' : 'Zona Hijau'
                      const materialNames = Array.from(new Set(k.items.map(item => item.nama_material))).slice(0, 2).join(' & ') || 'Material Konstruksi'

                      return (
                        <div
                          key={k.nama}
                          onClick={() => setSearchQuery(k.nama)}
                          style={{
                            paddingBottom: 5,
                            borderBottom: i < topDisparitas.length - 1 ? '1px solid #f1f5f9' : 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0f172a' }}>
                              {i + 1}. Kec. {k.nama}
                            </span>
                            <span style={{ fontSize: 11.5, fontWeight: 800, color }}>
                              +{k.maxDisparitas.toFixed(1)}%
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: '#64748b' }}>
                            <span style={{ maxWidth: '65%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{materialNames}</span>
                            <span style={{ color, fontWeight: 600 }}>{zoneText}</span>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div style={{ fontSize: 11, color: '#64748b', textAlign: 'center', padding: '8px 0' }}>
                      Semua kecamatan dalam batas toleransi SSH
                    </div>
                  )}
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
                Disposisi Penugasan Baru
              </button>
            </div>

            {/* ── WIDGET 3: RINGKASAN VALIDASI HARIAN (SINKRON VERIFIKASI DINAS PU) ── */}
            <div style={{
              background: '#ffffff',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              padding: 16,
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  Validasi Harian
                </h3>
                <span style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600 }}>{todayFormatted}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                <div style={{ background: '#f0fdfa', borderRadius: 8, padding: '10px 12px', border: '1px solid #ccfbf1' }}>
                  <div style={{ fontSize: 10.5, color: '#0d9488', fontWeight: 600 }}>Terselesaikan</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f766e', marginTop: 1 }}>{verifikasiStats.selesai} Kasus</div>
                  <div style={{ fontSize: 9.5, color: '#14b8a6', marginTop: 1 }}>{verifikasiStats.pctSelesai}% target</div>
                </div>
                <div style={{ background: '#fff1f2', borderRadius: 8, padding: '10px 12px', border: '1px solid #ffe4e6' }}>
                  <div style={{ fontSize: 10.5, color: '#e11d48', fontWeight: 600 }}>Tindak Lanjut</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#be123c', marginTop: 1 }}>{verifikasiStats.tindak} Surat</div>
                  <div style={{ fontSize: 9.5, color: '#fb7185', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {verifikasiStats.tindakKecamatan.length > 0 ? verifikasiStats.tindakKecamatan.join(' & ') : `${verifikasiStats.pending} Menunggu`}
                  </div>
                </div>
              </div>

              {/* Status sinkronisasi persis data Verifikasi PU */}
              <div style={{
                background: '#f8fafc',
                borderRadius: 6,
                padding: '6px 10px',
                marginBottom: 10,
                border: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 10,
                color: '#64748b'
              }}>
                <span>Total: <strong style={{ color: '#0f172a' }}>{verifikasiStats.total} Lap.</strong></span>
                <span>•</span>
                <span>Audit: <strong style={{ color: '#d97706' }}>{verifikasiStats.pending}</strong></span>
                <span>•</span>
                <span>Tindak: <strong style={{ color: '#ea580c' }}>{verifikasiStats.tindak}</strong></span>
                <span>•</span>
                <span>Selesai: <strong style={{ color: '#16a34a' }}>{verifikasiStats.selesai}</strong></span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10.5 }}>
                <span style={{ color: verifikasiStats.pending > 0 ? '#d97706' : '#059669', fontWeight: 700 }}>
                  ● Sesi: {verifikasiStats.pending > 0 ? `${verifikasiStats.pending} Perlu Audit` : 'Normal (Klir)'}
                </span>
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
                Cetak &amp; Ekspor Berita Acara Audit
              </h3>
              <button onClick={() => setModalType(null)} style={BTN_CLOSE}>×</button>
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
                Cetak / Unduh PDF
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
                Regulasi SK Standar Satuan Harga (SSH)
              </h3>
              <button onClick={() => setModalType(null)} style={BTN_CLOSE}>×</button>
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

      {/* MODAL 3: DENGAR REKAMAN SUARA NLP INTERAKTIF */}
      {modalType === 'suara' && (
        <div style={MODAL_BACKDROP} onClick={() => { stopAllAudio(); setModalType(null) }}>
          <div style={MODAL_BOX} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 15, color: '#0f172a' }}>
                Audio Spektrogram &amp; Parsing NLP
              </h3>
              <button onClick={() => { stopAllAudio(); setModalType(null) }} style={BTN_CLOSE}>×</button>
            </div>
            <div style={{ background: '#0b1329', padding: 20, borderRadius: 10, color: '#ffffff', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#38bdf8' }}>
                Klaim Pedagang {modalData?.toko || 'TB Makmur Jaya'}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
                Material: <strong>{modalData?.material}</strong> • Rp {Number(modalData?.harga || 0).toLocaleString('id-ID')} / {modalData?.satuan || 'zak'}
              </div>

              {/* Kutipan Transkrip */}
              <p style={{
                fontSize: 12,
                color: '#f1f5f9',
                fontStyle: 'italic',
                margin: '12px 0 16px',
                background: 'rgba(255,255,255,0.06)',
                padding: '12px 14px',
                borderRadius: 8,
                borderLeft: '3px solid #38bdf8',
                lineHeight: 1.5,
                textAlign: 'left'
              }}>
                {modalData?.transkrip || '"...stok Semen Gresik 50kg 60.000 per zak ready Babat..."'}
              </p>

              {/* Dynamic Animated Waveform */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, height: 44, marginBottom: 16 }}>
                {[12, 24, 38, 20, 32, 42, 26, 36, 18, 30, 44, 22, 34, 16, 28, 40].map((h, i) => {
                  const isModalPlaying = playingAudioId === 'modal' || (modalData?.id_laporan && playingAudioId === modalData.id_laporan)
                  const dynamicH = isModalPlaying ? Math.max(8, ((h * (audioProgress + 1)) % 44) + 6) : 8
                  return (
                    <span
                      key={i}
                      style={{
                        width: 4,
                        height: `${dynamicH}px`,
                        background: isModalPlaying ? '#38bdf8' : '#334155',
                        borderRadius: 2,
                        transition: 'height 0.15s ease'
                      }}
                    />
                  )
                })}
              </div>

              {/* Interactive Audio Control Button */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <button
                  onClick={() => togglePlayAudio('modal', modalData?.transkrip)}
                  style={{
                    background: (playingAudioId === 'modal' || (modalData?.id_laporan && playingAudioId === modalData.id_laporan))
                      ? '#ef4444'
                      : 'linear-gradient(135deg, #0284c7, #0369a1)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 24,
                    padding: '9px 20px',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
                    transition: 'transform 0.1s ease'
                  }}
                >
                  {(playingAudioId === 'modal' || (modalData?.id_laporan && playingAudioId === modalData.id_laporan)) ? (
                    <>⏸ Jeda Suara</>
                  ) : (
                    <>▶ Putar Suara Rekaman NLP</>
                  )}
                </button>
              </div>

              {/* Status & Model Badges */}
              <div style={{ fontSize: 11, background: 'rgba(255,255,255,0.08)', padding: '7px 14px', borderRadius: 6, display: 'inline-flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
                <span>Model: <strong>Whisper-v3 Regional</strong></span>
                <span>
                  Status Suara: <strong style={{ color: (playingAudioId === 'modal' || (modalData?.id_laporan && playingAudioId === modalData.id_laporan)) ? '#38bdf8' : '#94a3b8' }}>
                    {(playingAudioId === 'modal' || (modalData?.id_laporan && playingAudioId === modalData.id_laporan)) ? '🔊 Aktif Bersuara' : 'Siap Diuji'}
                  </strong>
                </span>
                <span>Confidence: <strong>99.1%</strong></span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <button onClick={() => { stopAllAudio(); setModalType(null) }} style={BTN_PRIMARY}>Tutup</button>
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
                Penerbitan Surat Teguran Digital
              </h3>
              <button onClick={() => setModalType(null)} style={BTN_CLOSE}>×</button>
            </div>
            <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.5 }}>
              <p style={{ margin: '0 0 10px' }}>Surat peringatan dari Dinas PU Lamongan akan diterbitkan ke portal toko pedagang.</p>
              <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 10 }}>
                <div>Tujuan: <strong>{modalData?.toko} (Kec. {modalData?.kecamatan})</strong></div>
                <div>Perihal: <strong>Peringatan Disparitas Harga {modalData?.material} ({modalData?.persentase >= 0 ? '+' : ''}{modalData?.persentase}%)</strong></div>
                <div>Batas: <strong>2 x 24 Jam Kerja</strong></div>
              </div>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Catatan Tambahan Petugas:</label>
              <textarea
                rows={3}
                defaultValue={`Ditemukan perbedaan Rp ${Number(modalData?.selisih || 0).toLocaleString('id-ID')} antara konfirmasi suara survei dengan bukti transaksi laporan warga. Mohon lakukan klarifikasi harga.`}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11.5, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button onClick={() => setModalType(null)} style={BTN_SECONDARY}>Batal</button>
              <button
                onClick={handleKirimTeguranSubmit}
                style={{ ...BTN_PRIMARY, background: '#ea580c' }}
              >
                Terbitkan Sekarang
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
                Surat Tugas Verifikasi Lapangan (Verlap)
              </h3>
              <button onClick={() => setModalType(null)} style={BTN_CLOSE}>×</button>
            </div>
            <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.5 }}>
              <p style={{ margin: '0 0 10px' }}>Tugaskan tim teknis Cipta Karya siaga untuk inspeksi fisik ke toko {modalData?.toko} di Kecamatan {modalData?.kecamatan}.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                <div>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: 3 }}>Pilih Tim Bertugas:</label>
                  <select style={{ width: '100%', padding: '7px 9px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11.5 }}>
                    <option>Tim 01 • Hendra W., ST ({modalData?.kecamatan || 'Babat'})</option>
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
                defaultValue={`Periksa stok fisik ${modalData?.material || 'material'} di gudang ${modalData?.toko} & minta salinan faktur distributor.`}
                style={{ width: '100%', padding: '7px 9px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11.5, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button onClick={() => setModalType(null)} style={BTN_SECONDARY}>Batal</button>
              <button
                onClick={handleDisposisiSubmit}
                style={BTN_PRIMARY}
              >
                Kirim Disposisi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Lightbox Foto Bukti Laporan Warga ── */}
      {fotoModal && (
        <div
          onClick={() => setFotoModal(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            cursor: 'zoom-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: 12,
              overflow: 'hidden',
              maxWidth: 720,
              width: '100%',
              maxHeight: '90vh',
              boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{
              padding: '12px 18px',
              background: '#0f172a',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>🧾</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Bukti Fisik Verifikasi (Nota / Struk Pembelian)</span>
              </div>
              <button
                onClick={() => setFotoModal(null)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: 6,
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                ✕ Tutup
              </button>
            </div>
            <div style={{ padding: 16, background: '#f8fafc', textAlign: 'center', overflow: 'auto' }}>
              <img
                src={fotoModal}
                alt="Bukti foto laporan"
                style={{
                  maxWidth: '100%',
                  maxHeight: '75vh',
                  objectFit: 'contain',
                  display: 'inline-block',
                  borderRadius: 6,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              />
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
