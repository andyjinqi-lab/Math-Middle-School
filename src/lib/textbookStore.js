const TEXTBOOK_KEY = 'math_planet_textbooks_v1'

function safeParse(value, fallback) {
  try {
    return JSON.parse(value) ?? fallback
  } catch {
    return fallback
  }
}

export function loadTextbooks(defaultValue) {
  if (typeof window === 'undefined') return defaultValue
  return safeParse(window.localStorage.getItem(TEXTBOOK_KEY), defaultValue)
}

export function saveTextbooks(value) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(TEXTBOOK_KEY, JSON.stringify(value))
}

export function validateTextbooks(payload) {
  if (!Array.isArray(payload) || payload.length === 0) return false
  return payload.every((book) => {
    if (!book || typeof book !== 'object') return false
    if (!book.id || !book.name || !book.pdfPath) return false
    if (!Array.isArray(book.chapters) || book.chapters.length === 0) return false
    return book.chapters.every((chapter) => chapter.id && chapter.name)
  })
}
