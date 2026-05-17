// ─── Domain types ────────────────────────────────────────────────────────────

export type NoteType = 'note' | 'todo' | 'dayplan' | 'diagram'
export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'
export type ThemeMode = 'light' | 'dark'
export type SectionType = 'text' | 'priorities' | 'checklist' | 'timeblocks'

export interface Tag {
  id: string
  name: string
  color: string
}

export interface Notebook {
  id: string
  name: string
  icon: string
  createdAt: string
}

export interface Folder {
  id: string
  name: string
  parentId: string | null
  icon: string
  createdAt: string
}

export interface Category {
  id: string
  label: string
  icon: string
  color: string
  isBuiltIn: boolean
}

export interface Attachment {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
}

export interface TodoItem {
  id: string
  text: string
  checked: boolean
  timerSeconds: number
  timerRemaining: number
  timerRunning: boolean
}

// ─── Section types ───────────────────────────────────────────────────────────

export interface PriorityItem {
  id: string
  text: string
  done: boolean
  priority: number
}

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

export interface TimeBlock {
  id: string
  time: string
  task: string
  category: string | null
  done: boolean
}

interface BaseSection {
  key: string
  label: string
  type: SectionType
  description: string
  collapsed: boolean
}

export interface TextSectionData extends BaseSection {
  type: 'text'
  content: string
}

export interface PrioritiesSectionData extends BaseSection {
  type: 'priorities'
  items: PriorityItem[]
}

export interface ChecklistSectionData extends BaseSection {
  type: 'checklist'
  items: ChecklistItem[]
}

export interface TimeBlockSectionData extends BaseSection {
  type: 'timeblocks'
  items: TimeBlock[]
}

export type AnySection =
  | TextSectionData
  | PrioritiesSectionData
  | ChecklistSectionData
  | TimeBlockSectionData

// ─── Template ────────────────────────────────────────────────────────────────

export interface SectionConfig {
  count?: number
  defaultItems?: string[]
  startTime?: string
  endTime?: string
  interval?: number
}

export interface TemplateSectionDef {
  key: string
  label: string
  type: SectionType
  description?: string
  config?: SectionConfig
}

export interface Template {
  id: string
  name: string
  isBuiltIn: boolean
  description: string
  color?: string
  sections: TemplateSectionDef[]
}

// ─── Notes ───────────────────────────────────────────────────────────────────

interface NoteExtras {
  tagIds: string[]
  notebookId: string | null
  folderId: string | null
  dueDate: string | null
  color: string | null
  isFavorite: boolean
  category: string | null
  attachments: Attachment[]
}

interface BaseNote extends NoteExtras {
  id: string
  title: string
  type: NoteType
  tags: string[]
  isPinned: boolean
  locationTag: string
  createdAt: string
  updatedAt: string
  metadata: Record<string, unknown>
  extensions: Record<string, unknown>
}

export interface Note extends BaseNote {
  type: 'note'
  content: string
}

export interface Todo extends BaseNote {
  type: 'todo'
  items: TodoItem[]
  reminderAt: string | null
  reminderNotified: boolean
}

export interface DayPlan extends BaseNote {
  type: 'dayplan'
  date: string
  templateId: string
  templateName: string
  sections: AnySection[]
  mood: null
  reminderAt: string | null
  reminderNotified: boolean
}

export interface Diagram extends BaseNote {
  type: 'diagram'
  diagramData: Record<string, unknown> | null
}

export type AnyNote = Note | Todo | DayPlan | Diagram

// ─── App data & settings ─────────────────────────────────────────────────────

export interface AppSettings {
  theme?: string
  storageLocation?: string
}

export interface AppData {
  $schema: string
  version: number
  settings: AppSettings
  notes: AnyNote[]
  templates: Template[]
  tags: Tag[]
  notebooks: Notebook[]
  folders: Folder[]
  categories: Category[]
  customFields: Record<string, unknown>
  metadata: { createdAt: string; lastModified: string }
}

export interface SystemInfo {
  storagePath: string
  notesFilePath?: string
  templatesPath?: string
  themesPath?: string
  timezone?: string
}

// ─── Theme ───────────────────────────────────────────────────────────────────

export interface Theme {
  id: string
  name: string
  mode: ThemeMode
  isBuiltIn: boolean
  description: string
  tokens: Record<string, string>
}

// ─── Electron API ─────────────────────────────────────────────────────────────

export interface ElectronAPI {
  data: {
    load: () => Promise<AppData | null>
    save: (data: AppData) => Promise<{ success: boolean }>
  }
  system: {
    getInfo: () => Promise<SystemInfo>
    pickFolder: () => Promise<string | null>
    openPath: (path: string) => Promise<void>
    moveData: (
      oldPath: string,
      newPath: string
    ) => Promise<{ success: boolean; data?: AppData; error?: string }>
  }
  templates: {
    load: (storagePath: string) => Promise<Template[]>
    save: (storagePath: string, template: Template) => Promise<void>
    delete: (storagePath: string, id: string) => Promise<void>
  }
  themes: {
    load: (storagePath: string) => Promise<Theme[]>
    save: (storagePath: string, theme: Theme) => Promise<void>
    delete: (storagePath: string, id: string) => Promise<void>
  }
  notifications?: {
    show: (opts: { title: string; body: string; noteId: string }) => void
  }
  attachments: {
    add: (
      noteId: string,
      filePaths: string[]
    ) => Promise<{ success: boolean; added: Attachment[] }>
    remove: (noteId: string, filename: string) => Promise<void>
    open: (noteId: string, filename: string) => void
    pickFiles: () => Promise<string[]>
  }
  onNoteFocus: (callback: (noteId: string) => void) => () => void
  onSystemThemeChange: (callback: (theme: ThemeMode) => void) => () => void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
