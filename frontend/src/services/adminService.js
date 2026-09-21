import api from './api'

export const getStatistik     = () => api.get('/api/admin/statistik')
export const getLaporanAdmin  = (status = null) => api.get('/api/admin/laporan', { params: status ? { status } : {} })
export const updateStatusLaporan = (id, status, catatan_admin = null) =>
  api.patch(`/api/admin/laporan/${id}/status`, { status, catatan_admin })
