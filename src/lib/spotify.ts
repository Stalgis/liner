import type { SpotifyUser } from '../types'

// --- Configuración ---
// El Client ID sale de tu app en https://developer.spotify.com/dashboard
// y se lee desde .env.local (variable VITE_SPOTIFY_CLIENT_ID).
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID
// Debe coincidir EXACTO con la Redirect URI registrada en el dashboard.
const REDIRECT_URI = 'http://127.0.0.1:5173/callback'
// Permisos que le pedimos al usuario. user-top-read es nuevo: habilita leer
// sus artistas y canciones más escuchados (sus "gustos previos").
const SCOPES = ['user-read-private', 'user-read-email', 'user-top-read']

const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize'
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token'

const VERIFIER_KEY = 'spotify_code_verifier'
const TOKEN_KEY = 'spotify_access_token'
const EXPIRES_KEY = 'spotify_token_expires_at'

/* ---------- Helpers PKCE ----------
   PKCE = generamos un "verifier" secreto al azar y enviamos su hash
   ("challenge"). Al canjear el code, Spotify verifica que tengamos el
   verifier original. Reemplaza al client secret, que no se puede ocultar
   en el navegador. */

function randomString(length: number): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

async function sha256Base64Url(input: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(input),
  )
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/* ---------- Manejo del token en localStorage ---------- */

export function getToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY)
  const expiresAt = Number(localStorage.getItem(EXPIRES_KEY) ?? 0)
  // Si no hay token o ya venció, lo tratamos como deslogueado.
  if (!token || Date.now() > expiresAt) {
    clearToken()
    return null
  }
  return token
}

function saveToken(token: string, expiresInSeconds: number): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(EXPIRES_KEY, String(Date.now() + expiresInSeconds * 1000))
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EXPIRES_KEY)
}

/* ---------- Flujo OAuth ---------- */

// Paso 1: mandar al usuario al login oficial de Spotify.
export async function login(): Promise<void> {
  if (!CLIENT_ID) {
    throw new Error(
      'Falta VITE_SPOTIFY_CLIENT_ID. Creá .env.local y reiniciá el dev server.',
    )
  }

  const verifier = randomString(64)
  const challenge = await sha256Base64Url(verifier)
  // Guardamos el verifier para usarlo cuando Spotify nos devuelva.
  localStorage.setItem(VERIFIER_KEY, verifier)

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES.join(' '),
    code_challenge_method: 'S256',
    code_challenge: challenge,
    // Forzamos el diálogo de Spotify siempre, así se puede elegir/cambiar de
    // cuenta en vez de reusar en silencio la sesión ya abierta.
    show_dialog: 'true',
  })

  window.location.href = `${AUTH_ENDPOINT}?${params}`
}

// Cambiar de cuenta: borramos el token actual y mandamos de nuevo al login
// (que ahora fuerza el diálogo de Spotify con show_dialog).
export async function switchAccount(): Promise<void> {
  clearToken()
  await login()
}

// Paso 2: al volver con ?code=..., lo canjeamos por un access token.
export async function handleRedirectCallback(code: string): Promise<void> {
  const verifier = localStorage.getItem(VERIFIER_KEY)
  if (!verifier) throw new Error('Falta el code_verifier en localStorage')

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
  })

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })
  if (!res.ok) throw new Error(`Canje de token falló: ${res.status}`)

  const data = await res.json()
  saveToken(data.access_token, data.expires_in)
  localStorage.removeItem(VERIFIER_KEY)
}

// Paso 3: con el token, pedimos los datos del usuario.
export async function fetchProfile(token: string): Promise<SpotifyUser> {
  const res = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`No se pudo leer el perfil: ${res.status}`)
  return res.json()
}

// Gustos del usuario: artistas y canciones más escuchados + géneros.
// Una sola función que junta todo lo que el motor diario necesita.
export async function fetchTaste(token: string): Promise<{
  topArtists: string[]
  topTracks: string[]
  genres: string[]
}> {
  const headers = { Authorization: `Bearer ${token}` }
  const [artistsRes, tracksRes] = await Promise.all([
    fetch(
      'https://api.spotify.com/v1/me/top/artists?limit=15&time_range=medium_term',
      { headers },
    ),
    fetch(
      'https://api.spotify.com/v1/me/top/tracks?limit=15&time_range=medium_term',
      { headers },
    ),
  ])
  if (!artistsRes.ok)
    throw new Error(`No se pudieron leer tus artistas: ${artistsRes.status}`)
  if (!tracksRes.ok)
    throw new Error(`No se pudieron leer tus canciones: ${tracksRes.status}`)

  const artists = await artistsRes.json()
  const tracks = await tracksRes.json()

  const topArtists: string[] = artists.items.map(
    (artist: { name: string }) => artist.name,
  )

  // Los géneros vienen dentro de cada artista; los juntamos y deduplicamos.
  const genreSet = new Set<string>()
  for (const artist of artists.items as { genres: string[] }[]) {
    for (const genre of artist.genres) genreSet.add(genre)
  }
  const genres = [...genreSet].slice(0, 10)

  const topTracks: string[] = tracks.items.map(
    (track: { name: string; artists: { name: string }[] }) =>
      `${track.name} - ${track.artists.map((a) => a.name).join(', ')}`,
  )

  return { topArtists, topTracks, genres }
}
