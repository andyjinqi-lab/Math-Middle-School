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

function statisticsQuestion(rand, id, textbookId, chapterId, difficulty) {
  const total = pickInt(rand, 30, difficulty === '基础' ? 80 : 150)
  const part = pickInt(rand, 8, Math.floor(total * 0.7))
  const percent = Number(((part / total) * 100).toFixed(1))

  return buildQuestionByType({
    rand,
    id,
    textbookId,
    chapterId,
    difficulty,
    answerValue: percent,
    baseStem: `数据分析：某班共调查 ${total} 人，其中喜欢数学闯关练习的有 ${part} 人，占比约为`,
    explanation: `占比=${part}÷${total}×100%≈${percent}%。`,
    optionConfig: {
      step: 2,
      min: 0,
      max: 100,
      formatter: (v) => `${Number(v).toFixed(1)}%`,
    },
  })
}

function algebraExpressionQuestion(rand, id, textbookId, chapterId, difficulty) {
  const formatLinear = (coefficient, constant) => {
    if (constant === 0) return `${coefficient}x`
    return `${coefficient}x${constant >= 0 ? '+' : ''}${constant}`
  }

  const mkChoice = ({ stem, correct, distractors, explanation }) => {
    const values = shuffle([correct, ...distractors], rand)
    return makeQuestion({
      id,
      textbookId,
      chapterId,
      difficulty,
      questionType: 'choice',
      stem,
      options: values.map((value, idx) => `${String.fromCharCode(65 + idx)}. ${value}`),
      answer: values.findIndex((value) => value === correct),
      explanation,
    })
  }

  const linearSimplify = () => {
    const a = pickInt(rand, 2, difficulty === '基础' ? 5 : 9)
    const b = pickInt(rand, 1, 8)
    const c = pickInt(rand, 2, 7)
    const coefficient = a + c
    const constant = b - c
    const answer = formatLinear(coefficient, constant)

    if (difficulty === '挑战') {
      return makeQuestion({
        id,
        textbookId,
        chapterId,
        difficulty,
        questionType: 'calculation',
        stem: `整式运算：先化简 ${a}x+${b}+${c}(x-1)，再写出合并同类项后的结果。`,
        answer,
        explanation: `先去括号：${c}(x-1)=${c}x-${c}，再合并同类项，得 ${answer}。`,
      })
    }

    return mkChoice({
      stem: `整式运算：化简 ${a}x+${b}+${c}(x-1) 的结果是`,
      correct: answer,
      distractors: [
        `${a + c}x+${b + c}`,
        formatLinear(a, b - c),
        formatLinear(a - c, constant),
      ],
      explanation: `先去括号：${c}(x-1)=${c}x-${c}，再合并同类项，得 ${answer}。`,
    })
  }

  const monomialTimesPolynomial = () => {
    const a = pickInt(rand, 2, 7)
    const b = pickInt(rand, 2, 6)
    const c = pickInt(rand, 1, 9)
    return mkChoice({
      stem: `整式乘法：计算 ${a}x(${b}x-${c}) 的结果是`,
      correct: `${a * b}x²-${a * c}x`,
      distractors: [
        `${a + b}x²-${c}x`,
        `${a * b}x²-${c}x`,
        `${a * b}x²+${a * c}x`,
      ],
      explanation: `用单项式乘多项式法则，${a}x·${b}x=${a * b}x²，${a}x·(-${c})=-${a * c}x。`,
    })
  }

  const squareDifference = () => {
    const a = pickInt(rand, 2, 9)
    return mkChoice({
      stem: `乘法公式：展开 (x+${a})(x-${a}) 的结果是`,
      correct: `x²-${a * a}`,
      distractors: [`x²+${a * a}`, `x²-${2 * a}x+${a * a}`, `x²+${2 * a}x-${a * a}`],
      explanation: `利用平方差公式 (a+b)(a-b)=a²-b²，所以结果为 x²-${a * a}。`,
    })
  }

  const commonFactor = () => {
    const a = pickInt(rand, 2, 8)
    const b = pickInt(rand, 2, 9)
    const c = pickInt(rand, 1, 8)
    return mkChoice({
      stem: `因式分解：${a * b}x²+${a * c}x 提取公因式后的结果是`,
      correct: `${a}x(${b}x+${c})`,
      distractors: [
        `${a}(${b}x+${c})`,
        `${a}x(${b}x-${c})`,
        `${b}x(${a}x+${c})`,
      ],
      explanation: `两项的公因式是 ${a}x，提取后得到 ${a}x(${b}x+${c})。`,
    })
  }

  const completeSquare = () => {
    const a = pickInt(rand, 2, 7)
    return mkChoice({
      stem: `因式分解：x²+${2 * a}x+${a * a} 可分解为`,
      correct: `(x+${a})²`,
      distractors: [`(x-${a})²`, `(x+${a})(x-${a})`, `x(x+${2 * a})+${a * a}`],
      explanation: `符合完全平方公式 a²+2ab+b²=(a+b)²，所以 x²+${2 * a}x+${a * a}=(x+${a})²。`,
    })
  }

  const templates =
    difficulty === '基础'
      ? [linearSimplify, monomialTimesPolynomial, commonFactor]
      : difficulty === '提升'
        ? [monomialTimesPolynomial, squareDifference, commonFactor, completeSquare]
        : [linearSimplify, squareDifference, commonFactor, completeSquare]

  const picked = templates[pickInt(rand, 0, templates.length - 1)]
  return picked()
}

