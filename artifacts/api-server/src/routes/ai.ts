import { Router, type IRouter } from "express";

const router: IRouter = Router();
const model = "gpt-5-mini";
const languageNames: Record<string, string> = {
  tr: "Turkish",
  en: "English",
  de: "German",
  fr: "French",
  es: "Spanish",
};

function openAiUrl() {
  const base = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
  if (!base) throw new Error("OpenAI integration is not configured.");
  return `${base.replace(/\/$/, "")}/chat/completions`;
}

async function askOpenAi(messages: unknown[]) {
  const response = await fetch(openAiUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env["AI_INTEGRATIONS_OPENAI_API_KEY"] ?? ""}`,
    },
    body: JSON.stringify({ model, messages, max_completion_tokens: 1200 }),
  });
  if (!response.ok) throw new Error(`OpenAI request failed with ${response.status}.`);
  const payload = await response.json() as { choices?: { message?: { content?: string } }[] };
  return payload.choices?.[0]?.message?.content?.trim() ?? "";
}

router.post("/ai/coach", async (req, res) => {
  try {
    const { message, context, language } = req.body as { message?: string; context?: string; language?: string };
    if (!message?.trim()) return res.status(400).json({ error: "Message is required." });
    const content = await askOpenAi([
      { role: "system", content: `You are Forge Coach, a concise, encouraging fitness and nutrition coach. Use the user's app data below to personalize answers. Never invent logged data. If medical concerns arise, recommend a clinician. Reply entirely in ${languageNames[language ?? ""] ?? "the user's selected language"}; do not switch languages. User app data: ${context ?? "No profile data yet."}` },
      { role: "user", content: message.trim() },
    ]);
    return res.json({ content });
  } catch (error) {
    req.log?.error?.({ error }, "Coach request failed");
    return res.status(502).json({ error: "AI coach unavailable." });
  }
});

router.post("/ai/food-analysis", async (req, res) => {
  try {
    const { imageData, language } = req.body as { imageData?: string; language?: string };
    if (!imageData) return res.status(400).json({ error: "Image data is required." });
    const content = await askOpenAi([
      { role: "system", content: `You analyze a food photo. Reply only valid JSON with keys name, calories, protein, carbs, fat. Use realistic estimates, numbers only for nutrition values, and use language ${language ?? "en"} for name. If uncertain, make the estimate explicit in the name.` },
      { role: "user", content: [{ type: "text", text: "Identify this meal and estimate its nutrition." }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageData}` } }] },
    ]);
    const normalized = content.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
    const result = JSON.parse(normalized) as { name?: string; calories?: number; protein?: number; carbs?: number; fat?: number };
    return res.json({ name: result.name ?? "Analyzed meal", calories: Number(result.calories) || 0, protein: Number(result.protein) || 0, carbs: Number(result.carbs) || 0, fat: Number(result.fat) || 0 });
  } catch (error) {
    req.log?.error?.({ error }, "Food analysis failed");
    return res.status(502).json({ error: "Food analysis unavailable." });
  }
});

export default router;