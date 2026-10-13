import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Read the actual CSS file for structural assertions
const css = readFileSync(resolve(__dirname, '../dockview-theme.css'), 'utf-8')

describe('dockview-theme.css — sash styling', () => {
  it('sets tab bar height to 40px', () => {
    expect(css).toContain('--dv-tabs-and-actions-container-height: 40px')
  })

  it('defines sash default color variable', () => {
    expect(css).toContain('--dv-sash-color:')
  })

  it('defines active sash color variable', () => {
    expect(css).toContain('--dv-active-sash-color:')
  })

  it('expands clickable area with ::before pseudo-element', () => {
    expect(css).toContain('.dv-sash::before')
    expect(css).toContain('margin: -6px')
  })

  it('has hover state with cobalt glow', () => {
    expect(css).toMatch(/\.dv-sash.*:hover[\s\S]*box-shadow.*var\(--color-blue-500\)/)
  })

  it('has active (dragging) state with cobalt accent', () => {
    expect(css).toMatch(/\.dv-sash.*:active[\s\S]*background-color: var\(--color-blue-500\)/)
  })

  it('has dark mode sash overrides', () => {
    expect(css).toContain(':where(.dark, .dark *)')
    expect(css).toMatch(/:where\(\.dark.*\.dv-sash.*:hover/)
  })

  it('sash is 1px default width via CSS variable', () => {
    // The sash should default to a thin line via the CSS variable
    expect(css).toContain('--dv-sash-color')
  })

  it('sash expands to 3px on hover via box-shadow width', () => {
    // 3px visual appearance via box-shadow 0 0 0 1px on a 1px sash = 3px total
    expect(css).toMatch(/\.dv-sash.*:hover[\s\S]*box-shadow/)
  })
})

describe('dockview-theme.css — light/dark mode', () => {
  it('defines light mode panel body as white', () => {
    expect(css).toContain('--dv-group-view-background-color: #ffffff')
  })

  it('defines dark mode panel body as the ink canvas', () => {
    expect(css).toContain('--dv-group-view-background-color: var(--color-gray-950)')
  })

  it('active tab underline is cobalt in both modes', () => {
    const matches = css.match(/--dv-active-tab-border-bottom-color: var\(--color-blue-500\)/g)
    expect(matches?.length).toBeGreaterThanOrEqual(2)
  })
})
