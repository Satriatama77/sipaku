import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const WRAP  = { padding: '24px 32px', maxWidth: 900, margin: '0 auto' }

export default function KatalogHargaPage() {
  const { user } = useAuth()
  // TODO: id_toko akan diambil dari user JWT setelah integrasi penuh
  const id_toko = 1

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#f8fafc' }}>
      <div style={WRAP}>
        <h1 style={{ color: '#38bdf8' }}>Katalog Harga Toko</h1>
        <p style={{ color: '#64748b', marginBottom: 24 }}>Kelola daftar harga material toko Anda. Gunakan <strong>Input Suara</strong> untuk update lebih cepat.</p>
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 32, textAlign: 'center', color: '#475569' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🚧</div>
          <p>Halaman katalog terhubung ke <code style={{ background: '#0f172a', padding: '2px 8px', borderRadius: 4 }}>/api/katalog/{id_toko}</code></p>
          <p style={{ fontSize: 13 }}>Implementasi tabel akan menggunakan komponen <code>KatalogTable</code> dari <code>components/</code></p>
        </div>
      </div>
    </div>
  )
}
