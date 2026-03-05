import { fetch } from "expo/fetch";
import { AIConfig } from "./storage";
import { validateAPIKeyFormat, maskAPIKey, sanitizeErrorMessage } from "./encryption";
import { logError, retryWithBackoff, handleAPIError } from "./error-handler";

export interface AIModel {
  id: string;
  displayName: string;
  description: string;
}

export const AI_PROVIDERS = {
  openai: {
    name: "OpenAI",
    icon: "logo-github",
    color: "#10A37F",
    models: [
      { id: "gpt-5.3-instant", displayName: "GPT-5.3 Instant", description: "Latest flagship, human-like tone & reasoning" },
      { id: "gpt-5.2-pro", displayName: "GPT-5.2 Pro", description: "Smarter, more precise flagship" },
      { id: "gpt-5.2", displayName: "GPT-5.2", description: "Standard flagship for agentic tasks" },
      { id: "o3", displayName: "OpenAI o3", description: "Deep reasoning for complex science/math" },
      { id: "gpt-5.3-codex", displayName: "GPT-5.3 Codex", description: "Specialized for advanced coding" },
      { id: "gpt-5-mini", displayName: "GPT-5 Mini", description: "Cost-efficient, fast performance" },
      { id: "gpt-5-nano", displayName: "GPT-5 Nano", description: "Ultra-lightweight on-device tasks" },
      { id: "gpt-4o", displayName: "GPT-4o", description: "Legacy balanced performance" },
    ] as AIModel[],
  },
  gemini: {
    name: "Google Gemini",
    icon: "logo-google",
    color: "#4285F4",
    models: [
      { id: "gemini-3.1-pro", displayName: "Gemini 3.1 Pro", description: "Most intelligent flagship model" },
      { id: "gemini-3-deep-think", displayName: "Gemini 3 Deep Think", description: "Extreme reasoning & math focus" },
      { id: "gemini-3.1-flash", displayName: "Gemini 3.1 Flash", description: "Fast, efficient, long context" },
      { id: "gemini-3.1-flash-lite", displayName: "Gemini 3.1 Flash-Lite", description: "Ultra-fast, low latency responses" },
      { id: "gemini-2.5-flash-live", displayName: "Gemini 2.5 Flash Live", description: "Real-time bidirectional response" },
      { id: "gemini-2.5-pro", displayName: "Gemini 2.5 Pro", description: "Stable legacy flagship" },
      { id: "nano-banana-2", displayName: "Nano Banana 2", description: "SOTA Image generation & editing" },
    ] as AIModel[],
  },
  groq: {
    name: "Groq",
    icon: "flash",
    color: "#F55036",
    models: [
      { id: "llama-4-scout-17b", displayName: "Llama 4 Scout (17B)", description: "Next-gen open source, blazing fast" },
      { id: "llama-3.3-70b-versatile", displayName: "Llama 3.3 70B", description: "Highly stable & versatile open model" },
      { id: "qwen-qwq-32b", displayName: "Qwen QwQ 32B", description: "Alibaba's reasoning-heavy model" },
      { id: "qwen3-32b", displayName: "Qwen 3 32B", description: "General purpose speed king" },
      { id: "llama-3.1-8b-instant", displayName: "Llama 3.1 8B", description: "Instant responses for simple tasks" },
      { id: "mixtral-8x7b-32768", displayName: "Mixtral 8x7B", description: "Reliable mixture-of-experts" },
    ] as AIModel[],
  },
  anthropic: {
    name: "Anthropic Claude",
    icon: "sparkles",
    color: "#CC785C",
    models: [
      { id: "claude-3-5-opus-20240229", displayName: "Claude Opus 4.6", description: "Top intelligence, best for coding" },
      { id: "claude-3-5-sonnet-20241022", displayName: "Claude Sonnet 4.6", description: "Perfect balance of speed & smarts" },
      { id: "claude-3-5-haiku-20241022", displayName: "Claude Haiku 4.5", description: "Near-frontier smarts, ultra fast" },
      { id: "claude-4-opus-thinking", displayName: "Claude 4 Opus (Thinking)", description: "Deep reasoning with extended logic" },
      { id: "claude-4-6-adaptive", displayName: "Claude 4.6 Adaptive", description: "Adjusts reasoning based on task" },
    ] as AIModel[],
  },
};

export type ProviderKey = keyof typeof AI_PROVIDERS;

async function callOpenAI(
  config: AIConfig,
  messages: { role: string; content: string }[],
  onChunk?: (text: string) => void
): Promise<string> {
  const stream = !!onChunk;
  
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        stream,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const error = handleAPIError(response);
      throw new Error(`${error.code}: ${error.message}`);
    }

    if (!stream) {
      const data = await response.json() as { choices: { message: { content: string } }[] };
      const content = data.choices[0]?.message?.content || "";
      if (!content) throw new Error("Empty response from OpenAI");
      return content;
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";
    let fullContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6);
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data) as { choices: { delta: { content?: string } }[] };
          const chunk = parsed.choices[0]?.delta?.content || "";
          if (chunk) {
            fullContent += chunk;
            onChunk!(chunk);
          }
        } catch {
          // Ignore parsing errors for individual chunks
        }
      }
    }
    
    if (!fullContent) {
      throw new Error("Empty response from OpenAI");
    }
    
    return fullContent;
  } catch (error) {
    const sanitized = sanitizeErrorMessage(error instanceof Error ? error.message : String(error));
    logError(error, { provider: "openai", maskedKey: maskAPIKey(config.apiKey) });
    throw new Error(`OpenAI Error: ${sanitized}`);
  }
}

