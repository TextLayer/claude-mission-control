import type { IDockviewPanelProps } from 'dockview-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { LiveContextData } from '../../hooks/use-context-percent'
import type { SessionOwnership } from '@claude-view/shared/types/generated/SessionOwnership'
import { CliTerminal } from '../cli-terminal/CliTerminal'
import { ChatSession } from '../../pages/ChatSession'

interface ChatPanelParams {
  sessionId: string
  ownership?: SessionOwnership | null
  liveProjectPath?: string
  liveContextData?: LiveContextData
  /** Tmux session ID — when set, renders xterm terminal. */
  tmuxSessionId?: string
}

/**
 * Thin dockview wrapper — delegates all rendering to ChatSession (V1).
 * The V2 revamp is architectural (direct TCP, multi-session dockview),
 * not a UI rewrite. ChatSession owns all rich rendering, scroll anchoring,
 * permission handling, model selection, and command palette.
 */
export function ChatPanel({ params, api }: IDockviewPanelProps<ChatPanelParams>) {
  const { sessionId, ownership, liveProjectPath, liveContextData, tmuxSessionId } = params
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Focus the chat textarea when this panel becomes active (tab switch, sidebar click).
  // Uses dockview's PanelApi.onDidActiveChange — fires when tab is selected.
  useEffect(() => {
    const focus = () => {
      requestAnimationFrame(() => {
        const textarea = containerRef.current?.querySelector<HTMLTextAreaElement>(
          '[data-testid="chat-input"]',
        )
        if (textarea && !textarea.disabled) textarea.focus()
      })
    }

    // Focus on initial mount if this panel is already active
    if (api.isActive) focus()

    // Focus on subsequent tab switches
    const disposable = api.onDidActiveChange((event) => {
      if (event.isActive) focus()
    })
    return () => disposable.dispose()
  }, [api])

  // Scroll-to-bottom signal: incremented when dockview moves this panel
  // to a different group (drag-drop). The DOM is reparented without a React
  // remount — scrollTop resets to 0 but no lifecycle fires. This counter
  // propagates through ChatSession → ConversationThread to trigger scroll.
  const [scrollSignal, setScrollSignal] = useState(0)
  useEffect(() => {
    const disposable = api.onDidGroupChange(() => {
      setScrollSignal((n) => n + 1)
    })
    return () => disposable.dispose()
  }, [api])

  // Called when the FSM's panel session id diverges from this panel's prop:
  // a watched CLI session is TAKEN OVER (forked) into a new SDK session id.
  // Point this dockview panel + the router URL at the new id. The original
  // CLI session stays in the live list (sidebar) and keeps streaming.
  const onSessionCreated = useCallback(
    (newSessionId: string) => {
      api.updateParameters({ sessionId: newSessionId })
      api.setTitle(newSessionId.slice(0, 8))
      navigate(`/chat/${newSessionId}`)
    },
    [api, navigate],
  )

  // Tmux-owned session with resolved tmuxSessionId → render xterm terminal.
  // React handles the swap when ownership arrives via SSE param update.
  if (tmuxSessionId) {
    return (
      <div ref={containerRef} className="flex flex-col h-full min-w-0 overflow-hidden">
        <CliTerminal tmuxSessionId={tmuxSessionId} className="h-full" />
      </div>
    )
  }

  // No session → nothing to show. Mission Control doesn't start sessions; a
  // blank panel (e.g. restored from an older saved layout) just asks the user
  // to pick one instead of rendering a composer that would create a session.
  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-full px-4">
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Select a session from the sidebar.
        </p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex flex-col h-full min-w-0 overflow-hidden">
      <ChatSession
        sessionId={sessionId}
        ownership={ownership ?? null}
        liveProjectPath={liveProjectPath}
        liveContextData={liveContextData}
        onSessionCreated={onSessionCreated}
        scrollToBottomSignal={scrollSignal}
      />
    </div>
  )
}
