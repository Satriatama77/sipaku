const STATUS_MAP = {
  // Disparitas Zona
  Normal:         { label: 'Normal / Sesuai', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', dot: '#10b981' },
  Waspada:        { label: 'Waspada',         bg: '#fffbeb', color: '#b45309', border: '#fde68a', dot: '#f59e0b' },
  Merah:          { label: 'Zona Merah',      bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', dot: '#ef4444' },

  // Workflow Pengaduan & Verifikasi
  Pending:        { label: 'Menunggu Verifikasi', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', dot: '#3b82f6' },
  'Tindak Lanjut':{ label: 'Dalam Sidak / Investigasi', bg: '#fffbeb', color: '#b45309', border: '#fde68a', dot: '#f59e0b' },
  Selesai:        { label: 'Selesai / Ditindak', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', dot: '#10b981' },
  Disetujui:      { label: 'Disetujui',       bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', dot: '#10b981' },
  Valid:          { label: 'Valid',           bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', dot: '#10b981' },
  Ditolak:        { label: 'Ditolak',         bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', dot: '#ef4444' },
}

/**
 * StatusBadge — Badge status modern dan profesional dengan indicator dot.
 * @param {string} status - Nama status atau zona
 * @param {boolean} showDot - Menampilkan titik indikator warna
 * @param {string} customLabel - Override label default jika diperlukan
 */
export default function StatusBadge({ status, showDot = true, customLabel }) {
  const normKey = Object.keys(STATUS_MAP).find(
    (k) => k.toLowerCase() === (status || '').toLowerCase()
  )
  const cfg = normKey
    ? STATUS_MAP[normKey]
    : {
        label: status || 'Unknown',
        bg: '#f8fafc',
        color: '#475569',
        border: '#e2e8f0',
        dot: '#94a3b8',
      }

  const label = customLabel || cfg.label

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '11.5px',
        fontWeight: 650,
        letterSpacing: '0.01em',
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
      }}
    >
      {showDot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: cfg.dot,
            marginRight: 6,
            flexShrink: 0,
          }}
        />
      )}
      {label}
    </span>
  )
}