function quadraticFunctionQuestion(rand, id, textbookId, chapterId, difficulty) {
  const a = pickInt(rand, 1, difficulty === '基础' ? 3 : 5)
  const h = pickInt(rand, -4, 4)
  const k = pickInt(rand, -6, 8)
  const x = pickInt(rand, -3, 5)
  const y = a * (x - h) * (x - h) + k

  return buildQuestionByType({
    rand,
    id,
    textbookId,
    chapterId,
    difficulty,
    answerValue: y,
    baseStem: `二次函数 y=${a}(x${h >= 0 ? '-' : '+'}${Math.abs(h)})²${k >= 0 ? '+' : ''}${k} 中，当 x=${x} 时，y=`,
    explanation: `代入 x=${x}，得 y=${a}×(${x}-${h})²${k >= 0 ? '+' : ''}${k}=${y}。`,
    optionConfig: { step: 2, min: -100, max: 200 },
  })
}

function quadraticEquationQuestion(rand, id, textbookId, chapterId, difficulty) {
  const r1 = pickInt(rand, -6, 4)
  let r2 = pickInt(rand, 1, 9)
  if (r2 === r1) r2 += 1
  const sum = r1 + r2
  const product = r1 * r2

  return makeQuestion({
    id,
    textbookId,
    chapterId,
    difficulty,
    questionType: difficulty === '基础' ? 'choice' : 'calculation',
    stem:
      difficulty === '基础'
        ? `一元二次方程 x²${sum >= 0 ? '-' : '+'}${Math.abs(sum)}x${product >= 0 ? '+' : ''}${product}=0 的一个根是`
        : `解一元二次方程：x²${sum >= 0 ? '-' : '+'}${Math.abs(sum)}x${product >= 0 ? '+' : ''}${product}=0。`,
    ...(difficulty === '基础'
      ? buildNumericOptions(r1, rand, { step: 1, min: -12, max: 12 })
      : {
          answer: `${r1},${r2}`,
        }),
    explanation: `原方程可分解为 (x-${r1})(x-${r2})=0，所以 x=${r1} 或 x=${r2}。`,
  })
}

