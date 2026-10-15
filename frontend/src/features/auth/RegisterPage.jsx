import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AlertBox from '../../components/ui/AlertBox'
import FormField from '../../components/ui/FormField'
import { useFormValidation, validators } from '../../hooks/useFormValidation'

export default function RegisterPage() {
  const [error, setError]     = useState('')
  const [sukses, setSukses]   = useState(false)
  const [loading, setLoading] = useState(false)
  const { register }          = useAuth()
  const navigate              = useNavigate()

  // Inisialisasi useFormValidation dengan schema validasi komprehensif
  const {
    isSubmitting,
    handleSubmit,
    getFieldProps,
  } = useFormValidation(
    {
      nama_lengkap: '',
      username: '',
      password: '',
      konfirmasi_password: '',
    },
    {
      nama_lengkap: [
        validators.required('Nama lengkap wajib diisi'),
        validators.minLength(3, 'Nama lengkap minimal 3 karakter'),
      ],
      username: [
        validators.required('Username akun wajib diisi'),
        validators.minLength(3, 'Username minimal 3 karakter'),
        validators.matches(
          /^[a-zA-Z0-9_]+$/,
          'Username hanya boleh memuat huruf, angka, dan underscore (_)'
        ),
      ],
      password: [
        validators.required('Password wajib diisi'),
        validators.minLength(6, 'Password minimal 6 karakter'),
      ],
      konfirmasi_password: [
        validators.required('Konfirmasi password wajib diisi'),
        validators.sameAs('password', 'Konfirmasi password tidak cocok dengan password di atas'),
      ],
    }
  )

  const handleValidSubmit = async (values) => {
    setError('')
    setLoading(true)
    try {
      await register(values.nama_lengkap.trim(), values.username.trim(), values.password)
      setSukses(true)
      setTimeout(() => {
        navigate('/pembeli')
      }, 1500)
    } catch (err) {
      if (!err.response) {
        setError('Gagal terhubung ke server backend. Pastikan server aktif.')
      } else {
        setError(err.response?.data?.detail || 'Pendaftaran gagal. Silakan coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }


  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f1f5f9',
      backgroundImage: `
        radial-gradient(circle at center, rgba(14, 165, 233, 0.04) 0%, transparent 65%),
        linear-gradient(to right, rgba(226, 232, 240, 0.6) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(226, 232, 240, 0.6) 1px, transparent 1px)
      `,
      backgroundSize: '100% 100%, 36px 36px, 36px 36px',
      padding: '40px 16px',
      position: 'relative',
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
    }}>
      {/* Decorative Radar/Concentric Rings Accent (Subtle Background) */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 720,
        height: 720,
        borderRadius: '50%',
        border: '1px dashed rgba(148, 163, 184, 0.25)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 960,
        height: 960,
        borderRadius: '50%',
        border: '1px solid rgba(148, 163, 184, 0.12)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Main Card Container */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: 480,
        background: '#ffffff',
        borderRadius: 16,
        boxShadow: '0 20px 45px -12px rgba(15, 23, 42, 0.12), 0 4px 16px -2px rgba(15, 23, 42, 0.04)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        {/* Top Dark Navy Header Strip */}
        <div style={{
          height: 6,
          background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0369a1 100%)'
        }} />

        <div style={{ padding: '32px 32px 28px' }}>
          {/* Header Branding */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            {/* Top Logo & Dinas PU Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <img
                src="/logo.jpg"
                alt="Logo SIPAKU"
                style={{
                  width: 44,
                  height: 44,
                  objectFit: 'contain',
                  borderRadius: 10,
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)'
                }}
              />
              <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    SIPAKU
                  </span>
                  <span style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    color: '#059669',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    padding: '2px 6px',
                    borderRadius: 4
                  }}>
                    DINAS PU
                  </span>
                </div>
                <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>
                  KABUPATEN LAMONGAN
                </div>
              </div>
            </div>

            {/* Pill Banner Kedinasan (Clean tanpa emoji) */}
            <div>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#475569',
                fontSize: 10,
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: 9999,
                letterSpacing: '0.04em'
              }}>
                PEMERINTAH KABUPATEN LAMONGAN • DINAS PU BM & CK
              </span>
            </div>

            {/* Title & Subtitle */}
            <h1 style={{
              margin: '14px 0 4px',
              fontSize: 22,
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.02em'
            }}>
              Daftar Akun Pembeli
            </h1>
            <p style={{
              margin: 0,
              fontSize: 12.5,
              color: '#64748b',
              lineHeight: 1.45
            }}>
              Buat akun warga untuk berpartisipasi melaporkan harga pasar di SIPAKU Lamongan
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <AlertBox variant="error" title="Pendaftaran Gagal" style={{ marginBottom: 16 }}>
              {error}
            </AlertBox>
          )}

          {/* Success Alert */}
          {sukses && (
            <AlertBox variant="success" title="Registrasi Berhasil" style={{ marginBottom: 16 }}>
              Akun warga berhasil didaftarkan! Mengalihkan Anda ke dasbor pembeli...
            </AlertBox>
          )}

          {/* Form Registrasi Warga */}
          <form onSubmit={handleSubmit(handleValidSubmit)} noValidate>
            <FormField
              label="Nama Lengkap"
              placeholder="Masukkan nama lengkap Anda"
              required
              {...getFieldProps('nama_lengkap')}
            />

            <FormField
              label="Username"
              placeholder="Masukkan username akun Anda"
              required
              helperText="Hanya boleh huruf, angka, dan underscore (_)"
              {...getFieldProps('username')}
            />

            <FormField
              label="Password (Min. 6 Karakter)"
              type="password"
              placeholder="Masukkan password minimal 6 karakter"
              required
              {...getFieldProps('password')}
            />

            <FormField
              label="Konfirmasi Password"
              type="password"
              placeholder="Ulangi password Anda"
              required
              {...getFieldProps('konfirmasi_password')}
            />

            {/* Tombol Submit Pendaftaran */}
            <button
              id="btn-submit-register"
              type="submit"
              disabled={loading || isSubmitting || sukses}
              style={{
                width: '100%',
                padding: '11px 16px',
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
                cursor: (loading || isSubmitting || sukses) ? 'not-allowed' : 'pointer',
                opacity: (loading || isSubmitting || sukses) ? 0.75 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
                transition: 'background 0.15s, transform 0.1s',
                marginTop: 6,
              }}
              onMouseEnter={(e) => { if (!loading && !isSubmitting && !sukses) e.currentTarget.style.background = '#1e293b' }}
              onMouseLeave={(e) => { if (!loading && !isSubmitting && !sukses) e.currentTarget.style.background = '#0f172a' }}
            >
              <span>{loading || isSubmitting ? 'Memproses Pendaftaran...' : 'Daftar Sekarang'}</span>
              <span style={{ fontSize: 15 }}>→</span>
            </button>
          </form>


          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '18px 0 14px',
            color: '#94a3b8',
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.08em'
          }}>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            <span style={{ padding: '0 12px', color: '#64748b' }}>SUDAH PUNYA AKUN?</span>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>

          {/* Tombol Masuk ke Login */}
          <Link
            to="/login"
            style={{
              width: '100%',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#0f172a',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              boxSizing: 'border-box',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f8fafc'
              e.currentTarget.style.borderColor = '#94a3b8'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff'
              e.currentTarget.style.borderColor = '#cbd5e1'
            }}
          >
            <span>Masuk ke Akun Terdaftar</span>
          </Link>

          {/* Link Buka Dasbor Publik */}
          <div style={{ marginTop: 14, textAlign: 'center' }}>
            <Link
              to="/pembeli"
              style={{
                color: '#64748b',
                fontSize: 12,
                textDecoration: 'none',
                fontWeight: 600
              }}
            >
              Kembali ke Dasbor Harga (Tanpa Akun)
            </Link>
          </div>

          {/* Security Status Box (Clean tanpa emoji) */}
          <div style={{
            marginTop: 18,
            padding: '10px 14px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11
          }}>
            <span style={{ color: '#475569', fontWeight: 600 }}>Enkripsi TLS 1.3 End-to-End</span>
            <span style={{ color: '#059669', fontWeight: 600 }}>Node Lamongan: Aktif</span>
          </div>
        </div>
      </div>

      {/* Outside Footer Info */}
      <div style={{
        marginTop: 18,
        textAlign: 'center',
        fontSize: 11,
        color: '#64748b',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
        justifyContent: 'center',
        zIndex: 1
      }}>
        <span>Dinas PU Bina Marga & Cipta Karya Kab. Lamongan</span>
        <span>•</span>
        <span>Panduan Teknis</span>
        <span>•</span>
        <span>Kebijakan Privasi</span>
        <span>•</span>
        <span style={{ fontWeight: 600, color: '#475569' }}>v2.4.0</span>
      </div>
    </div>
  )
}
