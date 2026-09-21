import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'

const WRAP = { padding: '24px 32px', maxWidth: 900, margin: '0 auto' }

export default function PenjualDashboard() {
  const { user } = useAuth()
  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#f8fafc' }}>
      <div style={WRAP}>
        <h1 style={{ color: '#38bdf8' }}>Dasbor Penjual</h1>
        <p style={{ color: '#64748b' }}>Selamat datang, {user?.nama_lengkap}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 32 }}>
          <Link to="/penjual/katalog" style={{ background: '#1e293b', borderRadius: 12, padding: 28, textDecoration: 'none', color: '#f8fafc', border: '1px solid #334155' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <h2 style={{ margin: 0, color: '#e2e8f0' }}>Katalog Harga</h2>
            <p style={{ color: '#64748b', marginTop: 8 }}>Lihat dan kelola daftar harga material toko Anda</p>
          </Link>
          <Link to="/penjual/voice" style={{ background: '#1e293b', borderRadius: 12, padding: 28, textDecoration: 'none', color: '#f8fafc', border: '1px solid #334155' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🎙️</div>
            <h2 style={{ margin: 0, color: '#e2e8f0' }}>Input Suara (NLP)</h2>
            <p style={{ color: '#64748b', marginTop: 8 }}>Perbarui harga material cukup dengan perintah suara</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
