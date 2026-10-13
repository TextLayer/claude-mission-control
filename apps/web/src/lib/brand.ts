/**
 * Product identity for the TextLayer fork of claude-view.
 *
 * User-visible names and links live here so the brand is changed in one
 * place. The installed command is `mission-control` (installed under
 * `~/.mission-control/`), but the data directory `~/.claude-view/`,
 * `CLAUDE_VIEW_*` env vars and localStorage keys deliberately keep upstream's
 * names: renaming them would strand existing local data and make every
 * upstream merge conflict.
 */
export const PRODUCT_NAME = 'TextLayer Mission Control'

/** Short form for running text where "TextLayer" is already implied. */
export const PRODUCT_SHORT_NAME = 'Mission Control'

export const GITHUB_REPO = 'TextLayer/claude-mission-control'
export const GITHUB_URL = `https://github.com/${GITHUB_REPO}`
