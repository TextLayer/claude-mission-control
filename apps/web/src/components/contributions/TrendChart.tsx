import { chartFontSize } from '@claude-view/design-tokens'
import { useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatNumber } from '../../lib/format-utils'
import { cn } from '../../lib/utils'
import type { DailyTrendPoint, Insight } from '../../types/generated'
import { InsightLine } from './InsightLine'

interface TrendChartProps {
  data: DailyTrendPoint[]
  insight?: Insight
}

type ChartMetric = 'lines' | 'commits' | 'sessions'

const METRIC_OPTIONS: { value: ChartMetric; label: string }[] = [
  { value: 'lines', label: 'Lines' },
  { value: 'commits', label: 'Commits' },
  { value: 'sessions', label: 'Sessions' },
]

/**
 * TrendChart displays contribution trends over time.
 */
export function TrendChart({ data, insight }: TrendChartProps) {
  const [metric, setMetric] = useState<ChartMetric>('lines')

  // Transform data for the selected metric
  const chartData = data.map((point) => ({
    date: formatDate(point.date),
    fullDate: point.date,
    linesAdded: point.linesAdded,
    linesRemoved: point.linesRemoved,
    net: point.linesAdded - point.linesRemoved,
    commits: point.commits,
    sessions: point.sessions,
  }))

  // Find max value for Y axis scaling
  const getMaxValue = () => {
    switch (metric) {
      case 'lines':
        return Math.max(...chartData.map((d) => Math.max(d.linesAdded, d.linesRemoved)))
      case 'commits':
        return Math.max(...chartData.map((d) => d.commits))
      case 'sessions':
        return Math.max(...chartData.map((d) => d.sessions))
    }
  }

  const maxValue = getMaxValue() || 1

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Contribution Trend
        </h2>

        {/* Metric Toggle */}
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {METRIC_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setMetric(option.value)}
              className={cn(
                'px-3 py-1 text-xs font-medium transition-colors cursor-pointer',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-inset',
                option.value === metric
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            No trend data available for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--chart-grid, var(--color-gray-200))"
              />
              <XAxis
                dataKey="date"
                tick={{
                  fontSize: chartFontSize.axisTick,
                  fill: 'var(--chart-text, var(--color-gray-500))',
                }}
                tickLine={false}
                axisLine={{ stroke: 'var(--chart-axis, var(--color-gray-300))' }}
                interval="preserveStartEnd"
                angle={data.length > 14 ? -35 : 0}
                textAnchor={data.length > 14 ? 'end' : 'middle'}
                height={data.length > 14 ? 50 : 30}
              />
              <YAxis
                domain={[0, Math.ceil(maxValue * 1.1)]}
                tick={{
                  fontSize: chartFontSize.axisTick,
                  fill: 'var(--chart-text, var(--color-gray-500))',
                }}
                tickLine={false}
                axisLine={{ stroke: 'var(--chart-axis, var(--color-gray-300))' }}
                tickFormatter={formatYAxisValue}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--tooltip-bg, #fff)',
                  border: '1px solid var(--tooltip-border, var(--color-gray-200))',
                  borderRadius: '8px',
                  fontSize: chartFontSize.tooltip,
                }}
                labelFormatter={(label) => {
                  const point = chartData.find((d) => d.date === label)
                  return point?.fullDate || label
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: chartFontSize.legend, paddingTop: '10px' }}
                iconType="line"
              />

              {metric === 'lines' && (
                <>
                  <Line
                    type="monotone"
                    dataKey="linesAdded"
                    name="Added"
                    stroke="var(--color-green-500)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="linesRemoved"
                    name="Removed"
                    stroke="var(--color-red-500)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    name="Net"
                    stroke="var(--color-blue-500)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 2 }}
                  />
                </>
              )}

              {metric === 'commits' && (
                <Line
                  type="monotone"
                  dataKey="commits"
                  name="Commits"
                  stroke="var(--color-violet-500)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              )}

              {metric === 'sessions' && (
                <Line
                  type="monotone"
                  dataKey="sessions"
                  name="Sessions"
                  stroke="var(--color-amber-500)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Insight */}
      {insight && <InsightLine insight={insight} className="mt-4" />}
    </div>
  )
}

/**
 * Format date for X axis — always includes weekday (e.g., "Mon Jan 13")
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' })
  const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${weekday} ${monthDay}`
}

function formatYAxisValue(value: number): string {
  return formatNumber(value)
}
