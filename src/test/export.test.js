import { describe, it, expect, vi, afterEach } from 'vitest'
import { htmlToMarkdown, downloadFile } from '../utils/export.js'

describe('htmlToMarkdown', () => {
  it('returns empty string for falsy input', () => {
    expect(htmlToMarkdown('')).toBe('')
    expect(htmlToMarkdown(null)).toBe('')
    expect(htmlToMarkdown(undefined)).toBe('')
  })

  it('converts headings', () => {
    expect(htmlToMarkdown('<h1>Hello</h1>')).toBe('# Hello')
    expect(htmlToMarkdown('<h2>World</h2>')).toBe('## World')
    expect(htmlToMarkdown('<h3>Sub</h3>')).toBe('### Sub')
  })

  it('converts bold and italic', () => {
    expect(htmlToMarkdown('<strong>bold</strong>')).toBe('**bold**')
    expect(htmlToMarkdown('<b>bold</b>')).toBe('**bold**')
    expect(htmlToMarkdown('<em>italic</em>')).toBe('*italic*')
    expect(htmlToMarkdown('<i>italic</i>')).toBe('*italic*')
  })

  it('converts underline and strikethrough', () => {
    expect(htmlToMarkdown('<u>under</u>')).toBe('__under__')
    expect(htmlToMarkdown('<s>strike</s>')).toBe('~~strike~~')
    expect(htmlToMarkdown('<del>deleted</del>')).toBe('~~deleted~~')
  })

  it('converts inline code and code blocks', () => {
    expect(htmlToMarkdown('<code>foo()</code>')).toBe('`foo()`')
    expect(htmlToMarkdown('<pre><code>block</code></pre>')).toBe('```\nblock\n```')
  })

  it('converts blockquote', () => {
    const result = htmlToMarkdown('<blockquote>quote</blockquote>')
    expect(result).toContain('> quote')
  })

  it('converts unordered list', () => {
    const result = htmlToMarkdown('<ul><li>Alpha</li><li>Beta</li></ul>')
    expect(result).toContain('- Alpha')
    expect(result).toContain('- Beta')
  })

  it('converts ordered list', () => {
    const result = htmlToMarkdown('<ol><li>First</li><li>Second</li></ol>')
    expect(result).toContain('1. First')
    expect(result).toContain('2. Second')
  })

  it('converts links', () => {
    expect(htmlToMarkdown('<a href="https://example.com">click</a>')).toBe('[click](https://example.com)')
  })

  it('converts images', () => {
    expect(htmlToMarkdown('<img src="img.png" alt="logo" />')).toBe('![logo](img.png)')
  })

  it('converts horizontal rule', () => {
    const result = htmlToMarkdown('<hr />')
    expect(result).toContain('---')
  })

  it('converts mark/highlight', () => {
    expect(htmlToMarkdown('<mark>highlighted</mark>')).toBe('==highlighted==')
  })

  it('converts a table', () => {
    const html = '<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>'
    const result = htmlToMarkdown(html)
    expect(result).toContain('| A | B |')
    expect(result).toContain('| --- |')
    expect(result).toContain('| 1 | 2 |')
  })

  it('collapses multiple blank lines', () => {
    const result = htmlToMarkdown('<p>a</p><p>b</p>')
    expect(result).not.toMatch(/\n{3,}/)
  })
})

describe('downloadFile', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates and clicks an anchor element with the correct filename', () => {
    const mockClick = vi.fn()
    const mockAnchor = { href: '', download: '', click: mockClick }
    vi.spyOn(document, 'createElement').mockReturnValueOnce(mockAnchor)

    const mockURL = 'blob:mock'
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => mockURL), revokeObjectURL: vi.fn() })

    downloadFile('test.md', '# Hello', 'text/markdown')

    expect(mockAnchor.download).toBe('test.md')
    expect(mockAnchor.href).toBe(mockURL)
    expect(mockClick).toHaveBeenCalledOnce()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockURL)
  })
})
