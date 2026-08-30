import { Router, type IRouter } from "express";

const router: IRouter = Router();

const OPEN_FOOD_FACTS_URL = "https://world.openfoodfacts.org/cgi/search.pl";
const supportedLanguages = new Set(["tr", "en", "de", "fr", "es"]);

type ProviderProduct = {
  code?: string;
  product_name?: string;
  product_name_en?: string;
  product_name_tr?: string;
  product_name_de?: string;
  product_name_fr?: string;
  product_name_es?: string;
  brands?: string;
  serving_size?: string;
  nutriments?: Record<string, unknown>;
};

type ProviderResponse = {
  products?: ProviderProduct[];
};

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function firstNumber(nutriments: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = toNumber(nutriments[key]);
    if (value !== null && value >= 0) return value;
  }
  return null;
}

function productName(product: ProviderProduct, language: string) {
  const localized = product[`product_name_${language}` as keyof ProviderProduct];
  const name = typeof localized === "string" && localized.trim()
    ? localized.trim()
    : product.product_name?.trim() || product.product_name_en?.trim();
  if (!name) return null;
  const brand = product.brands?.split(",")[0]?.trim();
  return brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${name} · ${brand}` : name;
}

function normalizeProduct(product: ProviderProduct, language: string, index: number) {
  const name = productName(product, language);
  const nutriments = product.nutriments ?? {};
  if (!name) return null;

  const hasServingValues = firstNumber(nutriments, [
    "energy-kcal_serving",
    "proteins_serving",
    "carbohydrates_serving",
    "fat_serving",
  ]) !== null;
  const calories = firstNumber(nutriments, hasServingValues
    ? ["energy-kcal_serving", "energy-kcal_value_serving"]
    : ["energy-kcal_100g", "energy-kcal_value_100g"]);
  const protein = firstNumber(nutriments, hasServingValues
    ? ["proteins_serving"]
    : ["proteins_100g"]);
  const carbs = firstNumber(nutriments, hasServingValues
    ? ["carbohydrates_serving"]
    : ["carbohydrates_100g"]);
  const fat = firstNumber(nutriments, hasServingValues
    ? ["fat_serving"]
    : ["fat_100g"]);

  if (calories === null || protein === null || carbs === null || fat === null) return null;

  return {
    id: product.code?.trim() || `food-${index}`,
    name,
    serving: hasServingValues
      ? product.serving_size?.trim() || "1 serving"
      : "100 g",
    calories: Math.round(calories),
    protein: Math.round(protein * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fat: Math.round(fat * 10) / 10,
  };
}

router.get("/food/search", async (req, res) => {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const language = typeof req.query.language === "string" && supportedLanguages.has(req.query.language)
    ? req.query.language
    : "en";
  const requestedLimit = typeof req.query.limit === "string" ? Number.parseInt(req.query.limit, 10) : 12;
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 20) : 12;

  if (query.length < 2) {
    return res.status(400).json({ error: "Search text must be at least 2 characters." });
  }

  try {
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: "1",
      action: "process",
      json: "1",
      page_size: String(Math.min(limit * 2, 40)),
      fields: [
        "code",
        "product_name",
        "product_name_en",
        "product_name_tr",
        "product_name_de",
        "product_name_fr",
        "product_name_es",
        "brands",
        "serving_size",
        "nutriments",
      ].join(","),
    });
    const response = await fetch(`${OPEN_FOOD_FACTS_URL}?${params.toString()}`, {
      headers: { Accept: "application/json", "User-Agent": "ForgeFit/1.0 (nutrition search)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Food provider returned ${response.status}.`);
    const payload = await response.json() as ProviderResponse;
    const seen = new Set<string>();
    const items = (payload.products ?? [])
      .map((product, index) => normalizeProduct(product, language, index))
      .filter((item): item is NonNullable<ReturnType<typeof normalizeProduct>> => {
        if (!item || seen.has(item.name.toLowerCase())) return false;
        seen.add(item.name.toLowerCase());
        return true;
      })
      .slice(0, limit);
    return res.json({ query, items });
  } catch (error) {
    req.log?.error?.({ error, query }, "Food search failed");
    return res.status(502).json({ error: "Food search is temporarily unavailable." });
  }
});

export default router;