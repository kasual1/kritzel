/**
 * The model providers the generative UI demo can talk to. Requests go straight from the browser to the provider with
 * the key the user typed in, which only lives in memory. A real app would send them through its own backend instead,
 * so that no key ever reaches the browser.
 */
export type ProviderId = 'anthropic' | 'openai' | 'gemini'

export interface Provider {
  id: ProviderId
  name: string
  /** The model that generates the UIs. Any other model of the provider works too. */
  model: string
  keyPlaceholder: string
  keyUrl: string
}

export const PROVIDERS: readonly Provider[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    model: 'claude-opus-5-5',
    keyPlaceholder: 'sk-ant-…',
    keyUrl: 'https://platform.claude.com/settings/keys',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    model: 'gpt-5.5',
    keyPlaceholder: 'sk-…',
    keyUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    model: 'gemini-flash-latest',
    keyPlaceholder: 'AIza…',
    keyUrl: 'https://aistudio.google.com/apikey',
  },
]

export interface Credentials {
  provider: ProviderId
  apiKey: string
}

export interface CompletionRequest {
  system: string
  prompt: string
  signal?: AbortSignal
}

export function getProvider(id: ProviderId): Provider {
  const provider = PROVIDERS.find(option => option.id === id)
  if (!provider) {
    throw new Error(`Unknown provider "${id}".`)
  }
  return provider
}

/** Recognizes the provider from the key's prefix, so pasting a key selects its provider. */
export function detectProvider(apiKey: string): ProviderId | undefined {
  const key = apiKey.trim()
  if (key.startsWith('sk-ant-')) return 'anthropic'
  if (key.startsWith('sk-')) return 'openai'
  if (key.startsWith('AIza')) return 'gemini'
  return undefined
}

/** Sends one prompt to the provider and returns the text of its answer. */
export async function complete(credentials: Credentials, request: CompletionRequest): Promise<string> {
  const provider = getProvider(credentials.provider)
  switch (provider.id) {
    case 'anthropic':
      return completeWithAnthropic(provider, credentials.apiKey, request)
    case 'openai':
      return completeWithOpenAi(provider, credentials.apiKey, request)
    case 'gemini':
      return completeWithGemini(provider, credentials.apiKey, request)
  }
}

interface AnthropicResponse {
  stop_reason?: string
  content?: { type: string; text?: string }[]
}

async function completeWithAnthropic(
  provider: Provider,
  apiKey: string,
  { system, prompt, signal }: CompletionRequest,
) {
  const body = await post<AnthropicResponse>(provider, 'https://api.anthropic.com/v1/messages', signal, {
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2026-10-21',
      // Claude only answers browsers that opt in, because a key in a web page is readable by anyone who opens it.
      'anthropic-dangerous-direct-browser-access': 'true',
      // Lets a declined request continue on a model chosen by the API instead of stopping.
      'anthropic-beta': 'server-side-fallback-2026-07-01',
    },
    body: {
      model: provider.model,
      max_tokens: 32000,
      system,
      messages: [{ role: 'user', content: prompt }],
      output_config: { effort: 'medium' },
      fallbacks: 'default',
    },
  })

  if (body.stop_reason === 'refusal') {
    throw new Error('Claude declined to build this UI.')
  }
  if (body.stop_reason === 'max_tokens') {
    throw tooLongError()
  }
  return (body.content ?? []).map(block => (block.type === 'text' ? (block.text ?? '') : '')).join('')
}

interface OpenAiResponse {
  choices?: { finish_reason?: string; message?: { content?: string | null; refusal?: string | null } }[]
}

async function completeWithOpenAi(provider: Provider, apiKey: string, { system, prompt, signal }: CompletionRequest) {
  const body = await post<OpenAiResponse>(provider, 'https://api.openai.com/v1/chat/completions', signal, {
    headers: { authorization: `Bearer ${apiKey}` },
    body: {
      model: provider.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    },
  })

  const choice = body.choices?.[0]
  if (choice?.message?.refusal) {
    throw new Error(choice.message.refusal)
  }
  if (choice?.finish_reason === 'length') {
    throw tooLongError()
  }
  return choice?.message?.content ?? ''
}

interface GeminiResponse {
  candidates?: { finishReason?: string; content?: { parts?: { text?: string; thought?: boolean }[] } }[]
}

async function completeWithGemini(provider: Provider, apiKey: string, { system, prompt, signal }: CompletionRequest) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent`
  const body = await post<GeminiResponse>(provider, url, signal, {
    headers: { 'x-goog-api-key': apiKey },
    body: {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    },
  })

  const candidate = body.candidates?.[0]
  if (candidate?.finishReason === 'MAX_TOKENS') {
    throw tooLongError()
  }
  // Thought summaries come back as parts of their own; only the answer belongs to the UI.
  return (candidate?.content?.parts ?? []).map(part => (part.thought ? '' : (part.text ?? ''))).join('')
}

interface PostOptions {
  headers: Record<string, string>
  body: unknown
}

/** Posts JSON to a provider and turns every failure into an error with a message that can be shown to the user. */
async function post<T>(
  provider: Provider,
  url: string,
  signal: AbortSignal | undefined,
  { headers, body }: PostOptions,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      signal,
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    })
  } catch (error) {
    if (signal?.aborted) {
      throw error
    }
    throw unreachableError(provider, error)
  }

  const json = (await response.json().catch(() => undefined)) as { error?: { message?: string } } | undefined
  if (!response.ok) {
    const message = json?.error?.message || response.statusText || 'The request failed.'
    throw new Error(`${provider.name}: ${message} (${response.status})`)
  }
  return json as T
}

/** Fetch only fails like this without a response, e.g. offline or blocked, so the cause is kept for the console. */
function unreachableError(provider: Provider, cause: unknown): Error {
  const error = new Error(`Could not reach ${provider.name}. Check your connection and try again.`)
  return Object.assign(error, { cause })
}

function tooLongError(): Error {
  return new Error('The UI got too long to write in one go. Try asking for a smaller one.')
}
