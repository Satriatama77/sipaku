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

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#f8fafc', padding: '24px 32px' }}>
      <h1 style={{ color: '#38bdf8', marginBottom: 8 }}>Peta Disparitas Harga</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>Titik anomali harga material per kecamatan di Kabupaten Lamongan</p>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 13 }}>
        {Object.entries(ZONA_COLOR).map(([zona, color]) => (
          <div key={zona} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: color }} />
            <span style={{ color: '#94a3b8' }}>{zona}</span>
          </div>
        ))}
      </div>

      <div style={{ borderRadius: 16, overflow: 'hidden', height: 600 }}>
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
    </div>
  )
}
