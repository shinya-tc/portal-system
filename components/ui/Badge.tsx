import { cn } from '@/lib/utils'

type Color = 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'purple'

const colorClass: Record<Color, string> = {
  blue:   'bg-blue-100 text-blue-700',
  green:  'bg-green-100 text-green-700',
  red:    'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  gray:   'bg-gray-100 text-gray-600',
  purple: 'bg-purple-100 text-purple-700',
}

export function Badge({ label, color = 'gray' }: { label: string; color?: Color }) {
  return (
    <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium', colorClass[color])}>
      {label}
    </span>
  )
}
