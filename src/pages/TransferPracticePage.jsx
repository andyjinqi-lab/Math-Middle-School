import { useMemo, useState } from 'react'
import { BookOpenCheck, FileText, KeyRound, Lightbulb, Sparkles, Upload } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import IconBox from '../components/ui/IconBox'
import {
  AI_PROVIDER_PRESETS,
  analyzeWrongQuestionWithAi,
  clearAiSettings,
  loadAiSettings,
  saveAiSettings,
  validateAiSettings,
} from '../lib/byokAiClient'
import { formatMathDisplay } from '../lib/mathTextFormat'

const knowledgeRules = [
  { words: ['函数', '图像', '一次函数', '二次函数'], label: '函数图像与解析式' },
  { words: ['方程', 'x', '未知数'], label: '方程建模与求解' },
  { words: ['三角形', '角', '全等', '相似'], label: '几何图形与证明' },
  { words: ['平行四边形', '矩形', '菱形'], label: '四边形性质' },
  { words: ['分式', '分母', '约分'], label: '分式运算' },
  { words: ['概率', '统计', '平均数'], label: '统计与概率' },
]

function analyzeText(text) {
  const compact = text.trim()
  if (!compact) {
    return {
      source: 'rule',
      summary: '请先输入或上传一道错题，系统会根据题干提取知识点。',
      knowledge: ['待识别知识点'],
      answer: '待输入题目后生成解析。',
      steps: ['输入题目', '识别知识点', '给出解题路径', '推荐同类练习'],
      mistakes: [],
      practice: [],
    }
  }

  const knowledge = knowledgeRules
    .filter((rule) => rule.words.some((word) => compact.includes(word)))
    .map((rule) => rule.label)
  const finalKnowledge = knowledge.length ? knowledge : ['基础计算与审题']

  return {
    source: 'rule',
    summary: `这道题主要考查：${finalKnowledge.join('、')}。`,
    knowledge: finalKnowledge,
    answer: '当前为本地规则解析：请先拆题干条件，明确要求，再选择对应公式或性质。点击“用 API 解析错题”可生成更完整的答案、错因和变式练习。',
    steps: [
      '圈出已知条件和要求的量。',
      '判断题型对应的核心知识点。',
      '列式或画辅助图，按步骤推导。',
      '回代检查答案是否符合题意。',
    ],
    mistakes: ['只看数字不看条件', '没有检查答案是否符合题意'],
    practice: [],
  }
}

function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('图片读取失败，请重新上传。'))
    reader.readAsDataURL(file)
  })
}

