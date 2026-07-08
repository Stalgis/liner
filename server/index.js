// Backend Express: el ÚNICO lugar donde vive la ANTHROPIC_API_KEY.
// El navegador le pide a este servidor, y este le pide a Claude.

import dotenv from 'dotenv'
// Cargamos primero .env.local (gitignored) y luego .env.
dotenv.config({ path: ['.env.local', '.env'] })

import express from 'express'
import Anthropic from '@anthropic-ai/sdk'

const app = express()
app.use(express.json())

// El SDK toma la API key de process.env.ANTHROPIC_API_KEY automáticamente.
const anthropic = new Anthropic()

// Cache en memoria del descubrimiento del día (clave: userId:fecha).
// Se borra al reiniciar el server; la persistencia real llegará con el historial.
const dailyCache = new Map()

// Historial en memoria de lo ya recomendado por usuario, para no repetir y
// forzar novedad día a día. (También se borra al reiniciar el server.)
const pickHistory = new Map()
const MAX_HISTORY = 40

// Cada día rota un "tema" de época — todos sesgados al DESCUBRIMIENTO, no al
// disco obvio que un fan del género ya tiene escuchado.
const ERA_THEMES = [
  'un clásico de culto o injustamente olvidado (1950–1985), NO uno de los discos más famosos de la historia',
  'algo reciente y todavía poco conocido (de los últimos 2 años)',
  'una joya subvalorada de entre 1985 y 2010',
  'un artista poco masivo pero muy cercano a sus gustos (cualquier época)',
]

function dayNumber(dateStr) {
  return Math.floor(new Date(`${dateStr}T00:00:00`).getTime() / 86_400_000)
}

app.post('/api/daily', async (req, res) => {
  try {
    const {
      userId = 'anon',
      topArtists = [],
      topTracks = [],
      genres = [],
      date,
    } = req.body

    const today =
      typeof date === 'string' ? date : new Date().toISOString().slice(0, 10)

    console.log(
      `[daily] user=${userId} artists=${topArtists.length} tracks=${topTracks.length} genres=${genres.length}`,
    )

    if (topArtists.length === 0 && topTracks.length === 0) {
      return res.status(400).json({
        error:
          'Esta cuenta no tiene suficiente historial de escucha en Spotify para recomendarte.',
      })
    }

    // Estable por día: si ya lo generamos hoy, lo devolvemos sin llamar a Claude.
    const cacheKey = `${userId}:${today}`
    if (dailyCache.has(cacheKey)) {
      return res.json({ daily: dailyCache.get(cacheKey), cached: true })
    }

    const theme = ERA_THEMES[dayNumber(today) % ERA_THEMES.length]
    const seen = pickHistory.get(userId) ?? []

    const taste =
      `Artistas favoritos: ${topArtists.join(', ') || '—'}\n` +
      `Canciones favoritas: ${topTracks.join(', ') || '—'}\n` +
      `Géneros que escucha: ${genres.join(', ') || '—'}` +
      (seen.length
        ? `\nYa recomendados (NO repitas ninguno): ${seen.join('; ')}`
        : '')

    const system = `Sos un curador musical experto, estilo "liner notes" (esos textos que venían en los vinilos contando la historia del disco). Tu trabajo es hacer DESCUBRIR música, no confirmar lo que el usuario ya conoce.

Elegí UN álbum como "descubrimiento del día". Debe ser algo que el usuario muy probablemente NO conoce todavía.

Reglas:
- Tiene que encajar con los géneros/estilos que ya escucha (o adyacentes). NUNCA un estilo que claramente no escucha.
- NO recomiendes ninguno de los artistas de su lista de favoritos. Buscá artistas ADYACENTES y menos masivos, que un fan de esos artistas amaría descubrir.
- EVITÁ los discos obvios, canónicos o "grandes éxitos" que cualquier fan del género ya tiene escuchados. Arriesgá: preferí joyas de culto, artistas de perfil bajo, escenas o subgéneros menos difundidos.
- El álbum de hoy debe ser: ${theme}.
- Usá la búsqueda web para verificar datos reales (año, sello, contexto histórico). No inventes datos.

La idea es que ANTES de darle play entienda de dónde viene la música. Respondé ÚNICAMENTE con un JSON válido (sin markdown, sin texto extra) con este formato exacto:
{
  "album": "string",
  "artist": "string",
  "year": "string (año de lanzamiento)",
  "genre": "string",
  "hook": "una frase corta que enganche, en español",
  "artistStory": "quién es el artista/banda y de dónde viene, en español (2-3 frases)",
  "albumMoment": "en qué momento de su carrera sacó este disco y por qué importa, en español (2-3 frases)",
  "worldContext": "qué pasaba en el mundo o en la música en esa época, en español (1-2 frases)",
  "whyYou": "por qué se lo recomendamos según sus gustos, en español (1 frase)",
  "listenFor": "qué prestar atención al escucharlo, en español (1 frase)"
}`

    // La búsqueda web es server-side: si llega a su límite interno, devuelve
    // stop_reason "pause_turn" y hay que reenviar para que continúe.
    const messages = [{ role: 'user', content: taste }]
    let response

    for (let i = 0; i < 5; i++) {
      response = await anthropic.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 6000,
        // Opus razona el descubrimiento antes de responder (mejores picks).
        thinking: { type: 'adaptive' },
        system,
        // Opus soporta el web search con filtrado dinámico (más preciso).
        tools: [{ type: 'web_search_20260209', name: 'web_search' }],
        messages,
      })
      if (response.stop_reason !== 'pause_turn') break
      messages.push({ role: 'assistant', content: response.content })
    }

    if (response.stop_reason === 'refusal') {
      return res.status(422).json({ error: 'Claude rechazó la solicitud.' })
    }

    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')

    const match = text.match(/\{[\s\S]*\}/)
    if (!match) {
      return res
        .status(502)
        .json({ error: 'Claude no devolvió un JSON válido.', raw: text })
    }

    const daily = JSON.parse(match[0])
    dailyCache.set(cacheKey, daily)

    // Guardamos lo recomendado para no repetirlo en los próximos días.
    const updated = [...seen, `${daily.album} — ${daily.artist}`].slice(
      -MAX_HISTORY,
    )
    pickHistory.set(userId, updated)

    res.json({ daily, cached: false })
  } catch (err) {
    console.error('Error en /api/daily:', err)
    res.status(500).json({ error: err.message })
  }
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`✅ API de Liner escuchando en http://localhost:${PORT}`)
})
