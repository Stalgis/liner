import { Play } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { DAY_PICK } from './covers'

// La "carta del día": frente = portada, dorso = la historia.
// El flip 3D en hover ata la animación al concepto "contexto antes del play".
export function FlipCard() {
  const reduce = useReducedMotion()

  return (
    <div style={{ perspective: 1200 }} className="w-[300px] max-w-full">
      <motion.div
        className="relative aspect-[3/4] w-full"
        style={{
          transformStyle: 'preserve-3d',
          WebkitTransformStyle: 'preserve-3d',
        }}
        whileHover={reduce ? undefined : { rotateY: 180 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* FRENTE */}
        <div
          className="absolute inset-0 flex flex-col overflow-hidden rounded-xl border border-border"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          <div
            className="relative flex-1"
            style={{
              backgroundImage: `linear-gradient(140deg, ${DAY_PICK.cover.from}, ${DAY_PICK.cover.to})`,
            }}
          >
            <span className="absolute left-3 top-3 rounded-pill bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              {DAY_PICK.badge}
            </span>
          </div>
          <div className="bg-card p-4">
            <p className="text-lg font-bold leading-tight">
              {DAY_PICK.cover.title}
            </p>
            <p className="text-sm text-subdued">{DAY_PICK.cover.artist}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Pasá el cursor para la historia →
            </p>
          </div>
        </div>

        {/* DORSO */}
        <div
          className="absolute inset-0 flex flex-col gap-3 overflow-hidden rounded-xl border border-spotify/40 bg-card p-5"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-spotify">
            Liner notes
          </span>
          <p className="text-sm leading-relaxed text-subdued">
            {DAY_PICK.story}
          </p>
          <div className="mt-auto flex items-center gap-2 text-sm font-semibold text-spotify">
            <Play className="size-4" />
            Ahora sí, dale play
          </div>
        </div>
      </motion.div>
    </div>
  )
}
