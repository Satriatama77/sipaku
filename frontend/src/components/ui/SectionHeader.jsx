/**
 * SectionHeader — Header section yang konsisten dengan breadcrumb, judul, subjudul, dan aksi.
 *
 * @param {string} title - Judul utama section
 * @param {string} subtitle - Subjudul/deskripsi
 * @param {Array<{label: string, to?: string}>} breadcrumb - Item breadcrumb
 * @param {React.ReactNode} actions - Tombol/aksi di sisi kanan
 * @param {string} badge - Teks badge kecil di sebelah judul
 * @param {'default'|'compact'} size - Ukuran header
 */

import { Link } from 'react-router-dom'

export default function SectionHeader({
  title,
  subtitle,
  breadcrumb,
  actions,
  badge,
  size = 'default',
}) {
  const isCompact = size === 'compact'

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 14,
        marginBottom: isCompact ? 16 : 22,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Breadcrumb */}
        {breadcrumb && breadcrumb.length > 0 && (
          <nav
            aria-label="breadcrumb"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 8,
              fontSize: 12,
              color: '#64748b',
              fontWeight: 500,
            }}
          >
            {breadcrumb.map((item, i) => {
              const isLast = i === breadcrumb.length - 1
              return (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {item.to && !isLast ? (
                    <Link
                      to={item.to}
                      style={{
                        color: '#0284c7',
                        textDecoration: 'none',
                        fontWeight: 600,
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.target.style.color = '#0369a1')}
                      onMouseLeave={(e) => (e.target.style.color = '#0284c7')}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      style={{
                        color: isLast ? '#0f172a' : '#64748b',
                        fontWeight: isLast ? 700 : 500,
                      }}
                    >
                      {item.label}
                    </span>
                  )}
                  {!isLast && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                </span>
              )
            })}
          </nav>
        )}

        {/* Title with optional badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h1
            style={{
              fontSize: isCompact ? 20 : 24,
              fontWeight: 850,
              color: '#0f172a',
              margin: '0 0 4px',
              letterSpacing: '-0.025em',
              lineHeight: 1.2,
            }}
          >
            {title}
          </h1>
          {badge && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 750,
                color: '#0369a1',
                background: '#e0f2fe',
                border: '1px solid #bae6fd',
                padding: '3px 10px',
                borderRadius: 6,
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
                marginBottom: 4,
              }}
            >
              {badge}
            </span>
          )}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p
            style={{
              color: '#64748b',
              fontSize: isCompact ? 12 : 13,
              margin: 0,
              lineHeight: 1.5,
              maxWidth: 640,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Actions */}
      {actions && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
            flexWrap: 'wrap',
          }}
        >
          {actions}
        </div>
      )}
    </div>
  )
}
