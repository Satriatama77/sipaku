import { useState } from 'react'
import { IconAlertTriangle } from '../Icons'

/**
 * FormField — Komponen visual input form dengan validasi error merah di bawah kolom input.
 *
 * @param {string} label - Label judul input
 * @param {string} name - Nama field
 * @param {string} type - Tipe input ('text' | 'password' | 'email' | 'number' | 'textarea' | 'select')
 * @param {any} value - Nilai saat ini
 * @param {Function} onChange - Handler perubahan nilai
 * @param {Function} onBlur - Handler on blur
 * @param {boolean} hasError - Apakah field memiliki error
 * @param {string} errorMessage - Pesan error berwarna merah di bawah input
 * @param {boolean} required - Tanda bintang merah wajib isi
 * @param {string} placeholder - Placeholder teks input
 * @param {string} helperText - Teks bantuan jika tidak ada error
 * @param {React.ReactNode} prefix - Ikon atau prefix di sisi kiri
 * @param {React.ReactNode} suffix - Ikon atau suffix di sisi kanan
 * @param {React.ReactNode} children - Opsi select jika type='select'
 * @param {object} inputStyle - Style inline kustom untuk input
 * @param {object} containerStyle - Style inline kustom untuk container
 */
export default function FormField({
  label,
  name,
  type = 'text',
  value = '',
  onChange,
  onBlur,
  hasError = false,
  errorMessage = '',
  required = false,
  placeholder = '',
  helperText = '',
  prefix = null,
  suffix = null,
  children = null,
  rows = 3,
  disabled = false,
  autoComplete = 'off',
  inputStyle = {},
  containerStyle = {},
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const activeType = isPassword ? (showPassword ? 'text' : 'password') : type

  const inputId = props.id || name

  // Styling state
  const borderColor = hasError ? '#ef4444' : '#cbd5e1'
  const bgColor = disabled ? '#f1f5f9' : hasError ? '#fff5f5' : '#f8fafc'

  const baseInputStyle = {
    width: '100%',
    padding: prefix ? '10px 14px 10px 38px' : isPassword ? '10px 42px 10px 14px' : '10px 14px',
    background: bgColor,
    border: `1.5px solid ${borderColor}`,
    borderRadius: 8,
    color: '#0f172a',
    fontSize: 13.5,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease',
    boxShadow: hasError ? '0 0 0 3px rgba(239, 68, 68, 0.12)' : 'none',
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    ...inputStyle,
  }

  const handleFocus = (e) => {
    if (!hasError) {
      e.target.style.borderColor = '#0284c7'
      e.target.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.12)'
      e.target.style.backgroundColor = '#ffffff'
    } else {
      e.target.style.borderColor = '#dc2626'
      e.target.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.18)'
    }
    if (props.onFocus) props.onFocus(e)
  }

  const handleInputBlur = (e) => {
    if (!hasError) {
      e.target.style.borderColor = '#cbd5e1'
      e.target.style.boxShadow = 'none'
      e.target.style.backgroundColor = '#f8fafc'
    }
    if (onBlur) onBlur(e)
  }

  return (
    <div
      style={{
        marginBottom: 16,
        display: 'flex',
        flexDirection: 'column',
        ...containerStyle,
      }}
    >
      {/* Label */}
      {label && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
          }}
        >
          <label
            htmlFor={inputId}
            style={{
              color: hasError ? '#b91c1c' : '#334155',
              fontSize: 12.5,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              letterSpacing: '-0.01em',
            }}
          >
            <span>{label}</span>
            {required && (
              <span
                style={{
                  color: '#ef4444',
                  fontWeight: 900,
                  fontSize: 13,
                }}
                title="Wajib diisi"
              >
                *
              </span>
            )}
          </label>
        </div>
      )}

      {/* Input Container */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {/* Left Prefix */}
        {prefix && (
          <div
            style={{
              position: 'absolute',
              left: 12,
              pointerEvents: 'none',
              color: hasError ? '#ef4444' : '#64748b',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {prefix}
          </div>
        )}

        {/* Input Element */}
        {type === 'textarea' ? (
          <textarea
            id={inputId}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={handleInputBlur}
            onFocus={handleFocus}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? `${inputId}-error` : undefined}
            style={baseInputStyle}
            {...props}
          />
        ) : type === 'select' ? (
          <select
            id={inputId}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={handleInputBlur}
            onFocus={handleFocus}
            disabled={disabled}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? `${inputId}-error` : undefined}
            style={{ ...baseInputStyle, cursor: 'pointer' }}
            {...props}
          >
            {children}
          </select>
        ) : (
          <input
            id={inputId}
            name={name}
            type={activeType}
            value={value}
            onChange={onChange}
            onBlur={handleInputBlur}
            onFocus={handleFocus}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete={autoComplete}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? `${inputId}-error` : undefined}
            style={baseInputStyle}
            {...props}
          />
        )}

        {/* Password Visibility Toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
            style={{
              position: 'absolute',
              right: 12,
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: 4,
            }}
          >
            {showPassword ? 'Tutup' : 'Lihat'}
          </button>
        )}

        {/* Right Suffix (non-password) */}
        {!isPassword && suffix && (
          <div
            style={{
              position: 'absolute',
              right: 12,
              pointerEvents: 'none',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {suffix}
          </div>
        )}
      </div>

      {/* Red Error Message Below Input */}
      {hasError && errorMessage ? (
        <div
          id={`${inputId}-error`}
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            color: '#dc2626',
            fontSize: 11.5,
            fontWeight: 650,
            marginTop: 5,
            animation: 'fadeIn 0.2s ease',
            lineHeight: 1.35,
          }}
        >
          <IconAlertTriangle size={13} color="#dc2626" />
          <span>{errorMessage}</span>
        </div>
      ) : helperText ? (
        <div
          style={{
            color: '#64748b',
            fontSize: 11.5,
            marginTop: 4,
            lineHeight: 1.35,
          }}
        >
          {helperText}
        </div>
      ) : null}
    </div>
  )
}
