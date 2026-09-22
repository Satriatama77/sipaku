import api from './api'

/**
 * Kirim teks transkrip ke backend untuk diparse NLP.
 * @param {string} teks - Teks hasil transkripsi suara / input manual
 * @returns {Promise} - { status, hasil_parse }
 */
export const parseTeks = (teks) =>
  api.post('/api/nlp/text-parse', { teks })

/**
 * Alias untuk kompatibilitas backward: parsing audio digantikan oleh speech recognition di browser.
 * Sekarang langsung kirim teks yang sudah ditranskrip.
 * @param {string} teks - Teks hasil Web Speech API
 * @returns {Promise} - { transkrip, hasil_parse }
 */
export const kirimAudio = async (teks) => {
  const res = await api.post('/api/nlp/text-parse', { teks })
  return {
    transkrip: teks,
    hasil_parse: res.data.hasil_parse,
  }
}
