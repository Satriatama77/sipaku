import { useEffect, useState, useMemo } from 'react'
import { getLaporanAdmin, updateStatusLaporan } from '../../services/adminService'
import StatusBadge from '../../components/StatusBadge'
import { useToast } from '../../context/ToastContext'
import Pagination from '../../components/ui/Pagination'

const STATUS_LIST = ['Pending', 'Tindak Lanjut', 'Selesai']

export default function VerifikasiPage() {
  const [data, setData]     = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [fotoModal, setFotoModal] = useState(null) // URL foto yang dibuka di modal
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const { toast } = useToast()

  const fetchData = (status = '') => {
    setLoading(true)
    getLaporanAdmin(status || null)
      .then((res) => {
        setData(res.data.data)
        setCurrentPage(1)
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const handleStatus = async (id, status) => {
    try {
      await updateStatusLaporan(id, status)
      toast.success(`Status laporan #${id} berhasil diubah ke "${status}"`, 'Status Diperbarui')
      fetchData(filter)
    } catch {
      toast.error(`Gagal memperbarui status laporan #${id}`, 'Kesalahan')
    }
  }

  const counts = {
    total: data.length,
    pending: data.filter(l => l.status === 'Pending').length,
    tindak: data.filter(l => l.status === 'Tindak Lanjut').length,
    selesai: data.filter(l => l.status === 'Selesai').length,
  }

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return data.slice(start, start + pageSize)
  }, [data, currentPage, pageSize])

  const handleExportCSV = () => {
    if (!data.length) return
    const headers = ['Kode Tiket', 'ID Laporan', 'Tanggal', 'Nama Material', 'Toko', 'Kecamatan', 'Nama Pelapor', 'Harga Temuan', 'Standar SSH', 'Disparitas (%)', 'Status']
    const rows = data.map(l => [
      `"${(l.kode_tiket || `SPK-2026-${String(l.id_laporan).padStart(4, '0')}`).replace(/"/g, '""')}"`,
      l.id_laporan,
      `"${(l.tanggal_laporan || '').replace(/"/g, '""')}"`,
      `"${(l.nama_material || '').replace(/"/g, '""')}"`,
      `"${(l.nama_toko || '').replace(/"/g, '""')}"`,
      `"${(l.nama_kecamatan || '').replace(/"/g, '""')}"`,
      `"${(l.nama_pelapor || 'Warga Anonim').replace(/"/g, '""')}"`,
      l.harga_temuan,
      l.harga_ssh || 0,
      l.persentase_disparitas ? Number(l.persentase_disparitas).toFixed(1) : '0.0',
      `"${(l.status || '').replace(/"/g, '""')}"`
    ])
    const csvString = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n')
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rekap_laporan_disparitas_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('File CSV laporan berhasil diunduh.', 'Ekspor Selesai')
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', color: '#1e293b', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

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
                SIPAKU VERIFIKASI
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
                Data Terverifikasi
              </span>
            </div>

            <button
              onClick={() => fetchData(filter)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                backdropFilter: 'blur(4px)',
                transition: 'all 0.15s ease'
              }}
            >
              Segarkan Data
            </button>
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
              Verifikasi &amp; Validasi Laporan Harga Material
            </h1>
            <p style={{
              fontSize: 13,
              color: '#cbd5e1',
              margin: 0,
              lineHeight: 1.55
            }}>
              Dinas Pekerjaan Umum Bina Marga &amp; Cipta Karya Kabupaten Lamongan — Verifikasi laporan disparitas harga material bangunan dari warga dan pedagang.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            {[
              { label: 'Total Laporan', value: counts.total, color: '#38bdf8', desc: '100% Aduan Masuk' },
              { label: 'Menunggu Audit', value: counts.pending, color: '#fbbf24', desc: 'Perlu Ditinjau' },
              { label: 'Tindak Lanjut', value: counts.tindak, color: '#fb923c', desc: 'Proses Tim Sidak' },
              { label: 'Selesai', value: counts.selesai, color: '#34d399', desc: 'Tervalidasi / Tuntas' },
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

        {/* Filter Tabs */}
        <section style={{
          background: '#ffffff',
          borderRadius: 12,
          padding: '14px 20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Saring Status:</span>
          <div className="horizontal-scroll-touch" style={{ gap: 8 }}>
            {['', ...STATUS_LIST].map((s) => (
              <button key={s} onClick={() => { setFilter(s); fetchData(s) }}
                style={{
                  padding: '6px 16px',
                  borderRadius: 20,
                  border: '1px solid',
                  borderColor: filter === s ? '#0f172a' : '#cbd5e1',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                  background: filter === s ? '#0f172a' : '#ffffff',
                  color: filter === s ? '#ffffff' : '#475569',
                  whiteSpace: 'nowrap'
                }}>
                {s || 'Semua'}
              </button>
            ))}
          </div>
        </section>

        {/* Data Table Card */}
        <section style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          overflow: 'hidden'
        }}>
          {/* Section Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div style={{ borderLeft: '3px solid #0f172a', paddingLeft: 10 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '0 0 2px' }}>
                Daftar Laporan Disparitas Harga
              </h2>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                Data laporan warga terkait selisih harga material di toko bangunan
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={data.length === 0}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  padding: '6px 14px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 650,
                  cursor: data.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                Ekspor CSV
              </button>

              <button
                type="button"
                onClick={handlePrint}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  padding: '6px 14px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 650,
                  cursor: 'pointer'
                }}
              >
                Cetak Dokumen
              </button>

              <span style={{
                background: '#f1f5f9',
                color: '#475569',
                fontSize: 11,
                fontWeight: 700,
                padding: '5px 12px',
                borderRadius: 20
              }}>
                {data.length} Laporan
              </span>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Memuat data laporan...</div>
          ) : (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', minWidth: 780, borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Kode Tiket', 'Material', 'Toko', 'Kecamatan', 'Harga Temuan', 'Disparitas', 'Bukti Foto', 'Status', 'Aksi'].map((h) => (
                      <th key={h} style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        color: '#64748b',
                        fontWeight: 700,
                        fontSize: 11,
                        letterSpacing: '0.04em',
                        borderBottom: '1px solid #e2e8f0'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ padding: 36, textAlign: 'center', color: '#94a3b8' }}>
                        Tidak ada laporan yang sesuai filter.
                      </td>
                    </tr>
                  )}
                  {paginatedData.map((l, idx) => (
                    <tr key={l.id_laporan} style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: idx % 2 === 0 ? '#ffffff' : '#fafbfc'
                    }}>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          fontSize: 11.5,
                          color: '#0284c7',
                          background: '#f0f9ff',
                          padding: '2px 7px',
                          borderRadius: 4,
                          border: '1px solid #bae6fd'
                        }}>
                          {l.kode_tiket || `SPK-2026-${String(l.id_laporan).padStart(4, '0')}`}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                        {l.nama_material}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        <div style={{ fontWeight: 600, color: '#334155' }}>{l.nama_toko}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                          Pelapor: {l.nama_pelapor || 'Warga Anonim'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: '#f1f5f9',
                          color: '#475569',
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 4
                        }}>
                          {l.nama_kecamatan}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#059669', fontWeight: 700 }}>
                        Rp {Number(l.harga_temuan).toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: Math.abs(l.persentase_disparitas) >= 20 ? '#fee2e2' : Math.abs(l.persentase_disparitas) >= 10 ? '#fef3c7' : '#dcfce7',
                          color: Math.abs(l.persentase_disparitas) >= 20 ? '#b91c1c' : Math.abs(l.persentase_disparitas) >= 10 ? '#92400e' : '#15803d',
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 4,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          <span style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: Math.abs(l.persentase_disparitas) >= 20 ? '#b91c1c' : Math.abs(l.persentase_disparitas) >= 10 ? '#92400e' : '#15803d'
                          }} />
                          {l.persentase_disparitas?.toFixed(1)}%
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {l.foto_url ? (
                          <button
                            onClick={() => setFotoModal(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${l.foto_url}`)}
                            style={{
                              background: 'none',
                              border: '2px solid #e2e8f0',
                              borderRadius: 6,
                              padding: 0,
                              cursor: 'pointer',
                              overflow: 'hidden',
                              display: 'block',
                              transition: 'border-color 0.15s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.borderColor = '#0284c7'}
                            onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                            title="Klik untuk memperbesar"
                          >
                            <img
                              src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${l.foto_url}`}
                              alt="Bukti foto"
                              style={{
                                width: 48,
                                height: 48,
                                objectFit: 'cover',
                                display: 'block'
                              }}
                            />
                          </button>
                        ) : (
                          <span style={{
                            fontSize: 11,
                            color: '#94a3b8',
                            background: '#f8fafc',
                            border: '1px dashed #cbd5e1',
                            padding: '3px 8px',
                            borderRadius: 4
                          }}>
                            Tanpa Bukti
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}><StatusBadge status={l.status} /></td>
                      <td style={{ padding: '12px 16px' }}>
                        <select onChange={(e) => handleStatus(l.id_laporan, e.target.value)} defaultValue={l.status}
                          style={{
                            background: '#f8fafc',
                            color: '#0f172a',
                            border: '1px solid #e2e8f0',
                            borderRadius: 6,
                            padding: '5px 10px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}>
                          {STATUS_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && data.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={data.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              itemLabel="laporan"
            />
          )}
        </section>

        {/* Modal Lightbox Foto Bukti */}
        {fotoModal && (
          <div
            onClick={() => setFotoModal(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.75)',
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
                maxHeight: '85vh',
                boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                position: 'relative'
              }}
            >
              <div style={{
                padding: '10px 16px',
                background: '#0f172a',
                color: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Bukti Foto Laporan</span>
                <button
                  onClick={() => setFotoModal(null)}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: 6,
                    padding: '4px 12px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Tutup
                </button>
              </div>
              <img
                src={fotoModal}
                alt="Bukti foto laporan"
                style={{
                  width: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  display: 'block',
                  background: '#f1f5f9'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
