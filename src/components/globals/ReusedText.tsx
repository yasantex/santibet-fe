

export const ErrorText = ({
  text,
  className,
}: {
  text: string
  className?: string
}) => {
  return (
    <div className={`pt-1 text-xs font-normal text-error ${className}`}>
      {text}
    </div>
  )
}

