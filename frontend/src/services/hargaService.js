import api from './api'

export const getDataSSH = () => api.get('/api/harga/ssh')

export const komparasiHarga = (nama_material, nama_kecamatan, harga_laporan) =>
  api.get('/api/harga/komparasi', {
    params: { nama_material, nama_kecamatan, harga_laporan },
  })
