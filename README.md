<div align="center">

# TextLayer Mission Control

**Mission Control for Claude Code, by [TextLayer](https://www.textlayer.ai)**

<p>
  <a href="https://github.com/TextLayer/claude-mission-control/releases/latest"><img src="https://img.shields.io/github/v/release/TextLayer/claude-mission-control?label=release" alt="Latest release"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/Platform-macOS%20%7C%20Linux-lightgrey.svg" alt="macOS and Linux">
</p>

```bash
curl -fsSL https://github.com/TextLayer/claude-mission-control/releases/latest/download/install.sh | sh
```

</div>

---

## What Is Mission Control?

Mission Control is a local dashboard for every Claude Code session on your machine: live agents, past conversations, costs, sub-agents, hooks and tool calls, in one place. You keep starting sessions wherever you do today (terminal, IDE, Agent SDK); Mission Control watches them. It's a Rust server with a React web app, installed from this repo's GitHub Releases, and nothing it reads leaves your machine.

It's TextLayer's fork of [claude-view](https://github.com/tombelieber/claude-view) by Tom Tang (MIT).

---

## Live Monitor

See every running session at a glance. No more terminal tab-switching.

| Feature | What it does |
|---------|-------------|
| **Session cards** | Each card shows the last message, model, cost, and status — instantly know what every agent is working on |
| **Multi-session chat** | Open sessions side-by-side in VS Code-style tabs (dockview). Drag to split horizontally or vertically |
| **Context gauge** | Real-time context window fill per session — see which agents are in the danger zone before they hit the limit |
| **Cache countdown** | Know exactly when prompt cache expires so you can time messages to save tokens |
| **Cost tracking** | Per-session and aggregate spend with token breakdown — hover for input/output/cache split by model |
| **Sub-agent tree** | See the full tree of spawned agents, their status, costs, and what tools they're calling |
| **Notification sounds** | Get pinged when a session finishes, errors, or needs your input — stop polling terminals |
| **Multiple views** | Grid, List, Kanban, Monitor, or Harness mode — pick what fits your workflow |
| **Kanban swimlanes** | Group sessions by project or branch — visual swimlane layout for multi-project workflows |
| **Recently closed** | Sessions that end appear in "Recently Closed" instead of vanishing — persists across server restarts |
| **Queued messages** | Messages waiting in the queue show as pending bubbles with a "Queued" badge |
| **SSE-driven** | All live data pushed via Server-Sent Events — eliminates stale-cache risks entirely |

---

## Chat & Conversation

Read, search, and interact with any session — live or historical.

| Feature | What it does |
|---------|-------------|
| **Unified live chat** | History and real-time messages in a single scrollable conversation — no tab-switching |
| **Developer mode** | Toggle between Chat and Developer views per session. Developer mode shows tool cards, event cards, hook metadata, and the full execution trace with filter chips |
| **Full conversation browser** | Every session, every message, fully rendered with markdown and code blocks |
| **Tool call visualization** | See file reads, edits, bash commands, MCP calls, skill invocations — not just text |
| **Compact / verbose toggle** | Skim the conversation or drill into every tool call |
| **Thread view** | Follow agent conversations with sub-agent hierarchies and indented threading |
| **Hook events inline** | Pre/post tool hooks rendered as conversation blocks — see hooks firing alongside the conversation |
| **Export** | Markdown export for context resumption or sharing |
| **Bulk select & archive** | Select multiple sessions for batch archiving with persistent filter state |

---

## Agent Internals

Claude Code does a lot behind `"thinking..."` that never shows in your terminal. Mission Control exposes all of it.

| Feature | What it does |
|---------|-------------|
| **Sub-agent conversations** | Full tree of spawned agents, their prompts, outputs, and per-agent cost/token breakdown |
| **MCP server calls** | Which MCP tools are being invoked and their results |
| **Skill / hook / plugin tracking** | Which skills fired, which hooks ran, what plugins are active |
| **Hook event recording** | Dual-channel hook capture (live WebSocket + JSONL backfill) — every event recorded and browsable, even for past sessions |
| **Session source badges** | Each session shows how it was started: Terminal, VS Code, Agent SDK, or other entrypoints |
| **Worktree branch drift** | Detects when git worktree branches diverge — shown in live monitor and history |
| **@File mention chips** | `@filename` references extracted and shown as chips — hover for full path |
| **Tool use timeline** | Action log of every tool_use/tool_result pair with timing |
| **Error surfacing** | Errors bubble up to the session card — no buried failures |
| **Raw message inspector** | Drill into any message's raw JSON when you need the full picture |

---

## Search

| Feature | What it does |
|---------|-------------|
| **Rust grep search** | Search across all sessions — messages, tool calls, file paths. Powered by ripgrep-core over raw JSONL |
| **Filtered search engine** | SQLite pre-filter + grep search — one endpoint without maintaining a separate session search index |
| **Project & branch filters** | Scope to the project or branch you're working on right now |
| **Command palette** | <kbd>Cmd</kbd>+<kbd>K</kbd> to jump between sessions, switch views, find anything |

---

## Analytics

A full analytics suite for your Claude Code usage. Think Cursor's dashboard, but deeper.

<details>
<summary><strong>Dashboard</strong></summary>
<br>

| Feature | Description |
|---------|-------------|
| **Week-over-week metrics** | Session count, token usage, cost — compared to your previous period |
| **Activity heatmap** | 90-day GitHub-style grid showing daily usage intensity |
| **Top skills / commands / MCP tools / agents** | Leaderboards of your most-used invocables — click any to search matching sessions |
| **Most active projects** | Bar chart of projects ranked by session count |
| **Tool usage breakdown** | Total edits, reads, and bash commands across all sessions |
| **Longest sessions** | Quick access to your marathon sessions with duration |

</details>

<details>
<summary><strong>AI Contributions</strong></summary>
<br>

| Feature | Description |
|---------|-------------|
| **Code output tracking** | Lines added/removed, files touched, commit count — across all sessions |
| **Cost ROI metrics** | Cost per commit, cost per session, cost per line of AI output — with trend charts |
| **Model comparison** | Side-by-side breakdown of output and efficiency by model (Opus, Sonnet, Haiku) |
| **Learning curve** | Re-edit rate over time — see yourself getting better at prompting |
| **Branch breakdown** | Collapsible per-branch view with session drill-down |
| **Skill effectiveness** | Which skills actually improve your output vs which don't |

</details>

<details>
<summary><strong>Insights</strong> <em>(experimental)</em></summary>
<br>

| Feature | Description |
|---------|-------------|
| **Pattern detection** | Behavioral patterns discovered from your session history |
| **Then vs Now benchmarks** | Compare your first month to recent usage |
| **Category breakdown** | Treemap of what you use Claude for — refactoring, features, debugging, etc. |
| **AI Fluency Score** | Single 0-100 number tracking your overall effectiveness |

> Insights and Fluency Score are experimental. Treat as directional, not definitive.

</details>

---

## Plans, Prompts & Teams

| Feature | What it does |
|---------|-------------|
| **Plan browser** | View your `.claude/plans/` directly in session detail — no more hunting through files |
| **Prompt history** | Full-text search across all prompts you've sent with template clustering and intent classification |
| **Teams dashboard** | See team leads, inbox messages, team tasks, and file changes across all team members |
| **Prompt analytics** | Leaderboards of prompt templates, intent distribution, and usage statistics |

---

## System Monitor

| Feature | What it does |
|---------|-------------|
| **Live CPU / RAM / Disk gauges** | Real-time system metrics streaming via SSE with smooth animated transitions |
| **Component dashboard** | See sidecar and on-device AI metrics: VRAM usage, CPU, RAM, and session count per component |
| **Process list** | Processes grouped by name, sorted by CPU — see what your machine is actually doing while agents run |

---

## On-Device AI

Run a local LLM for session phase classification — no API calls, no extra cost.

| Feature | What it does |
|---------|-------------|
| **Provider-agnostic** | Connect to any OpenAI-compatible endpoint — oMLX, Ollama, LM Studio, or your own server |
| **Model selector** | Choose from a curated model registry with RAM requirements shown |
| **Phase classification** | Sessions tagged with their current phase (coding, debugging, planning, etc.) using confidence-gated display |
| **Smart resource management** | EMA-stabilized classification with exponential backoff — 93% GPU waste reduction vs naive polling |

---

## Workflows

| Feature | What it does |
|---------|-------------|
| **Workflow builder** | Create multi-stage workflows with VS Code-style layout, Mermaid diagram preview, and YAML editor |
| **Streaming LLM chat rail** | Generate workflow definitions in real time via embedded chat |
| **Stage runner** | Visualize stage columns, attempt cards, and progress bar as your workflow executes |
| **Built-in seed workflows** | Plan Polisher and Plan Executor ship out of the box |

---

## Open in IDE

| Feature | What it does |
|---------|-------------|
| **One-click file open** | Files referenced in sessions open directly in your editor |
| **Auto-detects your editor** | VS Code, Cursor, Zed, and others — no configuration needed |
| **Everywhere it matters** | Button appears in Changes tab, file headers, and Kanban project headers |
| **Preference memory** | Your preferred editor is remembered across sessions |

---

## How It's Built

| | |
|---|---|
| **Fast** | Rust backend with SIMD-accelerated JSONL parsing, memory-mapped I/O — indexes thousands of sessions in seconds |
| **Real-time** | File watcher + SSE + multiplexed WebSocket with heartbeat, event replay, and crash recovery |
| **Tiny** | ~10 MB download, ~27 MB on disk. No runtime dependencies, no background daemons |
| **Local-first** | Your sessions, code & prompts never leave your machine. No analytics, no accounts |
| **Zero config** | One install command and you're done. No API keys, no setup, no accounts |
| **FSM-driven** | Chat sessions run on a finite state machine with explicit phases and typed events — deterministic, race-free |

<details>
<summary><strong>The Numbers</strong></summary>
<br>

Measured on an M-series Mac with 1,493 sessions across 26 projects:

| Metric | Mission Control | Typical Electron dashboard |
|--------|:-----------:|:--------------------------:|
| **Download** | **~10 MB** | 150-300 MB |
| **On disk** | **~27 MB** | 300-500 MB |
| **Startup** | **< 500 ms** | 3-8 s |
| **RAM (full index)** | **~50 MB** | 300-800 MB |
| **Index 1,500 sessions** | **< 1 s** | N/A |
| **Runtime deps** | **0** | Node.js + Chromium |

Key techniques: SIMD pre-filter (`memchr`), memory-mapped JSONL parsing, ripgrep-core search over raw JSONL, zero-copy slices from mmap through parse to response.

</details>

---

## Privacy

Mission Control is local-only. **Your sessions, code, prompts, file paths and project names never leave your machine.**

Release builds are made with `./scripts/release.sh`, which compiles in no analytics key and no sign-in, share or mobile-relay servers, so there is no code path that sends usage data anywhere. (Upstream claude-view's official builds send anonymous analytics; ours don't.)

---

## Installation

**Requirements:** macOS or Linux, and [Claude Code](https://docs.anthropic.com/en/docs/claude-code). [Node.js](https://nodejs.org) is only needed to resume or take over sessions from the dashboard.

### One-line install (recommended)

```bash
curl -fsSL https://github.com/TextLayer/claude-mission-control/releases/latest/download/install.sh | sh
```

The installer downloads the build for your platform from the [latest release](https://github.com/TextLayer/claude-mission-control/releases/latest), checks it against the release's `checksums.txt`, installs it to `~/.mission-control/bin`, and adds that to your PATH. Then run:

```bash
mission-control
```

The dashboard opens at [http://localhost:47892](http://localhost:47892).

| Env variable | Default | Description |
|-------------|---------|-------------|
| `MISSION_CONTROL_VERSION` | latest | Install a specific version, e.g. `1.0.0` |
| `MISSION_CONTROL_INSTALL_DIR` | `~/.mission-control` | Install somewhere else |

### Manual download

1. Download `mission-control-<platform>.tar.gz` for your machine from the [Releases page](https://github.com/TextLayer/claude-mission-control/releases): `darwin-arm64` (Apple Silicon Mac), `darwin-x64` (Intel Mac), `linux-x64` or `linux-arm64`.
2. Unpack it into a folder and run `./mission-control` from that folder. Keep the `dist/` and `sidecar/` folders next to the binary.
3. **macOS:** the builds aren't signed by Apple, so a browser download is blocked on first run. Clear the quarantine flag first:

   ```bash
   xattr -dr com.apple.quarantine <folder>
   ```

### Update and uninstall

- **Update:** run the install command again.
- **Uninstall:** run `mission-control cleanup` (removes the hooks it added to Claude Code), then delete `~/.mission-control` and the `# TextLayer Mission Control` PATH line from your shell profile. Your indexed data lives in `~/.claude-view`; delete that too to remove everything.

<details>
<summary><strong>Configuration</strong></summary>
<br>

| Env Variable | Default | Description |
|-------------|---------|-------------|
| `CLAUDE_VIEW_PORT` or `PORT` | `47892` | Override the default port |

</details>

<details>
<summary><strong>Enterprise / Sandbox Environments</strong></summary>
<br>

If your machine restricts writes (DataCloak, CrowdStrike, corporate DLP):

```bash
cp crates/server/.env.example .env
# Uncomment CLAUDE_VIEW_DATA_DIR
```

This keeps database, prompt index, cache, and lock files inside the repo. Set `CLAUDE_VIEW_SKIP_HOOKS=1` to skip hook registration in read-only environments.

</details>

---

## FAQ

<details>
<summary><strong>"Not signed in" banner showing even though I'm logged in</strong></summary>
<br>

Mission Control checks your Claude credentials by reading `~/.claude/.credentials.json` (with macOS Keychain fallback). Try these steps:

1. **Verify Claude CLI auth:** `claude auth status`
2. **Check credentials file:** `cat ~/.claude/.credentials.json` — should have a `claudeAiOauth` section with an `accessToken`
3. **Check macOS Keychain:** `security find-generic-password -s "Claude Code-credentials" -w`
4. **Check token expiry:** Look at `expiresAt` in the credentials JSON — if past, run `claude auth login`
5. **Check HOME:** `echo $HOME` — the server reads from `$HOME/.claude/.credentials.json`

If all checks pass and the banner persists, [open an issue](https://github.com/TextLayer/claude-mission-control/issues).

</details>

<details>
<summary><strong>What data does Mission Control access?</strong></summary>
<br>

Mission Control reads the JSONL session files that Claude Code writes to `~/.claude/projects/`. It indexes session metadata locally in SQLite and searches session text with rust grep over local JSONL files. **Nothing it reads leaves your machine**, and release builds send no analytics. See [Privacy](#privacy).

</details>

<details>
<summary><strong>Does it work with Claude Code in VS Code / Cursor / IDE extensions?</strong></summary>
<br>

Yes. Mission Control monitors all Claude Code sessions regardless of how they were started — terminal CLI, VS Code extension, Cursor, or Agent SDK. Each session shows a source badge (Terminal, VS Code, SDK) so you can filter by launch method.

</details>

---

## Support

Questions and bug reports: [GitHub issues](https://github.com/TextLayer/claude-mission-control/issues).

---

<details>
<summary><strong>Development</strong></summary>
<br>

Prerequisites: [Rust](https://rustup.rs/), [Bun](https://bun.sh/), `cargo install cargo-watch`

```bash
bun install        # Install all workspace dependencies
bun dev            # Start full-stack dev (Rust + Web + Sidecar with hot reload)
```

### Workspace Layout

| Path | Package | Purpose |
|------|---------|---------|
| `apps/web/` | `@claude-view/web` | React SPA (Vite) — main web frontend |
| `apps/share/` | `@claude-view/share` | Share viewer SPA — Cloudflare Pages |
| `apps/mobile/` | `@claude-view/mobile` | Expo native app |
| `apps/landing/` | `@claude-view/landing` | Astro 5 landing page (zero client-side JS) |
| `packages/shared/` | `@claude-view/shared` | Shared types & theme tokens |
| `packages/design-tokens/` | `@claude-view/design-tokens` | Colors, spacing, typography |
| `crates/` | — | Rust backend (Axum) |
| `sidecar/` | — | Node.js sidecar (Agent SDK bridge) |
| `infra/share-worker/` | — | Cloudflare Worker — share API (R2 + D1) |

### Dev Commands

| Command | Description |
|---------|-------------|
| `bun dev` | Full-stack dev — Rust + Web + Sidecar with hot reload |
| `bun run dev:web` | Web frontend only |
| `bun run dev:server` | Rust backend only |
| `bun run build` | Build all workspaces |
| `bun run lint:all` | Lint JS/TS + Rust (Clippy) |
| `bun run typecheck` | TypeScript type checking |
| `bun run test` | Run all tests (Turbo) |
| `bun run test:rust` | Run Rust tests |
| `bun run storybook` | Launch Storybook for component development |
| `bun run release:dry-run` | Build and verify the release downloads without publishing |

### Releasing

There's no CI pipeline: releases are built on a Mac and published to GitHub Releases with the [GitHub CLI](https://cli.github.com) (`gh auth login` first). Linux builds run in Docker, so start Docker Desktop first.

```bash
./scripts/release.sh --dry-run   # build + verify all four downloads, publish nothing
./scripts/release.sh             # release the version already in Cargo.toml
./scripts/release.sh patch       # bump (patch | minor | major | X.Y.Z), commit, then release
```

The script runs `./scripts/ci-local.sh`, builds `mission-control-<platform>.tar.gz` for each platform plus `checksums.txt`, then asks before it pushes `main` and the tag and creates the release with `install.sh` attached. Pass `--platforms darwin-arm64,darwin-x64` to skip the Linux builds.

</details>

---

## Platform Support

| Platform | Download |
|----------|----------|
| macOS (Apple Silicon) | `mission-control-darwin-arm64.tar.gz` |
| macOS (Intel) | `mission-control-darwin-x64.tar.gz` |
| Linux (x64) | `mission-control-linux-x64.tar.gz` |
| Linux (arm64) | `mission-control-linux-arm64.tar.gz` |
| Windows | Not supported |

---

## Credits

Mission Control is built on [claude-view](https://github.com/tombelieber/claude-view) by Tom Tang, released under the [MIT License](./LICENSE).
