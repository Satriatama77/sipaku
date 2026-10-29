import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getLaporanAdmin } from '../../services/adminService'
import { KOORDINAT_KECAMATAN, PUSAT_KABUPATEN_LAMONGAN } from '../../data/koordinatKecamatan'

const ZONA_COLOR = {
  Merah: '#ef4444',
  Waspada: '#f59e0b',
  Normal: '#10b981',
  Stabil: '#64748b'
}

// Komponen pengendali peta Leaflet (pan / zoom ke koordinat terpilih)
function MapController({ targetCoord, zoomLevel }) {
  const map = useMap()
  useEffect(() => {
    if (targetCoord) {
      map.flyTo(targetCoord, zoomLevel || 13, { duration: 1.2 })
    }
  }, [targetCoord, zoomLevel, map])
  return null
}

export default function PetaDisparitasPage() {
  const [laporan, setLaporan] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState('Semua') // 'Semua' | 'Merah' | 'Waspada' | 'Normal' | 'Stabil'
  const [searchKecamatan, setSearchKecamatan] = useState('')
  const [focusedCoord, setFocusedCoord] = useState(null)
  const [zoomLevel, setZoomLevel] = useState(10)

  useEffect(() => {
    setLoading(true)
    getLaporanAdmin()
      .then((res) => setLaporan(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Kelompokkan data laporan berdasarkan kecamatan
  const grouped = useMemo(() => {
    return laporan.reduce((acc, l) => {
      const kec = l.nama_kecamatan
      if (!acc[kec]) acc[kec] = []
      acc[kec].push(l)
      return acc
    }, {})
  }, [laporan])

  // Bangun data rekapitulasi untuk seluruh 27 kecamatan Lamongan
  const rekapKecamatan = useMemo(() => {
    return Object.keys(KOORDINAT_KECAMATAN).map((namaKec) => {
      const items = grouped[namaKec] || []
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
  }, [grouped])

  // Filter daftar kecamatan berdasarkan zona & search
  const filteredKecamatan = useMemo(() => {
    return rekapKecamatan.filter((k) => {
      const matchFilter = selectedFilter === 'Semua' ? true : k.zona === selectedFilter
      const matchSearch = k.nama.toLowerCase().includes(searchKecamatan.toLowerCase())
      return matchFilter && matchSearch
    })
  }, [rekapKecamatan, selectedFilter, searchKecamatan])

  // Hitung jumlah zona
  const zoneCount = {
    merah: rekapKecamatan.filter((k) => k.zona === 'Merah').length,
    waspada: rekapKecamatan.filter((k) => k.zona === 'Waspada').length,
    normal: rekapKecamatan.filter((k) => k.zona === 'Normal').length,
    stabil: rekapKecamatan.filter((k) => k.zona === 'Stabil').length,
    total: rekapKecamatan.length
  }

  const handleFokusKecamatan = (coords) => {
    setFocusedCoord(coords)
    setZoomLevel(13)
  }

  const handleResetMap = () => {
    setFocusedCoord([...PUSAT_KABUPATEN_LAMONGAN])
    setZoomLevel(10)
    setSearchKecamatan('')
    setSelectedFilter('Semua')
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', color: '#1e293b', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div className="dash-container" style={{ maxWidth: 1280 }}>
        
        {/* Header Geospasial */}
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
                SIPAKU GEOSPASIAL
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
                27 Kecamatan Terpetakan
              </span>
            </div>

            <button
              onClick={handleResetMap}
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
              Reset Tampilan Peta
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
              Peta Disparitas Harga Material Kabupaten Lamongan
            </h1>
            <p style={{
              fontSize: 13,
              color: '#cbd5e1',
              margin: 0,
              lineHeight: 1.55
            }}>
              Dinas Pekerjaan Umum Bina Marga &amp; Cipta Karya — Pemetaan sebaran harga di 27 kecamatan untuk mendeteksi disparitas harga material konstruksi secara visual.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            {[
              { label: 'Zona Merah', value: zoneCount.merah, color: '#f87171', desc: 'Disparitas ≥ 20%' },
              { label: 'Zona Waspada', value: zoneCount.waspada, color: '#fbbf24', desc: 'Disparitas 10 - 20%' },
              { label: 'Zona Normal', value: zoneCount.normal, color: '#34d399', desc: 'Disparitas < 10%' },
              { label: 'Stabil / Terdata', value: zoneCount.stabil, color: '#93c5fd', desc: 'Sesuai Standar HAP' },
              { label: 'Total Kecamatan', value: zoneCount.total, color: '#ffffff', desc: '100% Wilayah' },
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

        {/* Filter Bar & Quick Selector */}
        <section style={{
          background: '#ffffff',
          borderRadius: 12,
          padding: '14px 18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap'
        }}>
          {/* Filter Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginRight: 4 }}>Filter Zona:</span>
            {[
              { id: 'Semua', label: `Semua (${zoneCount.total})` },
              { id: 'Merah', label: `Merah (${zoneCount.merah})`, color: '#ef4444' },
              { id: 'Waspada', label: `Waspada (${zoneCount.waspada})`, color: '#f59e0b' },
              { id: 'Normal', label: `Normal (${zoneCount.normal})`, color: '#10b981' },
              { id: 'Stabil', label: `Stabil (${zoneCount.stabil})`, color: '#64748b' },
            ].map((tab) => {
              const active = selectedFilter === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedFilter(tab.id)}
                  style={{
                    background: active ? '#0f172a' : '#f8fafc',
                    color: active ? '#ffffff' : tab.color || '#334155',
                    border: '1px solid',
                    borderColor: active ? '#0f172a' : '#cbd5e1',
                    borderRadius: 6,
                    padding: '5px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Kecamatan Quick Jump Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Fokus Kecamatan:</label>
            <select
              value=""
              onChange={(e) => {
                const kec = e.target.value
                if (kec && KOORDINAT_KECAMATAN[kec]) {
                  handleFokusKecamatan(KOORDINAT_KECAMATAN[kec])
                }
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                fontSize: 12,
                fontWeight: 600,
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              <option value="">-- Pilih Kecamatan di Peta --</option>
              {Object.keys(KOORDINAT_KECAMATAN).sort().map((kec) => (
                <option key={kec} value={kec}>
                  Kec. {kec} {grouped[kec] ? `(${grouped[kec].length} Lap.)` : ''}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Map Container Card */}
        <section style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          marginBottom: 20
        }}>
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#ffffff'
          }}>
            <div style={{ borderLeft: '3px solid #0f172a', paddingLeft: 10 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '0 0 2px' }}>
                Peta Titik Geospasial Kabupaten Lamongan
              </h2>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                Menampilkan 27 kecamatan dengan koordinat terverifikasi OpenStreetMap. Klik titik untuk melihat info harga & disparitas.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} /> Merah (≥20%)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} /> Waspada (10-20%)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} /> Normal (&lt;10%)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8' }} /> Stabil
              </div>
            </div>
          </div>

          <div style={{ height: 560, position: 'relative' }}>
            <MapContainer
              center={PUSAT_KABUPATEN_LAMONGAN}
              zoom={10}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapController targetCoord={focusedCoord} zoomLevel={zoomLevel} />

              {rekapKecamatan.map((k) => {
                if (!k.coords) return null

                // Cek apakah kecamatan ini cocok dengan filter yang aktif
                const isFiltered = selectedFilter === 'Semua' || k.zona === selectedFilter
                if (!isFiltered) return null

                const hasReports = k.totalLaporan > 0
                const markerColor = ZONA_COLOR[k.zona]
                const radius = hasReports ? Math.max(9, Math.min(22, k.maxDisparitas / 1.5)) : 5.5

                return (
                  <CircleMarker
                    key={k.nama}
                    center={k.coords}
                    radius={radius}
                    pathOptions={{
                      color: markerColor,
                      fillColor: markerColor,
                      fillOpacity: hasReports ? 0.75 : 0.5,
                      weight: hasReports ? 2 : 1.5
                    }}
                  >
                    <Popup>
                      <div style={{ minWidth: 200, padding: '2px 0' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: '1px solid #e2e8f0',
                          paddingBottom: 6,
                          marginBottom: 8
                        }}>
                          <strong style={{ fontSize: 14, color: '#0f172a' }}>Kecamatan {k.nama}</strong>
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: `${markerColor}18`,
                            color: markerColor,
                            border: `1px solid ${markerColor}44`
                          }}>
                            {k.zona === 'Stabil' ? 'Stabil' : `Zona ${k.zona}`}
                          </span>
                        </div>

                        {hasReports ? (
                          <>
                            <div style={{ fontSize: 12, marginBottom: 4, color: '#475569' }}>
                              Disparitas Maksimal: <strong style={{ color: markerColor }}>{k.maxDisparitas.toFixed(1)}%</strong>
                            </div>
                            <div style={{ fontSize: 12, marginBottom: 8, color: '#475569' }}>
                              Total Laporan Masuk: <strong style={{ color: '#0f172a' }}>{k.totalLaporan} laporan</strong>
                            </div>

                            <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: 6 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
                                Material Terlapor:
                              </div>
                              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: '#334155' }}>
                                {k.items.slice(0, 3).map((item, idx) => (
                                  <li key={idx} style={{ marginBottom: 3 }}>
                                    <span>{item.nama_material}</span>{' '}
                                    <span style={{ color: '#64748b' }}>
                                      (Rp {Number(item.harga_laporan || 0).toLocaleString('id-ID')})
                                    </span>
                                  </li>
                                ))}
                                {k.items.length > 3 && (
                                  <li style={{ color: '#64748b', listStyleType: 'none', marginLeft: -8, marginTop: 2 }}>
                                    +{k.items.length - 3} laporan lainnya
                                  </li>
                                )}
                              </ul>
                            </div>
                          </>
                        ) : (
                          <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                            Kondisi harga material konstruksi terpantau stabil sesuai standar SSH Pemkab Lamongan. Belum ada laporan disparitas.
                          </div>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                )
              })}
            </MapContainer>
          </div>
        </section>

        {/* Tabel Rekapitulasi Seluruh 27 Kecamatan */}
        <section style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          overflow: 'hidden',
          marginBottom: 30
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: '0 0 2px' }}>
                Status 27 Wilayah Kecamatan Kabupaten Lamongan
              </h3>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                Menampilkan {filteredKecamatan.length} dari 27 kecamatan
              </p>
            </div>

            <input
              type="text"
              placeholder="Cari kecamatan..."
              value={searchKecamatan}
              onChange={(e) => setSearchKecamatan(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                fontSize: 12,
                outline: 'none',
                width: 200
              }}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 700 }}>
                  <th style={{ padding: '10px 16px', width: 40 }}>#</th>
                  <th style={{ padding: '10px 16px' }}>Kecamatan</th>
                  <th style={{ padding: '10px 16px' }}>Status Disparitas</th>
                  <th style={{ padding: '10px 16px' }}>Disparitas Tertinggi</th>
                  <th style={{ padding: '10px 16px' }}>Total Laporan</th>
                  <th style={{ padding: '10px 16px' }}>Koordinat (Lat, Lng)</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center' }}>Aksi Peta</th>
                </tr>
              </thead>
              <tbody>
                {filteredKecamatan.map((k, index) => {
                  const badgeColor = ZONA_COLOR[k.zona]
                  return (
                    <tr
                      key={k.nama}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '10px 16px', color: '#94a3b8' }}>{index + 1}</td>
                      <td style={{ padding: '10px 16px', fontWeight: 700, color: '#0f172a' }}>
                        {k.nama}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          background: `${badgeColor}15`,
                          color: badgeColor,
                          border: `1px solid ${badgeColor}33`
                        }}>
                          {k.zona === 'Stabil' ? 'Stabil (0 anomali)' : `Zona ${k.zona}`}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', fontWeight: 600, color: k.maxDisparitas >= 20 ? '#ef4444' : '#475569' }}>
                        {k.totalLaporan > 0 ? `${k.maxDisparitas.toFixed(1)}%` : '-'}
                      </td>
                      <td style={{ padding: '10px 16px', color: '#64748b' }}>
                        {k.totalLaporan > 0 ? `${k.totalLaporan} laporan` : '0'}
                      </td>
                      <td style={{ padding: '10px 16px', color: '#94a3b8', fontFamily: 'monospace', fontSize: 11 }}>
                        {k.coords[0].toFixed(4)}, {k.coords[1].toFixed(4)}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => {
                            handleFokusKecamatan(k.coords)
                            window.scrollTo({ top: 380, behavior: 'smooth' })
                          }}
                          style={{
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            padding: '4px 10px',
                            borderRadius: 5,
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#0f172a',
                            cursor: 'pointer'
                          }}
                        >
                          Lihat di Peta
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  )
}
