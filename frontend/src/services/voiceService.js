import api from './api'

/**
 * Kirim audio blob ke endpoint NLP backend.
 * @param {Blob} audioBlob - Blob dari MediaRecorder API
 * @returns {Promise} - { transkrip, hasil_parse }
 */
export const kirimAudio = async (audioBlob) => {
  const formData = new FormData()
  formData.append('audio', audioBlob, 'rekaman.webm')
  const res = await api.post('/api/nlp/voice-to-text', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

/**
 * Parse teks manual (mode debug / tanpa mic)
 */
export const parseTeks = (teks) => api.post(`/api/nlp/text-parse?teks=${encodeURIComponent(teks)}`)
