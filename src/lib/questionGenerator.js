function hashSeed(input) {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }
  return Math.abs(hash >>> 0)
}

function rngFactory(seedText) {
  let seed = hashSeed(seedText) || 1
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

function pickInt(rand, min, max) {
  return Math.floor(rand() * (max - min + 1)) + min
}

function shuffle(arr, rand) {
  const next = [...arr]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

function buildNumericOptions(answer, rand, { step = 1, min = -9999, max = 9999, formatter = (v) => `${v}` } = {}) {
  const set = new Set([answer])
  while (set.size < 4) {
    const delta = pickInt(rand, -4, 4) * step
    const candidate = Math.min(max, Math.max(min, answer + (delta === 0 ? step : delta)))
    set.add(Number(candidate.toFixed(4)))
  }

  const shuffled = shuffle([...set], rand)
  return {
    options: shuffled.map((value, idx) => `${String.fromCharCode(65 + idx)}. ${formatter(value)}`),
    answer: shuffled.findIndex((value) => value === answer),
  }
}

function pickQuestionType(rand, difficulty) {
  const r = rand()
  if (difficulty === '基础') {
    if (r < 0.6) return 'choice'
    if (r < 0.9) return 'fill'
    return 'calculation'
  }
  if (difficulty === '提升') {
    if (r < 0.45) return 'choice'
    if (r < 0.75) return 'fill'
    return 'calculation'
  }
  if (r < 0.35) return 'choice'
  if (r < 0.6) return 'fill'
  return 'calculation'
}

function makeQuestion(base) {
  return {
    source: '自动生成',
    ...base,
  }
}

function buildQuestionByType({ rand, id, textbookId, chapterId, difficulty, answerValue, baseStem, explanation, optionConfig, figure }) {
  const questionType = pickQuestionType(rand, difficulty)

  if (questionType === 'choice') {
    const { options, answer } = buildNumericOptions(answerValue, rand, optionConfig)
    return makeQuestion({
      id,
      textbookId,
      chapterId,
      difficulty,
      questionType,
      stem: baseStem,
      options,
      answer,
      explanation,
      figure,
    })
  }

  const answerText = optionConfig?.formatter ? optionConfig.formatter(answerValue) : `${answerValue}`
  const stemPrefix = questionType === 'fill' ? '填空：' : '计算并填写结果：'

  return makeQuestion({
    id,
    textbookId,
    chapterId,
    difficulty,
    questionType,
    stem: `${stemPrefix}${baseStem}`,
    answer: answerText,
    explanation,
    figure,
  })
}

function arithmeticQuestion(rand, id, textbookId, chapterId, difficulty) {
  const maxAbs = difficulty === '基础' ? 20 : difficulty === '提升' ? 40 : 80
  const a = pickInt(rand, -maxAbs, maxAbs)
  const b = pickInt(rand, -maxAbs, maxAbs)
  const ops = difficulty === '挑战' ? ['+', '-', '*'] : ['+', '-']
  const op = ops[pickInt(rand, 0, ops.length - 1)]
  const answer = op === '+' ? a + b : op === '-' ? a - b : a * b

  return buildQuestionByType({
    rand,
    id,
    textbookId,
    chapterId,
    difficulty,
    answerValue: answer,
    baseStem: `计算：${a} ${op} ${b} 的结果是`,
    explanation: `按有理数运算顺序计算可得结果为 ${answer}。`,
    optionConfig: { step: op === '*' ? 3 : 1, min: -9999, max: 9999 },
  })
}

function ratioQuestion(rand, id, textbookId, chapterId, difficulty) {
  const denominator = difficulty === '基础' ? pickInt(rand, 2, 10) : pickInt(rand, 5, 20)
  const numerator = pickInt(rand, 1, denominator - 1)
  const answer = Number((numerator / denominator).toFixed(2))

  return buildQuestionByType({
    rand,
    id,
    textbookId,
    chapterId,
    difficulty,
    answerValue: answer,
    baseStem: `把分数 ${numerator}/${denominator} 化成小数，结果是`,
    explanation: `${numerator}÷${denominator}=${answer.toFixed(2)}。`,
    optionConfig: {
      step: 0.05,
      min: 0,
      max: 1,
      formatter: (v) => Number(v).toFixed(2),
    },
  })
}

function equationQuestion(rand, id, textbookId, chapterId, difficulty) {
  const x = pickInt(rand, -12, 18)
  const k = pickInt(rand, 1, difficulty === '挑战' ? 9 : difficulty === '提升' ? 6 : 4)
  const b = pickInt(rand, -15, 15)
  const c = k * x + b

  return buildQuestionByType({
    rand,
    id,
    textbookId,
    chapterId,
    difficulty,
    answerValue: x,
    baseStem: `解方程：${k}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} = ${c}，x=`,
    explanation: `移项得 ${k}x=${c - b}，再两边同除以 ${k}，可得 x=${x}。`,
    optionConfig: { step: 1, min: -30, max: 30 },
  })
}

function systemEquationQuestion(rand, id, textbookId, chapterId, difficulty) {
  const x = pickInt(rand, -6, 12)
  const y = pickInt(rand, -6, 12)
  const a1 = pickInt(rand, 1, 4)
  const b1 = pickInt(rand, 1, 4)
  const a2 = pickInt(rand, 1, 4)
  const b2 = pickInt(rand, 1, 4)
  const c1 = a1 * x + b1 * y
  const c2 = a2 * x - b2 * y

  return buildQuestionByType({
    rand,
    id,
    textbookId,
    chapterId,
    difficulty,
    answerValue: x,
    baseStem: `方程组 { ${a1}x + ${b1}y = ${c1}, ${a2}x - ${b2}y = ${c2} } 的解中 x=`,
    explanation: `联立求解可得 (x,y)=(${x},${y})。`,
    optionConfig: { step: 1, min: -20, max: 20 },
  })
}

function functionQuestion(rand, id, textbookId, chapterId, difficulty) {
  const m = pickInt(rand, -5, 6) || 1
  const n = pickInt(rand, -9, 12)
  const x = pickInt(rand, -5, 8)
  const y = m * x + n

  return buildQuestionByType({
    rand,
    id,
    textbookId,
    chapterId,
    difficulty,
    answerValue: y,
    baseStem: `一次函数 y=${m}x ${n >= 0 ? '+' : '-'} ${Math.abs(n)} 中，当 x=${x} 时，y=`,
    explanation: `把 x=${x} 代入函数表达式，得到 y=${y}。`,
    optionConfig: { step: 1, min: -80, max: 80 },
  })
}

function probabilityQuestion(rand, id, textbookId, chapterId, difficulty) {
  const pool = [0.1, 0.2, 0.25, 0.3, 0.4, 0.5]
  const p = pool[pickInt(rand, 0, pool.length - 1)]
  const answer = Number((1 - p).toFixed(2))

  return buildQuestionByType({
    rand,
    id,
    textbookId,
    chapterId,
    difficulty,
    answerValue: answer,
    baseStem: `某事件发生概率为 ${p.toFixed(2)}，则该事件不发生的概率是`,
    explanation: `对立事件概率和为 1，所以 1-${p.toFixed(2)}=${answer.toFixed(2)}。`,
    optionConfig: {
      step: 0.05,
      min: 0,
      max: 1,
      formatter: (v) => Number(v).toFixed(2),
    },
  })
}

function angleSupplementQuestion(rand, id, textbookId, chapterId, difficulty) {
  const known = pickInt(rand, 20, difficulty === '基础' ? 120 : 150)
  const answer = 180 - known

  return buildQuestionByType({
    rand,
    id,
    textbookId,
    chapterId,
    difficulty,
    answerValue: answer,
    baseStem: `如图，A、O、B 在同一直线上，已知 ∠AOC=${known}°。求 ∠COB 的度数。`,
    explanation: `平角为 180°，所以 ∠COB=180°-${known}°=${answer}°。`,
    optionConfig: { step: 5, min: 5, max: 175, formatter: (v) => `${v}°` },
    figure: {
      type: 'line-angle',
      known,
      answer,
      labels: { left: 'A', right: 'B', top: 'C', center: 'O' },
    },
  })
}

function triangleAngleQuestion(rand, id, textbookId, chapterId, difficulty) {
  const a = pickInt(rand, 25, 80)
  const b = pickInt(rand, 20, 90 - Math.floor(a / 2))
  const answer = 180 - a - b

  return buildQuestionByType({
    rand,
    id,
    textbookId,
    chapterId,
    difficulty,
    answerValue: answer,
    baseStem: '如图，在 △ABC 中，已知 ∠A 与 ∠B，求 ∠C。',
    explanation: `三角形内角和为 180°，所以 ∠C=180°-${a}°-${b}°=${answer}°。`,
    optionConfig: { step: 5, min: 10, max: 140, formatter: (v) => `${v}°` },
    figure: {
      type: 'triangle-angles',
      a,
      b,
      answer,
      labels: { A: 'A', B: 'B', C: 'C' },
    },
  })
}

function isoscelesQuestion(rand, id, textbookId, chapterId, difficulty) {
  const vertex = pickInt(rand, 20, 120)
  const answer = (180 - vertex) / 2

  return buildQuestionByType({
    rand,
    id,
    textbookId,
    chapterId,
    difficulty,
    answerValue: answer,
    baseStem: '如图，在等腰三角形 △ABC 中，AB=AC，已知顶角 ∠A，求底角 ∠B。',
    explanation: `等腰三角形两底角相等，且三角形内角和为 180°，所以 ∠B=(180°-${vertex}°)/2=${answer}°。`,
    optionConfig: { step: 5, min: 10, max: 90, formatter: (v) => `${v}°` },
    figure: {
      type: 'isosceles',
      vertex,
      answer,
      labels: { A: 'A', B: 'B', C: 'C' },
    },
  })
}

function pythagoreanQuestion(rand, id, textbookId, chapterId, difficulty) {
  const triples = [
    [3, 4, 5],
    [5, 12, 13],
    [8, 15, 17],
    [7, 24, 25],
  ]
  const [a, b, c] = triples[pickInt(rand, 0, triples.length - 1)]
  const hidden = pickInt(rand, 0, 2)
  const answer = hidden === 0 ? a : hidden === 1 ? b : c

  const knownText =
    hidden === 0
      ? `BC=${b}，AC=${c}`
      : hidden === 1
        ? `AB=${a}，AC=${c}`
        : `AB=${a}，BC=${b}`

  return buildQuestionByType({
    rand,
    id,
    textbookId,
    chapterId,
    difficulty,
    answerValue: answer,
    baseStem: `如图，Rt△ABC 中，∠B=90°，已知 ${knownText}，求未知边长度。`,
    explanation:
      hidden === 2
        ? `根据勾股定理，AC²=AB²+BC²=${a}²+${b}²=${c * c}，所以 AC=${c}。`
        : `根据勾股定理，${c}²-${hidden === 0 ? b : a}²=${answer * answer}，所以未知边为 ${answer}。`,
    optionConfig: { step: 1, min: 1, max: 40 },
    figure: {
      type: 'right-triangle',
      a,
      b,
      c,
      hidden,
      labels: { A: 'A', B: 'B', C: 'C' },
    },
  })
}

function equationCompositePilot(rand, id, textbookId, chapterId, difficulty) {
  const x = pickInt(rand, -8, 14)
  const a = pickInt(rand, 2, 5)
  const b = pickInt(rand, 1, 6)
  const c = pickInt(rand, 2, 5)
  const d = pickInt(rand, -6, 6)
  const leftConst = a * (x - b) + c * (x + d)
  const answer = x

  return makeQuestion({
    id,
    textbookId,
    chapterId,
    difficulty,
    questionType: 'composite',
    stem: `综合计算：解方程 ${a}(x-${b}) + ${c}(x${d >= 0 ? '+' : '-'}${Math.abs(d)}) = ${leftConst}。`,
    answer: `${answer}`,
    explanation: `展开并合并同类项，得到 ${(a + c)}x ${-a * b + c * d >= 0 ? '+' : '-'} ${Math.abs(-a * b + c * d)} = ${leftConst}；移项后解得 x=${answer}。`,
    keywords: ['展开', '合并同类项', '移项', '解得'],
    referenceSteps: [
      '先去括号并展开各项。',
      '合并同类项形成一元一次方程。',
      '移项并化简，最终求出 x。',
    ],
  })
}

function equationOpenPilot(rand, id, textbookId, chapterId, difficulty) {
  const unitPrice = pickInt(rand, 6, 15)
  const count = pickInt(rand, 8, 20)
  const shipping = pickInt(rand, 10, 25)
  const total = unitPrice * count + shipping
  const answer = count

  return makeQuestion({
    id,
    textbookId,
    chapterId,
    difficulty,
    questionType: 'open',
    stem: `问答题：某网店每支中性笔单价 ${unitPrice} 元，另收运费 ${shipping} 元。小明共支付 ${total} 元，买了多少支中性笔？请写出设元、列方程、求解过程。`,
    answer: `${answer}`,
    explanation: `设购买 x 支，则 ${unitPrice}x + ${shipping} = ${total}，解得 x=${answer}。`,
    keywords: ['设', '列方程', '解', '答'],
    referenceSteps: [
      '设购买 x 支中性笔。',
      `根据题意列方程：${unitPrice}x + ${shipping} = ${total}。`,
      `解方程得到 x=${answer}，并写“答：买了 ${answer} 支”。`,
    ],
  })
}

function geometryCompositePilot(rand, id, textbookId, chapterId, difficulty) {
  const a = pickInt(rand, 35, 75)
  const b = pickInt(rand, 30, 70)
  const answer = 180 - a - b

  return makeQuestion({
    id,
    textbookId,
    chapterId,
    difficulty,
    questionType: 'composite',
    stem: `综合计算：如图，在 △ABC 中，已知 ∠A=${a}°，∠B=${b}°，求 ∠C 的度数。`,
    answer: `${answer}°`,
    explanation: `三角形内角和为 180°，所以 ∠C=180°-${a}°-${b}°=${answer}°。`,
    keywords: ['内角和', '180', '计算'],
    referenceSteps: ['写出三角形内角和公式。', `代入 ∠A=${a}°、∠B=${b}°。`, `计算得 ∠C=${answer}°。`],
    figure: {
      type: 'triangle-angles',
      a,
      b,
      answer,
      labels: { A: 'A', B: 'B', C: 'C' },
    },
  })
}

function geometryOpenPilot(rand, id, textbookId, chapterId, difficulty) {
  const known = pickInt(rand, 28, 78)
  const answer = 180 - known

  return makeQuestion({
    id,
    textbookId,
    chapterId,
    difficulty,
    questionType: 'open',
    stem: `问答题：如图，A、O、B 在同一直线上，射线 OC 与 OA 构成 ∠AOC=${known}°。求 ∠COB，并说明理由。`,
    answer: `${answer}°`,
    explanation: `因为 A、O、B 共线，∠AOC 与 ∠COB 互为邻补角，和为 180°，所以 ∠COB=180°-${known}°=${answer}°。`,
    keywords: ['共线', '邻补角', '180', '因此'],
    referenceSteps: [
      '指出 A、O、B 共线，形成平角 180°。',
      '说明 ∠AOC 与 ∠COB 互补。',
      `计算 ∠COB=180°-${known}°=${answer}°。`,
    ],
    figure: {
      type: 'line-angle',
      known,
      answer,
      labels: { left: 'A', right: 'B', top: 'C', center: 'O' },
    },
  })
}

function arithmeticCompositePilot(rand, id, textbookId, chapterId, difficulty) {
  const a = pickInt(rand, -18, 18)
  const b = pickInt(rand, 2, 9)
  const c = pickInt(rand, -12, 12)
  const d = pickInt(rand, 2, 7)
  const answer = (a * b + c * d) / d

  return makeQuestion({
    id,
    textbookId,
    chapterId,
    difficulty,
    questionType: 'composite',
    stem: `综合计算：计算 [(${a})×${b} + (${c})×${d}] ÷ ${d} 的结果。`,
    answer: `${Number(answer.toFixed(2))}`,
    explanation: `先算括号内乘法与加法，再做除法，结果为 ${Number(answer.toFixed(2))}。`,
    keywords: ['先乘后加', '括号', '除法'],
    referenceSteps: ['先完成乘法运算。', '合并括号内结果。', '最后做除法得到结果。'],
  })
}

function arithmeticOpenPilot(rand, id, textbookId, chapterId, difficulty) {
  const first = pickInt(rand, 25, 60)
  const second = pickInt(rand, 12, 35)
  const left = pickInt(rand, 8, 18)
  const answer = first - second + left

  return makeQuestion({
    id,
    textbookId,
    chapterId,
    difficulty,
    questionType: 'open',
    stem: `问答题：仓库上午有 ${first} 箱饮料，中午运走 ${second} 箱，下午又补进 ${left} 箱。现在仓库共有多少箱？请写出算式并作答。`,
    answer: `${answer}`,
    explanation: `按“原有-运走+补进”列式：${first}-${second}+${left}=${answer}。`,
    keywords: ['原有', '减去', '加上', '答'],
    referenceSteps: ['明确数量变化关系。', `列式 ${first}-${second}+${left}。`, `计算得 ${answer} 箱并作答。`],
  })
}

function buildPilotChallengeQuestion(rand, id, textbookId, chapterId, difficulty) {
  const chapterTypeMap = {
    '7a-c2': [equationCompositePilot, equationOpenPilot],
    '7a-c3': [geometryCompositePilot, geometryOpenPilot],
    '7a-c4': [arithmeticCompositePilot, arithmeticOpenPilot],
  }
  const pool = chapterTypeMap[chapterId]
  if (!pool || difficulty !== '挑战') return null
  const picked = pool[pickInt(rand, 0, pool.length - 1)]
  return picked(rand, id, textbookId, chapterId, difficulty)
}

const CHAPTER_CATEGORY_BY_ID = {
  '6a-c1': 'arithmetic',
  '6a-c2': 'arithmetic',
  '6a-c3': 'equation',
  '6a-c4': 'geometry',
  '6a-c5': 'ratio',
  '6a-c6': 'ratio',
  '6a-c7': 'probability',
  '6a-c8': 'arithmetic',
  '6b-c1': 'ratio',
  '6b-c2': 'geometry',
  '6b-c3': 'probability',
  '6b-c4': 'arithmetic',
  '6b-c5': 'equation',
  '6b-c6': 'geometry',
  '6b-c7': 'geometry',
  '6b-c8': 'probability',
  '7a-c1': 'arithmetic',
  '7a-c2': 'equation',
  '7a-c3': 'geometry',
  '7a-c4': 'arithmetic',
  '7a-c5': 'geometry',
  '7a-c6': 'arithmetic',
  '7a-c7': 'arithmetic',
  '7a-c8': 'arithmetic',
  '7b-c1': 'equation',
  '7b-c2': 'system-equation',
  '7b-c3': 'probability',
  '7b-c4': 'geometry',
  '7b-c5': 'arithmetic',
  '7b-c6': 'geometry',
  '7b-c7': 'geometry',
  '7b-c8': 'arithmetic',
  '8a-c1': 'function',
  '8a-c2': 'geometry',
  '8a-c3': 'equation',
  '8a-c4': 'probability',
  '8a-c5': 'geometry',
  '8a-c6': 'arithmetic',
  '8a-c7': 'function',
  '8a-c8': 'arithmetic',
  '8b-c1': 'equation',
  '8b-c2': 'geometry',
  '8b-c3': 'geometry',
  '8b-c4': 'probability',
  '8b-c5': 'function',
  '8b-c6': 'geometry',
  '8b-c7': 'probability',
  '8b-c8': 'arithmetic',
  '9a-c1': 'function',
  '9a-c2': 'geometry',
  '9a-c3': 'geometry',
  '9a-c4': 'arithmetic',
  '9a-c5': 'equation',
  '9a-c6': 'function',
  '9a-c7': 'geometry',
  '9a-c8': 'arithmetic',
  '9b-c1': 'geometry',
  '9b-c2': 'probability',
  '9b-c3': 'arithmetic',
  '9b-c4': 'arithmetic',
  '9b-c5': 'geometry',
  '9b-c6': 'function',
  '9b-c7': 'geometry',
  '9b-c8': 'arithmetic',
}

function chapterCategory(chapter) {
  const name = `${chapter.name ?? ''}`
  const id = `${chapter.id ?? ''}`

  if (CHAPTER_CATEGORY_BY_ID[id]) return CHAPTER_CATEGORY_BY_ID[id]

  if (/几何|图形|角|三角|全等|相似|圆|平行|坐标|勾股|变换|证明/.test(name)) return 'geometry'
  if (/方程组/.test(name)) return 'system-equation'
  if (/方程|不等式|分式|因式/.test(name)) return 'equation'
  if (/函数/.test(name)) return 'function'
  if (/概率|统计|抽样|数据/.test(name)) return 'probability'
  if (/比|比例|分数|小数/.test(name)) return 'ratio'

  if (/c2|c3|c4/.test(id) && /^8a|^8b|^9a|^9b/.test(id)) return 'geometry'
  return 'arithmetic'
}

function factoryByCategory(category) {
  if (category === 'equation') return equationQuestion
  if (category === 'system-equation') return systemEquationQuestion
  if (category === 'function') return functionQuestion
  if (category === 'probability') return probabilityQuestion
  if (category === 'ratio') return ratioQuestion
  if (category === 'geometry') {
    return (rand, id, textbookId, chapterId, difficulty) => {
      const geometryFactories = [
        angleSupplementQuestion,
        triangleAngleQuestion,
        isoscelesQuestion,
        pythagoreanQuestion,
      ]
      const picked = geometryFactories[pickInt(rand, 0, geometryFactories.length - 1)]
      return picked(rand, id, textbookId, chapterId, difficulty)
    }
  }
  return arithmeticQuestion
}

export function buildGeneratedQuestions(textbooks, countPerDifficulty = 100) {
  const difficulties = ['基础', '提升', '挑战']
  const generated = []

  textbooks.forEach((book) => {
    book.chapters.forEach((chapter) => {
      const category = chapterCategory(chapter)
      const factory = factoryByCategory(category)

      difficulties.forEach((difficulty) => {
        for (let i = 0; i < countPerDifficulty; i += 1) {
          const rand = rngFactory(`${book.id}-${chapter.id}-${difficulty}-${i}`)
          const generatedId = `auto-${book.id}-${chapter.id}-${difficulty}-${i + 1}`
          const pilotQuestion = buildPilotChallengeQuestion(
            rand,
            generatedId,
            book.id,
            chapter.id,
            difficulty,
          )
          if (pilotQuestion) {
            generated.push(pilotQuestion)
            continue
          }
          generated.push(
            factory(
              rand,
              generatedId,
              book.id,
              chapter.id,
              difficulty,
            ),
          )
        }
      })
    })
  })

  return generated
}

export function mergeQuestionBank(curatedQuestions, generatedQuestions) {
  const normalizedCurated = curatedQuestions.map((q, i) => ({
    ...q,
    source: q.source ?? (i % 2 === 0 ? '教材真题' : '教师自编'),
    questionType: q.questionType ?? 'choice',
  }))
  const ids = new Set(normalizedCurated.map((q) => q.id))
  const dedupedGenerated = generatedQuestions.filter((q) => !ids.has(q.id))
  return [...normalizedCurated, ...dedupedGenerated]
}