export default function TransferPracticePage({ questions = [], onStartPractice }) {
  const [wrongText, setWrongText] = useState('')
  const [fileName, setFileName] = useState('')
  const [imageDataUrl, setImageDataUrl] = useState('')
  const [aiSettings, setAiSettings] = useState(() => loadAiSettings())
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [validateLoading, setValidateLoading] = useState(false)
  const [validateResult, setValidateResult] = useState('')
  const [practiceAnswers, setPracticeAnswers] = useState({})
  const [practiceRevealed, setPracticeRevealed] = useState({})
  const [settingsHint, setSettingsHint] = useState('')

  const ruleAnalysis = useMemo(() => analyzeText(wrongText), [wrongText])
  const analysis = aiAnalysis || ruleAnalysis

  const recommendedQuestions = useMemo(() => {
    const source = questions.filter((item) => item?.stem && item.source !== 'SB')
    if (Array.isArray(analysis.practice) && analysis.practice.length) return []
    if (!wrongText.trim()) return source.slice(0, 3)
    const hits = source.filter((item) =>
      analysis.knowledge?.some((tag) => `${item.stem}${item.explanation ?? ''}`.includes(tag.slice(0, 2))),
    )
    return (hits.length ? hits : source).slice(0, 3)
  }, [analysis.knowledge, analysis.practice, questions, wrongText])
  const practiceItems = useMemo(() => {
    if (Array.isArray(analysis.practice) && analysis.practice.length) {
      return analysis.practice.map((item, index) => ({
        id: `ai-${index}`,
        label: `AI 变式题 ${index + 1}`,
        stem: item.stem,
        answer: item.answer,
        explanation: item.explanation,
        source: 'ai',
      }))
    }

    return recommendedQuestions.map((item, index) => ({
      id: item.id ?? `bank-${index}`,
      label: `题库同类题 ${index + 1}`,
      stem: formatMathDisplay(item.stem),
      answer: item.answer ?? '暂无答案',
      explanation: item.explanation ?? '暂无解析',
      source: 'bank',
    }))
  }, [analysis.practice, recommendedQuestions])

  async function handleFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setAiAnalysis(null)
    setAiError('')

    if (file.type.startsWith('image/')) {
      const dataUrl = await readImageAsDataUrl(file)
      setImageDataUrl(dataUrl)
      setWrongText((prev) =>
        prev.trim() ? prev : `已上传图片：${file.name}\n可以补充题干文字，AI 会结合图片一起解析。`,
      )
      return
    }

    setImageDataUrl('')
    setWrongText((prev) =>
      prev.trim()
        ? prev
        : `已上传文件：${file.name}\n当前前端直连 API 先支持图片识别；PDF 可先复制题干文字到这里。`,
    )
  }

  function updateSettings(patch) {
    setAiSettings((prev) => ({ ...prev, ...patch }))
    setSettingsHint('')
    setValidateResult('')
  }

  function handleProviderChange(provider) {
    const preset = AI_PROVIDER_PRESETS[provider] ?? AI_PROVIDER_PRESETS.custom
    setAiSettings((prev) => ({
      ...prev,
      provider,
      baseUrl: preset.baseUrl,
      endpointType: preset.endpointType,
      model: preset.defaultModel || prev.model,
    }))
    setSettingsHint('')
    setValidateResult('')
  }

  function handleSaveSettings() {
    const next = saveAiSettings(aiSettings)
    setAiSettings(next)
    setSettingsHint('API 设置已保存在本浏览器。')
  }

  function handleClearSettings() {
    setAiSettings(clearAiSettings())
    setSettingsHint('API 设置已清除。')
  }

  async function handleAiAnalyze() {
    setAiLoading(true)
    setAiError('')
    try {
      const result = await analyzeWrongQuestionWithAi({
        text: wrongText,
        imageDataUrl,
        settings: aiSettings,
      })
      setAiAnalysis({ ...result, source: 'ai' })
      setPracticeAnswers({})
      setPracticeRevealed({})
    } catch (error) {
      setAiError(error.message || 'AI 解析失败，请检查 API Key、Base URL 和模型名。')
    } finally {
      setAiLoading(false)
    }
  }

  function updatePracticeAnswer(id, value) {
    setPracticeAnswers((prev) => ({ ...prev, [id]: value }))
  }

  function revealPractice(id) {
    setPracticeRevealed((prev) => ({ ...prev, [id]: true }))
  }

  async function handleValidateApi() {
    setValidateLoading(true)
    setValidateResult('')
    setAiError('')
    try {
      const text = await validateAiSettings(aiSettings)
      setValidateResult(`验证通过：${String(text).slice(0, 80)}`)
    } catch (error) {
      setValidateResult(`验证失败：${error.message || '请检查 Key、Base URL、Endpoint 和模型名。'}`)
    } finally {
      setValidateLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <Card variant="gradient" padding="lg">
        <div className="grid gap-5 lg:grid-cols-[0.58fr_0.42fr]">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge color="cyan">举一反三</Badge>
              <Badge color="purple">用户自带 API Key</Badge>
              <Badge color="green">错题解析 + 同类练习</Badge>
            </div>
            <h1 className="mt-4 text-3xl font-black leading-tight text-textMain md:text-4xl">
              上传或输入错题，AI 帮你拆出知识点，再练会一类题
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-textSub">
              用户可填写自己的 OpenAI API Key。Key 仅保存在当前浏览器，用于直接调用 AI 解析错题、生成答案、错因和同类练习。
            </p>
          </div>
          <div className="rounded-3xl border border-white bg-white/85 p-4 shadow-card">
            <div className="flex items-center gap-3">
              <IconBox color="cyan" icon={<Sparkles size={22} />} />
              <div>
                <p className="font-black text-textMain">解析流程</p>
                <p className="text-sm text-textSub">错题输入 → AI 解析 → 知识点 → 同类训练</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3">
          <IconBox color="purple" icon={<KeyRound size={22} />} />
          <div>
            <h2 className="text-lg font-black text-textMain">API Key 设置</h2>
            <p className="text-sm text-textSub">开放给用户自填 Key；保存后仅存储在本浏览器 localStorage。</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[0.85fr_1.2fr_1fr_0.8fr]">
          <label className="text-sm font-bold text-textSub">
            API 服务商
            <select
              value={aiSettings.provider}
              onChange={(event) => handleProviderChange(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-borderLight bg-surfaceSoft px-4 py-3 text-sm text-textMain outline-none focus:border-borderPrimary focus:bg-white"
            >
              {Object.entries(AI_PROVIDER_PRESETS).map(([key, preset]) => (
                <option key={key} value={key}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold text-textSub">
            API Key
            <input
              type="password"
              value={aiSettings.apiKey}
              onChange={(event) => updateSettings({ apiKey: event.target.value })}
              placeholder="sk-..."
              className="mt-1 w-full rounded-2xl border border-borderLight bg-surfaceSoft px-4 py-3 text-sm text-textMain outline-none focus:border-borderPrimary focus:bg-white"
            />
          </label>
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_0.8fr_0.8fr]">
          <label className="text-sm font-bold text-textSub">
            Base URL
            <input
              value={aiSettings.baseUrl}
              onChange={(event) => updateSettings({ baseUrl: event.target.value })}
              placeholder="https://api.openai.com/v1"
              className="mt-1 w-full rounded-2xl border border-borderLight bg-surfaceSoft px-4 py-3 text-sm text-textMain outline-none focus:border-borderPrimary focus:bg-white"
            />
          </label>
          <label className="text-sm font-bold text-textSub">
            Model
            {AI_PROVIDER_PRESETS[aiSettings.provider]?.models?.length ? (
              <select
                value={aiSettings.model}
                onChange={(event) => updateSettings({ model: event.target.value })}
                className="mt-1 w-full rounded-2xl border border-borderLight bg-surfaceSoft px-4 py-3 text-sm text-textMain outline-none focus:border-borderPrimary focus:bg-white"
              >
                {AI_PROVIDER_PRESETS[aiSettings.provider].models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={aiSettings.model}
                onChange={(event) => updateSettings({ model: event.target.value })}
                placeholder="model-name"
                className="mt-1 w-full rounded-2xl border border-borderLight bg-surfaceSoft px-4 py-3 text-sm text-textMain outline-none focus:border-borderPrimary focus:bg-white"
              />
            )}
          </label>
          <label className="text-sm font-bold text-textSub">
            Endpoint
            <select
              value={aiSettings.endpointType || AI_PROVIDER_PRESETS[aiSettings.provider]?.endpointType || 'chat'}
              onChange={(event) => updateSettings({ endpointType: event.target.value })}
              className="mt-1 w-full rounded-2xl border border-borderLight bg-surfaceSoft px-4 py-3 text-sm text-textMain outline-none focus:border-borderPrimary focus:bg-white"
            >
              <option value="responses">Responses API</option>
              <option value="chat">Chat Completions</option>
              <option value="minimaxText">MiniMax Text V2</option>
            </select>
          </label>
        </div>
        <div className="mt-3 rounded-2xl bg-softBlue px-4 py-3 text-xs leading-6 text-textSub">
          国内多数模型使用 OpenAI-compatible 的 <span className="font-black text-textMain">/chat/completions</span>；
          OpenAI 官方默认使用 <span className="font-black text-textMain">/responses</span>。
          如果供应商不支持图片，先把题干文字粘贴到输入框再解析。
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button onClick={handleSaveSettings}>保存 API 设置</Button>
          <Button variant="secondary" loading={validateLoading} onClick={handleValidateApi}>
            验证 API
          </Button>
          <Button variant="secondary" onClick={handleClearSettings}>清除 Key</Button>
          {settingsHint ? <span className="text-sm font-bold text-primary">{settingsHint}</span> : null}
        </div>
        {validateResult ? (
          <p
            className={`mt-3 rounded-2xl px-4 py-2 text-sm font-semibold ${
              validateResult.startsWith('验证通过')
                ? 'border border-secondary/20 bg-secondary/10 text-emerald-700'
                : 'border border-red/20 bg-red/10 text-error'
            }`}
          >
            {validateResult}
          </p>
        ) : null}
      </Card>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-textMain">错题输入</h2>
              <p className="mt-1 text-sm text-textSub">粘贴题干，或上传图片让 AI 结合图片解析。</p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-[14px] border border-borderPrimary bg-white px-4 py-2.5 text-sm font-bold text-primary shadow-card hover:bg-softBlue">
              <Upload size={16} />
              上传错题
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />
            </label>
          </div>
          {fileName ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-cyan/10 px-3 py-1.5 text-xs font-bold text-cyan">
              <FileText size={14} /> {fileName}
            </p>
          ) : null}
          <textarea
            value={wrongText}
            onChange={(event) => {
              setWrongText(event.target.value)
              setAiAnalysis(null)
            }}
            rows={12}
            placeholder="把错题题干粘贴到这里，例如：已知一次函数 y=kx+b 的图像经过..."
            className="mt-4 w-full rounded-2xl border border-borderLight bg-surfaceSoft px-4 py-3 text-sm leading-7 text-textMain outline-none transition focus:border-borderPrimary focus:bg-white"
          />
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button loading={aiLoading} onClick={handleAiAnalyze} iconLeft={<Sparkles size={16} />}>
              用 API 解析错题
            </Button>
            <span className="text-xs font-semibold text-textSub">
              {analysis.source === 'ai' ? '当前显示 AI 解析结果' : '当前显示本地规则预览'}
            </span>
          </div>
          {aiError ? (
            <p className="mt-3 rounded-2xl border border-red/20 bg-red/10 px-3 py-2 text-sm font-semibold text-error">
              {aiError}
            </p>
          ) : null}
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <IconBox color="purple" icon={<Lightbulb size={22} />} />
            <div>
              <h2 className="text-lg font-black text-textMain">解析与知识点</h2>
              <p className="text-sm text-textSub">AI 会生成答案、步骤、易错点和同类练习。</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-softBlue p-4">
            <p className="text-sm font-bold text-textMain">{analysis.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {analysis.knowledge?.map((item) => (
                <Badge key={item} color="blue">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <p className="text-sm font-black text-textMain">参考解题路径</p>
            {analysis.steps?.map((step, index) => (
              <div key={`${step}-${index}`} className="flex gap-3 rounded-2xl border border-borderLight bg-white p-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-black text-white">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-textSub">{step}</p>
              </div>
            ))}
          </div>
          {analysis.mistakes?.length ? (
            <div className="mt-4 rounded-2xl bg-red/10 p-4">
              <p className="text-sm font-black text-error">易错点</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-textMain">
                {analysis.mistakes.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="mt-4 rounded-2xl bg-orange/10 p-4">
            <p className="text-sm font-black text-amber-700">答案 / 解析</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-textMain">{analysis.answer}</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-textMain">同类题练习</h2>
            <p className="mt-1 text-sm text-textSub">AI 生成变式题，或从题库中推荐相关题。</p>
          </div>
          <Button onClick={onStartPractice} iconLeft={<BookOpenCheck size={16} />}>
            进入练习页
          </Button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {practiceItems.map((item) => {
            const revealed = Boolean(practiceRevealed[item.id])
            return (
              <div key={item.id} className="rounded-2xl border border-borderLight bg-surfaceSoft p-4">
                <Badge color={item.source === 'ai' ? 'cyan' : 'purple'}>{item.label}</Badge>
                <p className="mt-3 min-h-[72px] text-sm font-bold leading-6 text-textMain">{item.stem}</p>
                <label className="mt-4 block text-sm font-bold text-textSub">
                  你的答案
                  <textarea
                    value={practiceAnswers[item.id] ?? ''}
                    onChange={(event) => updatePracticeAnswer(item.id, event.target.value)}
                    rows={3}
                    placeholder="先写下你的答案或思路，再查看解析"
                    className="mt-1 w-full rounded-2xl border border-borderLight bg-white px-3 py-2 text-sm text-textMain outline-none focus:border-borderPrimary"
                  />
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => revealPractice(item.id)}>
                    {revealed ? '已显示解析' : '提交并查看解析'}
                  </Button>
                </div>
                {revealed ? (
                  <div className="mt-3 rounded-2xl bg-white p-3">
                    <p className="text-sm text-textSub">
                      <span className="font-black text-textMain">参考答案：</span>
                      {item.answer}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-textSub">
                      <span className="font-black text-textMain">解析：</span>
                      {item.explanation}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 rounded-2xl bg-primary/5 px-3 py-2 text-xs font-semibold text-primary">
                    答案和解析已隐藏，提交后再显示。
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
