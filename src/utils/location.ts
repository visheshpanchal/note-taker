export function getLocationTag(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

export function formatLocation(timezone: string | null | undefined): string {
  if (!timezone) return ''
  const parts = timezone.split('/')
  return parts[parts.length - 1].replace(/_/g, ' ')
}
