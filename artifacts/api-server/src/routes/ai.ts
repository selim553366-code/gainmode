import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();
const COACH_MODEL = "gpt-5-mini";
const SIMPLE_COACH_MODEL = "gpt-5-nano";
const FOOD_ANALYSIS_MODEL = "gpt-5-nano";
const LUNA_MODEL = "gpt-5.6-luna";
const MODEL_PRICING_USD_PER_MILLION: Record<string, { input: number; output: number }> = {
  "gpt-5-mini": { input: 0.25, output: 2 },
  "gpt-5-nano": { input: 0.05, output: 0.4 },
};
const supportedLanguages = new Set(["tr", "en", "de", "fr", "es"]);
const AI_WINDOW_MS = 60 * 60 * 1000;
const COACH_REQUESTS_PER_WINDOW = 30;
const FOOD_ANALYSIS_REQUESTS_PER_WINDOW = 10;
const MAX_IMAGE_DATA_LENGTH = 8_000_000;
const MAX_MESSAGE_LENGTH = 2_000;
const MAX_CONTEXT_LENGTH = 12_000;
const COACH_MAX_COMPLETION_TOKENS = 8192;
const languageNames: Record<string, string> = {
  tr: "Turkish",
  en: "English",
  de: "German",
  fr: "French",
  es: "Spanish",
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type OpenAiUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  prompt_tokens_details?: { cached_tokens?: number };
  completion_tokens_details?: { reasoning_tokens?: number };
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();

function getClientKey(req: Request) {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function enforceRateLimit(
  req: Request,
  res: Response,
  scope: string,
  limit: number,
) {
  const now = Date.now();
  const clientKey = `${scope}:${getClientKey(req)}`;
  const current = rateLimitBuckets.get(clientKey);
  const bucket = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + AI_WINDOW_MS }
    : current;

  bucket.count += 1;
  rateLimitBuckets.set(clientKey, bucket);

  if (rateLimitBuckets.size > 10_000) {
    for (const [key, value] of rateLimitBuckets) {
      if (value.resetAt <= now) rateLimitBuckets.delete(key);
    }
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  res.setHeader("RateLimit-Limit", limit);
  res.setHeader("RateLimit-Remaining", Math.max(0, limit - bucket.count));
  res.setHeader("RateLimit-Reset", Math.ceil(bucket.resetAt / 1000));

  if (bucket.count > limit) {
    res.setHeader("Retry-After", retryAfterSeconds);
    res.status(429).json({ error: "AI usage limit temporarily reached.", retryAfterSeconds });
    return false;
  }

  return true;
}

function normalizeLanguage(language: unknown) {
  return typeof language === "string" && supportedLanguages.has(language) ? language : null;
}

function normalizeImageData(imageData: unknown) {
  if (typeof imageData !== "string" || !imageData) return null;
  const base64 = imageData.replace(/^data:image\/[^;]+;base64,/, "");
  if (
    base64.length > MAX_IMAGE_DATA_LENGTH
    || base64.length === 0
    || base64.length % 4 === 1
    || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)
  ) {
    return null;
  }
  return base64;
}

function parseCoachPayload(content: string) {
  const normalized = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    const parsed = JSON.parse(normalized) as { content?: unknown; actions?: unknown };
    if (typeof parsed.content === "string" && Array.isArray(parsed.actions)) {
      return { content: parsed.content.trim(), actions: parsed.actions.slice(0, 8) };
    }
  } catch {
    // Keep plain-text responses usable if the model misses the JSON contract.
  }
  return { content, actions: [] };
}

function openAiUrl() {
  const base = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
  if (!base) throw new Error("OpenAI integration is not configured.");
  return `${base.replace(/\/$/, "")}/chat/completions`;
}

async function askOpenAi(messages: unknown[], maxCompletionTokens = 1200) {
  return askOpenAiWithOptions(messages, { maxCompletionTokens, model: COACH_MODEL });
}

function isSimpleCoachRequest(message: string) {
  const normalized = message.toLocaleLowerCase();
  if (normalized.length > 180) return false;
  if (/(ekle|çıkar|sil|değiştir|güncelle|taşı|kaldır|add|remove|delete|change|update|ersetze|lösche|ajoute|supprime|cambia|elimina)/i.test(normalized)) return false;
  return /(kaç|kaldı|hedef|kalori|protein|karbonhidrat|yağ|öğün|yemek|bugün|motivasyon|merhaba|selam|how many|calorie|protein|carb|fat|meal|today|motivat|\bhello\b|\bhi\b|wie viel|kalorien|repas|calories|combien|comida|calorías|cuánto)/i.test(normalized);
}

async function requestChatCompletion(
  url: string,
  apiKey: string,
  model: string,
  messages: unknown[],
  maxCompletionTokens: number,
) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, max_completion_tokens: maxCompletionTokens }),
  });
  if (!response.ok) {
    const providerError = (await response.text()).slice(0, 1000);
    throw new Error(`AI provider request failed with ${response.status}: ${providerError}`);
  }
  const payload = await response.json() as { choices?: { message?: { content?: string } }[]; usage?: OpenAiUsage };
  return {
    content: payload.choices?.[0]?.message?.content?.trim() ?? "",
    usage: payload.usage,
    model,
  };
}