function trigonometryQuestion(rand, id, textbookId, chapterId, difficulty) {
  const triples = [
    { sin: '3/5', cos: '4/5', tan: '3/4' },
    { sin: '5/13', cos: '12/13', tan: '5/12' },
    { sin: '8/17', cos: '15/17', tan: '8/15' },
  ]
  const picked = triples[pickInt(rand, 0, triples.length - 1)]
  const ask = ['sin', 'cos', 'tan'][pickInt(rand, 0, 2)]
  const answer = picked[ask]

  return makeQuestion({
    id,
    textbookId,
    chapterId,
    difficulty,
    questionType: 'choice',
    stem: `锐角三角函数：在直角三角形中，若某锐角的对边、邻边、斜边对应比为 ${picked.sin}、${picked.cos}，则 ${ask}θ=`,
    options: [`A. ${answer}`, 'B. 1', 'C. 0', `D. ${picked[ask === 'tan' ? 'sin' : 'tan']}`],
    answer: 0,
    explanation: `根据锐角三角函数定义，${ask}θ=${answer}。`,
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

function applicationModelQuestion(rand, id, textbookId, chapterId, difficulty) {
  const templates = [
    () => {
      const unitPrice = pickInt(rand, difficulty === '基础' ? 4 : 7, difficulty === '挑战' ? 18 : 12)
      const count = pickInt(rand, 6, difficulty === '挑战' ? 30 : 18)
      const shipping = pickInt(rand, 5, difficulty === '基础' ? 15 : 28)
      const total = unitPrice * count + shipping
      return makeQuestion({
        id,
        textbookId,
        chapterId,
        difficulty,
        questionType: difficulty === '基础' ? 'choice' : 'open',
        stem:
          difficulty === '基础'
            ? `应用建模：练习本每本 ${unitPrice} 元，运费 ${shipping} 元，一共付 ${total} 元。购买了多少本练习本？`
            : `应用建模：练习本每本 ${unitPrice} 元，另付运费 ${shipping} 元。小明一共支付 ${total} 元。请设未知数并列方程求购买本数。`,
        ...(difficulty === '基础'
          ? buildNumericOptions(count, rand, { step: 1, min: 1, max: 60 })
          : {
              answer: `${count}`,
              keywords: ['设', '方程', `${unitPrice}x+${shipping}`, `${total}`],
              referenceSteps: [
                '设购买 x 本练习本。',
                `根据“单价×数量+运费=总价”列方程：${unitPrice}x+${shipping}=${total}。`,
                `解得 x=${count}，所以购买 ${count} 本。`,
              ],
            }),
        explanation: `设购买 x 本，则 ${unitPrice}x+${shipping}=${total}，解得 x=${count}。`,
      })
    },
    () => {
      const start = pickInt(rand, 40, 90)
      const used = pickInt(rand, 12, 35)
      const added = pickInt(rand, 8, 28)
      const answer = start - used + added
      return makeQuestion({
        id,
        textbookId,
        chapterId,
        difficulty,
        questionType: difficulty === '基础' ? 'choice' : 'open',
        stem:
          difficulty === '基础'
            ? `应用建模：仓库原有 ${start} 箱矿泉水，运走 ${used} 箱，又补进 ${added} 箱。现在有多少箱？`
            : `应用建模：仓库原有 ${start} 箱矿泉水，上午运走 ${used} 箱，下午补进 ${added} 箱。请画出数量变化关系并求现在箱数。`,
        ...(difficulty === '基础'
          ? buildNumericOptions(answer, rand, { step: 1, min: 1, max: 120 })
          : {
              answer: `${answer}`,
              keywords: ['原有', '运走', '补进', '现在'],
              referenceSteps: [
                '找出初始量、减少量、增加量。',
                `列式：${start}-${used}+${added}。`,
                `计算得到现在有 ${answer} 箱。`,
              ],
            }),
        explanation: `数量关系为“原有-运走+补进”，所以 ${start}-${used}+${added}=${answer}。`,
      })
    },
    () => {
      const speed = pickInt(rand, 40, difficulty === '基础' ? 70 : 90)
      const time = pickInt(rand, 2, difficulty === '挑战' ? 6 : 4)
      const rest = pickInt(rand, 15, 35)
      const total = speed * time + rest
      return makeQuestion({
        id,
        textbookId,
        chapterId,
        difficulty,
        questionType: difficulty === '基础' ? 'choice' : 'open',
        stem:
          difficulty === '基础'
            ? `应用建模：汽车每小时行 ${speed} 千米，行驶 ${time} 小时后还剩 ${rest} 千米。全程多少千米？`
            : `应用建模：汽车每小时行 ${speed} 千米，行驶 ${time} 小时后还剩 ${rest} 千米。请根据“已行路程+剩余路程=全程”建模求全程。`,
        ...(difficulty === '基础'
          ? buildNumericOptions(total, rand, { step: 5, min: 20, max: 600 })
          : {
              answer: `${total}`,
              keywords: ['速度', '时间', '路程', '剩余'],
              referenceSteps: [
                `已行路程=${speed}×${time}=${speed * time}。`,
                `全程=已行路程+剩余路程=${speed * time}+${rest}。`,
                `全程为 ${total} 千米。`,
              ],
            }),
        explanation: `已行 ${speed}×${time}=${speed * time} 千米，全程为 ${speed * time}+${rest}=${total} 千米。`,
      })
    },
  ]

  return templates[pickInt(rand, 0, templates.length - 1)]()
}

function buildAdvancedChallengeQuestion(rand, id, textbookId, chapterId, category) {
  const mk = (base) =>
    makeQuestion({
      id,
      textbookId,
      chapterId,
      difficulty: '挑战',
      questionType: 'composite',
      source: '自动生成',
      ...base,
    })

  const algebraTemplates = [
    () => {
      const a = pickInt(rand, 2, 6)
      const b = pickInt(rand, 2, 7)
      const c = pickInt(rand, 1, 5)
      const x = pickInt(rand, -4, 6)
      const value = (a + b) * x * x + c * x
      return mk({
        stem: `综合计算：先化简 A=${a}x(x+1)+${b}x(x-1)+${c}x，再求当 x=${x} 时 A 的值。`,
        answer: `${value}`,
        explanation: `先展开并合并：A=${a + b}x²+${c}x；代入 x=${x} 得 A=${value}。`,
        keywords: ['展开', '合并同类项', '代入'],
        referenceSteps: ['展开每个括号。', '合并同类项得到关于 x 的式子。', `代入 x=${x} 计算数值。`],
      })
    },
    () => {
      const p = pickInt(rand, 2, 5)
      const q = pickInt(rand, 1, 6)
      const r = pickInt(rand, 1, 4)
      const ans = p * p - q * q + r
      return mk({
        stem: `综合计算：计算 (x+${q})(x-${q})+( ${p}x-${p} )( ${p}x+${p} ) 在 x=1 时的值，并再加上 ${r}。`,
        answer: `${ans}`,
        explanation: `利用平方差公式化简后代入 x=1，结果为 ${ans}。`,
        keywords: ['平方差', '代入'],
        referenceSteps: ['两组乘积先用平方差公式。', '再代入 x=1。', `最后加上 ${r}。`],
      })
    },
  ]

  const equationTemplates = [
    () => {
      const x = pickInt(rand, 8, 28)
      const a = pickInt(rand, 3, 8)
      const b = pickInt(rand, 2, 6)
      const c = pickInt(rand, 2, 9)
      const rhs = a * (2 * x - b) - (a - 1) * (x + c)
      return mk({
        stem: `高阶挑战：解 ${a}(2x-${b})-(${a - 1})(x+${c})=${rhs}。`,
        answer: `${x}`,
        explanation: `先去括号并合并同类项，再移项得到一元一次方程，解得 x=${x}。`,
        keywords: ['去括号', '合并同类项', '移项'],
        referenceSteps: ['去括号。', '合并同类项。', '移项求解并验算。'],
      })
    },
    () => {
      const x = pickInt(rand, 6, 22)
      const p = 2 * pickInt(rand, 1, 3)
      const q = pickInt(rand, 2, 6)
      const r = pickInt(rand, 1, 7)
      const rhs = (p * (x + r)) / 2 + (3 * q * (x - r)) / 6
      return mk({
        stem: `高阶挑战：解 [${p}(x+${r})]/2 + [${3 * q}(x-${r})]/6 = ${rhs}。`,
        answer: `${x}`,
        explanation: `先约分与去分母，再化简为一元一次方程，解得 x=${x}。`,
        keywords: ['去分母', '约分', '移项'],
        referenceSteps: ['先把分母统一处理。', '再去括号并合并同类项。', '解方程并验算。'],
      })
    },
    () => {
      const x = pickInt(rand, 4, 15)
      const a = pickInt(rand, 2, 7)
      const b = pickInt(rand, 2, 6)
      const m = a * x - b
      return mk({
        stem: `参数挑战：若关于 x 的方程 ${a}x-${b}=m 的解是 x=${x}，求参数 m。`,
        answer: `${m}`,
        explanation: `把 x=${x} 代入 ${a}x-${b}=m，得 m=${a}×${x}-${b}=${m}。`,
        keywords: ['参数', '代入', '方程'],
        referenceSteps: ['把已知解代入方程。', '计算右侧参数值。'],
      })
    },
    () => {
      const x = pickInt(rand, 7, 26)
      const a = pickInt(rand, 2, 5)
      const b = pickInt(rand, 2, 6)
      const c = pickInt(rand, 1, 4)
      const d = pickInt(rand, 1, 5)
      const rhs = a * (x - b) + c * (x + d) - (a - c) * x
      return mk({
        stem: `高阶挑战：解 ${a}(x-${b})+${c}(x+${d})-(${a - c})x=${rhs}。`,
        answer: `${x}`,
        explanation: `先整体化简左边，再移项解出 x=${x}。`,
        keywords: ['整体化简', '移项'],
        referenceSteps: ['去括号并合并。', '移项求 x。', '验算。'],
      })
    },
    () => {
      const x = pickInt(rand, 6, 24)
      const p = pickInt(rand, 2, 5)
      let q = pickInt(rand, 2, 6)
      if (q === p) q += 1
      const t = pickInt(rand, 4, 10)
      const total = p * x + q * (x + t)
      return mk({
        stem: `应用挑战：某班团购练习册，A类每本 ${p} 元买 x 本，B类每本 ${q} 元买 x+${t} 本，共花 ${total} 元。求 x。`,
        answer: `${x}`,
        explanation: `由总价列方程 ${p}x+${q}(x+${t})=${total}，解得 x=${x}。`,
        keywords: ['设元', '列方程', '总价'],
        referenceSteps: ['设未知数 x。', '写总价方程。', '解并验算。'],
      })
    },
    () => {
      const x = pickInt(rand, 8, 30)
      const unit = pickInt(rand, 12, 26)
      const trigger = pickInt(rand, 5, 10)
      const off = pickInt(rand, 2, 6)
      const total = unit * trigger + (unit - off) * (x - trigger)
      return mk({
        stem: `应用挑战（分段计价）：单价 ${unit} 元，超过 ${trigger} 件后超出部分每件优惠 ${off} 元。某次购买共付 ${total} 元，求购买件数 x。`,
        answer: `${x}`,
        explanation: `列方程 ${unit}×${trigger}+(${unit}-${off})(x-${trigger})=${total}，解得 x=${x}。`,
        keywords: ['分段函数思想', '方程建模'],
        referenceSteps: ['分段写总价。', '列方程。', '求解并验算。'],
      })
    },
    () => {
      const ten = pickInt(rand, 2, 7)
      const one = pickInt(rand, ten + 1, 9)
      const x = one
      const diff = (10 * one + ten) - (10 * ten + one)
      return mk({
        stem: `应用挑战（数位）：某两位数十位是 ${ten}，个位是 x。交换数位后，新数比原数大 ${diff}。求 x。`,
        answer: `${x}`,
        explanation: `原数 10×${ten}+x，新数 10x+${ten}，列方程 (10x+${ten})-(10×${ten}+x)=${diff}，解得 x=${x}。`,
        keywords: ['两位数', '位值'],
        referenceSteps: ['按位值写数。', '根据差值列式。', '解得 x。'],
      })
    },
    () => {
      const x = pickInt(rand, 4, 18)
      const m = pickInt(rand, 2, 6)
      const n = pickInt(rand, 1, 5)
      const y = m * x + n
      const z = (m + 1) * x - n
      return mk({
        stem: `综合挑战：已知 y=${m}x+${n}，z=${m + 1}x-${n}，且 2y-z=${2 * y - z}。求 x。`,
        answer: `${x}`,
        explanation: `先化简 2y-z，再代入已知值解方程，得 x=${x}。`,
        keywords: ['代数式化简', '一元一次方程'],
        referenceSteps: ['写出 2y-z。', '代入并化简。', '解出 x。'],
      })
    },
    () => {
      const x = pickInt(rand, 9, 36)
      const fast = pickInt(rand, 14, 24)
      const slow = pickInt(rand, 5, 12)
      const gap = (fast - slow) * x
      return mk({
        stem: `应用挑战（追及）：甲速 ${slow} m/min，乙速 ${fast} m/min，同向出发且初始相距 ${gap} m。乙追上甲需多少分钟？`,
        answer: `${x}`,
        explanation: `设需 t 分钟，按速度差列式 (${fast}-${slow})t=${gap}，解得 t=${x}。`,
        keywords: ['追及问题', '速度差'],
        referenceSteps: ['设追及时间为 t。', '列速度差方程。', '求解 t。'],
      })
    },
    () => {
      const years = pickInt(rand, 2, 6)
      const ratio = pickInt(rand, 2, 4)
      const bNow = pickInt(rand, 6, 13)
      const aNow = ratio * (bNow + years) - years
      const diff = aNow - bNow
      return mk({
        stem: `应用挑战（年龄）：甲现 ${aNow} 岁，乙现 ${bNow} 岁。${years} 年后甲是乙的 ${ratio} 倍。设甲比乙大 x 岁，求 x。`,
        answer: `${diff}`,
        explanation: `由 (${bNow}+${years})×${ratio}=${aNow}+${years}，年龄差 x=${aNow}-${bNow}=${diff}。`,
        keywords: ['年龄方程', '设元'],
        referenceSteps: ['根据“若干年后倍数”列式。', '求年龄差 x。'],
      })
    },
    () => {
      const x = pickInt(rand, 10, 30)
      const a = pickInt(rand, 2, 6)
      const b = pickInt(rand, 2, 6)
      const rhs = a * (x - b) + b * (x + a) - (a + b)
      return mk({
        stem: `高阶挑战：解 ${a}(x-${b})+${b}(x+${a})-${a + b}=${rhs}，并说明为何可先合并含 x 项。`,
        answer: `${x}`,
        explanation: `去括号后同类项可直接合并，得到一元一次方程，解得 x=${x}。`,
        keywords: ['同类项', '化简', '移项'],
        referenceSteps: ['去括号。', '合并含 x 项与常数项。', '移项求解。'],
      })
    },
    () => {
      const x = pickInt(rand, 4, 16)
      const a = 2 * pickInt(rand, 2, 6)
      const b = 2 * pickInt(rand, 1, 5)
      const c = 3 * pickInt(rand, 1, 4)
      const rhs = (a * x) / 2 - (b * (x - 1)) / 2 + c
      return mk({
        stem: `高阶挑战：解 (${a}x)/2 - [${b}(x-1)]/2 + ${c} = ${rhs}。`,
        answer: `${x}`,
        explanation: `先去分母并化简，解得 x=${x}。`,
        keywords: ['去分母', '去括号', '合并同类项'],
        referenceSteps: ['先清分母。', '化简。', '移项求解并验算。'],
      })
    },
  ]

  const geometryTemplates = [
    () => {
      const a = pickInt(rand, 35, 75)
      const b = pickInt(rand, 20, 50)
      const ans = 180 - a - b
      return mk({
        stem: `角度综合：在 △ABC 中，延长 BC 到 D，已知 ∠A=${a}°，外角 ∠ACD=${a + b}°。求 ∠B。`,
        answer: `${b}°`,
        explanation: `外角等于两内对角和，∠ACD=∠A+∠B，所以 ∠B=${b}°。`,
        keywords: ['外角', '内对角'],
        referenceSteps: ['写出三角形外角定理。', '代入已知角。', '求出 ∠B。'],
      })
    },
    () => {
      const x = pickInt(rand, 18, 38)
      const y = pickInt(rand, 52, 86)
      const ans = 180 - x - y
      return mk({
        stem: `角度综合：如图条件可得三角形两角分别为 ${x}° 与 ${y}°，求第三角。`,
        answer: `${ans}°`,
        explanation: `三角形内角和 180°，第三角=180°-${x}°-${y}°=${ans}°。`,
        keywords: ['内角和', '180'],
        referenceSteps: ['三角形内角和定理。', '代入两个已知角。', '计算第三角。'],
      })
    },
  ]

  const functionTemplates = [
    () => {
      const m = pickInt(rand, 2, 6)
      const b = pickInt(rand, -8, 10)
      const x1 = pickInt(rand, -3, 2)
      const x2 = pickInt(rand, 3, 8)
      const delta = m * (x2 - x1)
      return mk({
        stem: `函数综合：一次函数 y=${m}x${b >= 0 ? '+' : ''}${b}，求当 x 从 ${x1} 增加到 ${x2} 时，y 的增量。`,
        answer: `${delta}`,
        explanation: `一次函数增量只与斜率和 x 变化量有关，Δy=${m}×(${x2}-${x1})=${delta}。`,
        keywords: ['斜率', '增量'],
        referenceSteps: ['写出 y2-y1。', '代入一次函数表达式。', '化简得到增量。'],
      })
    },
  ]

  const probabilityTemplates = [
    () => {
      const red = pickInt(rand, 3, 8)
      const blue = pickInt(rand, 2, 7)
      const total = red + blue
      const ans = Number((1 - red / total).toFixed(2))
      return mk({
        stem: `概率综合：袋中有红球 ${red} 个、蓝球 ${blue} 个，随机取 1 个，取到“非红球”的概率是（保留两位小数）。`,
        answer: `${ans.toFixed(2)}`,
        explanation: `P(非红)=1-P(红)=1-${red}/${total}=${ans.toFixed(2)}。`,
        keywords: ['对立事件', '概率'],
        referenceSteps: ['先求 P(红)。', '用 1 减去 P(红)。', '保留两位小数。'],
      })
    },
  ]

  const byCategory = {
    arithmetic: algebraTemplates,
    application: equationTemplates,
    algebra: algebraTemplates,
    statistics: probabilityTemplates,
    'quadratic-function': functionTemplates,
    'quadratic-equation': equationTemplates,
    trigonometry: geometryTemplates,
    ratio: algebraTemplates,
    equation: equationTemplates,
    'system-equation': equationTemplates,
    geometry: geometryTemplates,
    function: functionTemplates,
    probability: probabilityTemplates,
  }

  const pool = byCategory[category] || algebraTemplates
  const serial = Number(String(id).split('-').pop()) || 1
  const offset = hashSeed(`${textbookId}-${chapterId}-${category}`) % pool.length
  const index = (serial - 1 + offset) % pool.length
  return pool[index]()
}

function buildPilotChallengeQuestion(rand, id, textbookId, chapterId, difficulty) {
  if (difficulty === '挑战') {
    const category = chapterCategory({ id: chapterId, name: '' })
    return buildAdvancedChallengeQuestion(rand, id, textbookId, chapterId, category)
  }
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
  '6a-c2': 'algebra',
  '6a-c3': 'equation',
  '6a-c4': 'geometry',
  '6a-c5': 'ratio',
  '6a-c6': 'ratio',
  '6a-c7': 'statistics',
  '6a-c8': 'application',
  '6b-c1': 'ratio',
  '6b-c2': 'geometry',
  '6b-c3': 'statistics',
  '6b-c4': 'application',
  '6b-c5': 'equation',
  '6b-c6': 'geometry',
  '6b-c7': 'geometry',
  '6b-c8': 'probability',
  '7a-c1': 'algebra',
  '7a-c2': 'equation',
  '7a-c3': 'geometry',
  '7a-c4': 'algebra',
  '7a-c5': 'ratio',
  '7a-c6': 'ratio',
  '7a-c7': 'algebra',
  '7a-c8': 'application',
  '7b-c1': 'equation',
  '7b-c2': 'system-equation',
  '7b-c3': 'statistics',
  '7b-c4': 'geometry',
  '7b-c5': 'algebra',
  '7b-c6': 'geometry',
  '7b-c7': 'geometry',
  '7b-c8': 'application',
  '8a-c1': 'function',
  '8a-c2': 'geometry',
  '8a-c3': 'algebra',
  '8a-c4': 'statistics',
  '8a-c5': 'geometry',
  '8a-c6': 'algebra',
  '8a-c7': 'function',
  '8a-c8': 'application',
  '8b-c1': 'ratio',
  '8b-c2': 'geometry',
  '8b-c3': 'geometry',
  '8b-c4': 'probability',
  '8b-c5': 'function',
  '8b-c6': 'geometry',
  '8b-c7': 'statistics',
  '8b-c8': 'application',
  '9a-c1': 'quadratic-function',
  '9a-c2': 'geometry',
  '9a-c3': 'geometry',
  '9a-c4': 'application',
  '9a-c5': 'quadratic-equation',
  '9a-c6': 'quadratic-function',
  '9a-c7': 'geometry',
  '9a-c8': 'application',
  '9b-c1': 'trigonometry',
  '9b-c2': 'statistics',
  '9b-c3': 'application',
  '9b-c4': 'application',
  '9b-c5': 'geometry',
  '9b-c6': 'function',
  '9b-c7': 'geometry',
  '9b-c8': 'application',
}

function chapterCategory(chapter) {
  const name = `${chapter.name ?? ''}`
  const id = `${chapter.id ?? ''}`

  if (CHAPTER_CATEGORY_BY_ID[id]) return CHAPTER_CATEGORY_BY_ID[id]

  if (/几何|图形|角|三角|全等|相似|圆|平行|坐标|勾股|变换|证明/.test(name)) return 'geometry'
  if (/方程组/.test(name)) return 'system-equation'
  if (/二次函数/.test(name)) return 'quadratic-function'
  if (/一元二次方程/.test(name)) return 'quadratic-equation'
  if (/三角函数/.test(name)) return 'trigonometry'
  if (/统计|抽样|数据/.test(name)) return 'statistics'
  if (/整式|因式|指数|实数|根式/.test(name)) return 'algebra'
  if (/方程|不等式|分式|因式/.test(name)) return 'equation'
  if (/函数/.test(name)) return 'function'
  if (/概率/.test(name)) return 'probability'
  if (/应用|建模|综合|中考|压轴|真题/.test(name)) return 'application'
  if (/比|比例|分数|小数/.test(name)) return 'ratio'

  if (/c2|c3|c4/.test(id) && /^8a|^8b|^9a|^9b/.test(id)) return 'geometry'
  return 'arithmetic'
}

function factoryByCategory(category) {
  if (category === 'algebra') return algebraExpressionQuestion
  if (category === 'application') return applicationModelQuestion
  if (category === 'statistics') return statisticsQuestion
  if (category === 'quadratic-function') return quadraticFunctionQuestion
  if (category === 'quadratic-equation') return quadraticEquationQuestion
  if (category === 'trigonometry') return trigonometryQuestion
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
  const normalizedCurated = curatedQuestions.map((q, i) => {
    const source = q.source ?? (i % 2 === 0 ? '教材真题' : '教师自编')
    const isPdfWorkbook = source === 'SB' || source === 'PDF练习册'
    const difficulty = q.difficulty ?? (isPdfWorkbook ? '提升' : '基础')
    return {
      ...q,
      source,
      difficulty,
      questionType: q.questionType ?? 'choice',
    }
  })
  const ids = new Set(normalizedCurated.map((q) => q.id))
  const dedupedGenerated = generatedQuestions.filter((q) => !ids.has(q.id))
  return [...normalizedCurated, ...dedupedGenerated]
}
