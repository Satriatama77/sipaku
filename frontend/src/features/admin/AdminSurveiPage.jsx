import { useState, useEffect } from 'react'
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder'
import { parseTeks } from '../../services/voiceService'
import { getSemuaToko, getKatalogToko, updateKatalogToko } from '../../services/adminService'
import sshLamongan from '../../data/ssh_lamongan'
import AlertBox from '../../components/ui/AlertBox'

const CARD = {
  background: '#ffffff',
  borderRadius: 12,
  padding: 22,
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
}

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
    <div style={{ background: '#f8fafc', minHeight: '100vh', color: '#1e293b', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", paddingBottom: 60 }}>
      <div className="dash-container" style={{ maxWidth: 1200 }}>
        {/* Hero Banner */}
        <section className="hero-banner-box">
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
                SIPAKU SURVEI NLP
              </span>
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                • Dinas PU & Tata Ruang Lamongan •
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
                AI Ready
              </span>
            </div>
          </div>

          <div style={{ maxWidth: 880, marginBottom: 16 }}>
            <h1 style={{
              fontSize: 'clamp(20px, 4vw, 26px)',
              fontWeight: 800,
              color: '#ffffff',
              margin: '0 0 8px',
              letterSpacing: '-0.02em',
              lineHeight: 1.25
            }}>
              Survei Lapangan & Input Harga Suara (NLP)
            </h1>
            <p style={{
              fontSize: 'clamp(12px, 2.5vw, 13px)',
              color: '#94a3b8',
              margin: 0,
              lineHeight: 1.55
            }}>
              Petugas melakukan survei harga material langsung ke toko bangunan. Ucapkan harga material dan sistem AI akan mengekstrak datanya secara otomatis.
            </p>
          </div>
        </section>

        {/* Notifikasi Sukses */}
        {pesanSukses && (
          <AlertBox
            variant="success"
            title="Berhasil Disimpan"
            style={{ marginBottom: 20 }}
            actions={
              <button
                type="button"
                onClick={() => setPesanSukses(null)}
                style={{
                  background: '#047857',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '4px 12px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Tutup
              </button>
            }
          >
            {pesanSukses}
          </AlertBox>
        )}

        {/* Peringatan browser tidak support */}
        {!isSupported && (
          <AlertBox
            variant="warning"
            title="Browser Tidak Mendukung Speech Recognition"
            style={{ marginBottom: 20 }}
          >
            Gunakan <strong>Google Chrome</strong> atau <strong>Microsoft Edge</strong> versi modern untuk fitur input suara realtime. Anda tetap dapat menggunakan mode input <em>Teks Manual</em>.
          </AlertBox>
        )}


        <div className="dash-split-comparison" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {/* Kolom Kiri: Pilih Toko & Input Suara */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Kartu Pilih Toko */}
            <div style={CARD}>
              <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                Toko Bangunan yang Disurvei
              </h3>
              <label style={{ fontSize: 12, color: '#64748b', marginBottom: 6, display: 'block', fontWeight: 600 }}>
                Pilih Toko Tujuan:
              </label>
              <select
                id="select-toko-survei"
                value={selectedTokoId}
                onChange={(e) => setSelectedTokoId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  color: '#0f172a',
                  fontSize: 13,
                  outline: 'none',
                  fontWeight: 600
                }}
              >
                {daftarToko.map((t) => (
                  <option key={t.id_toko} value={t.id_toko}>
                    {t.nama_toko} {t.nama_pemilik ? `(${t.nama_pemilik})` : ''} — Kec. {t.nama_kecamatan || 'Lamongan'}
                  </option>
                ))}
              </select>

              {tokoAktif && (
                <div style={{
                  marginTop: 14,
                  padding: '10px 14px',
                  background: '#f8fafc',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#64748b',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  border: '1px solid #f1f5f9'
                }}>
                  <div>Pemilik: <strong style={{ color: '#0f172a' }}>{tokoAktif.nama_pemilik || '-'}</strong></div>
                  <div>Wilayah: <strong style={{ color: '#0f172a' }}>Kec. {tokoAktif.nama_kecamatan || 'Lamongan'}</strong></div>
                </div>
              )}
            </div>

            {/* Kartu Perekaman / Input Suara */}
            <div style={CARD}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                  Rekam Perintah Suara (NLP)
                </h3>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setModeInput('suara')}
                    style={{
                      padding: '5px 14px',
                      borderRadius: 20,
                      border: '1px solid',
                      borderColor: modeInput === 'suara' ? '#0f172a' : '#cbd5e1',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                      background: modeInput === 'suara' ? '#0f172a' : '#ffffff',
                      color: modeInput === 'suara' ? '#fff' : '#475569'
                    }}
                  >
                    Suara
                  </button>
                  <button
                    onClick={() => setModeInput('teks')}
                    style={{
                      padding: '5px 14px',
                      borderRadius: 20,
                      border: '1px solid',
                      borderColor: modeInput === 'teks' ? '#0f172a' : '#cbd5e1',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                      background: modeInput === 'teks' ? '#0f172a' : '#ffffff',
                      color: modeInput === 'teks' ? '#fff' : '#475569'
                    }}
                  >
                    Teks Manual
                  </button>
                </div>
              </div>

              {modeInput === 'suara' ? (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
                    Ucapkan kalimat harga material saat wawancara dengan penjual. Contoh: <em style={{ color: '#0284c7' }}>"harga semen lima puluh ribu per zak"</em>
                  </p>

                  {/* Tombol Mikrofon */}
                  <button
                    id="btn-admin-record"
                    onClick={isRecording ? handleStopDanProses : startRecording}
                    disabled={loadingNLP || !isSupported}
                    style={{
                      width: 90,
                      height: 90,
                      borderRadius: '50%',
                      border: 'none',
                      cursor: (loadingNLP || !isSupported) ? 'not-allowed' : 'pointer',
                      fontSize: 14,
                      fontWeight: 800,
                      background: isRecording ? '#dc2626' : 'linear-gradient(135deg, #0f172a, #1e293b)',
                      boxShadow: isRecording
                        ? '0 0 0 8px rgba(220, 38, 38, 0.25)'
                        : '0 4px 14px rgba(15, 23, 42, 0.2)',
                      transition: 'all 0.25s ease',
                      color: '#fff',
                      opacity: (!isSupported) ? 0.5 : 1,
                    }}
                  >
                    {isRecording ? 'Berhenti' : 'Rekam'}
                  </button>

                  <p style={{ color: isRecording ? '#dc2626' : '#64748b', marginTop: 16, fontSize: 13, fontWeight: isRecording ? 600 : 400 }}>
                    {isRecording ? 'Merekam ucapan... Klik untuk selesai & proses' : 'Klik tombol untuk mulai merekam'}
                  </p>

                  {micError && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 8 }}>{micError}</p>}

                  {/* Tampilkan teks real-time */}
                  {(isRecording || teksRekaman) && (
                    <div style={{
                      marginTop: 16,
                      padding: 14,
                      background: '#f8fafc',
                      borderRadius: 10,
                      textAlign: 'left',
                      border: '1px solid #e2e8f0'
                    }}>
                      <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
                        {isRecording ? 'Menangkap suara...' : 'Teks berhasil ditangkap:'}
                      </span>
                      <p style={{ margin: '6px 0 0', color: isRecording ? '#94a3b8' : '#0f172a', fontStyle: 'italic', fontSize: 14, lineHeight: 1.5 }}>
                        {teksRekaman || <span style={{ color: '#94a3b8' }}>Menunggu ucapan...</span>}
                        {isRecording && transcript && (
                          <span style={{ color: '#0284c7' }}> {transcript}</span>
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
                        background: loadingNLP ? '#94a3b8' : 'linear-gradient(135deg, #0f172a, #1e293b)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        fontWeight: 700,
                        cursor: loadingNLP ? 'not-allowed' : 'pointer',
                        fontSize: 14,
                      }}
                    >
                      {loadingNLP ? 'Memproses NLP...' : 'Ekstrak Harga via NLP'}
                    </button>
                  )}

                  {/* Tombol rekam ulang */}
                  {!isRecording && teksRekaman && (
                    <button
                      onClick={() => { resetTranscript(); setHasilParse(null); setTranskripTeks('') }}
                      style={{ marginTop: 8, width: '100%', padding: '8px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                    >
                      Rekam Ulang
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <p style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>
                    Ketik kalimat harga material untuk diproses NLP:
                  </p>
                  <textarea
                    rows={3}
                    value={teksManual}
                    onChange={(e) => setTeksManual(e.target.value)}
                    placeholder="Contoh: harga semen gresik lima puluh delapan ribu per zak"
                    style={{ width: '100%', padding: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a', fontSize: 13, resize: 'none', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10, marginBottom: 14 }}>
                    <span style={{ fontSize: 11, color: '#64748b', alignSelf: 'center', fontWeight: 600 }}>Coba contoh:</span>
                    {CONTOH_SUARA.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => { setTeksManual(c); handleProsesTeks(c) }}
                        style={{ fontSize: 11, background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 20, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        {c.split(' ').slice(0, 3).join(' ')}...
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handleProsesTeks()}
                    disabled={loadingNLP || !teksManual.trim()}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'linear-gradient(135deg, #ea580c, #f97316)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: 14,
                      opacity: (!teksManual.trim() || loadingNLP) ? 0.6 : 1
                    }}
                  >
                    {loadingNLP ? 'Sedang Memparsing...' : 'Proses Parsing NLP'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Hasil Parsing NLP & Disparitas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Kartu Hasil Parsing */}
            <div style={CARD}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                Hasil Ekstraksi AI / NLP
              </h3>

              {loadingNLP ? (
                <div style={{ padding: '36px 16px', textAlign: 'center', color: '#0284c7' }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Memproses teks dengan NLP...</p>
                </div>
              ) : !hasilParse ? (
                <div style={{ padding: '36px 16px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: 10, border: '1px dashed #e2e8f0' }}>
                  <p style={{ margin: 0, fontSize: 13 }}>Rekam ucapan survei atau jalankan teks manual untuk melihat hasil parsing NLP.</p>
                </div>
              ) : (
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: 18, border: '1px solid #e2e8f0' }}>
                  {transkripTeks && (
                    <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>Transkrip Ucapan:</span>
                      <p style={{ margin: '4px 0 0', color: '#0f172a', fontStyle: 'italic', fontSize: 14 }}>
                        "{transkripTeks}"
                      </p>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div>
                      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Material Terdeteksi</span>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0284c7' }}>{hasilParse.nama_material}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Satuan</span>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{hasilParse.satuan || 'zak'}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Harga Temuan Survei</span>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#059669' }}>
                        Rp {Number(hasilParse.harga_jual).toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Tingkat Keyakinan (NLP)</span>
                      <div>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 700,
                          background: hasilParse.confidence === 'high' ? '#dcfce7' : '#fef3c7',
                          color: hasilParse.confidence === 'high' ? '#15803d' : '#92400e',
                          border: `1px solid ${hasilParse.confidence === 'high' ? '#86efac' : '#fcd34d'}`,
                        }}>
                          {hasilParse.confidence === 'high' ? 'Tinggi (Akurat)' : 'Perlu Verifikasi'}
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
                      background: disparitas.isTinggi ? '#fee2e2' : '#dcfce7',
                      border: `1px solid ${disparitas.isTinggi ? '#fecaca' : '#86efac'}`,
                      fontSize: 12,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: '#64748b' }}>Standar SSH Lamongan:</span>
                        <strong style={{ color: '#0f172a' }}>Rp {disparitas.harga_ssh.toLocaleString('id-ID')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Selisih terhadap SSH:</span>
                        <strong style={{ color: disparitas.isTinggi ? '#b91c1c' : '#15803d' }}>
                          {disparitas.persen > 0 ? `+${disparitas.persen}%` : `${disparitas.persen}%`}
                          {disparitas.isTinggi ? ' (Disparitas Signifikan)' : ' (Wajar)'}
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
                      background: simpanLoading ? '#94a3b8' : hasilParse.confidence !== 'high' ? '#e2e8f0' : 'linear-gradient(135deg, #059669, #10b981)',
                      color: hasilParse.confidence !== 'high' ? '#94a3b8' : '#fff',
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
                    <span>{simpanLoading ? 'Menyimpan...' : `Simpan ke Katalog ${tokoAktif?.nama_toko || 'Toko'}`}</span>
                  </button>
                  {hasilParse.confidence !== 'high' && (
                    <p style={{ fontSize: 11, color: '#92400e', textAlign: 'center', marginTop: 6 }}>
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
            <div style={{ borderLeft: '3px solid #0f172a', paddingLeft: 10 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                Katalog Harga Saat Ini — {tokoAktif?.nama_toko || 'Toko'}
              </h3>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
                Daftar harga material toko yang telah diverifikasi dan disinkronkan oleh Admin survei.
              </p>
            </div>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#475569',
              background: '#f1f5f9',
              padding: '4px 12px',
              borderRadius: 20
            }}>
              Total: {katalogToko.length} Material
            </span>
          </div>

          {loadingKatalog ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: 24 }}>Memuat katalog toko...</p>
          ) : katalogToko.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 12px', color: '#94a3b8', background: '#f8fafc', borderRadius: 8, border: '1px dashed #e2e8f0' }}>
              Toko ini belum memiliki daftar harga material. Gunakan formulir survei suara di atas untuk menambahkan harga pertama.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>Nama Material</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>Harga Survei</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>Satuan</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>Status Stok</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>Terakhir Diperbarui</th>
                  </tr>
                </thead>
                <tbody>
                  {katalogToko.map((item, idx) => (
                    <tr key={item.id_katalog || idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#fafbfc' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{item.nama_material}</td>
                      <td style={{ padding: '12px 16px', color: '#059669', fontWeight: 700 }}>
                        Rp {Number(item.harga_jual).toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>{item.satuan}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          color: item.stok_tersedia ? '#15803d' : '#b91c1c',
                          fontWeight: 600,
                          fontSize: 12,
                          background: item.stok_tersedia ? '#dcfce7' : '#fee2e2',
                          padding: '2px 8px',
                          borderRadius: 20,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.stok_tersedia ? '#15803d' : '#b91c1c' }} />
                          {item.stok_tersedia ? 'Tersedia' : 'Kosong'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 12 }}>
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
