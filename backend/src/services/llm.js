// LLM 어댑터 계층 (docs/PLAN.md 9장: 무료 티어 우선, provider 교체 가능)
// - 기본: Gemini API (Google AI Studio 무료 키)
// - GEMINI_API_KEY가 없으면 stub provider로 동작해 개발/데모가 끊기지 않게 한다
// - 새 provider는 chat(systemPrompt, messages) 함수 하나만 구현하면 된다

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

export class LlmError extends Error {}

// messages: [{role: 'user'|'assistant', content}]
async function geminiChat(systemPrompt, messages) {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${key}`;

  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      maxOutputTokens: 512, // 무료 쿼터 절약: 답변 길이 제한
      temperature: 0.7,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new LlmError(`Gemini API 오류 (${res.status}): ${detail.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text)
    .join("")
    .trim();
  if (!text) throw new LlmError("Gemini 응답이 비어 있습니다");
  return text;
}

// 개발/데모용 스텁: 키가 없어도 UI 흐름이 동작하도록 한다
async function stubChat(systemPrompt, messages) {
  const last = messages[messages.length - 1]?.content ?? "";
  return (
    `(개발 모드 응답) "${last.slice(0, 40)}"에 대한 질문을 받았어요. ` +
    "GEMINI_API_KEY를 설정하면 성향 맞춤 답변이 제공됩니다. " +
    "지금은 학습 목적으로, 투자 결정 전에 항상 분산과 손절 기준을 먼저 점검해보세요."
  );
}

export function activeProvider() {
  const forced = process.env.LLM_PROVIDER;
  if (forced === "stub") return "stub";
  if (forced === "gemini") return "gemini";
  return process.env.GEMINI_API_KEY ? "gemini" : "stub";
}

export async function chat(systemPrompt, messages) {
  const provider = activeProvider();
  if (provider === "gemini") return geminiChat(systemPrompt, messages);
  return stubChat(systemPrompt, messages);
}
