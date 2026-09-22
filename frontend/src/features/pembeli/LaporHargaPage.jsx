import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { submitLaporan } from '../../services/laporanService'
import { useDisparitas } from '../../hooks/useDisparitas'
import kecamatanData from '../../data/kecamatan_lamongan.json'
import sshData from '../../data/ssh_lamongan'

const WRAP  = { padding: '24px 32px', maxWidth: 700, margin: '0 auto' }
const INPUT = { width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#f8fafc', fontSize: 14, boxSizing: 'border-box', marginTop: 6, marginBottom: 16 }

export default function LaporHargaPage() {
  const location = useLocation()
  const prefill = location.state || {}

  const [form, setForm] = useState({
    id_kecamatan: prefill.id_kecamatan || '',
    nama_toko: prefill.nama_toko || '',
    nama_material: prefill.nama_material || '',
    harga_temuan: prefill.harga_temuan ? String(prefill.harga_temuan) : '',
    satuan: prefill.satuan || '',
  })
  const [sukses, setSukses] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const selectedSSH   = sshData.find((s) => s.nama_material === form.nama_material)
  const { persentase, statusZona } = useDisparitas(Number(form.harga_temuan), selectedSSH?.harga_ssh)

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await submitLaporan({
        ...form,
        id_kecamatan: Number(form.id_kecamatan),
        harga_temuan: Number(form.harga_temuan),
        satuan: form.satuan || selectedSSH?.satuan || 'satuan',
      })
      setSukses(true)
    } catch {
      setError('Gagal mengirim laporan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  if (sukses) return (
    <div style={{ background: '#0f172a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f8fafc' }}>
      <div style={{ textAlign: 'center', background: '#1e293b', padding: 40, borderRadius: 16, border: '1px solid #334155', maxWidth: 460 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <h2 style={{ color: '#34d399', margin: '0 0 8px' }}>Laporan Berhasil Dikirim!</h2>
        <p style={{ color: '#94a3b8', margin: 0, fontSize: 14 }}>
          Terima kasih telah berpartisipasi dalam pengawasan transparansi harga material konstruksi di Kabupaten Lamongan. Laporan Anda segera ditinjau oleh Dinas PU.
        </p>
        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={() => setSukses(false)} style={{ padding: '10px 18px', background: '#334155', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            Lapor Lagi
          </button>
          <Link to="/pembeli" style={{ padding: '10px 18px', background: '#0ea5e9', color: '#fff', textDecoration: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
            Ke Dasbor Harga
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#f8fafc' }}>
      <div style={WRAP}>
        <h1 style={{ color: '#38bdf8' }}>Lapor Harga Material</h1>
        {error && <div style={{ background: '#450a0a', color: '#fca5a5', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ background: '#1e293b', padding: 28, borderRadius: 16 }}>
          <label style={{ color: '#94a3b8', fontSize: 13 }}>Kecamatan</label>
          <select name="id_kecamatan" value={form.id_kecamatan} onChange={onChange} style={INPUT} required>
            <option value="">-- Pilih Kecamatan --</option>
            {kecamatanData.map((k) => <option key={k.id_kecamatan} value={k.id_kecamatan}>{k.nama_kecamatan}</option>)}
          </select>

          <label style={{ color: '#94a3b8', fontSize: 13 }}>Nama Toko Bangunan</label>
          <input name="nama_toko" value={form.nama_toko} onChange={onChange} placeholder="contoh: TB. Makmur Jaya" style={INPUT} required />

          <label style={{ color: '#94a3b8', fontSize: 13 }}>Material</label>
          <select name="nama_material" value={form.nama_material} onChange={onChange} style={INPUT} required>
            <option value="">-- Pilih Material --</option>
            {sshData.map((s) => <option key={s.nama_material} value={s.nama_material}>{s.nama_material}</option>)}
          </select>

          {selectedSSH && <p style={{ color: '#94a3b8', fontSize: 13, marginTop: -10, marginBottom: 12 }}>Harga SSH Acuan: <strong style={{ color: '#34d399' }}>Rp {selectedSSH.harga_ssh.toLocaleString('id-ID')} / {selectedSSH.satuan}</strong></p>}

          <label style={{ color: '#94a3b8', fontSize: 13 }}>Harga Temuan (Rp)</label>
          <input name="harga_temuan" type="number" value={form.harga_temuan} onChange={onChange} placeholder="contoh: 65000" style={INPUT} required />

          {form.harga_temuan && selectedSSH && (
            <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: statusZona === 'Merah' ? '#450a0a' : statusZona === 'Waspada' ? '#422006' : '#052e16' }}>
              <strong style={{ color: statusZona === 'Merah' ? '#fca5a5' : statusZona === 'Waspada' ? '#fcd34d' : '#34d399' }}>
                {statusZona} · Selisih {persentase > 0 ? '+' : ''}{persentase}% dari SSH
              </strong>
            </div>
          )}

          <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
            {loading ? 'Mengirim...' : 'Kirim Laporan'}
          </button>
        </form>
      </div>
    </div>
  )
}
