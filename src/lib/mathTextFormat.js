const SUPERSCRIPT_MAP = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '+': '⁺',
  '-': '⁻',
  '=': '⁼',
  '(': '⁽',
  ')': '⁾',
  n: 'ⁿ',
  m: 'ᵐ',
  a: 'ᵃ',
  b: 'ᵇ',
  c: 'ᶜ',
}

const SUPERSCRIPT_REVERSE_MAP = Object.fromEntries(Object.entries(SUPERSCRIPT_MAP).map(([key, value]) => [value, key]))
const SUPERSCRIPT_SEQUENCE_PATTERN = /[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿᵐᵃᵇᶜ]+/g

function toSuperscript(value) {
  return `${value ?? ''}`
    .split('')
    .map((char) => SUPERSCRIPT_MAP[char] ?? char)
    .join('')
}

function fromSuperscript(value) {
  return `${value ?? ''}`
    .split('')
    .map((char) => SUPERSCRIPT_REVERSE_MAP[char] ?? char)
    .join('')
}

export function formatMathDisplay(value) {
  return `${value ?? ''}`
    .replace(/beginarrayl{0,2}\|?/g, '{ ')
    .replace(/endarray/g, ' }')
    .replace(/\\leq|<=/g, '≤')
    .replace(/\\geq|>=/g, '≥')
    .replace(/\\neq|!=|<>/g, '≠')
    .replace(/≤slant/g, '≤')
    .replace(/≥slant/g, '≥')
    .replace(/(?<=[A-Z])bot(?=\s*[A-Z])/g, '⊥')
    .replace(/\bbot\b/g, '⊥')
    .replace(/\bpi\b/g, 'π')
    .replace(/\bprime\b/g, "'")
    .replace(/frac(\d+)sqrt([a-zA-Z][a-zA-Z0-9^]*)/g, '$1/√$2')
    .replace(/fracsqrt(\d+)(\d)(?=\s|[<>=,，。；;、）)]|$)/g, (_, numerator, denominator) => `√${numerator}/${denominator}`)
    .replace(/frac\{?([^{}\s]+)\}?\{?([^{}\s]+)\}?/g, '($1)/($2)')
    .replace(/sqrt\[3\]\s*([a-zA-Z0-9^()+\-]+)/g, '∛$1')
    .replace(/sqrt\(([^)]+)\)/g, '√($1)')
    .replace(/sqrt(\d+[a-zA-Z][a-zA-Z0-9^]*)/g, '√($1)')
    .replace(/sqrt([a-zA-Z][a-zA-Z0-9^]*)/g, '√$1')
    .replace(/sqrt(\d+)/g, '√$1')
    .replace(/\^\(([-+0-9a-zA-Z]+)\)/g, (_, exponent) => toSuperscript(`(${exponent})`))
    .replace(/\^([-+]?\d+)/g, (_, exponent) => toSuperscript(exponent))
    .replace(/\s+\./g, '。')
    .replace(/}\s*。\s*/g, '} ')
}

const UNIT_PATTERN =
  /平方厘米|平方千米|平方分米|平方毫米|立方厘米|立方米|厘米|千米|分米|毫米|米|元|万元|小时|分钟|个|种|台|件|cm\^2|cm²|km|dm|mm|cm|m²|m³|m|h|°|度/g

function normalizeRawMathText(value) {
  return `${value ?? ''}`
    .trim()
    .replace(/beginarrayl{0,2}\|?/g, '{')
    .replace(/endarray/g, '}')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/[［【]/g, '[')
    .replace(/[］】]/g, ']')
    .replace(/[，、；;]+/g, ',')
    .replace(/且/g, ',')
    .replace(/[。．]/g, '')
    .replace(/：/g, ':')
    .replace(/根号/g, 'sqrt')
    .replace(/√/g, 'sqrt')
    .replace(/∛/g, 'cuberoot')
    .replace(/π/g, 'pi')
    .replace(SUPERSCRIPT_SEQUENCE_PATTERN, (match) => `^${fromSuperscript(match)}`)
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/÷/g, '/')
    .replace(/×/g, '*')
    .replace(/－/g, '-')
    .replace(/＞/g, '>')
    .replace(/＜/g, '<')
    .replace(/＝/g, '=')
    .replace(/不等于|\\neq|!=|<>/g, '≠')
    .replace(/大于等于|\\geq|≥slant|≥|>=/g, '≥')
    .replace(/小于等于|\\leq|≤slant|≤|<=/g, '≤')
    .replace(/\s+/g, '')
    .replace(UNIT_PATTERN, '')
    .replace(/(?:km\/h|\/h|km|kg|cm\^2|cm²|cm|mm|dm|m²|m³|m|h|g|°)/g, '')
    .replace(/\/$/g, '')
    .toLowerCase()
}

function normalizeNumberToken(value) {
  const raw = normalizeRawMathText(value)
  if (!raw) return ''
  if (/^-?\d+(?:\.\d+)?%$/.test(raw)) {
    return `${Number(raw.slice(0, -1)) / 100}`
  }
  if (/^-?\d+\/-?\d+$/.test(raw)) {
    const [a, b] = raw.split('/').map(Number)
    if (b !== 0) return `${a / b}`
  }
  return raw
}

