import { useState } from 'react'
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder'
import { parseTeks } from '../../services/voiceService'

const WRAP = { padding: '24px 32px', maxWidth: 700, margin: '0 auto' }

export default function VoiceInputPage() {
  const {
    isRecording,
    transcript,
    finalTranscript,
    error,
    isSupported,
    startRecording,
    stopRecording,
    resetTranscript,
  } = useVoiceRecorder()

  const [hasilParse, setHasilParse] = useState(null)
  const [loading, setLoading]       = useState(false)
  const [sukses, setSukses]         = useState(false)
  const [teksAktif, setTeksAktif]   = useState('')

  // Teks real-time (final + interim)
  const teksRekaman = (finalTranscript + ' ' + transcript).trim()

  const handleStopDanProses = async () => {
    stopRecording()
    await new Promise((r) => setTimeout(r, 400))
    const teks = (finalTranscript + ' ' + transcript).trim()
    if (!teks) {
      alert('Tidak ada teks yang ditangkap. Coba ucapkan lebih jelas.')
      return
    }
    setTeksAktif(teks)
    await prosesNLP(teks)
  }

  const prosesNLP = async (teks) => {
    if (!teks || !teks.trim()) return
    setLoading(true)
    setSukses(false)
    try {
      const res = await parseTeks(teks.trim())
      setHasilParse(res.data.hasil_parse)
    } catch (err) {
      alert(err.response?.data?.detail || 'Gagal memproses NLP. Pastikan backend aktif.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    resetTranscript()
    setHasilParse(null)
    setTeksAktif('')
    setSukses(false)
  }

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#f8fafc' }}>
      <div style={WRAP}>
        <h1 style={{ color: '#38bdf8' }}>Input Harga via Suara</h1>
        <p style={{ color: '#64748b', marginBottom: 32 }}>
          Ucapkan harga material, misalnya:{' '}
          <em style={{ color: '#94a3b8' }}>"harga semen gresik lima puluh delapan ribu per zak"</em>
        </p>

        {/* Peringatan browser tidak support */}
        {!isSupported && (
          <div style={{ marginBottom: 20, padding: '12px 18px', background: '#451a03', border: '1px solid #ea580c', borderRadius: 10, color: '#fdba74', fontSize: 13 }}>
            ⚠️ <strong>Browser tidak mendukung Speech Recognition.</strong> Gunakan <strong>Google Chrome</strong> atau <strong>Microsoft Edge</strong> untuk fitur suara.
          </div>
        )}

        <div style={{ background: '#1e293b', borderRadius: 16, padding: 32, textAlign: 'center' }}>
          {/* Tombol Mikrofon */}
          <button
            id="btn-record"
            onClick={isRecording ? handleStopDanProses : startRecording}
            disabled={loading || !isSupported}
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              border: 'none',
              cursor: (loading || !isSupported) ? 'not-allowed' : 'pointer',
              fontSize: 40,
              background: isRecording ? '#ef4444' : '#0ea5e9',
              boxShadow: isRecording
                ? '0 0 0 8px rgba(239,68,68,0.3), 0 0 0 16px rgba(239,68,68,0.1)'
                : '0 0 0 8px rgba(14,165,233,0.2)',
              transition: 'all 0.3s',
              opacity: !isSupported ? 0.5 : 1,
            }}
          >
            {isRecording ? '⏹' : '🎙️'}
          </button>

          <p style={{ color: isRecording ? '#f87171' : '#64748b', marginTop: 16, fontWeight: isRecording ? 600 : 400 }}>
            {isRecording ? '🔴 Merekam... Klik untuk selesai & proses' : 'Klik untuk mulai merekam'}
          </p>

          {error && <p style={{ color: '#f87171', marginTop: 8, fontSize: 13 }}>{error}</p>}

          {/* Tampilkan teks real-time */}
          {(isRecording || teksRekaman) && (
            <div style={{ marginTop: 20, padding: 14, background: '#0f172a', borderRadius: 10, textAlign: 'left', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>
                {isRecording ? 'Menangkap suara...' : 'Teks berhasil ditangkap:'}
              </span>
              <p style={{ margin: '6px 0 0', color: '#e2e8f0', fontStyle: 'italic', fontSize: 14 }}>
                {teksRekaman}
                {isRecording && transcript && (
                  <span style={{ color: '#60a5fa' }}> {transcript}</span>
                )}
              </p>
            </div>
          )}

          {/* Tombol proses manual */}
          {!isRecording && teksRekaman && !hasilParse && (
            <div style={{ marginTop: 20, display: 'flex', gap: 8, flexDirection: 'column' }}>
              <button
                id="btn-proses"
                onClick={() => { setTeksAktif(teksRekaman); prosesNLP(teksRekaman) }}
                disabled={loading}
                style={{
                  padding: '10px 32px',
                  background: '#7c3aed',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                {loading ? '⚡ Memproses NLP...' : '⚡ Proses dengan AI'}
              </button>
              <button
                onClick={handleReset}
                style={{ padding: '8px', background: '#334155', color: '#94a3b8', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
              >
                🔄 Rekam Ulang
              </button>
            </div>
          )}

          {/* Hasil parsing */}
          {hasilParse && (
            <div style={{ marginTop: 24, background: '#0f172a', borderRadius: 12, padding: 20, textAlign: 'left' }}>
              <h3 style={{ color: '#a78bfa', margin: '0 0 12px' }}>Hasil Parsing NLP</h3>
              {teksAktif && (
                <p style={{ fontSize: 12, color: '#475569', fontStyle: 'italic', marginBottom: 12 }}>
                  Transkrip: "{teksAktif}"
                </p>
              )}
              <p><span style={{ color: '#64748b' }}>Material:</span> <strong>{hasilParse.nama_material}</strong></p>
              <p><span style={{ color: '#64748b' }}>Harga:</span> <strong style={{ color: '#34d399' }}>Rp {Number(hasilParse.harga_jual).toLocaleString('id-ID')}</strong></p>
              <p><span style={{ color: '#64748b' }}>Satuan:</span> <strong>{hasilParse.satuan}</strong></p>
              <p><span style={{ color: '#64748b' }}>Keyakinan:</span>{' '}
                <strong style={{ color: hasilParse.confidence === 'high' ? '#34d399' : '#f59e0b' }}>
                  {hasilParse.confidence === 'high' ? '✓ Tinggi' : '⚠ Perlu Verifikasi'}
                </strong>
              </p>

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                {hasilParse.confidence === 'high' && (
                  <button
                    onClick={() => setSukses(true)}
                    style={{ flex: 1, padding: '8px 24px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
                  >
                    ✓ Simpan ke Katalog
                  </button>
                )}
                <button
                  onClick={handleReset}
                  style={{ padding: '8px 16px', background: '#334155', color: '#94a3b8', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
                >
                  🔄 Ulang
                </button>
              </div>
            </div>
          )}

          {sukses && (
            <div style={{ marginTop: 16, padding: 12, background: '#052e16', borderRadius: 8, color: '#34d399' }}>
              ✅ Harga berhasil disimpan ke katalog!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
