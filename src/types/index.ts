// Shared TypeScript types and interfaces

// Datos del usuario que devuelve GET https://api.spotify.com/v1/me
export interface SpotifyUser {
  id: string
  display_name: string
  email: string
  images: { url: string }[]
  external_urls: { spotify: string }
}

// El "álbum del día" que devuelve nuestro backend (generado por Claude).
export interface DailyPick {
  album: string
  artist: string
  year: string
  genre: string
  hook: string
  artistStory: string
  albumMoment: string
  worldContext: string
  whyYou: string
  listenFor: string
  // Agregados por la verificación contra Spotify (server/daily-core.js).
  verified?: boolean
  coverUrl?: string | null
  spotifyUrl?: string | null
}
