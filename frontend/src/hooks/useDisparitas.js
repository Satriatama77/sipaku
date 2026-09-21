import { useMemo } from 'react'

const BATAS_WASPADA = 10
const BATAS_MERAH   = 20

/**
 * Hook kalkulasi disparitas harga (client-side preview).
 * Dipakai di form laporan untuk live feedback sebelum submit.
 *
 * @param {number} hargaLaporan - Harga temuan dari warga
 * @param {number} hargaSSH     - Harga referensi dari data SSH
 * @returns {{ selisih, persentase, statusZona }}
 */
export function useDisparitas(hargaLaporan, hargaSSH) {
  return useMemo(() => {
    if (!hargaLaporan || !hargaSSH || hargaSSH === 0) {
      return { selisih: 0, persentase: 0, statusZona: 'Normal' }
    }

    const selisih    = hargaLaporan - hargaSSH
    const persentase = Math.round((selisih / hargaSSH) * 100 * 100) / 100

    let statusZona = 'Normal'
    if (Math.abs(persentase) >= BATAS_MERAH)   statusZona = 'Merah'
    else if (Math.abs(persentase) >= BATAS_WASPADA) statusZona = 'Waspada'

    return { selisih, persentase, statusZona }
  }, [hargaLaporan, hargaSSH])
}
