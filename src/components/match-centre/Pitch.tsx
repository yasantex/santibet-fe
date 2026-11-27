import type { ReactNode } from 'react'

/**
 * A football pitch drawn to scale (105 × 68), striped grass and markings, with
 * children laid over it. Horizontal for the tracker card, vertical for lineups.
 */
const Pitch = ({ vertical = false, children, className = '' }: { vertical?: boolean; children?: ReactNode; className?: string }) => {
  const [w, h] = vertical ? [68, 105] : [105, 68]
  const stripes = Array.from({ length: 10 }, (_, i) => i)
  const line = { stroke: 'rgba(255,255,255,0.55)', strokeWidth: 0.4, fill: 'none' }
  return (
    <div className={`relative overflow-hidden bg-[#2f8f3a] ${className}`} style={{ aspectRatio: `${w} / ${h}` }}>
      <svg viewBox={`0 0 ${w} ${h}`} className='absolute inset-0 h-full w-full' aria-hidden>
        {stripes.map((i) =>
          vertical ? (
            <rect key={i} x={0} y={(i * h) / 10} width={w} height={h / 10} fill={i % 2 ? '#2f8f3a' : '#349b40'} />
          ) : (
            <rect key={i} x={(i * w) / 10} y={0} width={w / 10} height={h} fill={i % 2 ? '#2f8f3a' : '#349b40'} />
          ),
        )}
        <g transform={vertical ? `translate(${w} 0) rotate(90)` : undefined}>
          <rect x={1} y={1} width={103} height={66} {...line} />
          <line x1={52.5} y1={1} x2={52.5} y2={67} {...line} />
          <circle cx={52.5} cy={34} r={9.15} {...line} />
          <circle cx={52.5} cy={34} r={0.5} fill='rgba(255,255,255,0.7)' />
          <rect x={1} y={13.85} width={16.5} height={40.3} {...line} />
          <rect x={87.5} y={13.85} width={16.5} height={40.3} {...line} />
          <rect x={1} y={24.85} width={5.5} height={18.3} {...line} />
          <rect x={98.5} y={24.85} width={5.5} height={18.3} {...line} />
          <rect x={-1} y={30.35} width={2} height={7.3} {...line} />
          <rect x={104} y={30.35} width={2} height={7.3} {...line} />
        </g>
      </svg>
      {children}
    </div>
  )
}

export default Pitch
