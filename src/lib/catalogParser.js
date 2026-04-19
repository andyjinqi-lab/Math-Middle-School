export async function parseCatalogFile(file) {
  const text = await file.text()
  const fileName = file.name.toLowerCase()

  if (fileName.endsWith('.json')) {
    return JSON.parse(text)
  }

  if (fileName.endsWith('.csv')) {
    return parseCatalogCsv(text)
  }

  throw new Error('仅支持 JSON 或 CSV 文件')
}

function parseCatalogCsv(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) throw new Error('CSV 内容为空')

  const [header, ...rows] = lines
  const keys = header.split(',').map((key) => key.trim())
  const required = ['id', 'grade', 'semester', 'name', 'pdfPath', 'chapterId', 'chapterName']
  const missing = required.filter((key) => !keys.includes(key))
  if (missing.length) {
    throw new Error(`CSV 缺少列：${missing.join(', ')}`)
  }

  const index = Object.fromEntries(keys.map((key, i) => [key, i]))
  const bookMap = new Map()

  rows.forEach((row) => {
    const cols = row.split(',').map((cell) => cell.trim())
    const id = cols[index.id]
    if (!id) return

    if (!bookMap.has(id)) {
      bookMap.set(id, {
        id,
        grade: Number(cols[index.grade]),
        semester: cols[index.semester],
        name: cols[index.name],
        pdfPath: cols[index.pdfPath],
        chapters: [],
      })
    }

    const book = bookMap.get(id)
    const chapterId = cols[index.chapterId]
    const chapterName = cols[index.chapterName]
    if (chapterId && chapterName) {
      const existed = book.chapters.some((chapter) => chapter.id === chapterId)
      if (!existed) book.chapters.push({ id: chapterId, name: chapterName })
    }
  })

  return Array.from(bookMap.values())
}
