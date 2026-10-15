import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getLaporan } from '../../services/laporanService'
import StatusBadge from '../../components/StatusBadge'
import SectionHeader from '../../components/ui/SectionHeader'
import EmptyState from '../../components/ui/EmptyState'
import { IconFileText, IconCheck, IconAlertTriangle } from '../../components/Icons'

const WRAP_STYLE = { padding: '28px 24px', maxWidth: 1160, margin: '0 auto' }

export default function RiwayatLaporan() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLaporan()
      .then((res) => setData(res.data?.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  // Quick summary stats
  const stats = useMemo(() => {
    const total = data.length
    const pending = data.filter((d) => (d.status || '').toLowerCase().includes('pending')).length
    const sidak = data.filter((d) => (d.status || '').toLowerCase().includes('tindak') || (d.status || '').toLowerCase().includes('sidak')).length
    const selesai = data.filter((d) => (d.status || '').toLowerCase().includes('selesai')).length
    return { total, pending, sidak, selesai }
  }, [data])

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
              <span>+</span> Buat Pengaduan Baru
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
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '14px 18px', fontWeight: 750, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Material</th>
                    <th style={{ padding: '14px 18px', fontWeight: 750, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Toko & Lokasi</th>
                    <th style={{ padding: '14px 18px', fontWeight: 750, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Harga Temuan</th>
                    <th style={{ padding: '14px 18px', fontWeight: 750, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Standar HAP</th>
                    <th style={{ padding: '14px 18px', fontWeight: 750, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Disparitas</th>
                    <th style={{ padding: '14px 18px', fontWeight: 750, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Status Pengaduan</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((l) => {
                    const disp = Number(l.persentase_disparitas || 0)
                    const isHigh = disp > 20
                    const isMid = disp > 5

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
        </div>
      </div>
    </div>
  )
}

