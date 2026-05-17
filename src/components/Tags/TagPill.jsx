import './TagPill.css'

export function TagPill({ tag, onRemove, onClick, small }) {
  return (
    <span
      className={`tag-pill ${small ? 'tag-pill--small' : ''} ${onClick ? 'tag-pill--clickable' : ''}`}
      style={{ '--tag-color': tag.color || '#8e8e93' }}
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
