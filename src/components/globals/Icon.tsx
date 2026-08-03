import type { SVGProps } from 'react'
export const Icon = ({
  svg,
  width = 20,
  height = 20,
  className = '',
  containerClassName = '',
  onClick,
  ...props
}: {
  svg: string
  width?: number
  height?: number
  className?: string
  containerClassName?: string
  onClick?: () => void
} & SVGProps<SVGSVGElement>) => {
  return (
    <span
      className={`min-w-fit inline-block min-h-fit max-w-fit ${containerClassName}`}
    >
      <svg
        onClick={onClick}
        className={`inline-block ${className}`}
        style={{
          maxWidth: width,
          maxHeight: height,
        }}
        width={width}
        height={height}
        preserveAspectRatio='xMidYMid meet'
        {...props}
      >
        <use href={`/icons.svg#${svg}`} />
      </svg>
    </span>
  )
}
