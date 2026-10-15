import { useState, useCallback, useRef } from 'react'

/**
 * Standard Validator Rules Library
 */
export const validators = {
  required: (message = 'Kolom ini wajib diisi') => (value) => {
    if (value === undefined || value === null) return message
    if (typeof value === 'string' && !value.trim()) return message
    if (Array.isArray(value) && value.length === 0) return message
    return null
  },

  minLength: (min, message) => (value) => {
    if (!value) return null // Biarkan validator required yang menangani jika kosong
    const str = String(value)
    if (str.length < min) {
      return message || `Minimal ${min} karakter (saat ini ${str.length})`
    }
    return null
  },

  maxLength: (max, message) => (value) => {
    if (!value) return null
    const str = String(value)
    if (str.length > max) {
      return message || `Maksimal ${max} karakter`
    }
    return null
  },

  email: (message = 'Format email tidak valid (contoh: user@domain.com)') => (value) => {
    if (!value) return null
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(String(value).trim())) return message
    return null
  },

  numeric: (message = 'Nilai harus berupa angka') => (value) => {
    if (value === '' || value === undefined || value === null) return null
    if (isNaN(Number(value))) return message
    return null
  },

  minNumber: (min, message) => (value) => {
    if (value === '' || value === undefined || value === null) return null
    if (Number(value) < min) return message || `Nilai minimal adalah ${min}`
    return null
  },

  matches: (regex, message = 'Format input tidak valid') => (value) => {
    if (!value) return null
    if (!regex.test(String(value))) return message
    return null
  },

  sameAs: (targetField, message) => (value, allValues) => {
    if (value !== allValues[targetField]) {
      return message || `Nilai harus sama dengan ${targetField}`
    }
    return null
  },

  custom: (fn, message = 'Validasi gagal') => (value, allValues) => {
    const res = fn(value, allValues)
    if (res === false) return message
    if (typeof res === 'string') return res
    return null
  }
}

/**
 * useFormValidation — Hook Validasi Form Komprehensif
 *
 * @param {Object} initialValues - Nilai awal form { field: initialValue }
 * @param {Object|Function} schemaOrFn - Schema validasi { field: [rules] } ATAU fungsi (values) => errors
 */
export function useFormValidation(initialValues = {}, schemaOrFn = {}) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const schemaRef = useRef(schemaOrFn)
  schemaRef.current = schemaOrFn

  // Evaluasi error untuk satu field
  const validateSingleField = useCallback((name, value, currentValues) => {
    const schema = schemaRef.current
    if (typeof schema === 'function') {
      const allErrors = schema(currentValues)
      return allErrors[name] || ''
    }

    const rules = schema[name]
    if (!rules || !Array.isArray(rules)) return ''

    for (const rule of rules) {
      if (typeof rule === 'function') {
        const errorMsg = rule(value, currentValues)
        if (errorMsg) return errorMsg
      }
    }
    return ''
  }, [])

  // Evaluasi semua field
  const validateAllValues = useCallback((currentValues) => {
    const schema = schemaRef.current
    if (typeof schema === 'function') {
      return schema(currentValues) || {}
    }

    const newErrors = {}
    Object.keys(schema).forEach((field) => {
      const rules = schema[field]
      if (Array.isArray(rules)) {
        for (const rule of rules) {
          const errorMsg = rule(currentValues[field], currentValues)
          if (errorMsg) {
            newErrors[field] = errorMsg
            break // Simpan error pertama yang gagal
          }
        }
      }
    })
    return newErrors
  }, [])

  // Handler on-change
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target
    const val = type === 'checkbox' ? checked : value

    setValues((prev) => {
      const nextValues = { ...prev, [name]: val }

      // Jika field sudah disentuh, validasi secara real-time
      if (touched[name]) {
        const fieldError = validateSingleField(name, val, nextValues)
        setErrors((prevErr) => ({ ...prevErr, [name]: fieldError }))
      }

      return nextValues
    })
  }, [touched, validateSingleField])

  // Handler on-blur
  const handleBlur = useCallback((e) => {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))

    setValues((currentValues) => {
      const fieldError = validateSingleField(name, currentValues[name], currentValues)
      setErrors((prevErr) => ({ ...prevErr, [name]: fieldError }))
      return currentValues
    })
  }, [validateSingleField])

  // Manual setFieldValue (misal untuk custom select atau upload)
  const setFieldValue = useCallback((name, val, shouldValidate = true) => {
    setValues((prev) => {
      const nextValues = { ...prev, [name]: val }
      if (shouldValidate) {
        const fieldError = validateSingleField(name, val, nextValues)
        setErrors((prevErr) => ({ ...prevErr, [name]: fieldError }))
      }
      return nextValues
    })
  }, [validateSingleField])

  const setFieldError = useCallback((name, message) => {
    setErrors((prev) => ({ ...prev, [name]: message }))
    setTouched((prev) => ({ ...prev, [name]: true }))
  }, [])

  // Validasi seluruh formulir (misal sebelum submit)
  const validateAll = useCallback(() => {
    const allErrors = validateAllValues(values)
    setErrors(allErrors)

    // Tandai semua field sebagai touched agar error muncul
    const allTouched = Object.keys(values).reduce((acc, k) => {
      acc[k] = true
      return acc
    }, {})
    setTouched(allTouched)

    const isValid = Object.keys(allErrors).length === 0
    return isValid
  }, [validateAllValues, values])

  // Submit wrapper yang aman
  const handleSubmit = useCallback((onSubmitCallback) => async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault()
    }

    const isValid = validateAll()
    if (!isValid) {
      // Otomatis fokus ke input pertama yang invalid
      const allErrors = validateAllValues(values)
      const firstErrorField = Object.keys(allErrors)[0]
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField) || document.querySelector(`[name="${firstErrorField}"]`)
        if (element && typeof element.focus === 'function') {
          element.focus()
        }
      }
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmitCallback(values)
    } finally {
      setIsSubmitting(false)
    }
  }, [validateAll, validateAllValues, values])

  // Reset form ke initial state
  const resetForm = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  // Helper untuk binding langsung ke input field
  const getFieldProps = useCallback((name) => {
    const hasError = !!(touched[name] && errors[name])
    return {
      id: name,
      name,
      value: values[name] ?? '',
      onChange: handleChange,
      onBlur: handleBlur,
      'aria-invalid': hasError ? 'true' : 'false',
      'aria-describedby': hasError ? `${name}-error` : undefined,
      hasError,
      errorMessage: hasError ? errors[name] : '',
    }
  }, [errors, handleBlur, handleChange, touched, values])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid: Object.keys(errors).length === 0,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldError,
    setValues,
    validateAll,
    handleSubmit,
    resetForm,
    getFieldProps,
  }
}
