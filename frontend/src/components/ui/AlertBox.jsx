import { IconShield, IconAlertTriangle, IconCheck, IconLock } from '../Icons'

/**
 * AlertBox — Komponen alert/informasi yang konsisten di seluruh proyek SIPAKU.
 *
 * @param {'error'|'warning'|'success'|'info'|'forbidden'} variant - Jenis alert
 * @param {string} title - Judul alert (opsional, auto dari variant jika kosong)
 * @param {React.ReactNode} children - Konten utama alert
 * @param {React.ReactNode} actions - Tombol/aksi tambahan di bawah konten
 * @param {boolean} compact - Mode kompak (padding lebih kecil)
 * @param {object} style - Style tambahan
 */

const VARIANTS = {
  error: {
    bg: 'linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%)',
    border: '#fca5a5',
    accentBorder: '#ef4444',
    iconBg: '#fee2e2',
    iconColor: '#dc2626',
    titleColor: '#991b1b',
    textColor: '#b91c1c',
    Icon: IconAlertTriangle,
    defaultTitle: 'Otorisasi Gagal',
  },
  warning: {
    bg: 'linear-gradient(135deg, #fffbeb 0%, #fefce8 100%)',
    border: '#fde68a',
    accentBorder: '#f59e0b',
    iconBg: '#fef3c7',
    iconColor: '#d97706',
    titleColor: '#92400e',
    textColor: '#a16207',
    Icon: IconAlertTriangle,
    defaultTitle: 'Perhatian',
  },
  success: {
    bg: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
    border: '#86efac',
    accentBorder: '#22c55e',
    iconBg: '#dcfce7',
    iconColor: '#16a34a',
    titleColor: '#166534',
    textColor: '#15803d',
    Icon: IconCheck,
    defaultTitle: 'Berhasil',
  },
  info: {
    bg: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)',
    border: '#93c5fd',
    accentBorder: '#3b82f6',
    iconBg: '#dbeafe',
    iconColor: '#2563eb',
    titleColor: '#1e40af',
    textColor: '#1d4ed8',
    Icon: IconShield,
    defaultTitle: 'Informasi',
  },
  forbidden: {
    bg: 'linear-gradient(135deg, #fef2f2 0%, #fdf2f8 100%)',
    border: '#fca5a5',
    accentBorder: '#dc2626',
    iconBg: '#fee2e2',
    iconColor: '#dc2626',
    titleColor: '#991b1b',
    textColor: '#b91c1c',
    Icon: IconLock,
    defaultTitle: 'Akses Ditolak',
  },
}

export default function AlertBox({
  variant = 'info',
  title,
  children,
  actions,
  compact = false,
  style = {},
}) {
  const v = VARIANTS[variant] || VARIANTS.info
  const IconComp = v.Icon

  return (
    <div
      role="alert"
      style={{
        background: v.bg,
        border: `1px solid ${v.border}`,
        borderLeft: `4px solid ${v.accentBorder}`,
        borderRadius: 10,
        padding: compact ? '10px 14px' : '14px 18px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: compact ? 10 : 14,
        lineHeight: 1.5,
        animation: 'fadeSlideIn 0.25s ease-out',
        ...style,
      }}
    >
      {/* Icon Badge */}
      <div
        style={{
          width: compact ? 28 : 34,
          height: compact ? 28 : 34,
          borderRadius: 8,
          background: v.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 1,
          border: `1px solid ${v.border}`,
        }}
      >
        <IconComp size={compact ? 14 : 16} color={v.iconColor} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {(title || v.defaultTitle) && (
          <div
            style={{
              fontSize: compact ? 12 : 13,
              fontWeight: 750,
              color: v.titleColor,
              lineHeight: 1.3,
              marginBottom: 3,
              letterSpacing: '-0.01em',
            }}
          >
            {title || v.defaultTitle}
          </div>
        )}
        <div
          style={{
            fontSize: compact ? 12 : 12.5,
            color: v.textColor,
            lineHeight: 1.5,
            wordBreak: 'break-word',
          }}
        >
          {children}
        </div>

        {/* Actions */}
        {actions && (
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
