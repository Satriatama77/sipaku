/**
 * EmptyState — Tampilan kosong yang elegan saat data belum tersedia.
 *
 * @param {React.ReactNode} icon - Ikon SVG atau komponen
 * @param {string} title - Judul state kosong
 * @param {string} description - Deskripsi tambahan
 * @param {React.ReactNode} action - Tombol CTA
 */

export default function EmptyState({ icon, title, description, action }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '52px 24px',
        color: '#64748b',
      }}
    >
      {/* Icon Container */}
      {icon && (
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          {icon}
        </div>
      )}

      {/* Title */}
      {title && (
        <div
          style={{
            fontWeight: 800,
            color: '#0f172a',
            fontSize: 15,
            marginBottom: 6,
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </div>
      )}

      {/* Description */}
      {description && (
        <div
          style={{
            fontSize: 12.5,
            color: '#64748b',
            lineHeight: 1.5,
            maxWidth: 360,
            margin: '0 auto',
          }}
        >
          {description}
        </div>
      )}

      {/* Action */}
      {action && (
        <div style={{ marginTop: 18 }}>
          {action}
        </div>
      )}
    </div>
  )
}
