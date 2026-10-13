import { X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../lib/utils'

// TextLayer caveat style (brand-system.md): no tinted fill. A hairline frame,
// a small square marker in the status colour, and ink text — the site never
// fills a panel with colour. Errors keep coral text so they still read as urgent.
const SURFACE = {
  bar: 'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800',
  inline: 'bg-white dark:bg-gray-900 border-dashed border-gray-300 dark:border-gray-700',
}
const NEUTRAL_TEXT = 'text-gray-700 dark:text-gray-300'
const NEUTRAL_ACTION =
  'rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
const NEUTRAL_DISMISS =
  'text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200'

const VARIANT_CONFIG = {
  error: {
    ...SURFACE,
    marker: 'bg-red-500',
    textColor: 'text-red-700 dark:text-red-300',
    actionBg: NEUTRAL_ACTION,
    dismissColor: NEUTRAL_DISMISS,
  },
  warning: {
    ...SURFACE,
    marker: 'bg-amber-500',
    textColor: NEUTRAL_TEXT,
    actionBg: NEUTRAL_ACTION,
    dismissColor: NEUTRAL_DISMISS,
  },
  info: {
    ...SURFACE,
    marker: 'bg-blue-500',
    textColor: NEUTRAL_TEXT,
    actionBg: NEUTRAL_ACTION,
    dismissColor: NEUTRAL_DISMISS,
  },
  experimental: {
    ...SURFACE,
    marker: 'bg-amber-500',
    textColor: NEUTRAL_TEXT,
    actionBg: NEUTRAL_ACTION,
    dismissColor: NEUTRAL_DISMISS,
  },
} as const

export type BannerVariant = keyof typeof VARIANT_CONFIG

export interface BannerAction {
  label: string
  onClick: () => void
  icon?: React.ComponentType<{ className?: string }>
}

export interface BannerProps {
  variant: BannerVariant
  /** 'bar' = full-width top strip (border-b, no radius). 'inline' = rounded card in content flow. */
  layout?: 'bar' | 'inline'
  children: React.ReactNode
  /** If set, banner is dismissible. Value is the localStorage key. */
  dismissKey?: string
  action?: BannerAction
  className?: string
}

export function Banner({
  variant,
  layout = 'inline',
  children,
  dismissKey,
  action,
  className,
}: BannerProps) {
  const [dismissed, setDismissed] = useState(
    () => !!dismissKey && localStorage.getItem(dismissKey) === 'true',
  )

  if (dismissed) return null

  const config = VARIANT_CONFIG[variant]

  const handleDismiss = () => {
    if (dismissKey) {
      localStorage.setItem(dismissKey, 'true')
      setDismissed(true)
    }
  }

  const isBar = layout === 'bar'

  return (
    <div
      className={cn(
        'border transition-all ease-out duration-300',
        isBar
          ? cn('border-b border-x-0 border-t-0 px-4 py-2.5', config.bar)
          : cn('rounded-xl p-4', config.inline),
        className,
      )}
      role="alert"
    >
      <div className={cn('flex items-start gap-3', isBar && 'max-w-5xl mx-auto items-center')}>
        <span
          className={cn('size-2 flex-shrink-0', isBar ? 'mt-0' : 'mt-1.5', config.marker)}
          aria-hidden="true"
        />

        <div className={cn('flex-1 min-w-0 text-sm', config.textColor)}>{children}</div>

        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
              config.actionBg,
            )}
          >
            {action.icon && <action.icon className="w-4 h-4" aria-hidden="true" />}
            {action.label}
          </button>
        )}

        {dismissKey && (
          <button
            type="button"
            onClick={handleDismiss}
            className={cn(
              'p-0.5 flex-shrink-0 cursor-pointer transition-colors',
              config.dismissColor,
            )}
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
