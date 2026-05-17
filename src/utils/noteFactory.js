import { v4 as uuidv4 } from 'uuid'
import { getLocationTag } from './location.js'

// ─── Shared extra fields on every note ─────────────────────────────────────
function noteExtras() {
  return {
    tagIds: [], notebookId: null, dueDate: null,
    color: null, isFavorite: false, category: null,
    attachments: []
  }
}

// ─── Note / Todo / DayPlan ──────────────────────────────────────────────────
export function createNote(overrides = {}) {
  const now = new Date().toISOString()
  return {
    id: uuidv4(), type: 'note', title: 'Untitled Note', content: '',
    tags: [], isPinned: false, locationTag: getLocationTag(),
    createdAt: now, updatedAt: now,
    metadata: {}, extensions: {},
    ...noteExtras(), ...overrides
  }
}

export function createTodo(overrides = {}) {
  const now = new Date().toISOString()
  return {
    id: uuidv4(), type: 'todo', title: 'Untitled Todo', items: [],
    tags: [], isPinned: false, locationTag: getLocationTag(),
    createdAt: now, updatedAt: now,
    reminderAt: null, reminderNotified: false,
    metadata: {}, extensions: {},
    ...noteExtras(), ...overrides
  }
}

export function createTodoItem(overrides = {}) {
  return {
    id: uuidv4(), text: '', checked: false,
    timerSeconds: 0, timerRemaining: 0, timerRunning: false,
    ...overrides
  }
}

// ─── Tag, Notebook & Category ────────────────────────────────────────────────
const TAG_COLORS = ['#ff3b30','#ff9500','#ffcc00','#34c759','#5ac8fa','#007aff','#af52de','#ff2d55','#8e8e93']

export function createTag(name, color) {
  return {
    id: uuidv4(),
    name,
    color: color ?? TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]
  }
}

export function createNotebook(name, icon = '📁') {
  return { id: uuidv4(), name, icon, createdAt: new Date().toISOString() }
}

export function createCategory(label, icon = '📌', color = '#6366f1') {
  return { id: uuidv4(), label, icon, color, isBuiltIn: false }
}

// ─── Day Plan ────────────────────────────────────────────────────────────────
function generateTimeSlots(startTime, endTime, intervalMinutes) {
  const slots = []
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  let cur = sh * 60 + sm
  const end = eh * 60 + em
  while (cur < end) {
    const h = Math.floor(cur / 60).toString().padStart(2, '0')
    const m = (cur % 60).toString().padStart(2, '0')
    slots.push({ id: uuidv4(), time: `${h}:${m}`, task: '', category: null, done: false })
    cur += intervalMinutes
  }
  return slots
}

function instantiateSection(def) {
  const base = { key: def.key, label: def.label, type: def.type, description: def.description || '', collapsed: false }
  switch (def.type) {
    case 'text':       return { ...base, content: '' }
    case 'priorities': {
      const count = def.config?.count ?? 3
      return { ...base, items: Array.from({ length: count }, (_, i) => ({ id: uuidv4(), text: '', done: false, priority: i + 1 })) }
    }
    case 'checklist': {
      const items = (def.config?.defaultItems ?? []).map(text => ({ id: uuidv4(), text, done: false }))
      return { ...base, items }
    }
    case 'timeblocks': {
      const { startTime = '08:00', endTime = '20:00', interval = 60 } = def.config ?? {}
      return { ...base, items: generateTimeSlots(startTime, endTime, interval) }
    }
    default: return { ...base, content: '' }
  }
}

export function createDiagram(overrides = {}) {
  const now = new Date().toISOString()
  return {
    id: uuidv4(), type: 'diagram', title: 'Untitled Diagram',
    diagramData: null,
    tags: [], isPinned: false, locationTag: getLocationTag(),
    createdAt: now, updatedAt: now,
    metadata: {}, extensions: {},
    ...noteExtras(), ...overrides
  }
}

export function createDayPlan(template, date = new Date()) {
  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0]
  const d = new Date(dateStr + 'T12:00:00')
  const dateLabel = d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const now = new Date().toISOString()
  return {
    id: uuidv4(), type: 'dayplan',
    title: `Day Plan — ${dateLabel}`,
    date: dateStr, templateId: template.id, templateName: template.name,
    sections: template.sections.map(instantiateSection),
    tags: [], isPinned: false, mood: null,
    locationTag: getLocationTag(),
    createdAt: now, updatedAt: now,
    reminderAt: null, reminderNotified: false,
    metadata: {}, extensions: {},
    ...noteExtras()
  }
}

// ─── Built-in templates ──────────────────────────────────────────────────────
export function createDefaultTemplate() {
  return {
    id: 'built-in-productive-day', name: 'Productive Day', isBuiltIn: true,
    description: 'A balanced daily planning template with priorities, schedule, and habit tracking.',
    color: '#007aff',
    sections: [
      { key: 'intentions', label: '🌅 Morning Intentions', type: 'text', description: 'What matters most today? How do you want to show up?', config: {} },
      { key: 'priorities',  label: '🎯 Top 3 Priorities',  type: 'priorities', description: 'The three most important things to accomplish today.', config: { count: 3 } },
      { key: 'schedule',    label: '📅 Schedule',          type: 'timeblocks', description: 'Block out your day hour by hour.', config: { startTime: '08:00', endTime: '21:00', interval: 60 } },
      { key: 'habits',      label: '✅ Daily Habits',      type: 'checklist',  description: 'Track your daily habits.', config: { defaultItems: ['Hydrate (8 glasses)','Exercise / Move','Meditate','Read (30 min)','No screens after 9 pm'] } },
      { key: 'notes',       label: '💡 Notes & Ideas',     type: 'text',       description: 'Capture thoughts and ideas.', config: {} },
      { key: 'review',      label: '🌙 Evening Review',    type: 'text',       description: 'What went well? What would you do differently?', config: {} }
    ]
  }
}

export function createFocusTemplate() {
  return {
    id: 'built-in-deep-focus', name: 'Deep Focus', isBuiltIn: true,
    description: 'Minimal template for deep work sessions with time blocks and one clear goal.',
    color: '#ff9500',
    sections: [
      { key: 'main_goal',  label: '🏆 Main Goal',            type: 'text',       description: 'The one thing that will make today a success.', config: {} },
      { key: 'schedule',   label: '⏱ Time Blocks',           type: 'timeblocks', description: 'Plan focused work blocks.', config: { startTime: '09:00', endTime: '18:00', interval: 90 } },
      { key: 'blockers',   label: '🚧 Blockers & Distractions', type: 'checklist', description: 'What might pull you off track.', config: { defaultItems: [] } },
      { key: 'wins',       label: '🎉 End-of-Day Wins',      type: 'priorities', description: 'What did you accomplish?', config: { count: 3 } }
    ]
  }
}

export function createDefaultData(storagePath = '') {
  return {
    $schema: 'https://json-schema.org/draft-07/schema',
    version: 1,
    settings: { theme: 'system', storageLocation: storagePath },
    notes: [], templates: [], tags: [], notebooks: [], categories: [],
    customFields: {},
    metadata: { createdAt: new Date().toISOString(), lastModified: new Date().toISOString() }
  }
}
