import api from './api'

export const getStatistik       = () => api.get('/api/admin/statistik')
export const getLaporanAdmin    = (status = null) => api.get('/api/admin/laporan', { params: status ? { status } : {} })
export const updateStatusLaporan = (id, status, catatan_admin = null) =>
  api.patch(`/api/admin/laporan/${id}/status`, { status, catatan_admin })

// ── Toko & Survei Katalog Lapangan ─────────────────────────
export const getSemuaToko       = () => api.get('/api/admin/toko')
export const tambahToko         = (data) => api.post('/api/admin/toko', data)
export const getDaftarKecamatan = () => api.get('/api/admin/kecamatan')
export const getKatalogToko     = (idToko) => api.get(`/api/katalog/${idToko}`)
export const updateKatalogToko   = (idToko, data) => api.put(`/api/katalog/${idToko}`, data)
export const updateBatchKatalogToko = (idToko, items) => api.put(`/api/katalog/${idToko}/batch`, items)


