import { useState, useEffect } from 'react'
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder'
import { parseTeks } from '../../services/voiceService'
import { getSemuaToko, getKatalogToko, updateKatalogToko } from '../../services/adminService'
import sshLamongan from '../../data/ssh_lamongan'

const WRAP = { padding: '24px 32px', maxWidth: 1000, margin: '0 auto' }
const CARD = { background: '#1e293b', borderRadius: 14, padding: 24, border: '1px solid #334155' }

const CONTOH_SUARA = [
  'harga semen gresik lima puluh delapan ribu per zak',
  'besi beton polos delapan mili empat puluh lima ribu per batang',
  'pasir pasang seratus sembilan puluh ribu per kubik',
  'batu bata merah seribu per biji',
]

export default function AdminSurveiPage() {
  const {
    isRecording,
    transcript,
    finalTranscript,
    error: micError,
    isSupported,
    startRecording,
    stopRecording,
    resetTranscript,
  } = useVoiceRecorder()

  // State toko & katalog
  const [daftarToko, setDaftarToko]         = useState([])
  const [selectedTokoId, setSelectedTokoId] = useState('')
  const [katalogToko, setKatalogToko]       = useState([])
  const [loadingKatalog, setLoadingKatalog] = useState(false)

  // State NLP & Input
  const [modeInput, setModeInput]     = useState('suara') // 'suara' | 'teks'
  const [teksManual, setTeksManual]   = useState('')
  const [loadingNLP, setLoadingNLP]   = useState(false)
  const [transkripTeks, setTranskripTeks] = useState('')
  const [hasilParse, setHasilParse]   = useState(null)
  const [pesanSukses, setPesanSukses] = useState(null)
  const [simpanLoading, setSimpanLoading] = useState(false)

  // Teks aktif rekaman (realtime + final)
  const teksRekaman = (finalTranscript + ' ' + transcript).trim()

  // Ambil daftar toko saat pertama kali load
  useEffect(() => {
    getSemuaToko()
      .then((res) => {
        const tokos = res.data.data || []
        setDaftarToko(tokos)
        if (tokos.length > 0) {
          setSelectedTokoId(String(tokos[0].id_toko))
        }
      })
      .catch((err) => console.error('Gagal mengambil daftar toko:', err))
  }, [])

  // Muat katalog setiap kali toko yang dipilih berubah
  useEffect(() => {
    if (!selectedTokoId) return
    setLoadingKatalog(true)
    getKatalogToko(selectedTokoId)
      .then((res) => setKatalogToko(res.data.data || []))
      .catch(() => setKatalogToko([]))
      .finally(() => setLoadingKatalog(false))
  }, [selectedTokoId])

  const tokoAktif = daftarToko.find((t) => String(t.id_toko) === String(selectedTokoId))

  // Hitung disparitas terhadap SSH lokal
  const getDisparitasSSH = (namaMaterial, hargaJual) => {
    if (!namaMaterial || !hargaJual) return null
    const ssh = sshLamongan.find((item) =>
      namaMaterial.toLowerCase().includes(item.nama_material.toLowerCase()) ||
      item.nama_material.toLowerCase().includes(namaMaterial.toLowerCase())
    )
    if (!ssh) return null
    const diff = hargaJual - ssh.harga_ssh
    const persen = Math.round((diff / ssh.harga_ssh) * 100)
    return {
      harga_ssh: ssh.harga_ssh,
      persen,
      isTinggi: Math.abs(persen) >= 20,
    }
  }

  // Stop rekaman dan langsung proses NLP
  const handleStopDanProses = async () => {
    stopRecording()
    // Tunggu sebentar agar finalTranscript terupdate
    await new Promise((r) => setTimeout(r, 400))
    const teks = (finalTranscript + ' ' + transcript).trim()
    if (!teks) {
      alert('Tidak ada teks yang berhasil ditangkap. Coba ucapkan lebih jelas.')
      return
    }
    await prosesNLP(teks)
  }

  // Proses NLP dari teks
  const prosesNLP = async (teks) => {
    if (!teks || !teks.trim()) return
    setLoadingNLP(true)
    setPesanSukses(null)
    try {
      const res = await parseTeks(teks.trim())
      setTranskripTeks(teks.trim())
      setHasilParse(res.data.hasil_parse)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Gagal memproses NLP. Pastikan backend aktif.'
      alert(msg)
    } finally {
      setLoadingNLP(false)
    }
  }

  // Proses teks manual
  const handleProsesTeks = async (teks) => {
    const input = teks || teksManual
    if (!input.trim()) return
    await prosesNLP(input)
  }

  // Simpan ke katalog toko via API
  const handleSimpanKeKatalog = async () => {
    if (!selectedTokoId || !hasilParse) return
    setSimpanLoading(true)
    try {
      const payload = {
        nama_material: hasilParse.nama_material,
        harga_jual: Number(hasilParse.harga_jual),
        satuan: hasilParse.satuan || 'satuan',
        stok_tersedia: true,
      }
      await updateKatalogToko(selectedTokoId, payload)

      setPesanSukses(`Berhasil memperbarui harga "${payload.nama_material}" di toko ${tokoAktif?.nama_toko || 'terpilih'}!`)
      // Refresh katalog
      const refreshed = await getKatalogToko(selectedTokoId)
      setKatalogToko(refreshed.data.data || [])
      setHasilParse(null)
      setTranskripTeks('')
      resetTranscript()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Gagal menyimpan harga ke katalog.'
      alert(msg)
    } finally {
      setSimpanLoading(false)
    }
  }

  const disparitas = hasilParse ? getDisparitasSSH(hasilParse.nama_material, hasilParse.harga_jual) : null

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#f8fafc', paddingBottom: 60 }}>
      <div style={WRAP}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <span style={{ background: '#0369a1', color: '#e0f2fe', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
            🏢 Dinas PU &amp; Tata Ruang Lamongan · Petugas Survei
          </span>
          <h1 style={{ color: '#38bdf8', margin: '12px 0 6px', fontSize: 26 }}>
            Survei Lapangan &amp; Input Harga Suara (NLP)
          </h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: 14 }}>
            Petugas melakukan survei harga material langsung ke toko bangunan. Ucapkan harga material dan sistem AI akan mengekstrak datanya secara otomatis.
          </p>
        </div>

        {/* Notifikasi Sukses */}
        {pesanSukses && (
          <div style={{ marginBottom: 24, padding: '14px 18px', background: '#064e3b', border: '1px solid #059669', borderRadius: 10, color: '#6ee7b7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>✅ {pesanSukses}</span>
            <button onClick={() => setPesanSukses(null)} style={{ background: 'transparent', border: 'none', color: '#6ee7b7', cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>
        )}

        {/* Peringatan browser tidak support */}
        {!isSupported && (
          <div style={{ marginBottom: 20, padding: '12px 18px', background: '#451a03', border: '1px solid #ea580c', borderRadius: 10, color: '#fdba74', fontSize: 13 }}>
            ⚠️ <strong>Browser tidak mendukung Speech Recognition.</strong> Gunakan <strong>Google Chrome</strong> atau <strong>Microsoft Edge</strong> terbaru untuk fitur input suara. Anda tetap bisa menggunakan mode <em>Teks Manual</em>.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 24 }}>
          {/* Kolom Kiri: Pilih Toko & Input Suara */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Kartu Pilih Toko */}
            <div style={CARD}>
              <h3 style={{ margin: '0 0 14px', fontSize: 16, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🏪</span> Toko Bangunan yang Disurvei
              </h3>
              <label style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6, display: 'block' }}>
                Pilih Toko Tujuan:
              </label>
              <select
                id="select-toko-survei"
                value={selectedTokoId}
                onChange={(e) => setSelectedTokoId(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #475569', borderRadius: 8, color: '#f8fafc', fontSize: 14, outline: 'none' }}
              >
                {daftarToko.map((t) => (
                  <option key={t.id_toko} value={t.id_toko}>
                    {t.nama_toko} {t.nama_pemilik ? `(${t.nama_pemilik})` : ''} — Kec. {t.nama_kecamatan || 'Lamongan'}
                  </option>
                ))}
              </select>

              {tokoAktif && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: '#0f172a', borderRadius: 8, fontSize: 12, color: '#94a3b8', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>Pemilik: <strong style={{ color: '#cbd5e1' }}>{tokoAktif.nama_pemilik || '-'}</strong></div>
                  <div>Wilayah: <strong style={{ color: '#cbd5e1' }}>Kec. {tokoAktif.nama_kecamatan || 'Lamongan'}</strong></div>
                </div>
              )}
            </div>

            {/* Kartu Perekaman / Input Suara */}
            <div style={CARD}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🎙️</span> Rekam Perintah Suara (NLP)
                </h3>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setModeInput('suara')}
                    style={{ padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: modeInput === 'suara' ? '#0284c7' : '#334155', color: '#fff' }}
                  >
                    🎙️ Suara
                  </button>
                  <button
                    onClick={() => setModeInput('teks')}
                    style={{ padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: modeInput === 'teks' ? '#0284c7' : '#334155', color: '#fff' }}
                  >
                    ✏️ Teks Manual
                  </button>
                </div>
              </div>

              {modeInput === 'suara' ? (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>
                    Ucapkan kalimat harga material saat wawancara dengan penjual. Contoh: <em style={{ color: '#7dd3fc' }}>"harga semen lima puluh ribu per zak"</em>
                  </p>

                  {/* Tombol Mikrofon */}
                  <button
                    id="btn-admin-record"
                    onClick={isRecording ? handleStopDanProses : startRecording}
                    disabled={loadingNLP || !isSupported}
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: '50%',
                      border: 'none',
                      cursor: (loadingNLP || !isSupported) ? 'not-allowed' : 'pointer',
                      fontSize: 36,
                      background: isRecording ? '#dc2626' : '#0284c7',
                      boxShadow: isRecording
                        ? '0 0 0 10px rgba(220, 38, 38, 0.3), 0 0 0 20px rgba(220, 38, 38, 0.1)'
                        : '0 0 0 8px rgba(2, 132, 199, 0.25)',
                      transition: 'all 0.3s ease',
                      color: '#fff',
                      opacity: (!isSupported) ? 0.5 : 1,
                    }}
                  >
                    {isRecording ? '⏹' : '🎙️'}
                  </button>

                  <p style={{ color: isRecording ? '#f87171' : '#64748b', marginTop: 16, fontSize: 13, fontWeight: isRecording ? 600 : 400 }}>
                    {isRecording ? '🔴 Merekam ucapan... Klik untuk selesai & proses' : 'Klik mikrofon untuk mulai merekam'}
                  </p>

                  {micError && <p style={{ color: '#f87171', fontSize: 12, marginTop: 8 }}>{micError}</p>}

                  {/* Tampilkan teks real-time */}
                  {(isRecording || teksRekaman) && (
                    <div style={{ marginTop: 16, padding: 14, background: '#0f172a', borderRadius: 10, textAlign: 'left', border: '1px solid #1e293b' }}>
                      <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {isRecording ? 'Menangkap suara...' : 'Teks berhasil ditangkap:'}
                      </span>
                      <p style={{ margin: '6px 0 0', color: isRecording ? '#94a3b8' : '#e2e8f0', fontStyle: 'italic', fontSize: 14, lineHeight: 1.5 }}>
                        {teksRekaman || <span style={{ color: '#475569' }}>Menunggu ucapan...</span>}
                        {isRecording && transcript && (
                          <span style={{ color: '#60a5fa' }}> {transcript}</span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Tombol proses manual jika sudah ada teks */}
                  {!isRecording && teksRekaman && !hasilParse && (
                    <button
                      id="btn-admin-proses-audio"
                      onClick={() => prosesNLP(teksRekaman)}
                      disabled={loadingNLP}
                      style={{
                        marginTop: 14,
                        width: '100%',
                        padding: '10px',
                        background: loadingNLP ? '#475569' : '#7c3aed',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        fontWeight: 600,
                        cursor: loadingNLP ? 'not-allowed' : 'pointer',
                        fontSize: 14,
                      }}
                    >
                      {loadingNLP ? '⚡ Memproses NLP...' : '⚡ Ekstrak Harga via NLP'}
                    </button>
                  )}

                  {/* Tombol rekam ulang */}
                  {!isRecording && teksRekaman && (
                    <button
                      onClick={() => { resetTranscript(); setHasilParse(null); setTranskripTeks('') }}
                      style={{ marginTop: 8, width: '100%', padding: '8px', background: '#334155', color: '#94a3b8', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
                    >
                      🔄 Rekam Ulang
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>
                    Ketik kalimat harga material untuk diproses NLP:
                  </p>
                  <textarea
                    rows={3}
                    value={teksManual}
                    onChange={(e) => setTeksManual(e.target.value)}
                    placeholder="Contoh: harga semen gresik lima puluh delapan ribu per zak"
                    style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #475569', borderRadius: 8, color: '#f8fafc', fontSize: 13, resize: 'none', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10, marginBottom: 14 }}>
                    <span style={{ fontSize: 11, color: '#64748b', alignSelf: 'center' }}>Coba contoh:</span>
                    {CONTOH_SUARA.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => { setTeksManual(c); handleProsesTeks(c) }}
                        style={{ fontSize: 11, background: '#334155', color: '#cbd5e1', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}
                      >
                        {c.split(' ').slice(0, 3).join(' ')}...
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handleProsesTeks()}
                    disabled={loadingNLP || !teksManual.trim()}
                    style={{ width: '100%', padding: '10px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
                  >
                    {loadingNLP ? '⏳ Sedang Memparsing...' : '⚡ Proses Parsing NLP'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Hasil Parsing NLP & Disparitas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Kartu Hasil Parsing */}
            <div style={CARD}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🤖</span> Hasil Ekstraksi AI / NLP
              </h3>

              {loadingNLP ? (
                <div style={{ padding: '36px 16px', textAlign: 'center', color: '#60a5fa' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>⚡</div>
                  <p style={{ margin: 0, fontSize: 13 }}>Memproses teks dengan NLP...</p>
                </div>
              ) : !hasilParse ? (
                <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748b', background: '#0f172a', borderRadius: 10, border: '1px dashed #334155' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎙️</div>
                  <p style={{ margin: 0, fontSize: 13 }}>Rekam ucapan survei atau jalankan teks manual untuk melihat hasil parsing NLP.</p>
                </div>
              ) : (
                <div style={{ background: '#0f172a', borderRadius: 10, padding: 18, border: '1px solid #334155' }}>
                  {transkripTeks && (
                    <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #1e293b' }}>
                      <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Transkrip Ucapan:</span>
                      <p style={{ margin: '4px 0 0', color: '#e2e8f0', fontStyle: 'italic', fontSize: 14 }}>
                        "{transkripTeks}"
                      </p>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div>
                      <span style={{ fontSize: 11, color: '#64748b' }}>Material Terdeteksi</span>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#38bdf8' }}>{hasilParse.nama_material}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: '#64748b' }}>Satuan</span>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#cbd5e1' }}>{hasilParse.satuan || 'zak'}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: '#64748b' }}>Harga Temuan Survei</span>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#34d399' }}>
                        Rp {Number(hasilParse.harga_jual).toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: '#64748b' }}>Tingkat Keyakinan (NLP)</span>
                      <div>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          background: hasilParse.confidence === 'high' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                          color: hasilParse.confidence === 'high' ? '#34d399' : '#fbbf24',
                          border: `1px solid ${hasilParse.confidence === 'high' ? '#059669' : '#d97706'}`,
                        }}>
                          {hasilParse.confidence === 'high' ? '✓ Tinggi (Akurat)' : '⚠ Perlu Verifikasi'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Benchmark SSH & Disparitas */}
                  {disparitas && (
                    <div style={{
                      marginTop: 12,
                      padding: 12,
                      borderRadius: 8,
                      background: disparitas.isTinggi ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      border: `1px solid ${disparitas.isTinggi ? '#ef4444' : '#10b981'}`,
                      fontSize: 12,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: '#94a3b8' }}>Standar SSH Lamongan:</span>
                        <strong style={{ color: '#cbd5e1' }}>Rp {disparitas.harga_ssh.toLocaleString('id-ID')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Selisih terhadap SSH:</span>
                        <strong style={{ color: disparitas.isTinggi ? '#f87171' : '#34d399' }}>
                          {disparitas.persen > 0 ? `+${disparitas.persen}%` : `${disparitas.persen}%`}
                          {disparitas.isTinggi ? ' ⚠ Disparitas Signifikan' : ' ✓ Wajar'}
                        </strong>
                      </div>
                    </div>
                  )}

                  <button
                    id="btn-simpan-katalog"
                    onClick={handleSimpanKeKatalog}
                    disabled={simpanLoading || hasilParse.confidence !== 'high'}
                    title={hasilParse.confidence !== 'high' ? 'Koreksi teks manual sebelum menyimpan' : ''}
                    style={{
                      width: '100%',
                      marginTop: 16,
                      padding: '12px',
                      background: simpanLoading ? '#475569' : hasilParse.confidence !== 'high' ? '#374151' : '#16a34a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontWeight: 700,
                      cursor: (simpanLoading || hasilParse.confidence !== 'high') ? 'not-allowed' : 'pointer',
                      fontSize: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      transition: 'background 0.2s',
                    }}
                  >
                    <span>✓</span> {simpanLoading ? 'Menyimpan...' : `Simpan ke Katalog ${tokoAktif?.nama_toko || 'Toko'}`}
                  </button>
                  {hasilParse.confidence !== 'high' && (
                    <p style={{ fontSize: 11, color: '#fbbf24', textAlign: 'center', marginTop: 6 }}>
                      Keyakinan rendah. Coba ucapkan kembali dengan lebih jelas atau perbaiki teks manual.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabel Katalog Toko Terpilih */}
        <div style={{ ...CARD, marginTop: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, color: '#e2e8f0' }}>
                📋 Katalog Harga Saat Ini — {tokoAktif?.nama_toko || 'Toko'}
              </h3>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
                Daftar harga material toko yang telah diverifikasi dan disinkronkan oleh Admin survei.
              </p>
            </div>
            <span style={{ fontSize: 12, color: '#94a3b8', background: '#0f172a', padding: '4px 10px', borderRadius: 6 }}>
              Total: {katalogToko.length} Material
            </span>
          </div>

          {loadingKatalog ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: 24 }}>Memuat katalog toko...</p>
          ) : katalogToko.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 12px', color: '#64748b', background: '#0f172a', borderRadius: 8 }}>
              Toko ini belum memiliki daftar harga material. Gunakan formulir survei suara di atas untuk menambahkan harga pertama.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#94a3b8', textAlign: 'left', borderBottom: '1px solid #334155' }}>
                    <th style={{ padding: '10px 14px' }}>Nama Material</th>
                    <th style={{ padding: '10px 14px' }}>Harga Survei</th>
                    <th style={{ padding: '10px 14px' }}>Satuan</th>
                    <th style={{ padding: '10px 14px' }}>Status Stok</th>
                    <th style={{ padding: '10px 14px' }}>Terakhir Diperbarui</th>
                  </tr>
                </thead>
                <tbody>
                  {katalogToko.map((item, idx) => (
                    <tr key={item.id_katalog || idx} style={{ borderBottom: '1px solid #334155', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#f1f5f9' }}>{item.nama_material}</td>
                      <td style={{ padding: '10px 14px', color: '#34d399', fontWeight: 600 }}>
                        Rp {Number(item.harga_jual).toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>{item.satuan}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ color: item.stok_tersedia ? '#34d399' : '#f87171' }}>
                          {item.stok_tersedia ? '● Tersedia' : '○ Kosong'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 12 }}>
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
