import { cn } from '@/lib/utils'
import type { CoverData } from './covers'

// Una "tapa" cuadrada hecha con un gradiente + título/artista.
export function Cover({
  cover,
  className,
}: {
  cover: CoverData
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative flex aspect-square flex-col justify-end overflow-hidden rounded-md p-3',
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(140deg, ${cover.from}, ${cover.to})`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      <div className="relative">
        <p className="text-sm font-bold leading-tight text-white">
          {cover.title}
        </p>
        <p className="text-xs text-white/70">{cover.artist}</p>
      </div>
    </div>
  )
}
