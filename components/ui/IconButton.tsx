'use client'
import { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'danger' | 'secondary' | 'ghost'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  label?: string
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
}

const variantClass: Record<Variant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  danger:  'bg-red-500 text-white hover:bg-red-600',
  secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
  ghost:   'bg-transparent text-gray-500 hover:bg-gray-100',
}

const sizeClass = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
}

export function IconButton({ icon, label, variant = 'primary', size = 'md', className, ...props }: Props) {
  return (
    <button
      type="button"
      title={label}
      className={cn(
        'rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 disabled:opacity-50',
        variantClass[variant],
        sizeClass[size],
        className
      )}
      {...props}
    >
      {icon}
    </button>
  )
}
