import { useEffect, useState, type ReactNode } from 'react'
import {
  CalendarDays,
  Ear,
  Globe,
  Loader2,
  Music2,
  RefreshCw,
  Sparkles,
  User,
  type LucideIcon,
} from 'lucide-react'
import { fetchTaste, getToken } from '../lib'
import type { DailyPick } from '../types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// Gradientes para la "tapa" del álbum (no tenemos la portada real todavía;
// elegimos uno de forma determinista según el nombre).
const GRADIENTS: [string, string][] = [
  ['#1ED760', '#0b3b22'],
  ['#0e3b5c', '#0a0f14'],
  ['#1f6f43', '#101417'],
  ['#3a2f2a', '#121212'],
  ['#14323f', '#0a1417'],
]

function gradientFor(seed: string): [string, string] {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return GRADIENTS[h % GRADIENTS.length]
}

function Section({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-spotify">
        <Icon className="size-4" />
        {label}
      </span>
      <p className="text-sm leading-relaxed text-subdued">{children}</p>
    </div>
  )
}

function DailySkeleton() {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex gap-4">
          <div className="size-28 shrink-0 animate-pulse rounded-md bg-elevated" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-4 w-24 animate-pulse rounded bg-elevated" />
            <div className="h-6 w-2/3 animate-pulse rounded bg-elevated" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-elevated" />
          </div>
        </div>
        <div className="h-4 w-full animate-pulse rounded bg-elevated" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-elevated" />
        <div className="h-4 w-4/6 animate-pulse rounded bg-elevated" />
      </CardContent>
    </Card>
  )
}

interface DailyDiscoveryProps {
  userId: string
}

function DailyDiscovery({ userId }: DailyDiscoveryProps) {
  const [pick, setPick] = useState<DailyPick | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Un contador para poder reintentar (cambia → re-corre el efecto).
  const [attempt, setAttempt] = useState(0)

  // Se carga solo al montar (o al reintentar). El backend lo cachea por día.
  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const token = getToken()
        if (!token) throw new Error('Tu sesión expiró, volvé a entrar.')

        const taste = await fetchTaste(token)
        if (taste.topArtists.length === 0 && taste.topTracks.length === 0) {
          throw new Error(
            'Esta cuenta no tiene suficiente historial de escucha en Spotify. Escuchá algo de música y volvé, o probá con otra cuenta.',
          )
        }

        const date = new Date().toISOString().slice(0, 10)
        const res = await fetch('/api/daily', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Mandamos el token para que el backend valide el álbum en Spotify.
          body: JSON.stringify({ userId, date, spotifyToken: token, ...taste }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? `Error ${res.status}`)
        }
        const data = await res.json()
        if (!cancelled) setPick(data.daily)
      } catch (err) {
        // Log visible en la consola del navegador para diagnosticar.
        console.error('[DailyDiscovery]', err)
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [userId, attempt])

  if (loading) {
    return (
      <div className="w-full">
        <p className="mb-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Buscando tu descubrimiento de hoy…
        </p>
        <DailySkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            size="pill"
            onClick={() => setAttempt((a) => a + 1)}
          >
            <RefreshCw />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!pick) return null

  const [from, to] = gradientFor(pick.album + pick.artist)

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-6 p-6">
        {/* Encabezado: tapa + datos */}
        <div className="flex flex-col gap-4 sm:flex-row">
          {pick.coverUrl ? (
            <img
              src={pick.coverUrl}
              alt={`Tapa de ${pick.album}`}
              className="size-28 shrink-0 self-center overflow-hidden rounded-md object-cover sm:self-start"
            />
          ) : (
            <div
              className="flex size-28 shrink-0 items-center justify-center self-center overflow-hidden rounded-md sm:self-start"
              style={{
                backgroundImage: `linear-gradient(140deg, ${from}, ${to})`,
              }}
            >
              <Music2 className="size-10 text-white/80" />
            </div>
          )}
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <span className="inline-flex items-center justify-center gap-1.5 self-center text-xs font-semibold uppercase tracking-wide text-spotify sm:self-start">
              <CalendarDays className="size-4" />
              El álbum de hoy
            </span>
            <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
              {pick.album}
            </h2>
            <p className="text-subdued">
              {pick.artist} · {pick.year} · {pick.genre}
            </p>
            <p className="mt-2 text-base text-foreground">{pick.hook}</p>
            {pick.spotifyUrl ? (
              <a
                href={pick.spotifyUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center justify-center gap-1.5 self-center text-sm font-semibold text-spotify hover:underline sm:self-start"
              >
                <Music2 className="size-4" />
                Abrir en Spotify
              </a>
            ) : pick.verified === false ? (
              <p className="mt-1 text-xs text-muted-foreground">
                No pudimos verificar este álbum en Spotify; puede que el título
                no sea exacto.
              </p>
            ) : null}
          </div>
        </div>

        {/* Liner notes: la historia antes del play */}
        <div className="flex flex-col gap-4 border-t border-border pt-5">
          <Section icon={User} label="Sobre el artista">
            {pick.artistStory}
          </Section>
          <Section icon={Sparkles} label="El momento del disco">
            {pick.albumMoment}
          </Section>
          <Section icon={Globe} label="Qué pasaba en el mundo">
            {pick.worldContext}
          </Section>
          <Section icon={Music2} label="Por qué vos">
            {pick.whyYou}
          </Section>
          <Section icon={Ear} label="Prestá atención a">
            {pick.listenFor}
          </Section>
        </div>
      </CardContent>
    </Card>
  )
}

export default DailyDiscovery
