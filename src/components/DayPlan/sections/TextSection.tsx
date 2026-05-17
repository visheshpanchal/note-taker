import './Sections.css'
import type { TextSectionData } from '../../../types'

interface TextSectionProps {
  section: TextSectionData
  onUpdate: (patch: Partial<TextSectionData>) => void
}

export function TextSection({ section, onUpdate }: TextSectionProps) {
  return (
    <div className="text-section">
      {section.description && <p className="section-desc">{section.description}</p>}
      <textarea
        value={section.content ?? ''}
        onChange={e => onUpdate({ content: e.target.value })}
        placeholder={section.description || 'Write here…'}
        rows={4}
      />
    </div>
  )
}
