export function getLocationTag() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

export function formatLocation(timezone) {
  if (!timezone) return ''
  const parts = timezone.split('/')
  return parts[parts.length - 1].replace(/_/g, ' ')
}
