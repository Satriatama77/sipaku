import api from './api'

export const getDataSSH = () => api.get('/api/harga/ssh')

export const getSemuaKatalogPasar = () => api.get('/api/katalog/semua')

export const getSemuaTokoPublik = () => api.get('/api/katalog/toko/semua')

export const komparasiHarga = (nama_material, nama_kecamatan, harga_laporan) =>
  api.get('/api/harga/komparasi', {
    params: { nama_material, nama_kecamatan, harga_laporan },
  })
