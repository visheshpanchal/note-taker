import './TagPill.css'
import type { Tag } from '../../types'

interface TagPillProps {
  tag: Tag
  onRemove?: () => void
  onClick?: () => void
  small?: boolean
}

export function TagPill({ tag, onRemove, onClick, small }: TagPillProps) {
  return (
    <span
      className={`tag-pill ${small ? 'tag-pill--small' : ''} ${onClick ? 'tag-pill--clickable' : ''}`}
      style={{ '--tag-color': tag.color || '#8e8e93' } as React.CSSProperties}
      onClick={onClick}
    >
      <span className="tag-pill__dot" />
      <span className="tag-pill__name">{tag.name}</span>
      {onRemove && (
        <button className="tag-pill__remove" onClick={e => { e.stopPropagation(); onRemove() }}>×</button>
      )}
    </span>
  )
}
