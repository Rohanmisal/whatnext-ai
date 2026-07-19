type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }

function parseBlocks(content: string): Block[] {
  const lines = content.split('\n')
  const blocks: Block[] = []
  let paragraph: string[] = []
  let list: string[] = []

  const flushParagraph = () => {
    const text = paragraph.join(' ').trim()
    if (text) blocks.push({ type: 'paragraph', text })
    paragraph = []
  }

  const flushList = () => {
    if (list.length) blocks.push({ type: 'list', items: [...list] })
    list = []
  }

  for (const raw of lines) {
    const line = raw.trim()
    const isBullet = /^[-*•]\s+/.test(line) || /^\d+\.\s+/.test(line)

    if (!line) {
      flushList()
      flushParagraph()
      continue
    }

    if (isBullet) {
      flushParagraph()
      list.push(line.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, ''))
      continue
    }

    flushList()
    paragraph.push(line)
  }

  flushList()
  flushParagraph()
  return blocks
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-medium text-primary-container">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={index}>{part}</span>
  })
}

export default function ChatMessageContent({ content }: { content: string }) {
  const blocks = parseBlocks(content)

  if (!blocks.length) {
    return <p className="font-light text-on-surface-variant">{content}</p>
  }

  return (
    <div className="space-y-2.5">
      {blocks.map((block, index) => {
        if (block.type === 'paragraph') {
          return (
            <p key={index} className="font-light leading-relaxed text-on-surface-variant">
              {renderInline(block.text)}
            </p>
          )
        }

        return (
          <ul key={index} className="space-y-0">
            {block.items.map((item, itemIndex) => (
              <li
                key={itemIndex}
                className="relative border-b border-white/[0.06] py-2 pl-4 text-[13px] font-light leading-relaxed text-on-surface-variant last:border-b-0"
              >
                <span className="absolute left-0 top-2.5 text-lg leading-none text-primary-container">
                  ·
                </span>
                {renderInline(item)}
              </li>
            ))}
          </ul>
        )
      })}
    </div>
  )
}
