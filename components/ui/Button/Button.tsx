import cn from 'classnames'
import React, {
  forwardRef,
  ButtonHTMLAttributes,
  JSXElementConstructor,
  useRef,
} from 'react'
import mergeRefs from 'react-merge-refs'
import s from './Button.module.css'
import { LoadingDots } from '@components/ui'
import { ButtonUnstyled } from '@mui/material'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string
  className?: string
  variant?: 'text' | 'contained'
  size?: 'normal' | 'slim' | 'icon'
  color?: 'primary' | 'secondary'
  round?: boolean
  active?: boolean
  type?: 'submit' | 'reset' | 'button'
  Component?: string | JSXElementConstructor<any>
  width?: string | number
  loading?: boolean
  disabled?: boolean
}

const Button: React.FC<ButtonProps> = forwardRef((props, buttonRef) => {
  const {
    className,
    variant = 'contained',
    size = 'normal',
    color,
    round = false,
    children,
    active,
    width,
    loading = false,
    disabled = false,
    style = {},
    Component = 'button',
    ...rest
  } = props
  const ref = useRef<typeof Component>(null)

  const rootClassName = cn(
    s.root,
    {
      // Variants
      [s.contained]: variant === 'contained',
      [s.text]: variant === 'text',
      // Sizes
      [s.normal]: size === 'normal',
      [s.slim]: size === 'slim',
      [s.icon]: size === 'icon',
      // Colors
      [s.secondary]: color === 'secondary',
      // Other
      [s.loading]: loading,
      [s.disabled]: disabled,
      [s.round]: round,
    },
    className
  )

  return (
    <ButtonUnstyled
      aria-pressed={active}
      data-variant={variant}
      ref={mergeRefs([ref, buttonRef])}
      className={rootClassName}
      disabled={disabled}
      style={{
        width,
        ...style,
      }}
      {...rest}
    >
      {!loading && children}
      {loading && (
        <i className="pl-2 h-6 m-0 flex">
          <LoadingDots />
        </i>
      )}
    </ButtonUnstyled>
  )
})

export default Button
