import { useState, useEffect } from 'react'
import api from '../services/api'
import {
  IconX,
  IconShield,
  IconStore,
  IconUsers,
  IconLock,
  IconCheck,
  IconAlertTriangle,
  IconMapPin,
  IconLogout
} from './Icons'

export default function ProfileModal({ isOpen, onClose, user, onLogout }) {
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('info') // 'info' | 'keamanan'

  // State Ganti Password
  const [pwdForm, setPwdForm] = useState({
    password_lama: '',
    password_baru: '',
    konfirmasi: ''
  })
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdSuccess, setPwdSuccess] = useState('')
  const [pwdError, setPwdError] = useState('')

  // Ambil detail data profil dari server saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      setPwdError('')
      setPwdSuccess('')
      setPwdForm({ password_lama: '', password_baru: '', konfirmasi: '' })

      api.get('/api/auth/profil')
        .then((res) => {
          if (res.data?.data) {
            setProfileData(res.data.data)
          }
        })
        .catch((err) => {
          console.error('Gagal mengambil data profil:', err)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [isOpen])

  // Cegah scroll pada body saat modal aktif
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  // Helper Tema Role
  const role = user?.role || profileData?.role || 'pembeli'
  const isPenjual = role === 'penjual'
  const isAdmin = role === 'admin'
  const isPembeli = !isAdmin && !isPenjual

  const roleMeta = {
    admin: {
      title: 'Administrator PU',
      sub: 'Dinas PU Bina Marga & Cipta Karya Kab. Lamongan',
      badgeClass: 'nav-role-badge--admin',
      headerBg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%)',
      accentColor: '#0284c7',
      icon: <IconShield size={24} color="#ffffff" />
    },
    penjual: {
      title: 'Mitra Pemilik Toko',
      sub: 'Pangkalan Bahan Bangunan Terdaftar BMCK',
      badgeClass: 'nav-role-badge--verified',
      headerBg: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #0d9488 100%)',
      accentColor: '#10b981',
      icon: <IconStore size={24} color="#ffffff" />
    },
    pembeli: {
      title: 'Masyarakat / Publik',
      sub: 'Warga Pemerhati Komoditas Konstruksi',
      badgeClass: 'nav-role-badge--verified',
      headerBg: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
      accentColor: '#6366f1',
      icon: <IconUsers size={24} color="#ffffff" />
    }
  }[isAdmin ? 'admin' : isPenjual ? 'penjual' : 'pembeli']

  const handleGantiPassword = async (e) => {
    e.preventDefault()
    setPwdError('')
    setPwdSuccess('')

    if (!pwdForm.password_lama) {
      setPwdError('Kata sandi lama wajib diisi.')
      return
    }
    if (pwdForm.password_baru.length < 6) {
      setPwdError('Kata sandi baru minimal 6 karakter.')
      return
    }
    if (pwdForm.password_baru !== pwdForm.konfirmasi) {
      setPwdError('Konfirmasi kata sandi baru tidak cocok.')
      return
    }

    setPwdLoading(true)
    try {
      const res = await api.post('/api/auth/ganti-password', {
        password_lama: pwdForm.password_lama,
        password_baru: pwdForm.password_baru
      })
      setPwdSuccess(res.data?.pesan || 'Kata sandi berhasil diperbarui!')
      setPwdForm({ password_lama: '', password_baru: '', konfirmasi: '' })
    } catch (err) {
      const msg = err.response?.data?.detail || 'Gagal mengubah kata sandi.'
      setPwdError(msg)
    } finally {
      setPwdLoading(false)
    }
  }

  const displayName = profileData?.nama_lengkap || user?.nama_lengkap || 'Pengguna SIPAKU'
  const displayUsername = profileData?.username || user?.username || '-'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        padding: 16,
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          backgroundColor: '#ffffff',
          borderRadius: 20,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER BANNER ── */}
        <div
          style={{
            background: roleMeta.headerBg,
            padding: '24px 24px 20px 24px',
            position: 'relative',
            color: '#ffffff'
          }}
        >
          <button
            onClick={onClose}
            aria-label="Tutup Modal"
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#ffffff',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
          >
            <IconX size={18} color="#ffffff" />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: 'rgba(255, 255, 255, 0.18)',
                backdropFilter: 'blur(8px)',
                border: '1.5px solid rgba(255, 255, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              {roleMeta.icon}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 999, background: 'rgba(255, 255, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                  {roleMeta.title}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#bbf7d0', fontWeight: 600 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#4ade80' }}></span>
                  Aktif
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
                {displayName}
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'rgba(255, 255, 255, 0.82)', lineHeight: 1.4 }}>
                {roleMeta.sub}
              </p>
            </div>
          </div>
        </div>

        {/* ── TAB NAVIGASI MODAL ── */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 16px' }}>
          <button
            onClick={() => setActiveTab('info')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: activeTab === 'info' ? 700 : 500,
              color: activeTab === 'info' ? '#0f172a' : '#64748b',
              borderBottom: activeTab === 'info' ? `2px solid ${roleMeta.accentColor}` : '2px solid transparent',
              transition: 'all 0.15s ease'
            }}
          >
            Ringkasan Profil
          </button>
          <button
            onClick={() => setActiveTab('keamanan')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: activeTab === 'keamanan' ? 700 : 500,
              color: activeTab === 'keamanan' ? '#0f172a' : '#64748b',
              borderBottom: activeTab === 'keamanan' ? `2px solid ${roleMeta.accentColor}` : '2px solid transparent',
              transition: 'all 0.15s ease'
            }}
          >
            Keamanan Akun
          </button>
        </div>

        {/* ── MODAL CONTENT BODY ── */}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {activeTab === 'info' ? (
            <div>
              {loading && !profileData ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                  Memuat data akun...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Grid Data Akun */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 12,
                      background: '#f8fafc',
                      padding: 14,
                      borderRadius: 14,
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Username
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                        @{displayUsername}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Peran Sistem
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2, textTransform: 'capitalize' }}>
                        {role === 'admin' ? 'Pengawas Dinas PU' : role === 'penjual' ? 'Pemilik Toko' : 'Warga / Publik'}
                      </div>
                    </div>

                    {isPenjual && (
                      <>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Wilayah Kecamatan
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0284c7', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <IconMapPin size={13} color="#0284c7" />
                            {profileData?.nama_kecamatan || 'Kab. Lamongan'}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Nama Pemilik Toko
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                            {profileData?.nama_pemilik || '-'}
                          </div>
                        </div>
                      </>
                    )}

                    {isAdmin && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Cakupan Pengawasan
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#0284c7', marginTop: 2 }}>
                          Seluruh 27 Kecamatan di Kabupaten Lamongan
                        </div>
                      </div>
                    )}

                    {isPembeli && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Hak Partisipasi
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#10b981', marginTop: 2 }}>
                          Pelaporan Disparitas &amp; Komparasi Mandiri Harga Standar SSH
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Keterangan Hak Akses & Status Keamanan */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 12,
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10
                    }}
                  >
                    <div style={{ marginTop: 2 }}>
                      <IconCheck size={16} color="#16a34a" />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>
                        Sesi Login Aktif &amp; Terotentikasi (JWT)
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.45, marginTop: 2 }}>
                        Data akses terlindungi dengan enkripsi SHA/HS256 dan terverifikasi secara resmi pada server SIPAKU BMCK Lamongan.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Form Ganti Password */}
              <form onSubmit={handleGantiPassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, marginBottom: 4 }}>
                  Perbarui kata sandi akun Anda untuk menjaga keamanan akses portal pengawasan.
                </div>

                {pwdSuccess && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '10px 12px', borderRadius: 10, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <IconCheck size={16} color="#15803d" />
                    <span>{pwdSuccess}</span>
                  </div>
                )}

                {pwdError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 12px', borderRadius: 10, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <IconAlertTriangle size={16} color="#b91c1c" />
                    <span>{pwdError}</span>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 650, color: '#334155', marginBottom: 4 }}>
                    Kata Sandi Saat Ini
                  </label>
                  <input
                    type="password"
                    placeholder="Masukkan sandi saat ini..."
                    value={pwdForm.password_lama}
                    onChange={(e) => setPwdForm({ ...pwdForm, password_lama: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '9px 12px',
                      borderRadius: 10,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 650, color: '#334155', marginBottom: 4 }}>
                    Kata Sandi Baru (Min. 6 Karakter)
                  </label>
                  <input
                    type="password"
                    placeholder="Masukkan sandi baru..."
                    value={pwdForm.password_baru}
                    onChange={(e) => setPwdForm({ ...pwdForm, password_baru: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '9px 12px',
                      borderRadius: 10,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 650, color: '#334155', marginBottom: 4 }}>
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <input
                    type="password"
                    placeholder="Ulangi sandi baru..."
                    value={pwdForm.konfirmasi}
                    onChange={(e) => setPwdForm({ ...pwdForm, konfirmasi: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '9px 12px',
                      borderRadius: 10,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      outline: 'none'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={pwdLoading}
                  style={{
                    marginTop: 6,
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: 'none',
                    background: roleMeta.accentColor,
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: pwdLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'opacity 0.2s'
                  }}
                >
                  <IconLock size={14} color="#ffffff" />
                  {pwdLoading ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* ── MODAL FOOTER ── */}
        <div
          style={{
            padding: '14px 20px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <button
            onClick={() => {
              onClose()
              if (onLogout) onLogout()
            }}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #dc2626',
              background: '#dc2626',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 650,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <IconLogout size={14} color="#ffffff" />
            <span>Keluar dari Akun</span>
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: 12,
              fontWeight: 650,
              cursor: 'pointer'
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
