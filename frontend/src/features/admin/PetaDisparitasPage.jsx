import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getLaporanAdmin } from '../../services/adminService'

// Koordinat pusat tiap kecamatan Lamongan (lat, lng)
const KOORDINAT_KECAMATAN = {
  "Lamongan":       [-7.1164, 112.4159],
  "Babat":          [-7.1038, 112.2100],
  "Brondong":       [-6.8984, 112.2804],
  "Paciran":        [-6.8766, 112.3146],
  "Solokuro":       [-6.9522, 112.2706],
  "Laren":          [-7.0350, 112.1850],
  "Maduran":        [-7.0400, 112.2600],
  "Sekaran":        [-7.0700, 112.2300],
  "Karanggeneng":   [-7.0900, 112.2800],
  "Kalitengah":     [-7.1200, 112.2400],
  "Turi":           [-7.1000, 112.3600],
  "Deket":          [-7.1500, 112.3400],
  "Glagah":         [-7.1800, 112.3000],
  "Karangbinangun": [-7.1600, 112.3800],
  "Sarirejo":       [-7.2000, 112.3600],
  "Tikung":         [-7.2100, 112.3200],
  "Sukodadi":       [-7.1900, 112.2800],
  "Pucuk":          [-7.1700, 112.2200],
  "Modo":           [-7.2400, 112.1800],
  "Bluluk":         [-7.3000, 112.1400],
  "Ngimbang":       [-7.2700, 112.1600],
  "Sambeng":        [-7.3200, 112.2000],
  "Sukorame":       [-7.2800, 112.2400],
  "Kembangbahu":    [-7.2200, 112.2900],
  "Mantup":         [-7.2500, 112.3300],
  "Sugio":          [-7.2600, 112.2700],
  "Kedungpring":    [-7.2100, 112.2100],
}

const ZONA_COLOR = { Merah: '#ef4444', Waspada: '#f59e0b', Normal: '#22c55e' }

export default function PetaDisparitasPage() {
  const [laporan, setLaporan] = useState([])

  useEffect(() => {
    getLaporanAdmin().then((res) => setLaporan(res.data.data)).catch(() => {})
  }, [])

  const grouped = laporan.reduce((acc, l) => {
    const kec = l.nama_kecamatan
    if (!acc[kec]) acc[kec] = []
    acc[kec].push(l)
    return acc
  }, {})

  const zoneCount = {
    merah: Object.values(grouped).filter(items => Math.max(...items.map(i => Math.abs(i.persentase_disparitas ?? 0))) >= 20).length,
    waspada: Object.values(grouped).filter(items => { const m = Math.max(...items.map(i => Math.abs(i.persentase_disparitas ?? 0))); return m >= 10 && m < 20 }).length,
    normal: Object.values(grouped).filter(items => Math.max(...items.map(i => Math.abs(i.persentase_disparitas ?? 0))) < 10).length,
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', color: '#1e293b', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div className="dash-container" style={{ maxWidth: 1280 }}>
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
                SIPAKU GEOSPASIAL
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
                Live Map
              </span>
            </div>
          </div>

          <div style={{ maxWidth: 880, marginBottom: 20 }}>
            <h1 style={{
              fontSize: 'clamp(20px, 4vw, 26px)',
              fontWeight: 800,
              color: '#ffffff',
              margin: '0 0 8px',
              letterSpacing: '-0.02em',
              lineHeight: 1.25
            }}>
              Peta Geospasial Disparitas Harga Material
            </h1>
            <p style={{
              fontSize: 'clamp(12px, 2.5vw, 13px)',
              color: '#94a3b8',
              margin: 0,
              lineHeight: 1.55
            }}>
              Dinas Pekerjaan Umum Bina Marga & Cipta Karya Kabupaten Lamongan — Titik anomali harga material per kecamatan berdasarkan laporan warga dan survei lapangan.
            </p>
          </div>

          {/* Zone Quick Stats */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
            {[
              { label: 'Zona Merah', value: zoneCount.merah, color: '#ef4444', desc: 'Disparitas ≥20%' },
              { label: 'Zona Waspada', value: zoneCount.waspada, color: '#f59e0b', desc: 'Disparitas 10-20%' },
              { label: 'Zona Normal', value: zoneCount.normal, color: '#22c55e', desc: 'Disparitas <10%' },
              { label: 'Total Kecamatan', value: Object.keys(grouped).length, color: '#38bdf8', desc: 'Terdata di peta' },
            ].map((s) => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '8px 16px',
                minWidth: 120
              }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Legend Card */}
        <section style={{
          background: '#ffffff',
          borderRadius: 12,
          padding: '14px 20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Legenda Zona:</span>
          {Object.entries(ZONA_COLOR).map(([zona, color]) => (
            <div key={zona} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: color,
                boxShadow: `0 0 0 3px ${color}33`
              }} />
              <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>{zona}</span>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8' }}>
            Total Laporan: <strong style={{ color: '#0f172a' }}>{laporan.length}</strong>
          </div>
        </section>

        {/* Map Card */}
        <section style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          overflow: 'hidden'
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
                Peta Interaktif Kabupaten Lamongan
              </h2>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                Klik titik kecamatan untuk melihat detail laporan disparitas harga
              </p>
            </div>
          </div>

          <div style={{ height: 600 }}>
            <MapContainer center={[-7.1, 112.28]} zoom={11} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {Object.entries(grouped).map(([kec, items]) => {
                const coords = KOORDINAT_KECAMATAN[kec]
                if (!coords) return null
                const maxDisp = Math.max(...items.map((i) => Math.abs(i.persentase_disparitas ?? 0)))
                const zona = maxDisp >= 20 ? 'Merah' : maxDisp >= 10 ? 'Waspada' : 'Normal'
                return (
                  <CircleMarker key={kec} center={coords} radius={Math.max(8, Math.min(25, maxDisp / 2))}
                    pathOptions={{ color: ZONA_COLOR[zona], fillColor: ZONA_COLOR[zona], fillOpacity: 0.7 }}>
                    <Popup>
                      <strong>{kec}</strong><br />
                      Laporan: {items.length}<br />
                      Disparitas tertinggi: {maxDisp.toFixed(1)}%<br />
                      Status: <strong style={{ color: ZONA_COLOR[zona] }}>{zona}</strong>
                    </Popup>
                  </CircleMarker>
                )
              })}
            </MapContainer>
          </div>
        </section>
      </div>
    </div>
  )
}
