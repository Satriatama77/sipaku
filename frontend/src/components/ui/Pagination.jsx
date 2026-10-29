export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  itemLabel = 'data',
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  if (totalItems <= pageSize) {
    return (
      <div style={{
        padding: '12px 18px',
        borderTop: '1px solid #f1f5f9',
        fontSize: 12,
        color: '#64748b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>Menampilkan seluruh {totalItems} {itemLabel}</span>
      </div>
    )
  }

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <div style={{
      padding: '12px 18px',
      borderTop: '1px solid #f1f5f9',
      fontSize: 12.5,
      color: '#64748b',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 12,
      background: '#ffffff'
    }}>
      <div>
        Menampilkan <strong style={{ color: '#0f172a' }}>{startItem} - {endItem}</strong> dari <strong style={{ color: '#0f172a' }}>{totalItems}</strong> {itemLabel}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={{
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 650,
            borderRadius: 6,
            border: '1px solid #cbd5e1',
            background: currentPage <= 1 ? '#f8fafc' : '#ffffff',
            color: currentPage <= 1 ? '#94a3b8' : '#334155',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            transition: 'all 0.12s ease'
          }}
        >
          Sebelumnya
        </button>

        <span style={{ fontSize: 12, fontWeight: 700, color: '#334155', padding: '0 4px' }}>
          Halaman {currentPage} dari {totalPages}
        </span>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          style={{
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 650,
            borderRadius: 6,
            border: '1px solid #cbd5e1',
            background: currentPage >= totalPages ? '#f8fafc' : '#ffffff',
            color: currentPage >= totalPages ? '#94a3b8' : '#334155',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            transition: 'all 0.12s ease'
          }}
        >
          Selanjutnya
        </button>
      </div>
    </div>
  )
}
