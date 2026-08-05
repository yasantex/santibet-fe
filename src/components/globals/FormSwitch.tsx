import * as React from 'react'

type FormSwitchProps = {
  checked: boolean | number
  onChange: (checked: boolean | number) => void
  text?: string
  onLabel?: string
  offLabel?: string
  disabled?: boolean
  name?: string
  id?: string
  showLabel?: boolean
  className?: string
  labelClassName?: string
}

export const FormSwitch: React.FC<FormSwitchProps> = ({
  checked,
  onChange,
  text,
  onLabel = 'Enabled',
  offLabel = 'Disabled',
  disabled = false,
  name,
  id,
  showLabel = true,
  className = '',
  labelClassName = '',
}) => {
  const isChecked = checked === true || checked === 1
  const switchId = id ?? name
  const label = text ? text : isChecked ? onLabel : offLabel

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Return same type as what was passed in
    if (typeof checked === 'number') {
      onChange(e.target.checked ? 1 : 0)
    } else {
      onChange(e.target.checked)
    }
  }

  return (
    <label
      htmlFor={switchId}
      className={`inline-flex items-center gap-3 cursor-pointer select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }${className} `}
    >
      {showLabel && (
        <span
          className={`text-sm font-medium text-neutral-10 ${labelClassName}`}
        >
          {label}
        </span>
      )}
      <div className='relative'>
        <input
          id={switchId}
          name={name}
          type='checkbox'
          checked={isChecked}
          disabled={disabled}
          onChange={handleChange}
          className='sr-only'
        />

        {/* Track */}
        <div
          className={`h-5 w-11 rounded-[100px] transition-colors duration-200 ${
            isChecked ? `bg-brand-green` : 'bg-plain'
          }`}
        />

        {/* Thumb */}
        <div
          className={`absolute top-0.5 left-1 h-4 w-4 ${
            isChecked ? 'bg-surface-base' : 'bg-track'
          } rounded-[100px] transition-transform duration-200 ${
            isChecked ? 'translate-x-5' : 'translate-x-0 '
          }`}
        />
      </div>
    </label>
  )
}
