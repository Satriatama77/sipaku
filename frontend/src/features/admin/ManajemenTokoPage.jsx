import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'  // used for 'Kembali ke Dasbor' link
import { getSemuaToko, tambahToko, getDaftarKecamatan } from '../../services/adminService'
import { IconCheck, IconCopy, IconCheckCircle, IconX } from '../../components/Icons'

export default function ManajemenTokoPage() {
  const [daftarToko, setDaftarToko] = useState([])
  const [daftarKecamatan, setDaftarKecamatan] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalTambah, setModalTambah] = useState(false)
  const [search, setSearch] = useState('')
  const [filterKec, setFilterKec] = useState('')

  // Form State
  const [form, setForm] = useState({
    nama_toko: '',
    nama_pemilik: '',
    id_kecamatan: '',
    latitude: '',
    longitude: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [akunBaru, setAkunBaru] = useState(null)
  const [copySuccess, setCopySuccess] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resToko, resKec] = await Promise.all([
        getSemuaToko(),
        getDaftarKecamatan()
      ])
      setDaftarToko(resToko.data?.data || [])
      setDaftarKecamatan(resKec.data?.data || [])
    } catch (err) {
      console.error('Error fetching toko / kecamatan:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    if (!form.nama_toko || !form.id_kecamatan) {
      setErrorMsg('Nama toko dan kecamatan wajib diisi.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        nama_toko: form.nama_toko,
        nama_pemilik: form.nama_pemilik || form.nama_toko,
        id_kecamatan: Number(form.id_kecamatan),
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null
      }
      const res = await tambahToko(payload)
      const data = res.data?.data
      setAkunBaru(data)
      setForm({ nama_toko: '', nama_pemilik: '', id_kecamatan: '', latitude: '', longitude: '' })
      fetchData()
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Gagal menambahkan toko.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopyCredentials = () => {
    if (!akunBaru?.akun_penjual) return
    const text = `Akun Penjual SIPAKU:\nToko: ${akunBaru.nama_toko}\nUsername: ${akunBaru.akun_penjual.username}\nPassword: ${akunBaru.akun_penjual.password_default}\nURL: http://localhost:5173/login`
    navigator.clipboard.writeText(text)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2500)
  }

  const filteredToko = daftarToko.filter((t) => {
    const matchSearch =
      t.nama_toko?.toLowerCase().includes(search.toLowerCase()) ||
      t.nama_pemilik?.toLowerCase().includes(search.toLowerCase()) ||
      t.username?.toLowerCase().includes(search.toLowerCase())
    const matchKec = filterKec ? String(t.id_kecamatan) === String(filterKec) : true
    return matchSearch && matchKec
  })

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    color: '#0f172a',
    fontSize: 13.5,
    boxSizing: 'border-box',
    outline: 'none',
    fontWeight: 500
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', color: '#1e293b', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", paddingBottom: 60 }}>
      <div className="dash-container" style={{ maxWidth: 1280 }}>
        {/* Hero Banner */}
        <section className="hero-banner-box" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#f8fafc',
                fontSize: 11,
                fontWeight: 750,
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid rgba(255, 255, 255, 0.15)',
                letterSpacing: '0.04em'
              }}>
                SIPAKU MANAJEMEN
              </span>
              <span style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#6ee7b7',
                fontSize: 11,
                fontWeight: 650,
                padding: '3px 10px',
                borderRadius: 20,
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px rgba(52, 211, 153, 0.8)' }} />
                Data Toko &amp; Akun
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link
                to="/admin"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  borderRadius: 8,
                  padding: '7px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: 'none',
                  backdropFilter: 'blur(4px)',
                  transition: 'all 0.15s ease'
                }}
              >
                Kembali ke Dasbor
              </Link>
              <button
                onClick={() => { setAkunBaru(null); setErrorMsg(''); setModalTambah(true) }}
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  border: '1px solid #38bdf8',
                  borderRadius: 8,
                  padding: '7px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
                  transition: 'all 0.15s ease'
                }}
              >
                Tambah Toko Baru
              </button>
            </div>
          </div>

          <div style={{ maxWidth: 880, marginBottom: 20 }}>
            <h1 style={{
              fontSize: 'clamp(20px, 3.5vw, 24px)',
              fontWeight: 800,
              color: '#ffffff',
              margin: '0 0 6px',
              letterSpacing: '-0.02em',
              lineHeight: 1.25
            }}>
              Manajemen Toko Bangunan &amp; Akun Penjual
            </h1>
            <p style={{
              fontSize: 13,
              color: '#cbd5e1',
              margin: 0,
              lineHeight: 1.55
            }}>
              Dinas Pekerjaan Umum Bina Marga &amp; Cipta Karya Kabupaten Lamongan — Kelola data toko bangunan beserta akun login penjual di seluruh wilayah Kabupaten Lamongan.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            {[
              { label: 'Total Toko', value: daftarToko.length, color: '#38bdf8', desc: 'Mitra Terdaftar' },
              { label: 'Kecamatan', value: daftarKecamatan.length, color: '#34d399', desc: 'Sebaran Wilayah' },
              { label: 'Punya Akun', value: daftarToko.filter(t => t.username).length, color: '#fbbf24', desc: 'Akses Login Aktif' },
              { label: 'Tanpa Akun', value: daftarToko.filter(t => !t.username).length, color: '#cbd5e1', desc: 'Belum Ada Akun' },
            ].map((s) => (
              <div key={s.label} style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 12,
                padding: '12px 16px',
                backdropFilter: 'blur(4px)'
              }}>
                <div style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 600, marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Info Box */}
        <section style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: '14px 18px',
          marginBottom: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
            <strong style={{ color: '#0f172a' }}>Informasi Sistem:</strong> Setiap kali Admin menambahkan toko baru di formulir ini, sistem akan <strong>secara otomatis membuatkan akun login penjual</strong> di database dengan format username <code style={{ background: '#eff6ff', color: '#0284c7', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>penjual&lt;id&gt;</code> (contoh: <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, color: '#0f172a', fontWeight: 700 }}>penjual1</code>, <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, color: '#0f172a', fontWeight: 700 }}>penjual2</code>, dst.) dan password default <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, color: '#0f172a', fontWeight: 700 }}>penjual123</code>.
          </div>
        </section>

        {/* Filter Controls */}
        <section style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 280, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Cari nama toko, pemilik, atau username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                minWidth: 200,
                padding: '9px 14px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                color: '#0f172a',
                fontSize: 13,
                outline: 'none'
              }}
            />
            <select
              value={filterKec}
              onChange={(e) => setFilterKec(e.target.value)}
              style={{
                padding: '9px 14px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                color: '#0f172a',
                fontSize: 13,
                outline: 'none'
              }}
            >
              <option value="">-- Semua Kecamatan ({daftarKecamatan.length}) --</option>
              {daftarKecamatan.map((k) => (
                <option key={k.id_kecamatan} value={k.id_kecamatan}>{k.nama_kecamatan}</option>
              ))}
            </select>
          </div>
          <div style={{ fontSize: 13, color: '#64748b' }}>
            Total: <strong style={{ color: '#0f172a' }}>{filteredToko.length}</strong> toko
          </div>
        </section>

        {/* Table Toko & Akun */}
        <section style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ borderLeft: '3px solid #0f172a', paddingLeft: 10 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '0 0 2px' }}>
                Daftar Toko Bangunan & Akun Penjual
              </h2>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                Data toko beserta akun login penjual yang terdaftar di sistem SIPAKU
              </p>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Memuat data toko bangunan...</div>
          ) : filteredToko.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Tidak ada toko yang sesuai filter.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {['ID', 'Nama Toko', 'Pemilik / Kontak', 'Kecamatan', 'Akun Login Penjual', 'Koordinat'].map((h) => (
                      <th key={h} style={{
                        padding: '12px 16px',
                        color: '#64748b',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.04em'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredToko.map((toko, idx) => (
                    <tr key={toko.id_toko} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#fafbfc' }}>
                      <td style={{ padding: '12px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 12 }}>#{toko.id_toko}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{toko.nama_toko}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>{toko.nama_pemilik || '-'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          padding: '3px 8px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 700
                        }}>
                          {toko.nama_kecamatan || 'Lamongan'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {toko.username ? (
                          <div>
                            <div style={{ fontWeight: 700, color: '#059669' }}>{toko.username}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>Role: Penjual (Aktif)</div>
                          </div>
                        ) : (
                          <span style={{
                            color: '#b91c1c',
                            fontSize: 11,
                            fontWeight: 700,
                            background: '#fee2e2',
                            padding: '2px 8px',
                            borderRadius: 20,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#b91c1c' }} />
                            Belum ada akun
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 12 }}>
                        {toko.latitude && toko.longitude ? (
                          <span>{Number(toko.latitude).toFixed(4)}, {Number(toko.longitude).toFixed(4)}</span>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>-</span>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Modal Tambah Toko */}
      {modalTambah && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 20,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            width: '100%',
            maxWidth: 520,
            padding: 28,
            boxShadow: '0 25px 50px rgba(0,0,0,0.2)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {!akunBaru ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 800 }}>
                    Tambah Toko &amp; Buat Akun Penjual
                  </h2>
                  <button
                    onClick={() => setModalTambah(false)}
                    style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}
                  >
                    <IconX size={18} />
                  </button>
                </div>

                {errorMsg && (
                  <div style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16, fontWeight: 600 }}>
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 12.5, color: '#475569', fontWeight: 700, marginBottom: 6 }}>
                      Nama Toko Bangunan *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TB Sinar Harapan Lamongan"
                      value={form.nama_toko}
                      onChange={(e) => setForm({ ...form, nama_toko: e.target.value })}
                      required
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 12.5, color: '#475569', fontWeight: 700, marginBottom: 6 }}>
                      Nama Pemilik / Penanggung Jawab *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. H. Bambang Irawan"
                      value={form.nama_pemilik}
                      onChange={(e) => setForm({ ...form, nama_pemilik: e.target.value })}
                      required
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 12.5, color: '#475569', fontWeight: 700, marginBottom: 6 }}>
                      Kecamatan *
                    </label>
                    <select
                      value={form.id_kecamatan}
                      onChange={(e) => setForm({ ...form, id_kecamatan: e.target.value })}
                      required
                      style={inputStyle}
                    >
                      <option value="">-- Pilih Kecamatan --</option>
                      {daftarKecamatan.map((k) => (
                        <option key={k.id_kecamatan} value={k.id_kecamatan}>{k.nama_kecamatan}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4, fontWeight: 600 }}>
                        Latitude (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="-7.1164"
                        value={form.latitude}
                        onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                        style={{ ...inputStyle, padding: '9px 12px', fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4, fontWeight: 600 }}>
                        Longitude (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="112.4159"
                        value={form.longitude}
                        onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                        style={{ ...inputStyle, padding: '9px 12px', fontSize: 13 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setModalTambah(false)}
                      style={{
                        padding: '10px 18px',
                        background: '#ffffff',
                        color: '#475569',
                        border: '1px solid #cbd5e1',
                        borderRadius: 8,
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
                        padding: '10px 22px',
                        background: '#0f172a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        opacity: submitting ? 0.7 : 1,
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {submitting ? 'Menyimpan...' : 'Simpan Toko & Buat Akun'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* Success Card with Credentials - Clean & Professional */
              <div>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: '#ecfdf5',
                    color: '#059669',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10
                  }}>
                    <IconCheckCircle size={24} color="#059669" />
                  </div>
                  <h2 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: 18, fontWeight: 800 }}>
                    Toko &amp; Akun Penjual Berhasil Dibuat
                  </h2>
                  <p style={{ margin: 0, color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>
                    Toko <strong>{akunBaru.nama_toko}</strong> telah tersimpan di sistem. Berikan informasi akun berikut kepada pemilik toko untuk login.
                  </p>
                </div>

                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '16px 18px',
                  marginBottom: 20
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                    <span style={{ color: '#64748b', fontSize: 13 }}>Nama Toko:</span>
                    <strong style={{ color: '#0f172a', fontSize: 13 }}>{akunBaru.nama_toko}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                    <span style={{ color: '#64748b', fontSize: 13 }}>Pemilik:</span>
                    <span style={{ color: '#334155', fontSize: 13, fontWeight: 500 }}>{akunBaru.nama_pemilik}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                    <span style={{ color: '#64748b', fontSize: 13 }}>Username Penjual:</span>
                    <code style={{
                      fontFamily: 'monospace',
                      color: '#0f172a',
                      fontSize: 13.5,
                      fontWeight: 700,
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      padding: '3px 10px',
                      borderRadius: 6
                    }}>
                      {akunBaru.akun_penjual.username}
                    </code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontSize: 13 }}>Password Default:</span>
                    <code style={{
                      fontFamily: 'monospace',
                      color: '#0f172a',
                      fontSize: 13.5,
                      fontWeight: 700,
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      padding: '3px 10px',
                      borderRadius: 6
                    }}>
                      {akunBaru.akun_penjual.password_default}
                    </code>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={handleCopyCredentials}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: copySuccess ? '#059669' : '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 650,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {copySuccess ? <IconCheck size={14} color="#ffffff" /> : <IconCopy size={14} color="#ffffff" />}
                    <span>{copySuccess ? 'Berhasil Disalin' : 'Salin Akun Penjual'}</span>
                  </button>
                  <button
                    onClick={() => setModalTambah(false)}
                    style={{
                      padding: '10px 20px',
                      background: '#ffffff',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
