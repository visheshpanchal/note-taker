const api = window.electronAPI?.data

export async function loadData() {
  if (api) return api.load()
  const raw = localStorage.getItem('notetaker_data')
  return raw ? JSON.parse(raw) : null
}

export async function saveData(data) {
  if (api) return api.save(data)
  localStorage.setItem('notetaker_data', JSON.stringify(data))
  return { success: true }
}
