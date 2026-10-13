import { chartFontSize } from '@claude-view/design-tokens'
import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '../../lib/utils'
import type { LearningCurve as LearningCurveData } from '../../types/generated'
import { InsightLine } from './InsightLine'

interface LearningCurveProps {
  data: LearningCurveData
}

/**
 * LearningCurve displays re-edit rate over time.
 *
 * Shows a bar chart with monthly re-edit rates, demonstrating
 * whether the user is improving at writing effective prompts.
 * Lower re-edit rate = better prompting skills.
 */
export function LearningCurve({ data }: LearningCurveProps) {
  const { periods, currentAvg, improvement } = data

  // Format periods for display (e.g., "2026-01" -> "Jan")
  const chartData = periods.map((p) => ({
    period: formatPeriod(p.period),
    fullPeriod: p.period,
    reeditRate: p.reeditRate,
    // Color based on performance relative to average
    fill: p.reeditRate <= currentAvg ? 'var(--color-green-500)' : 'var(--color-amber-500)',
  }))

  // Determine trend icon
  const TrendIcon = improvement > 10 ? TrendingDown : improvement < -10 ? TrendingUp : Minus
  const trendColor =
    improvement > 10
      ? 'text-green-600 dark:text-green-400'
      : improvement < -10
        ? 'text-red-600 dark:text-red-400'
        : 'text-gray-500 dark:text-gray-400'

  // Create insight object for InsightLine
  const insight = {
    text: data.insight,
    kind:
      improvement > 10
        ? ('success' as const)
        : improvement < -10
          ? ('warning' as const)
          : ('info' as const),
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Your Progress
        </h2>

        {/* Current Average Badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Your avg:</span>
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
            {currentAvg.toFixed(2)}
          </span>
          <TrendIcon className={cn('w-4 h-4', trendColor)} aria-hidden="true" />
        </div>
      </div>

      {/* Subtitle */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Re-edit Rate Over Time <span className="text-xs">(lower = better prompting)</span>
      </p>

      {/* Chart */}
      <div className="h-48">
        {periods.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            Not enough data for learning curve analysis
          </div>
        ) : periods.length < 2 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            Need at least 2 months of data to show trends
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--chart-grid, var(--color-gray-200))"
                vertical={false}
              />
              <XAxis
                dataKey="period"
                tick={{
                  fontSize: chartFontSize.axisTick,
                  fill: 'var(--chart-text, var(--color-gray-500))',
                }}
                tickLine={false}
                axisLine={{ stroke: 'var(--chart-axis, var(--color-gray-300))' }}
              />
              <YAxis
                domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.2 * 10) / 10]}
                tick={{
                  fontSize: chartFontSize.axisTick,
                  fill: 'var(--chart-text, var(--color-gray-500))',
                }}
                tickLine={false}
                axisLine={{ stroke: 'var(--chart-axis, var(--color-gray-300))' }}
                tickFormatter={(value) => value.toFixed(1)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--tooltip-bg, #fff)',
                  border: '1px solid var(--tooltip-border, var(--color-gray-200))',
                  borderRadius: '8px',
                  fontSize: chartFontSize.tooltip,
                }}
                formatter={(value) => [(value as number).toFixed(2), 'Re-edit Rate']}
                labelFormatter={(label) => {
                  const point = chartData.find((d) => d.period === label)
                  return point?.fullPeriod || label
                }}
              />

              {/* Reference line for current average */}
              <ReferenceLine
                y={currentAvg}
                stroke="var(--color-blue-500)"
                strokeDasharray="5 5"
                label={{
                  value: `Avg: ${currentAvg.toFixed(2)}`,
                  position: 'right',
                  fill: 'var(--color-blue-500)',
                  fontSize: chartFontSize.annotation,
                }}
              />

              <Bar
                dataKey="reeditRate"
                name="Re-edit Rate"
                radius={[4, 4, 0, 0]}
                fill="var(--color-green-500)"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Insight */}
      {periods.length >= 2 && <InsightLine insight={insight} className="mt-4" />}
    </div>
  )
}

/**
 * Format period string for display.
 * Converts "2026-01" to "Jan", "2026-02" to "Feb", etc.
 * Returns the original string if parsing fails.
 */
function formatPeriod(period: string): string {
  const parts = period.split('-')
  if (parts.length < 2) return period

  const year = Number.parseInt(parts[0], 10)
  const month = Number.parseInt(parts[1], 10)

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return period
  }

  const date = new Date(year, month - 1)
  return date.toLocaleDateString('en-US', { month: 'short' })
}
