import { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getLaporan } from '../../services/laporanService'
import StatusBadge from '../../components/StatusBadge'
import SectionHeader from '../../components/ui/SectionHeader'
import EmptyState from '../../components/ui/EmptyState'
import { IconFileText, IconCheck, IconAlertTriangle, IconSearch, IconX, IconCopy } from '../../components/Icons'
import Pagination from '../../components/ui/Pagination'

const WRAP_STYLE = { padding: '28px 24px', maxWidth: 1160, margin: '0 auto' }

export default function RiwayatLaporan() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const [searchParams, setSearchParams] = useSearchParams()
  const initialTiket = searchParams.get('tiket') || searchParams.get('q') || ''
  const [searchQuery, setSearchQuery] = useState(initialTiket)
  const [copyFeedback, setCopyFeedback] = useState(null)

  useEffect(() => {
    getLaporan()
      .then((res) => setData(res.data?.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  // Sync jika URL search param berubah
  useEffect(() => {
    const t = searchParams.get('tiket') || searchParams.get('q') || ''
    if (t !== searchQuery) {
      setSearchQuery(t)
    }
  }, [searchParams])

  // Reset ke halaman 1 jika filter pencarian berubah
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  // Quick summary stats
  const stats = useMemo(() => {
    const total = data.length
    const pending = data.filter((d) => (d.status || '').toLowerCase().includes('pending')).length
    const sidak = data.filter((d) => (d.status || '').toLowerCase().includes('tindak') || (d.status || '').toLowerCase().includes('sidak')).length
    const selesai = data.filter((d) => (d.status || '').toLowerCase().includes('selesai')).length
    return { total, pending, sidak, selesai }
  }, [data])

  // Filter data berdasarkan Kode Tiket / Nama Material / Nama Toko / Kecamatan
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data
    const q = searchQuery.toLowerCase().trim()
    return data.filter((d) => {
      const tiket = (d.kode_tiket || `spk-2026-${String(d.id_laporan).padStart(4, '0')}`).toLowerCase()
      const mat = (d.nama_material || '').toLowerCase()
      const toko = (d.nama_toko || '').toLowerCase()
      const kec = (d.nama_kecamatan || '').toLowerCase()
      const pelapor = (d.nama_pelapor || '').toLowerCase()
      return tiket.includes(q) || mat.includes(q) || toko.includes(q) || kec.includes(q) || pelapor.includes(q)
    })
  }, [data, searchQuery])

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, currentPage, pageSize])

  const handleCopyTiket = (kode) => {
    navigator.clipboard.writeText(kode)
    setCopyFeedback(kode)
    setTimeout(() => setCopyFeedback(null), 2000)
  }

  return (
    <div className="sipaku-page" style={{ background: '#f8fafc', minHeight: '100vh', color: '#0f172a', paddingBottom: 60, fontFamily: 'var(--sans)' }}>
      <div className="sipaku-page-inner" style={WRAP_STYLE}>
        {/* Breadcrumb & Section Header */}
        <SectionHeader
          title="Riwayat Pengaduan & Tiket Sidak"
          subtitle="Daftar laporan disparitas harga material konstruksi masyarakat Kabupaten Lamongan yang sedang dan telah ditindaklanjuti oleh Dinas PU BM & CK."
          breadcrumb={[
            { label: 'Beranda Warga', to: '/pembeli' },
            { label: 'Riwayat Pengaduan' },
          ]}
          actions={
            <Link
              to="/pembeli/lapor"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#0f172a',
                color: '#ffffff',
                fontSize: 12.5,
                fontWeight: 700,
                padding: '9px 18px',
                borderRadius: 9,
                textDecoration: 'none',
                boxShadow: '0 2px 4px rgba(15,23,42,0.1)',
                transition: 'all 0.15s ease',
              }}
            >
              Buat Pengaduan Baru
            </Link>
          }
        />


        {/* KPI Mini Summary Cards */}
        {!loading && data.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 14,
              marginBottom: 20,
            }}
          >
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 18px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Pengaduan</div>
              <div style={{ fontSize: 24, fontWeight: 850, color: '#0f172a', marginTop: 4 }}>{stats.total}</div>
            </div>
            <div style={{ background: '#ffffff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '14px 18px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Menunggu Verifikasi</div>
              <div style={{ fontSize: 24, fontWeight: 850, color: '#1d4ed8', marginTop: 4 }}>{stats.pending}</div>
            </div>
            <div style={{ background: '#ffffff', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 18px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Dalam Penanganan</div>
              <div style={{ fontSize: 24, fontWeight: 850, color: '#b45309', marginTop: 4 }}>{stats.sidak}</div>
            </div>
            <div style={{ background: '#ffffff', border: '1px solid #a7f3d0', borderRadius: 12, padding: '14px 18px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Selesai / Ditindak</div>
              <div style={{ fontSize: 24, fontWeight: 850, color: '#047857', marginTop: 4 }}>{stats.selesai}</div>
            </div>
          </div>
        )}

        {/* ── BILAH PENCARIAN & PELACAKAN KODE TIKET ADUAN ── */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            padding: '16px 20px',
            marginBottom: 20,
            boxShadow: '0 2px 6px -1px rgba(15,23,42,0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 750, color: '#0f172a' }}>Lacak Pengaduan Warga</span>
              <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>
                Masukkan Kode Tiket (misal: <strong style={{ color: '#0284c7' }}>SPK-2026-0001</strong>) untuk mengecek laporan Anda
              </span>
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setSearchParams({})
                }}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  fontSize: 11.5,
                  fontWeight: 650,
                  padding: '4px 10px',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                Tampilkan Semua Laporan
              </button>
            )}
          </div>

          <div style={{ position: 'relative', width: '100%' }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }}>
              <IconSearch size={16} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value
                setSearchQuery(val)
                if (val.trim()) {
                  setSearchParams({ tiket: val.trim() })
                } else {
                  setSearchParams({})
                }
              }}
              placeholder="Ketik Kode Tiket (SPK-2026-XXXX), nama toko, material, atau kecamatan..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '11px 40px 11px 38px',
                borderRadius: 10,
                border: searchQuery ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                fontSize: 13,
                outline: 'none',
                background: searchQuery ? '#ffffff' : '#f8fafc',
                transition: 'all 0.15s ease'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setSearchParams({})
                }}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: 4
                }}
                title="Hapus pencarian"
              >
                <IconX size={14} />
              </button>
            )}
          </div>

          {searchQuery && (
            <div style={{ fontSize: 12, color: '#0284c7', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Ditemukan <strong>{filteredData.length}</strong> pengaduan untuk kata kunci "{searchQuery}"</span>
            </div>
          )}
        </div>

        {/* Table Container */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 4px 12px -2px rgba(15, 23, 42, 0.04)',
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', color: '#64748b', fontSize: 13 }}>
              <div style={{ display: 'inline-block', width: 28, height: 28, border: '3px solid #e2e8f0', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 12 }} />
              <div>Memuat data riwayat laporan...</div>
            </div>
          ) : data.length === 0 ? (
            <EmptyState
              icon={<IconFileText size={28} color="#64748b" />}
              title="Belum Ada Laporan Pengaduan"
              description="Laporan harga material yang Anda laporkan saat berbelanja di toko bangunan akan otomatis tersimpan di sini untuk dipantau statusnya."
              action={
                <Link
                  to="/pembeli/lapor"
                  style={{
                    display: 'inline-block',
                    background: '#0f172a',
                    color: '#ffffff',
                    fontSize: 12.5,
                    fontWeight: 700,
                    padding: '8px 16px',
                    borderRadius: 8,
                    textDecoration: 'none',
                    marginTop: 4,
                  }}
                >
                  Mulai Buat Laporan
                </Link>
              }
            />
          ) : filteredData.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', background: '#f1f5f9', color: '#64748b', marginBottom: 12 }}><IconSearch size={22} /></div>
              <h3 style={{ fontSize: 16, fontWeight: 750, color: '#0f172a', margin: '0 0 6px' }}>
                Pengaduan Tidak Ditemukan
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', maxWidth: 440, margin: '0 auto 16px', lineHeight: 1.5 }}>
                Tidak ada laporan dengan kode tiket atau kata kunci "<strong>{searchQuery}</strong>". Pastikan penulisan kode tiket sesuai (contoh: <code>SPK-2026-0001</code>).
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setSearchParams({})
                }}
                style={{
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Tampilkan Semua Laporan
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '14px 18px', fontWeight: 750, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Kode Tiket</th>
                    <th style={{ padding: '14px 18px', fontWeight: 750, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Material</th>
                    <th style={{ padding: '14px 18px', fontWeight: 750, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Toko & Lokasi</th>
                    <th style={{ padding: '14px 18px', fontWeight: 750, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Harga Temuan</th>
                    <th style={{ padding: '14px 18px', fontWeight: 750, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Standar HAP</th>
                    <th style={{ padding: '14px 18px', fontWeight: 750, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Disparitas</th>
                    <th style={{ padding: '14px 18px', fontWeight: 750, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Status Pengaduan</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((l) => {
                    const disp = Number(l.persentase_disparitas || 0)
                    const isHigh = disp > 20
                    const isMid = disp > 5
                    const kodeTiket = l.kode_tiket || `SPK-2026-${String(l.id_laporan).padStart(4, '0')}`
                    const isCopied = copyFeedback === kodeTiket

                    return (
                      <tr
                        key={l.id_laporan}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                      >
                        <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontWeight: 800,
                                fontSize: 12,
                                color: '#0284c7',
                                background: '#f0f9ff',
                                padding: '3px 8px',
                                borderRadius: 6,
                                border: '1px solid #bae6fd',
                                letterSpacing: '0.03em'
                              }}
                            >
                              {kodeTiket}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyTiket(kodeTiket)}
                              title={isCopied ? 'Tersalin!' : 'Salin Kode Tiket'}
                              style={{
                                background: isCopied ? '#ecfdf5' : '#f8fafc',
                                border: `1px solid ${isCopied ? '#a7f3d0' : '#e2e8f0'}`,
                                color: isCopied ? '#059669' : '#64748b',
                                cursor: 'pointer',
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 650
                              }}
                            >
                              {isCopied ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><IconCheck size={12} color="#059669" /> Tersalin</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><IconCopy size={12} /> Salin</span>}
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 13.5 }}>
                            {l.nama_material}
                          </div>
                          {l.tanggal_laporan && (
                            <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>
                              {l.tanggal_laporan}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>{l.nama_toko}</div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>
                            Kec. {l.nama_kecamatan}
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: 800, color: '#0f172a' }}>
                          Rp {Number(l.harga_temuan).toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '14px 18px', color: '#64748b' }}>
                          {l.harga_ssh ? `Rp ${Number(l.harga_ssh).toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              color: isHigh ? '#b91c1c' : isMid ? '#b45309' : '#047857',
                              fontWeight: 750,
                              background: isHigh ? '#fef2f2' : isMid ? '#fffbeb' : '#ecfdf5',
                              border: `1px solid ${isHigh ? '#fecaca' : isMid ? '#fde68a' : '#a7f3d0'}`,
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 11.5,
                            }}
                          >
                            {disp > 0 ? `+${disp.toFixed(1)}%` : `${disp.toFixed(1)}%`}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <StatusBadge status={l.status} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredData.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={filteredData.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              itemLabel="laporan"
            />
          )}
        </div>
      </div>
    </div>
  )
}

