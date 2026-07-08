import { motion, useReducedMotion } from 'motion/react'
import { COVERS, type CoverData } from './covers'
import { Cover } from './Cover'

// Repartimos las covers en columnas verticales.
const COLUMNS = 5
const columns: CoverData[][] = Array.from({ length: COLUMNS }, (_, c) =>
  COVERS.filter((_, i) => i % COLUMNS === c),
)

function DriftingColumn({
  items,
  duration,
  reverse,
}: {
  items: CoverData[]
  duration: number
  reverse?: boolean
}) {
  const reduce = useReducedMotion()
  // Duplicamos la lista para que el loop sea sin costuras (0% → -50%).
  const doubled = [...items, ...items]

  return (
    <motion.div
      className="flex shrink-0 flex-col gap-4"
      animate={reduce ? undefined : { y: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
      transition={{ duration, ease: 'linear', repeat: Infinity }}
    >
      {doubled.map((cover, i) => (
        <Cover key={i} cover={cover} className="w-32" />
      ))}
    </motion.div>
  )
}

// Pared de covers a la deriva detrás del hero. Solo animamos transform.
export function DriftingWall() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 flex justify-center gap-4 overflow-hidden opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]"
    >
      {columns.map((items, c) => (
        <DriftingColumn
          key={c}
          items={items}
          duration={28 + c * 6}
          reverse={c % 2 === 1}
        />
      ))}
    </div>
  )
}
