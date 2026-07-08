// Tapas placeholder generadas con gradientes (sin imágenes externas).
// Tonos oscuros con acento verde para mantener la estética de la marca.
export interface CoverData {
  title: string
  artist: string
  from: string
  to: string
}

export const COVERS: CoverData[] = [
  { title: 'Neon Dusk', artist: 'Vela', from: '#1ED760', to: '#0b3b22' },
  { title: 'Static Garden', artist: 'The Hollows', from: '#2e2e2e', to: '#0d0d0d' },
  { title: 'Paper Moons', artist: 'Lúmen', from: '#0f5132', to: '#103a2a' },
  { title: 'Velvet Static', artist: 'Marrow', from: '#3a2f2a', to: '#121212' },
  { title: 'Cold Harbor', artist: 'Ítaca', from: '#14323f', to: '#0a1417' },
  { title: 'Golden Hour', artist: 'Sora', from: '#6b5325', to: '#14110a' },
  { title: 'Midnight Bloom', artist: 'Aria Kohl', from: '#1f6f43', to: '#101417' },
  { title: 'Echoes', artist: 'Norr', from: '#25303a', to: '#0e1216' },
  { title: 'Wildfire', artist: 'Cienfuegos', from: '#5a2b22', to: '#140d0b' },
  { title: 'Lo-Fi Rain', artist: 'Pluvia', from: '#243b34', to: '#0d1411' },
  { title: 'Afterglow', artist: 'Tide & Bone', from: '#1ED760', to: '#14532d' },
  { title: 'Verde Sur', artist: 'Quiet Riot', from: '#1a4d33', to: '#0b0f0d' },
]

// La "carta del día": un ejemplo real para que se entienda el concepto de
// liner notes (la historia detrás del disco).
export const DAY_PICK = {
  cover: {
    title: 'Kind of Blue',
    artist: 'Miles Davis',
    from: '#0e3b5c',
    to: '#0a0f14',
  } satisfies CoverData,
  badge: 'El disco de hoy',
  story:
    'Grabado en 1959 en apenas dos sesiones y casi sin ensayo: Miles le repartió a su banda unos pocos bocetos de escalas y los dejó improvisar. De esa libertad nació el disco de jazz más vendido de la historia y, con él, el jazz modal.',
}