async function callGemini(
  config: AIConfig,
  messages: { role: string; content: string }[],
  onChunk?: (text: string) => void
): Promise<string> {
  const systemMsg = messages.find((m) => m.role === "system");
  const chatMsgs = messages.filter((m) => m.role !== "system");

  const geminiMessages = chatMsgs.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const endpoint = onChunk
    ? `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:streamGenerateContent?key=${config.apiKey}&alt=sse`
    : `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;

  const body: Record<string, unknown> = {
    contents: geminiMessages,
    generationConfig: { maxOutputTokens: 4096 },
  };
  if (systemMsg) {
    body.systemInstruction = { parts: [{ text: systemMsg.content }] };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini Error: ${err}`);
  }

  if (!onChunk) {
    const data = await response.json() as { candidates: { content: { parts: { text: string }[] } }[] };
    return data.candidates[0]?.content?.parts[0]?.text || "";
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";
  let fullContent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6);
      try {
        const parsed = JSON.parse(raw) as { candidates: { content: { parts: { text: string }[] } }[] };
        const chunk = parsed.candidates[0]?.content?.parts[0]?.text || "";
        if (chunk) {
          fullContent += chunk;
          onChunk!(chunk);
        }
      } catch {}
    }
  }
  return fullContent;
}

async function callGroq(
  config: AIConfig,
  messages: { role: string; content: string }[],
  onChunk?: (text: string) => void
): Promise<string> {
  return callOpenAICompatible(
    "https://api.groq.com/openai/v1/chat/completions",
    config,
    messages,
    onChunk
  );
}

async function callAnthropic(
  config: AIConfig,
  messages: { role: string; content: string }[],
  onChunk?: (text: string) => void
): Promise<string> {
  const stream = !!onChunk;
  const systemMsg = messages.find((m) => m.role === "system");
  const chatMsgs = messages.filter((m) => m.role !== "system");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 4096,
      stream,
      system: systemMsg?.content || undefined,
      messages: chatMsgs,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic Error: ${err}`);
  }

  if (!stream) {
    const data = await response.json() as { content: { text: string }[] };
    return data.content[0]?.text || "";
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";
  let fullContent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6);
      try {
        const parsed = JSON.parse(raw) as { type: string; delta?: { text?: string } };
        if (parsed.type === "content_block_delta" && parsed.delta?.text) {
          fullContent += parsed.delta.text;
          onChunk!(parsed.delta.text);
        }
      } catch {}
    }
  }
  return fullContent;
}

async function callOpenAICompatible(
  url: string,
  config: AIConfig,
  messages: { role: string; content: string }[],
  onChunk?: (text: string) => void
): Promise<string> {
  const stream = !!onChunk;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      stream,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API Error: ${err}`);
  }

  if (!stream) {
    const data = await response.json() as { choices: { message: { content: string } }[] };
    return data.choices[0]?.message?.content || "";
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";
  let fullContent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6);
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data) as { choices: { delta: { content?: string } }[] };
        const chunk = parsed.choices[0]?.delta?.content || "";
        if (chunk) {
          fullContent += chunk;
          onChunk!(chunk);
        }
      } catch {}
    }
  }
  return fullContent;
}

export async function callAI(
  config: AIConfig,
  messages: { role: string; content: string }[],
  onChunk?: (text: string) => void
): Promise<string> {
  switch (config.provider) {
    case "openai":
      return callOpenAI(config, messages, onChunk);
    case "gemini":
      return callGemini(config, messages, onChunk);
    case "groq":
      return callGroq(config, messages, onChunk);
    case "anthropic":
      return callAnthropic(config, messages, onChunk);
    default:
      throw new Error("Unknown provider");
  }
}

export async function validateAPIKey(config: AIConfig): Promise<boolean> {
  try {
    // Validate key format first
    if (!validateAPIKeyFormat(config.apiKey, config.provider)) {
      console.warn(`API key format may be invalid for ${config.provider}`);
    }

    // Use a very stable, cheap model specifically for validation to ensure the key itself is good
    const testConfig = { ...config };
    if (config.provider === "openai") testConfig.model = "gpt-5-mini";
    if (config.provider === "gemini") testConfig.model = "gemini-3.1-flash";
    if (config.provider === "groq") testConfig.model = "llama-3.1-8b-instant";
    if (config.provider === "anthropic") testConfig.model = "claude-3-5-haiku-20241022";

    // Test with a simple request
    const testMessages = [{ role: "user", content: "Respond with: OK" }];
    
    const result = await retryWithBackoff(
      async () => await callAI(testConfig, testMessages),
      1, // Fewer retries for speed in validation
      500
    );
    
    return !!(result && result.toLowerCase().includes("ok"));
  } catch (error: any) {
    const msg = error?.message || String(error);
    logError(error, { provider: config.provider, maskedKey: maskAPIKey(config.apiKey) });
    console.error("API Validation failed:", msg);
    return false;
  }
}

export function buildSystemPrompt(userProfile: {
  country: string;
  board: string;
  grade: string;
  subjects: string[];
}): string {
  return `You are LearnovaX, an expert AI study assistant specialized for the ${userProfile.board} education board in ${userProfile.country} for Grade ${userProfile.grade}.

The student studies: ${userProfile.subjects.join(", ")}.

Guidelines:
- Always align responses with the ${userProfile.board} curriculum and Grade ${userProfile.grade} level
- Use appropriate academic language and complexity for Grade ${userProfile.grade}
- Structure answers clearly with headings (##), bullet points, and examples
- Highlight KEY TERMS in **bold**
- Focus on exam-oriented content and probable exam questions
- For step-by-step problems: number each step clearly
- Avoid hallucinations — if unsure, say so clearly
- Stay academically serious and avoid harmful content
- Use relatable examples appropriate for the student's region and context
- When asked for formulas, use proper mathematical notation`;
}
