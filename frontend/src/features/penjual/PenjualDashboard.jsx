import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'

const WRAP = { padding: '24px 32px', maxWidth: 900, margin: '0 auto' }

export default function PenjualDashboard() {
  const { user } = useAuth()
  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#f8fafc' }}>
      <div style={WRAP}>
        <h1 style={{ color: '#38bdf8' }}>Dasbor Penjual — Toko Bangunan</h1>
        <p style={{ color: '#94a3b8' }}>Selamat datang, <strong>{user?.nama_lengkap}</strong></p>

        {/* Informasi Survei Admin */}
        <div style={{
          marginTop: 24,
          padding: 20,
          background: 'rgba(2, 132, 199, 0.08)',
          border: '1px solid #0284c7',
          borderRadius: 12,
          display: 'flex',
          gap: 16,
          alignItems: 'flex-start',
        }}>
          <div style={{ fontSize: 28, lineHeight: 1 }}>ℹ️</div>
          <div>
            <h3 style={{ margin: '0 0 6px', color: '#38bdf8', fontSize: 16 }}>
              Pembaruan Harga via Petugas Survei Dinas PU
            </h3>
            <p style={{ margin: 0, color: '#cbd5e1', fontSize: 13, lineHeight: 1.6 }}>
              Untuk menjaga transparansi dan validitas data harga konstruksi Kabupaten Lamongan, pembaruan harga material toko dilakukan melalui survei berkala oleh <strong>Petugas Lapangan Dinas PU (Admin)</strong> menggunakan sistem pengenalan suara AI (NLP).
            </p>
            <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: 12 }}>
              Saat petugas berkunjung ke toko Anda, cukup sebutkan harga terkini untuk dicatat dan diperbarui langsung ke dalam sistem e-governance SIPAKU.
            </p>
          </div>
        </div>

        <div style={{ marginTop: 28 }}>
          <Link to="/penjual/katalog" style={{ background: '#1e293b', borderRadius: 12, padding: 24, textDecoration: 'none', color: '#f8fafc', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 20, transition: 'border-color 0.2s' }}>
            <div style={{ fontSize: 40 }}>📋</div>
            <div>
              <h2 style={{ margin: 0, color: '#e2e8f0', fontSize: 18 }}>Katalog Harga Toko Saya</h2>
              <p style={{ color: '#94a3b8', margin: '6px 0 0', fontSize: 13 }}>
                Lihat daftar harga material yang sedang aktif dan terdaftar atas nama toko Anda
              </p>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 20, color: '#38bdf8' }}>→</div>
          </Link>
        </div>
      </div>
    </div>
  )
}