function splitTopLevel(value, separators) {
  const normalized = normalizeRawMathText(value).replace(/或者/g, '或')
  const raw = normalized.startsWith('{') && normalized.endsWith('}') ? normalized.slice(1, -1) : normalized
  const parts = []
  let current = ''
  let depth = 0

  for (const char of raw) {
    if (char === '(' || char === '[' || char === '{') depth += 1
    if (char === ')' || char === ']' || char === '}') depth = Math.max(0, depth - 1)

    if (depth === 0 && separators.has(char)) {
      if (current.trim()) parts.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  if (current.trim()) parts.push(current.trim())
  return parts
}

function splitAnswerAlternatives(value) {
  return splitTopLevel(value, new Set(['或']))
}

function splitAnswerList(value) {
  return splitTopLevel(value, new Set([',']))
}

function canonicalizePolynomial(value) {
  const raw = normalizeRawMathText(value)
    .replace(/^\+/, '')
    .replace(/\*/g, '')
  if (!raw || /[<>=≤≥≠/:]/.test(raw)) return raw
  const terms = raw
    .replace(/-/g, '+-')
    .split('+')
    .filter(Boolean)
  if (terms.length < 2) return raw
  return terms.sort().join('+')
}

function equivalentScalar(expected, actual) {
  const a = normalizeNumberToken(expected)
  const b = normalizeNumberToken(actual)
  const numA = Number(a)
  const numB = Number(b)
  if (Number.isFinite(numA) && Number.isFinite(numB)) {
    return Math.abs(numA - numB) < 1e-8
  }
  return false
}

function equivalentOptionalYEquation(expected, actual) {
  const a = normalizeRawMathText(expected)
  const b = normalizeRawMathText(actual)
  if (!a || !b) return false
  return a.replace(/^y=/, '') === b.replace(/^y=/, '') && (a.startsWith('y=') || b.startsWith('y='))
}

function normalizeQuadrantAnswer(value) {
  const raw = normalizeRawMathText(value)
  const map = {
    第一象限: '1',
    第1象限: '1',
    一象限: '1',
    第二象限: '2',
    第2象限: '2',
    二象限: '2',
    第三象限: '3',
    第3象限: '3',
    三象限: '3',
    第四象限: '4',
    第4象限: '4',
    四象限: '4',
  }
  return map[raw] ?? raw
}

function equivalentQuadrant(expected, actual) {
  const a = normalizeQuadrantAnswer(expected)
  const b = normalizeQuadrantAnswer(actual)
  return /^[1-4]$/.test(a) && a === b
}

function equivalentAnswerUnit(expected, actual) {
  return (
    normalizeRawMathText(expected) === normalizeRawMathText(actual) ||
    equivalentOptionalYEquation(expected, actual) ||
    equivalentQuadrant(expected, actual) ||
    canonicalizePolynomial(expected) === canonicalizePolynomial(actual) ||
    equivalentScalar(expected, actual)
  )
}

function equivalentAnswerSet(expectedParts, actualParts) {
  if (expectedParts.length !== actualParts.length) return false
  const used = new Set()
  return expectedParts.every((expectedPart) => {
    const index = actualParts.findIndex((actualPart, i) => !used.has(i) && equivalentAnswerUnit(expectedPart, actualPart))
    if (index < 0) return false
    used.add(index)
    return true
  })
}

function hasNamedAnswerParts(parts) {
  return parts.some((part) => /[a-zα-ω∠]/i.test(part) && /[=:＝<>≤≥≠]/.test(part))
}

function equivalentAnswerList(expectedParts, actualParts) {
  if (expectedParts.length !== actualParts.length) return false
  if (hasNamedAnswerParts(expectedParts) || hasNamedAnswerParts(actualParts)) {
    return equivalentAnswerSet(expectedParts, actualParts)
  }
  return expectedParts.every((part, index) => equivalentAnswerUnit(part, actualParts[index]))
}

export function normalizeMathAnswer(value) {
  return normalizeRawMathText(value)
}

export function answerMatches(expected, actual) {
  const normalizedActual = normalizeRawMathText(actual)
  if (!normalizedActual) return false

  const expectedParts = splitAnswerAlternatives(expected)
  const actualAlternatives = splitAnswerAlternatives(actual)

  if (expectedParts.length > 1) {
    const actualList = splitAnswerList(actual)
    if (actualList.length > 1) {
      return equivalentAnswerSet(expectedParts, actualList)
    }
    if (actualAlternatives.length > 1) {
      return equivalentAnswerSet(expectedParts, actualAlternatives)
    }
    return expectedParts.some((part) => equivalentAnswerUnit(part, actual))
  }

  const expectedList = splitAnswerList(expected)
  const actualList = splitAnswerList(actual)
  if (expectedList.length > 1 || actualList.length > 1) {
    return equivalentAnswerList(expectedList, actualList)
  }

  return equivalentAnswerUnit(expected, actual)
}
