// Lógica del "descubrimiento del día", compartida por:
//   - el server Express de desarrollo local (server/index.js)
//   - la función serverless de Vercel (api/daily.js)
// No depende de Express ni de Vercel: recibe el body ya parseado y devuelve
// { status, body } para que cada envoltorio lo mande como corresponda.

import Anthropic from '@anthropic-ai/sdk'

// El SDK toma la API key de process.env.ANTHROPIC_API_KEY automáticamente.
const anthropic = new Anthropic()

// OJO (serverless): estos Map viven EN MEMORIA del proceso. En Vercel cada
// invocación puede caer en una instancia distinta y las instancias se apagan,
// así que el cache y el historial son "best effort": ayudan mientras la
// instancia sigue caliente, pero no son persistentes. La persistencia real
// llegará con el historial en base de datos.
const dailyCache = new Map()
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

// Genera (o devuelve del cache) el descubrimiento del día.
// input = { userId, topArtists, topTracks, genres, date }
// return = { status: number, body: object }
export async function generateDaily(input) {
  try {
    const {
      userId = 'anon',
      topArtists = [],
      topTracks = [],
      genres = [],
      date,
    } = input ?? {}

    const today =
      typeof date === 'string' ? date : new Date().toISOString().slice(0, 10)

    console.log(
      `[daily] user=${userId} artists=${topArtists.length} tracks=${topTracks.length} genres=${genres.length}`,
    )

    if (topArtists.length === 0 && topTracks.length === 0) {
      return {
        status: 400,
        body: {
          error:
            'Esta cuenta no tiene suficiente historial de escucha en Spotify para recomendarte.',
        },
      }
    }

    // Estable por día: si ya lo generamos hoy, lo devolvemos sin llamar a Claude.
    const cacheKey = `${userId}:${today}`
    if (dailyCache.has(cacheKey)) {
      return { status: 200, body: { daily: dailyCache.get(cacheKey), cached: true } }
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
- Usá SOLO datos que conozcas con certeza (año, sello, contexto histórico). Si no estás seguro de algún dato, elegí otro álbum que sí conozcas bien. NUNCA inventes álbumes, artistas ni años.

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

    // Una sola llamada, sin web search: así entra holgado en el límite de
    // tiempo de la función serverless de Vercel (antes daba 504 por tardar).
    // effort 'low' recorta el "pensamiento" de Opus → más rápido y más barato.
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low' },
      system,
      messages: [{ role: 'user', content: taste }],
    })

    if (response.stop_reason === 'refusal') {
      return { status: 422, body: { error: 'Claude rechazó la solicitud.' } }
    }

    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')

    const match = text.match(/\{[\s\S]*\}/)
    if (!match) {
      return {
        status: 502,
        body: { error: 'Claude no devolvió un JSON válido.', raw: text },
      }
    }

    const daily = JSON.parse(match[0])
    dailyCache.set(cacheKey, daily)

    // Guardamos lo recomendado para no repetirlo en los próximos días.
    const updated = [...seen, `${daily.album} — ${daily.artist}`].slice(
      -MAX_HISTORY,
    )
    pickHistory.set(userId, updated)

    return { status: 200, body: { daily, cached: false } }
  } catch (err) {
    console.error('Error en generateDaily:', err)
    return { status: 500, body: { error: err.message } }
  }
}
