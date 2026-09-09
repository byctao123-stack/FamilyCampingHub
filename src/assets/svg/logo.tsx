import type { SVGAttributes } from 'react'

const LogoSvg = (props: SVGAttributes<SVGElement>) => {
  return (
    <svg
      className='shrink-0'
      width='32'
      height='32'
      viewBox='0 0 44 46'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-label='Family Camping Hub Logo'
      {...props}
    >
      {/* Tent body */}
      <path d='M22,10 L2,44 Q22,40 42,44 Z' fill='#4ade80' stroke='#15803d' strokeWidth='1.5' />

      {/* Tent door */}
      <path d='M12,44 L22,22 L32,44 Q22,40 12,44 Z' fill='#166534' />
      <path d='M14,44 L22,26 L30,44 Q22,40 14,44 Z' fill='#22c55e' />

      {/* Tent pole */}
      <line x1='22' y1='10' x2='22' y2='44' stroke='#14532d' strokeWidth='1.5' strokeLinecap='round' />

      {/* Flag on pole */}
      <line x1='22' y1='10' x2='22' y2='4' stroke='#14532d' strokeWidth='1.2' strokeLinecap='round' />
      <path d='M22,4 L27,6 L22,9 Z' fill='#f97316' />

      {/* Person 1 (parent - taller) */}
      <circle cx='8' cy='34' r='2.5' fill='#fbbf24' stroke='#14532d' strokeWidth='0.8' />
      <line x1='8' y1='37' x2='8' y2='44' stroke='#14532d' strokeWidth='1.5' strokeLinecap='round' />
      <line x1='8' y1='40' x2='5' y2='43' stroke='#14532d' strokeWidth='1.2' strokeLinecap='round' />
      <line x1='8' y1='40' x2='11' y2='43' stroke='#14532d' strokeWidth='1.2' strokeLinecap='round' />

      {/* Person 2 (child - shorter) */}
      <circle cx='38' cy='36' r='2' fill='#fbbf24' stroke='#14532d' strokeWidth='0.8' />
      <line x1='38' y1='38' x2='38' y2='44' stroke='#14532d' strokeWidth='1.2' strokeLinecap='round' />
      <line x1='38' y1='40' x2='35' y2='42' stroke='#14532d' strokeWidth='1' strokeLinecap='round' />
      <line x1='38' y1='40' x2='41' y2='42' stroke='#14532d' strokeWidth='1' strokeLinecap='round' />

      {/* Ground line */}
      <path d='M0,46 Q22,44 44,46' stroke='#15803d' strokeWidth='1.5' strokeLinecap='round' opacity='0.3' />
    </svg>
  )
}

export default LogoSvg
