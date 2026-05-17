export const BUILT_IN_CATEGORIES = [
  { id: 'personal',  label: 'Personal',  icon: '🏠', color: '#3b82f6', isBuiltIn: true },
  { id: 'work',      label: 'Work',      icon: '💼', color: '#f59e0b', isBuiltIn: true },
  { id: 'study',     label: 'Study',     icon: '📚', color: '#8b5cf6', isBuiltIn: true },
  { id: 'health',    label: 'Health',    icon: '💪', color: '#10b981', isBuiltIn: true },
  { id: 'finance',   label: 'Finance',   icon: '💰', color: '#ef4444', isBuiltIn: true },
  { id: 'travel',    label: 'Travel',    icon: '✈️',  color: '#06b6d4', isBuiltIn: true },
  { id: 'ideas',     label: 'Ideas',     icon: '💡', color: '#eab308', isBuiltIn: true },
  { id: 'projects',  label: 'Projects',  icon: '🚀', color: '#ec4899', isBuiltIn: true },
]

export const CATEGORY_COLORS = [
  '#3b82f6', '#f59e0b', '#8b5cf6', '#10b981',
  '#ef4444', '#06b6d4', '#eab308', '#ec4899',
  '#f97316', '#14b8a6', '#84cc16', '#6366f1',
]

export function getCategoryById(id, allCategories = BUILT_IN_CATEGORIES) {
  return allCategories.find(c => c.id === id) ?? null
}
