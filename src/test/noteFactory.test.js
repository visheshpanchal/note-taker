import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createNote,
  createTodo,
  createTodoItem,
  createTag,
  createNotebook,
  createCategory,
  createDiagram,
  createDayPlan,
  createDefaultTemplate,
  createFocusTemplate,
  createDefaultData,
} from '../utils/noteFactory.js'

// Stable UUIDs for assertions
vi.mock('uuid', () => ({ v4: () => 'test-uuid' }))
vi.mock('../utils/location.js', () => ({ getLocationTag: () => 'America/New_York' }))

describe('createNote', () => {
  it('returns a note with default shape', () => {
    const note = createNote()
    expect(note.type).toBe('note')
    expect(note.title).toBe('Untitled Note')
    expect(note.content).toBe('')
    expect(note.isPinned).toBe(false)
    expect(note.isFavorite).toBe(false)
    expect(note.tagIds).toEqual([])
    expect(note.attachments).toEqual([])
    expect(note.locationTag).toBe('America/New_York')
  })

  it('applies overrides', () => {
    const note = createNote({ title: 'My Note', isPinned: true })
    expect(note.title).toBe('My Note')
    expect(note.isPinned).toBe(true)
  })

  it('has a valid ISO createdAt / updatedAt', () => {
    const note = createNote()
    expect(() => new Date(note.createdAt)).not.toThrow()
    expect(note.createdAt).toEqual(note.updatedAt)
  })
})

describe('createTodo', () => {
  it('returns a todo with default shape', () => {
    const todo = createTodo()
    expect(todo.type).toBe('todo')
    expect(todo.title).toBe('Untitled Todo')
    expect(todo.items).toEqual([])
    expect(todo.reminderAt).toBeNull()
    expect(todo.reminderNotified).toBe(false)
  })

  it('applies overrides', () => {
    const todo = createTodo({ title: 'Shopping', reminderAt: '2026-01-01T09:00:00Z' })
    expect(todo.title).toBe('Shopping')
    expect(todo.reminderAt).toBe('2026-01-01T09:00:00Z')
  })
})

describe('createTodoItem', () => {
  it('returns an unchecked item with zero timer', () => {
    const item = createTodoItem()
    expect(item.text).toBe('')
    expect(item.checked).toBe(false)
    expect(item.timerSeconds).toBe(0)
    expect(item.timerRemaining).toBe(0)
    expect(item.timerRunning).toBe(false)
  })

  it('applies overrides', () => {
    const item = createTodoItem({ text: 'Buy milk', checked: true })
    expect(item.text).toBe('Buy milk')
    expect(item.checked).toBe(true)
  })
})

describe('createTag', () => {
  it('creates a tag with provided name and color', () => {
    const tag = createTag('work', '#ff0000')
    expect(tag.name).toBe('work')
    expect(tag.color).toBe('#ff0000')
    expect(tag.id).toBe('test-uuid')
  })

  it('assigns a random color when none provided', () => {
    const tag = createTag('personal')
    expect(tag.color).toMatch(/^#[0-9a-f]{6}$/i)
  })
})

describe('createNotebook', () => {
  it('creates a notebook with default icon', () => {
    const nb = createNotebook('Work')
    expect(nb.name).toBe('Work')
    expect(nb.icon).toBe('📁')
    expect(nb.id).toBe('test-uuid')
  })

  it('accepts custom icon', () => {
    const nb = createNotebook('Dev', '💻')
    expect(nb.icon).toBe('💻')
  })
})

describe('createCategory', () => {
  it('creates a category with defaults', () => {
    const cat = createCategory('Home')
    expect(cat.label).toBe('Home')
    expect(cat.icon).toBe('📌')
    expect(cat.color).toBe('#6366f1')
    expect(cat.isBuiltIn).toBe(false)
  })
})

describe('createDiagram', () => {
  it('returns a diagram with default shape', () => {
    const d = createDiagram()
    expect(d.type).toBe('diagram')
    expect(d.title).toBe('Untitled Diagram')
    expect(d.diagramData).toBeNull()
  })
})

describe('createDayPlan', () => {
  const template = createDefaultTemplate()

  it('creates a day plan for a given date', () => {
    const plan = createDayPlan(template, '2026-03-15')
    expect(plan.type).toBe('dayplan')
    expect(plan.date).toBe('2026-03-15')
    expect(plan.templateId).toBe(template.id)
    expect(plan.templateName).toBe(template.name)
    expect(plan.sections).toHaveLength(template.sections.length)
    expect(plan.mood).toBeNull()
    expect(plan.reminderAt).toBeNull()
  })

  it('instantiates text sections with empty content', () => {
    const plan = createDayPlan(template, '2026-03-15')
    const textSection = plan.sections.find(s => s.type === 'text')
    expect(textSection).toBeDefined()
    expect(textSection.content).toBe('')
  })

  it('instantiates priorities sections with correct item count', () => {
    const plan = createDayPlan(template, '2026-03-15')
    const priorities = plan.sections.find(s => s.type === 'priorities')
    expect(priorities.items).toHaveLength(3)
    priorities.items.forEach((item, i) => {
      expect(item.priority).toBe(i + 1)
      expect(item.done).toBe(false)
    })
  })

  it('instantiates checklist sections from defaultItems', () => {
    const plan = createDayPlan(template, '2026-03-15')
    const checklist = plan.sections.find(s => s.type === 'checklist')
    expect(checklist.items.length).toBeGreaterThan(0)
    checklist.items.forEach(item => expect(item.done).toBe(false))
  })

  it('instantiates timeblock sections with time slots', () => {
    const plan = createDayPlan(template, '2026-03-15')
    const timeblocks = plan.sections.find(s => s.type === 'timeblocks')
    expect(timeblocks.items.length).toBeGreaterThan(0)
    timeblocks.items.forEach(slot => {
      expect(slot.time).toMatch(/^\d{2}:\d{2}$/)
      expect(slot.done).toBe(false)
    })
  })

  it('accepts a Date object as the date parameter', () => {
    const plan = createDayPlan(template, new Date('2026-05-01'))
    expect(plan.date).toBe('2026-05-01')
  })
})

describe('createDefaultTemplate', () => {
  it('returns a valid built-in template', () => {
    const t = createDefaultTemplate()
    expect(t.isBuiltIn).toBe(true)
    expect(t.sections.length).toBeGreaterThan(0)
    expect(t.sections.every(s => s.key && s.type)).toBe(true)
  })
})

describe('createFocusTemplate', () => {
  it('returns a valid built-in template', () => {
    const t = createFocusTemplate()
    expect(t.isBuiltIn).toBe(true)
    expect(t.sections.length).toBeGreaterThan(0)
  })
})

describe('createDefaultData', () => {
  it('returns the default data scaffold with empty collections', () => {
    const d = createDefaultData('/some/path')
    expect(d.version).toBe(1)
    expect(d.notes).toEqual([])
    expect(d.tags).toEqual([])
    expect(d.notebooks).toEqual([])
    expect(d.categories).toEqual([])
    expect(d.templates).toEqual([])
    expect(d.settings.storageLocation).toBe('/some/path')
  })
})
