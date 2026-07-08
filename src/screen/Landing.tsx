import { type MouseEvent } from 'react'
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react'
import {
  Sparkles,
  Music,
  CalendarDays,
  BookOpen,
  Compass,
  MessageCircle,
} from 'lucide-react'
import { login } from '../lib'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DriftingWall } from './landing/DriftingWall'
import { FlipCard } from './landing/FlipCard'
import { MagneticButton } from './landing/MagneticButton'

const features = [
  {
    icon: CalendarDays,
    title: 'Un descubrimiento por día',
    text: 'Cada día un álbum, un artista, una canción y una playlist, elegidos a partir de lo que realmente escuchás en Spotify.',
  },
  {
    icon: BookOpen,
    title: 'Contexto antes del play',
    text: 'Antes de darle play te cuento la historia: el momento del artista, qué pasaba en el mundo cuando salió el disco, de dónde viene la banda.',
  },
  {
    icon: Compass,
    title: 'Toda la historia de la música',
    text: 'Un día algo recién salido, al otro un clásico histórico o una joya vieja — siempre dentro de estilos que ya escuchás.',
  },
  {
    icon: MessageCircle,
    title: 'Aprende de vos',
    text: 'Al final dejás un feedback rápido y se guarda. Así cada día te conoce mejor y afina lo que te recomienda.',
  },
]

// El título se revela palabra por palabra; la palabra verde es "historia,".
const TITLE_WORDS = ['Descubrí', 'música', 'con', 'historia,', 'no', 'al', 'azar.']
const GREEN_WORD = 3

const EASE = [0.22, 1, 0.36, 1] as const

// Separador suave (degradado) en vez de un borde duro que corta la pantalla.
function SoftDivider() {
  return (
    <div className="mx-auto h-px max-w-5xl bg-gradient-to-r from-transparent via-border to-transparent" />
  )
}

function Landing() {
  const reduce = useReducedMotion()

  // Posición del cursor (coords de viewport) para el spotlight global.
  const mx = useMotionValue(-1000)
  const my = useMotionValue(-1000)

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    mx.set(e.clientX)
    my.set(e.clientY)
  }

  // Parallax sutil del glow superior al scrollear.
  const { scrollY } = useScroll()
  const glowY = useTransform(scrollY, [0, 800], [0, 160])

  return (
    <div
      onMouseMove={reduce ? undefined : handleMove}
      className="relative min-h-screen overflow-x-hidden"
    >
      {/* ===== Fondo ambiental FIJO: cubre toda la pantalla y no se corta ===== */}
      <div aria-hidden className="pointer-events-none fixed inset-0">
        {/* Glow superior con parallax */}
        <motion.div
          style={{ y: reduce ? 0 : glowY }}
          className="absolute left-1/4 top-[-8%] size-[600px] -translate-x-1/2 rounded-full bg-spotify/12 blur-[160px]"
        />
        {/* Glow inferior: da continuidad a las secciones de abajo */}
        <div className="absolute -bottom-[10%] -right-[5%] size-[520px] rounded-full bg-spotify/10 blur-[170px]" />
        {/* Spotlight que sigue el cursor en TODA la página (solo transform) */}
        {!reduce && (
          <motion.div className="absolute left-0 top-0" style={{ x: mx, y: my }}>
            <div className="size-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-spotify/15 blur-[130px]" />
          </motion.div>
        )}
      </div>

      {/* ===== Contenido (por encima del fondo) ===== */}
      <div className="relative z-10">
        {/* ---------- HERO ---------- */}
        <section className="relative flex min-h-screen items-center overflow-hidden px-6 py-20">
          <DriftingWall />

          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
            {/* Izquierda: copy */}
            <div className="text-center lg:text-left">
              <span className="mb-6 inline-flex items-center gap-2 rounded-pill border border-border bg-card px-4 py-1.5 text-sm text-subdued">
                <Sparkles className="size-4 text-spotify" />
                Tu curador musical diario
              </span>

              <motion.h1
                className="text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl"
                initial={reduce ? false : 'hidden'}
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.08 } },
                }}
              >
                {TITLE_WORDS.map((word, i) => (
                  <motion.span
                    key={i}
                    className={
                      i < TITLE_WORDS.length - 1
                        ? 'mr-[0.22em] inline-block'
                        : 'inline-block'
                    }
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.5, ease: EASE },
                      },
                    }}
                  >
                    <span
                      className={i === GREEN_WORD ? 'text-spotify' : undefined}
                    >
                      {word}
                    </span>
                  </motion.span>
                ))}
              </motion.h1>

              <p className="mx-auto mt-6 max-w-md text-lg text-subdued lg:mx-0">
                Liner usa tus datos de Spotify para darte cada día un álbum, un
                artista y una canción — y te cuenta la historia detrás, como las
                viejas liner notes, antes de que le des play.
              </p>

              <div className="mt-10 flex flex-col items-center gap-3 lg:items-start">
                <MagneticButton>
                  <Button onClick={login} size="pill" className="text-base">
                    <Music />
                    Entrar con Spotify
                  </Button>
                </MagneticButton>
                <p className="text-sm text-muted-foreground">
                  Solo leemos tus gustos. Nunca publicamos nada en tu cuenta.
                </p>
              </div>
            </div>

            {/* Derecha: carta del día con flip */}
            <div className="flex justify-center lg:justify-end">
              <FlipCard />
            </div>
          </div>
        </section>

        {/* ---------- FEATURES ---------- */}
        <section className="mx-auto max-w-5xl px-6 py-24">
          <h2 className="mb-3 text-center text-3xl font-extrabold tracking-tight">
            No es otra lista de recomendados
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-subdued">
            Es un viaje guiado por la música: entender de dónde viene cada
            canción te hace escucharla distinto.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={reduce ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: EASE }}
              >
                <Card className="h-full">
                  <CardContent className="flex flex-col gap-3 p-6">
                    <div className="flex size-11 items-center justify-center rounded-lg bg-spotify/15 text-spotify">
                      <feature.icon className="size-5" />
                    </div>
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                    <p className="text-sm text-subdued">{feature.text}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <SoftDivider />

        {/* ---------- CTA FINAL ---------- */}
        <section className="px-6 py-20 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">
            ¿Listo para tu descubrimiento de hoy?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-subdued">
            Conectá tu Spotify y empezá a escuchar con contexto.
          </p>
          <div className="mt-8 flex justify-center">
            <MagneticButton>
              <Button onClick={login} size="pill" className="text-base">
                <Music />
                Entrar con Spotify
              </Button>
            </MagneticButton>
          </div>
        </section>

        <SoftDivider />

        <footer className="px-6 py-8 text-center text-sm text-muted-foreground">
          Liner · Escuchá con contexto · Hecho con tus datos de Spotify
        </footer>
      </div>
    </div>
  )
}

export default Landing
