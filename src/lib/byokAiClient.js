const SETTINGS_KEY = 'math-planet-ai-settings-v1'

export const AI_PROVIDER_PRESETS = {
  openai: {
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    endpointType: 'responses',
    defaultModel: 'gpt-4.1-mini',
    models: ['gpt-4.1-mini', 'gpt-4.1', 'gpt-4o-mini', 'gpt-4o'],
  },
  deepseek: {
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    endpointType: 'chat',
    defaultModel: 'deepseek-v4-flash',
    models: ['deepseek-v4-flash', 'deepseek-v4-pro', 'deepseek-chat', 'deepseek-reasoner'],
  },
  kimi: {
    label: 'Kimi / Moonshot',
    baseUrl: 'https://api.moonshot.ai/v1',
    endpointType: 'chat',
    defaultModel: 'kimi-k2.5',
    models: ['kimi-k2.5', 'kimi-k2.6'],
  },
  minimax: {
    label: 'MiniMax',
    baseUrl: 'https://api.minimax.io/v1',
    endpointType: 'chat',
    defaultModel: 'MiniMax-M2.7',
    models: ['MiniMax-M2.7', 'MiniMax-M2.7-highspeed', 'MiniMax-M2.5', 'MiniMax-M2.5-highspeed', 'MiniMax-M2.1', 'MiniMax-M2'],
  },
  minimaxLegacy: {
    label: 'MiniMax 旧版 Text 接口',
    baseUrl: 'https://api.minimax.io/v1',
    endpointType: 'minimaxText',
    defaultModel: 'MiniMax-M2.7',
    models: ['MiniMax-M2.7', 'MiniMax-M2.7-highspeed', 'MiniMax-M2.5', 'MiniMax-M2.5-highspeed', 'MiniMax-M2.1', 'MiniMax-M2'],
  },
  minimaxCn: {
    label: 'MiniMax 中国站（如账号要求）',
    baseUrl: 'https://api.minimaxi.com/v1',
    endpointType: 'chat',
    defaultModel: 'MiniMax-M2.7',
    models: ['MiniMax-M2.7', 'MiniMax-M2.7-highspeed', 'MiniMax-M2.5', 'MiniMax-M2.5-highspeed', 'MiniMax-M2.1', 'MiniMax-M2'],
  },
  zhipu: {
    label: '智谱 / BigModel',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    endpointType: 'chat',
    defaultModel: 'glm-4.5-flash',
    models: ['glm-4.5-flash', 'glm-4.5-air', 'glm-4.5', 'glm-4.5v', 'glm-4.6', 'glm-4.6v', 'glm-4.7'],
  },
  qwenCn: {
    label: '通义千问 / DashScope 北京',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    endpointType: 'chat',
    defaultModel: 'qwen-plus',
    models: ['qwen-plus', 'qwen-turbo', 'qwen-max', 'qwen-long', 'qwen-vl-plus', 'qwen-vl-max', 'qwen3.6-plus', 'qwen3.6-flash', 'qwen3.6-max-preview'],
  },
  qwenIntl: {
    label: '通义千问 / DashScope 国际',
    baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    endpointType: 'chat',
    defaultModel: 'qwen-plus',
    models: ['qwen-plus', 'qwen-turbo', 'qwen-max', 'qwen-long', 'qwen-vl-plus', 'qwen-vl-max', 'qwen3.6-plus', 'qwen3.6-flash', 'qwen3.6-max-preview'],
  },
  zai: {
    label: 'Z.ai',
    baseUrl: 'https://api.z.ai/api/paas/v4',
    endpointType: 'chat',
    defaultModel: 'glm-4.5-flash',
    models: ['glm-4.5-flash', 'glm-4.5-air', 'glm-4.5', 'glm-4.5v', 'glm-4.6', 'glm-4.6v', 'glm-4.7'],
  },
  custom: {
    label: '自定义 OpenAI-compatible',
    baseUrl: 'https://example.com/v1',
    endpointType: 'chat',
    defaultModel: '',
    models: [],
  },
}

export const DEFAULT_AI_SETTINGS = {
  provider: 'openai',
  baseUrl: AI_PROVIDER_PRESETS.openai.baseUrl,
  endpointType: AI_PROVIDER_PRESETS.openai.endpointType,
  model: AI_PROVIDER_PRESETS.openai.defaultModel,
  apiKey: '',
}

export function loadAiSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? { ...DEFAULT_AI_SETTINGS, ...JSON.parse(raw) } : DEFAULT_AI_SETTINGS
  } catch {
    return DEFAULT_AI_SETTINGS
  }
}

export function saveAiSettings(settings) {
  const next = {
    ...DEFAULT_AI_SETTINGS,
    ...settings,
    endpointType: settings.endpointType || DEFAULT_AI_SETTINGS.endpointType,
    baseUrl: (settings.baseUrl || DEFAULT_AI_SETTINGS.baseUrl).replace(/\/+$/, ''),
    apiKey: settings.apiKey || '',
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  return next
}

export function clearAiSettings() {
  localStorage.removeItem(SETTINGS_KEY)
  return DEFAULT_AI_SETTINGS
}

function extractOutputText(data) {
  if (data.output_text) return data.output_text
  const chunks = []
  data.output?.forEach((item) => {
    item.content?.forEach((content) => {
      if (content.type === 'output_text' && content.text) chunks.push(content.text)
      if (content.type === 'text' && content.text) chunks.push(content.text)
    })
  })
  return chunks.join('\n').trim()
}

function parseJsonFromText(text) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()
  return JSON.parse(cleaned)
}

