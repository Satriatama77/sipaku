import api from './api'

export const getLaporan    = (status = null) => api.get('/api/laporan', { params: status ? { status } : {} })
export const getLaporanById = (id) => api.get(`/api/laporan/${id}`)

/**
 * Submit laporan harga baru dengan foto bukti.
 * Menggunakan FormData (multipart/form-data) agar bisa mengirim file.
 */
export const submitLaporan = (data, fotoFile = null) => {
  const formData = new FormData()
  formData.append('id_kecamatan', data.id_kecamatan)
  formData.append('nama_toko', data.nama_toko)
  formData.append('nama_material', data.nama_material)
  formData.append('harga_temuan', data.harga_temuan)
  formData.append('satuan', data.satuan || 'satuan')
  formData.append('nama_pelapor', data.nama_pelapor || 'Warga Anonim')

  if (fotoFile) {
    formData.append('foto_bukti', fotoFile)
  }

  return api.post('/api/laporan', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
