import { useState } from 'react'
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder'
import { kirimAudio } from '../../services/voiceService'

const WRAP = { padding: '24px 32px', maxWidth: 700, margin: '0 auto' }

export default function VoiceInputPage() {
  const { isRecording, audioBlob, error, startRecording, stopRecording } = useVoiceRecorder()
  const [hasilParse, setHasilParse] = useState(null)
  const [loading, setLoading]       = useState(false)
  const [sukses, setSukses]         = useState(false)

  const handleKirim = async () => {
    if (!audioBlob) return
    setLoading(true)
    try {
      const res = await kirimAudio(audioBlob)
      setHasilParse(res.hasil_parse)
    } catch {
      alert('Gagal memproses audio. Pastikan backend aktif.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#f8fafc' }}>
      <div style={WRAP}>
        <h1 style={{ color: '#38bdf8' }}>Input Harga via Suara</h1>
        <p style={{ color: '#64748b', marginBottom: 32 }}>Ucapkan harga material, misalnya: <em style={{ color: '#94a3b8' }}>"harga semen gresik lima puluh delapan ribu per zak"</em></p>

        <div style={{ background: '#1e293b', borderRadius: 16, padding: 32, textAlign: 'center' }}>
          <button id="btn-record"
            onClick={isRecording ? stopRecording : startRecording}
            style={{ width: 120, height: 120, borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 40, background: isRecording ? '#ef4444' : '#0ea5e9', boxShadow: isRecording ? '0 0 0 8px rgba(239,68,68,0.3)' : '0 0 0 8px rgba(14,165,233,0.2)', transition: 'all 0.3s' }}>
            {isRecording ? '⏹' : '🎙️'}
          </button>
          <p style={{ color: '#64748b', marginTop: 16 }}>{isRecording ? 'Merekam... Klik untuk berhenti' : 'Klik untuk mulai merekam'}</p>
          {error && <p style={{ color: '#f87171', marginTop: 8 }}>{error}</p>}

          {audioBlob && !isRecording && (
            <div style={{ marginTop: 24 }}>
              <audio controls src={URL.createObjectURL(audioBlob)} style={{ marginBottom: 16 }} />
              <br />
              <button id="btn-proses" onClick={handleKirim} disabled={loading}
                style={{ padding: '10px 32px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                {loading ? 'Memproses NLP...' : 'Proses dengan AI'}
              </button>
            </div>
          )}

          {hasilParse && (
            <div style={{ marginTop: 24, background: '#0f172a', borderRadius: 12, padding: 20, textAlign: 'left' }}>
              <h3 style={{ color: '#a78bfa', margin: '0 0 12px' }}>Hasil Parsing NLP</h3>
              <p><span style={{ color: '#64748b' }}>Material:</span> <strong>{hasilParse.nama_material}</strong></p>
              <p><span style={{ color: '#64748b' }}>Harga:</span> <strong style={{ color: '#34d399' }}>Rp {Number(hasilParse.harga_jual).toLocaleString('id-ID')}</strong></p>
              <p><span style={{ color: '#64748b' }}>Satuan:</span> <strong>{hasilParse.satuan}</strong></p>
              <p><span style={{ color: '#64748b' }}>Keyakinan:</span> <strong style={{ color: hasilParse.confidence === 'high' ? '#34d399' : '#f59e0b' }}>{hasilParse.confidence}</strong></p>
              {hasilParse.confidence === 'high' && (
                <button onClick={() => setSukses(true)} style={{ marginTop: 12, padding: '8px 24px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                  ✓ Simpan ke Katalog
                </button>
              )}
            </div>
          )}

          {sukses && <div style={{ marginTop: 16, padding: 12, background: '#052e16', borderRadius: 8, color: '#34d399' }}>✅ Harga berhasil disimpan ke katalog!</div>}
        </div>
      </div>
    </div>
  )
}