function buildPrompt(text, hasImage) {
  return `
你是面向中国初中生的数学错题 AI 陪练。请解析学生输入${hasImage ? '和上传图片中' : ''}的错题。

要求：
1. 用中文回答，语气清晰、鼓励、适合初中生。
2. 给出知识点、解题思路、参考答案、易错点。
3. 生成 3 道同知识点练习题，题目要有答案和简短解析。
4. 如果题目信息不完整，请明确指出缺少什么。
5. 严格返回 JSON，不要返回 Markdown。

JSON 结构：
{
  "summary": "一句话概括",
  "knowledge": ["知识点1", "知识点2"],
  "answer": "参考答案",
  "steps": ["步骤1", "步骤2", "步骤3"],
  "mistakes": ["易错点1", "易错点2"],
  "practice": [
    {"stem": "练习题1", "answer": "答案", "explanation": "解析"},
    {"stem": "练习题2", "answer": "答案", "explanation": "解析"},
    {"stem": "练习题3", "answer": "答案", "explanation": "解析"}
  ]
}

学生输入：
${text || (hasImage ? '学生上传了图片，请识别图片中的题目。' : '学生未输入题目。')}
`.trim()
}

async function callResponsesApi({ baseUrl, apiKey, model, prompt, imageDataUrl }) {
  const content = [{ type: 'input_text', text: prompt }]
  if (imageDataUrl) {
    content.push({ type: 'input_image', image_url: imageDataUrl, detail: 'auto' })
  }

  const res = await fetch(`${baseUrl}/responses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: [{ role: 'user', content }],
      temperature: 0.2,
      store: false,
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || `AI 请求失败：HTTP ${res.status}`)
  }
  return extractOutputText(data)
}

async function callChatCompletionsApi({ baseUrl, apiKey, model, prompt, imageDataUrl }) {
  const content = imageDataUrl
    ? [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageDataUrl } },
      ]
    : prompt

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content,
        },
      ],
      temperature: 0.2,
      stream: false,
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || data.base_resp?.status_msg || `AI 请求失败：HTTP ${res.status}`)
  }
  return data.choices?.[0]?.message?.content || data.output_text || ''
}

async function callMiniMaxTextApi({ baseUrl, apiKey, model, prompt }) {
  const res = await fetch(`${baseUrl}/text/chatcompletion_v2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          name: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      stream: false,
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || data.base_resp?.status_msg || `AI 请求失败：HTTP ${res.status}`)
  }
  return data.choices?.[0]?.message?.content || data.output_text || ''
}

export async function analyzeWrongQuestionWithAi({ text, imageDataUrl, settings }) {
  const merged = { ...DEFAULT_AI_SETTINGS, ...settings }
  const apiKey = merged.apiKey?.trim()
  if (!apiKey) throw new Error('请先填写并保存 API Key。')

  const baseUrl = (merged.baseUrl || DEFAULT_AI_SETTINGS.baseUrl).replace(/\/+$/, '')
  const model = merged.model?.trim() || DEFAULT_AI_SETTINGS.model
  const endpointType = merged.endpointType || AI_PROVIDER_PRESETS[merged.provider]?.endpointType || 'chat'
  const prompt = buildPrompt(text, Boolean(imageDataUrl))

  const outputText =
    endpointType === 'responses'
      ? await callResponsesApi({ baseUrl, apiKey, model, prompt, imageDataUrl })
      : endpointType === 'minimaxText'
        ? await callMiniMaxTextApi({ baseUrl, apiKey, model, prompt })
      : await callChatCompletionsApi({ baseUrl, apiKey, model, prompt, imageDataUrl })

  if (!outputText) throw new Error('AI 没有返回可解析内容。')

  try {
    return parseJsonFromText(outputText)
  } catch {
    return {
      summary: 'AI 已返回解析，但格式不是标准 JSON。',
      knowledge: ['AI 解析结果'],
      answer: outputText,
      steps: ['请查看下方原始解析内容。'],
      mistakes: [],
      practice: [],
    }
  }
}

export async function validateAiSettings(settings) {
  const merged = { ...DEFAULT_AI_SETTINGS, ...settings }
  const apiKey = merged.apiKey?.trim()
  if (!apiKey) throw new Error('请先填写 API Key。')

  const baseUrl = (merged.baseUrl || DEFAULT_AI_SETTINGS.baseUrl).replace(/\/+$/, '')
  const model = merged.model?.trim() || DEFAULT_AI_SETTINGS.model
  const endpointType = merged.endpointType || AI_PROVIDER_PRESETS[merged.provider]?.endpointType || 'chat'
  const prompt = '请只回复 OK，用于验证 API Key、URL、模型和接口是否可用。'

  const outputText =
    endpointType === 'responses'
      ? await callResponsesApi({ baseUrl, apiKey, model, prompt })
      : endpointType === 'minimaxText'
        ? await callMiniMaxTextApi({ baseUrl, apiKey, model, prompt })
        : await callChatCompletionsApi({ baseUrl, apiKey, model, prompt })

  return outputText || 'OK'
}
