import api from './api'

export const getLaporan    = (status = null) => api.get('/api/laporan', { params: status ? { status } : {} })
export const getLaporanById = (id) => api.get(`/api/laporan/${id}`)
export const submitLaporan = (data) => api.post('/api/laporan', data)
