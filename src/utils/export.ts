/** Converts TipTap HTML output to GitHub-flavoured Markdown */
export function htmlToMarkdown(html: string | null | undefined): string {
  if (!html) return ''
  const div = document.createElement('div')
  div.innerHTML = html

  function processNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ''

    const el = node as Element
    const tag = el.tagName?.toLowerCase()
    const children = () => Array.from(node.childNodes).map(processNode).join('')

    switch (tag) {
      case 'p':           return `\n${children()}\n`
      case 'br':          return '\n'
      case 'h1':          return `\n# ${children()}\n`
      case 'h2':          return `\n## ${children()}\n`
      case 'h3':          return `\n### ${children()}\n`
      case 'h4':          return `\n#### ${children()}\n`
      case 'strong':
      case 'b':           return `**${children()}**`
      case 'em':
      case 'i':           return `*${children()}*`
      case 'u':           return `__${children()}__`
      case 's':
      case 'del':
      case 'strike':      return `~~${children()}~~`
      case 'code': {
        const parent = el.parentElement?.tagName?.toLowerCase()
        if (parent === 'pre') return children()
        return `\`${children()}\``
      }
      case 'pre':         return `\n\`\`\`\n${children()}\n\`\`\`\n`
      case 'blockquote':  return `\n> ${children().trim().replace(/\n/g, '\n> ')}\n`
      case 'hr':          return `\n---\n`
      case 'ul': {
        const items = Array.from(el.querySelectorAll(':scope > li'))
        return '\n' + items.map(li => `- ${li.textContent?.trim()}`).join('\n') + '\n'
      }
      case 'ol': {
        const items = Array.from(el.querySelectorAll(':scope > li'))
        return '\n' + items.map((li, i) => `${i + 1}. ${li.textContent?.trim()}`).join('\n') + '\n'
      }
      case 'li': {
        const checkbox = el.querySelector('input[type="checkbox"]') as HTMLInputElement | null
        if (checkbox) return `- [${checkbox.checked ? 'x' : ' '}] ${node.textContent?.replace(/^\s*/, '').trim()}`
        return children()
      }
      case 'a': {
        const href = el.getAttribute('href') || ''
        return `[${children()}](${href})`
      }
      case 'img': {
        const src = el.getAttribute('src') || ''
        const alt = el.getAttribute('alt') || ''
        return `![${alt}](${src})`
      }
      case 'table': {
        const rows = Array.from(el.querySelectorAll('tr'))
        const md = rows.map((tr, i) => {
          const cells = Array.from(tr.querySelectorAll('th, td'))
            .map(cell => cell.textContent?.trim() ?? '')
          const row = `| ${cells.join(' | ')} |`
          if (i === 0) return row + '\n|' + cells.map(() => ' --- ').join('|') + '|'
          return row
        })
        return '\n' + md.join('\n') + '\n'
      }
      case 'mark':       return `==${children()}==`
      default:           return children()
    }
  }

  return Array.from(div.childNodes)
    .map(processNode)
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function downloadFile(filename: string, content: string, mimeType = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