async function askOpenAiWithOptions(
  messages: unknown[],
  options: { maxCompletionTokens?: number; model: string },
) {
  const lunaApiKey = process.env["LUNA_API_KEY"];
  const lunaBaseUrl = process.env["LUNA_API_BASE_URL"];
  const openAiApiKey = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"] ?? "";
  const maxCompletionTokens = options.maxCompletionTokens ?? 1200;

  if (lunaApiKey && lunaBaseUrl) {
    try {
      return await requestChatCompletion(
        `${lunaBaseUrl.replace(/\/$/, "")}/chat/completions`,
        lunaApiKey,
        LUNA_MODEL,
        messages,
        maxCompletionTokens,
      );
    } catch (error) {
      if (!openAiApiKey) throw error;
      console.warn("Luna provider unavailable; using the configured OpenAI fallback.");
    }
  }

  return requestChatCompletion(openAiUrl(), openAiApiKey, options.model, messages, maxCompletionTokens);
}

function logAiUsage(req: Request, operation: string, clientId: string | null, result: { model: string; usage?: OpenAiUsage }) {
  const inputTokens = Math.max(0, Math.round(result.usage?.prompt_tokens ?? 0));
  const outputTokens = Math.max(0, Math.round(result.usage?.completion_tokens ?? 0));
  const cachedInputTokens = Math.max(0, Math.round(result.usage?.prompt_tokens_details?.cached_tokens ?? 0));
  const reasoningTokens = Math.max(0, Math.round(result.usage?.completion_tokens_details?.reasoning_tokens ?? 0));
  const pricing = MODEL_PRICING_USD_PER_MILLION[result.model];
  const estimatedCostUsd = pricing
    ? (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000
    : null;
  req.log?.info?.({
    aiUsage: {
      operation,
      clientId: clientId ?? "unknown",
      model: result.model,
      inputTokens,
      outputTokens,
      totalTokens: Math.max(0, Math.round(result.usage?.total_tokens ?? inputTokens + outputTokens)),
      cachedInputTokens,
      reasoningTokens,
      estimatedCostUsd: estimatedCostUsd === null ? null : Number(estimatedCostUsd.toFixed(8)),
    },
  }, "AI usage measured");
}

router.post("/ai/coach", async (req, res) => {
  if (!enforceRateLimit(req, res, "coach", COACH_REQUESTS_PER_WINDOW)) return;
  try {
    const { message, context, language, imageData, clientId } = req.body as { message?: string; context?: string; language?: string; imageData?: string; clientId?: string };
    const selectedLanguage = normalizeLanguage(language) ?? "en";
    const normalizedImageData = normalizeImageData(imageData);
    const trimmedMessage = typeof message === "string" ? message.trim() : "";
    const normalizedContext = typeof context === "string" ? context : "";
    if (!trimmedMessage && !normalizedImageData) return res.status(400).json({ error: "Message or image is required." });
    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) return res.status(413).json({ error: "Message is too long." });
    if (normalizedContext.length > MAX_CONTEXT_LENGTH) return res.status(413).json({ error: "Context is too large." });
    if (imageData && !normalizedImageData) return res.status(413).json({ error: "Image is too large or invalid." });
    const prompt = trimmedMessage || "Please assess this photo and give useful fitness and nutrition guidance.";
    const selectedModel = isSimpleCoachRequest(prompt) ? SIMPLE_COACH_MODEL : COACH_MODEL;
    const userContent = normalizedImageData
      ? [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${normalizedImageData}` } }]
      : prompt;
    const response = await askOpenAiWithOptions([
      { role: "system", content: `You are Forge Coach, a warm fitness and nutrition coach who feels like a trusted gym friend. Speak naturally, casually, and supportively rather than sounding clinical, formal, or scripted. Briefly acknowledge the user's feeling or effort before giving advice. Celebrate real progress without exaggerated hype. If the user's preferred name exists in the app data, use it occasionally when it feels natural, never in every reply. Use the friendly informal form of "you" appropriate to ${languageNames[selectedLanguage]}. Never use pet names, shame, guilt, forced slang, or more than one emoji; an emoji is optional and should appear only when it genuinely fits. Use only the relevant app data included below. The userSummary and planOverview are the baseline facts you always know about this user; never act as if an available profile or workout plan does not exist. Use recentConversation to understand follow-up messages and references. If a category is not included, do not claim to have checked it and do not invent it. If medical concerns arise, recommend a clinician. Reply entirely in ${languageNames[selectedLanguage]}; do not switch languages. Keep every reply short: 2-3 clear sentences, one compact paragraph, and no more than 55 words. Do not repeat the user's data, add long explanations, or use long bullet lists. Give only the most useful interpretation and one practical next step. Return ONLY valid JSON with this exact shape: {"content":"your localized reply","actions":[]}.

Behavior rules:
- When request.intent is "greeting", simply greet the user warmly, show natural familiarity with at most one relevant baseline fact if useful, and ask what they want help with. Do not create, recommend, replace, or describe a workout or nutrition program.
- When a request is vague or could mean several things, ask one concise clarifying question instead of guessing or generating a program.
- Never create or replace a program unless the user explicitly asks for a new program or asks to change the existing one.
- Treat planOverview as the user's current program. Do not offer a random alternative merely because exercise details were not included.
- General conversation and advice must return actions=[].

Detect when the user explicitly wants to add, update, change, move, or remove information in the app. In that case, propose the corresponding action and tell the user briefly that the change is ready for their confirmation; never say it has already been applied. Questions that only ask for advice or whether a change is sensible must return actions=[].

Allowed actions:
- {"type":"add_exercise","workoutId":"existing workout id","name":"exercise name","sets":1-3,"reps":1-100}
- {"type":"remove_exercise","workoutId":"existing workout id","exerciseId":"existing exercise id"}
- {"type":"update_exercise","workoutId":"existing workout id","exerciseId":"existing exercise id","name":"new exercise name","sets":3,"reps":12}; omit unchanged optional fields
- {"type":"update_workout","workoutId":"existing workout id","day":"WED","name":"new workout name","duration":60}; omit unchanged optional fields
- {"type":"update_profile","patch":{"weight":74}}; include only requested supported fields
- {"type":"update_nutrition","calories":2200,"protein":150,"carbs":240,"fat":70}; omit unchanged optional fields

Supported profile fields are equipment, equipmentDetails, gymLevel, height, weight, age, goal, sex, activity, trainingDays, sessionDuration, goalRate, diet, proteinPreference, experience, preferredDays, and targetWeight. Use exact IDs and current values from the request context. Never invent IDs, fields, or values. Do not propose removing required profile facts; explain briefly that the required fact can be changed but not deleted. User app data: ${normalizedContext || "No profile data yet."}` },
      { role: "user", content: userContent },
    ], { model: selectedModel, maxCompletionTokens: COACH_MAX_COMPLETION_TOKENS });
    logAiUsage(req, "coach", typeof clientId === "string" ? clientId.slice(0, 80) : null, response);
    if (!response.content) return res.status(502).json({ error: "AI coach returned an empty response." });
    const result = parseCoachPayload(response.content);
    if (!result.content) return res.status(502).json({ error: "AI coach returned an empty response." });
    return res.json(result);
  } catch (error) {
    req.log?.error?.({ errorMessage: error instanceof Error ? error.message : String(error) }, "Coach request failed");
    return res.status(502).json({ error: "AI coach unavailable." });
  }
});

router.post("/ai/food-analysis", async (req, res) => {
  if (!enforceRateLimit(req, res, "food-analysis", FOOD_ANALYSIS_REQUESTS_PER_WINDOW)) return;
  try {
    const { imageData, language, clientId } = req.body as { imageData?: string; language?: string; clientId?: string };
    const selectedLanguage = normalizeLanguage(language) ?? "en";
    const normalizedImageData = normalizeImageData(imageData);
    if (!normalizedImageData) return res.status(400).json({ error: "Valid image data is required." });
    const response = await askOpenAiWithOptions([
      { role: "system", content: `You analyze a food photo. Reply only valid JSON with keys name, calories, protein, carbs, fat. Use realistic estimates, numbers only for nutrition values, and use language ${selectedLanguage} for name. If uncertain, make the estimate explicit in the name.` },
      { role: "user", content: [{ type: "text", text: "Identify this meal and estimate its nutrition." }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${normalizedImageData}` } }] },
    ], { model: FOOD_ANALYSIS_MODEL, maxCompletionTokens: 8192 });
    logAiUsage(req, "food-analysis", typeof clientId === "string" ? clientId.slice(0, 80) : null, response);
    const normalized = response.content.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
    const result = JSON.parse(normalized) as { name?: string; calories?: number; protein?: number; carbs?: number; fat?: number };
    if (
      typeof result.name !== "string"
      || !Number.isFinite(Number(result.calories))
      || !Number.isFinite(Number(result.protein))
      || !Number.isFinite(Number(result.carbs))
      || !Number.isFinite(Number(result.fat))
    ) {
      return res.status(502).json({ error: "Food analysis returned invalid nutrition data." });
    }
    return res.json({ name: result.name ?? "Analyzed meal", calories: Number(result.calories) || 0, protein: Number(result.protein) || 0, carbs: Number(result.carbs) || 0, fat: Number(result.fat) || 0 });
  } catch (error) {
    req.log?.error?.({ errorMessage: error instanceof Error ? error.message : String(error) }, "Food analysis failed");
    return res.status(502).json({ error: "Food analysis unavailable." });
  }
});

export default router;