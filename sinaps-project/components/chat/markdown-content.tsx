import React from 'react'

interface MarkdownContentProps {
  content: string
  className?: string
}

export function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  if (!content) return null

  // Split content into lines to handle blocks (lists, paragraphs)
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let currentList: string[] = []

  function renderInline(text: string): React.ReactNode[] {
    if (!text) return []

    // Safe split matching **bold** or `code` without any while-loop
    const tokens = text.split(/(\*\*.*?\*\*|`[^`]+`)/g)

    return tokens.map((token, index) => {
      if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
        return (
          <strong key={index} className="font-semibold text-foreground">
            {token.slice(2, -2)}
          </strong>
        )
      }
      if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
        return (
          <code
            key={index}
            className="rounded bg-muted/80 px-1.5 py-0.5 font-mono text-xs font-medium text-primary"
          >
            {token.slice(1, -1)}
          </code>
        )
      }
      return token
    })
  }

  function flushList() {
    if (currentList.length > 0) {
      const listKey = `list-${elements.length}`
      elements.push(
        <ul key={listKey} className="my-1.5 space-y-1 pl-1">
          {currentList.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm leading-relaxed">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/70" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      )
      currentList = []
    }
  }

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim()

    // Bullet point
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      currentList.push(trimmed.replace(/^(\*|-|•)\s+/, ''))
      return
    }

    flushList()

    if (!trimmed) {
      // Empty line = paragraph gap
      return
    }

    const pKey = `p-${lineIndex}`
    elements.push(
      <p key={pKey} className="text-sm leading-relaxed">
        {renderInline(trimmed)}
      </p>
    )
  })

  flushList()

  return <div className={`space-y-2 ${className}`}>{elements}</div>
}
