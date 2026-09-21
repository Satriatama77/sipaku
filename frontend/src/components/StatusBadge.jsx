const ZONA_CONFIG = {
  Normal:        { label: 'Normal',        bg: '#d1fae5', color: '#065f46' },
  Waspada:       { label: 'Waspada',       bg: '#fef3c7', color: '#92400e' },
  Merah:         { label: 'Zona Merah',    bg: '#fee2e2', color: '#991b1b' },
  Pending:       { label: 'Pending',       bg: '#e0e7ff', color: '#3730a3' },
  'Tindak Lanjut': { label: 'Tindak Lanjut', bg: '#fef3c7', color: '#92400e' },
  Selesai:       { label: 'Selesai',       bg: '#d1fae5', color: '#065f46' },
}

/**
 * Badge kecil untuk status zona disparitas atau status laporan.
 */
export default function StatusBadge({ status }) {
  const cfg = ZONA_CONFIG[status] ?? { label: status, bg: '#f3f4f6', color: '#374151' }
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: 600,
      background: cfg.bg,
      color: cfg.color,
    }}>
      {cfg.label}
    </span>
  )
}
