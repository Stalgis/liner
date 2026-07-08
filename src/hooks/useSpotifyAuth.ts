import { useEffect, useRef, useState } from 'react'
import {
  clearToken,
  fetchProfile,
  getToken,
  handleRedirectCallback,
} from '../lib/spotify'
import type { SpotifyUser } from '../types'

// Hook que maneja todo el estado de autenticación:
// - detecta si volvemos del login de Spotify (?code=...)
// - guarda el token y trae el perfil
// - expone { user, loading, logout } para que la UI decida qué mostrar
export function useSpotifyAuth() {
  const [user, setUser] = useState<SpotifyUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Guard contra el doble-render de <StrictMode> en desarrollo: sin esto,
  // el efecto corre dos veces e intenta canjear el mismo code dos veces
  // (Spotify lo rechaza la segunda vez porque el code es de un solo uso).
  const didInit = useRef(false)

  useEffect(() => {
    if (didInit.current) return
    didInit.current = true

    async function init() {
      try {
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        const error = params.get('error')

        // Limpiamos la URL (?code / ?error) apenas la leemos.
        if (code || error) {
          window.history.replaceState({}, '', '/')
        }

        if (error) throw new Error(`Spotify devolvió: ${error}`)
        if (code) await handleRedirectCallback(code)

        const token = getToken()
        if (token) {
          setUser(await fetchProfile(token))
        }
      } catch (err) {
        console.error('Error de autenticación:', err)
        clearToken()
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  function logout() {
    clearToken()
    setUser(null)
  }

  return { user, loading, logout }
}
