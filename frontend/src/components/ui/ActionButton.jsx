/**
 * ActionButton — Tombol aksi yang konsisten di seluruh proyek SIPAKU.
 *
 * @param {'primary'|'secondary'|'danger'|'ghost'} variant - Jenis tombol
 * @param {'sm'|'md'|'lg'} size - Ukuran tombol
 * @param {React.ReactNode} icon - Ikon di sebelah kiri teks
 * @param {React.ReactNode} children - Teks/konten tombol
 * @param {boolean} loading - Status loading
 * @param {boolean} disabled - Status disabled
 * @param {boolean} fullWidth - Lebar penuh
 * @param {object} style - Style tambahan
 * @param {Function} onClick - Handler klik
 * @param {'button'|'submit'} type - Tipe tombol HTML
 */

import { useState } from 'react'

const VARIANT_STYLES = {
  primary: {
    bg: '#0f172a',
    bgHover: '#1e293b',
    color: '#ffffff',
    border: 'none',
    shadow: '0 2px 8px rgba(15, 23, 42, 0.2)',
  },
  secondary: {
    bg: '#ffffff',
    bgHover: '#f8fafc',
    color: '#0f172a',
    border: '1px solid #cbd5e1',
    shadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  },
  danger: {
    bg: '#dc2626',
    bgHover: '#b91c1c',
    color: '#ffffff',
    border: 'none',
    shadow: '0 2px 8px rgba(220, 38, 38, 0.25)',
  },
  ghost: {
    bg: 'transparent',
    bgHover: '#f1f5f9',
    color: '#475569',
    border: 'none',
    shadow: 'none',
  },
}

const SIZE_STYLES = {
  sm: { padding: '6px 12px', fontSize: 11.5, gap: 5, borderRadius: 7 },
  md: { padding: '9px 16px', fontSize: 12.5, gap: 7, borderRadius: 8 },
  lg: { padding: '11px 20px', fontSize: 14, gap: 8, borderRadius: 9 },
}

export default function ActionButton({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  loading = false,
  disabled = false,
  fullWidth = false,
  style = {},
  onClick,
  type = 'button',
  ...props
}) {
  const [hovered, setHovered] = useState(false)
  const v = VARIANT_STYLES[variant] || VARIANT_STYLES.primary
  const s = SIZE_STYLES[size] || SIZE_STYLES.md
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: s.gap,
        padding: s.padding,
        fontSize: s.fontSize,
        fontWeight: 700,
        fontFamily: 'inherit',
        color: v.color,
        background: hovered && !isDisabled ? v.bgHover : v.bg,
        border: v.border,
        borderRadius: s.borderRadius,
        boxShadow: v.shadow,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        width: fullWidth ? '100%' : 'auto',
        transition: 'all 0.15s ease',
        letterSpacing: '-0.005em',
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...props}
    >
      {loading ? (
        <svg
          width={s.fontSize}
          height={s.fontSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ animation: 'spin 0.8s linear infinite' }}
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      ) : icon ? (
        icon
      ) : null}
      {children && <span>{loading ? 'Memproses...' : children}</span>}
    </button>
  )
}
