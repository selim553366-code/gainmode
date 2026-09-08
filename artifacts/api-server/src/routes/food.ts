import { Router, type IRouter } from "express";

const router: IRouter = Router();

const OPEN_FOOD_FACTS_URLS = [
  "https://world.openfoodfacts.net/cgi/search.pl",
  "https://world.openfoodfacts.org/cgi/search.pl",
];
const OPEN_FOOD_FACTS_PRODUCT_URLS = [
  "https://world.openfoodfacts.net/api/v2/product",
  "https://world.openfoodfacts.org/api/v2/product",
];
const USDA_SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";
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

type ProviderProductResponse = {
  product?: ProviderProduct;
};

type UsdaNutrient = {
  nutrientId?: number;
  nutrientName?: string;
  unitName?: string;
  value?: number;
};

type UsdaProduct = {
  fdcId?: number;
  description?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients?: UsdaNutrient[];
};

type UsdaResponse = {
  foods?: UsdaProduct[];
};

type NormalizedFood = {
  id: string;
  name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

function expandUpcE(code: string) {
  if (!/^\d{8}$/.test(code)) return null;
  const numberSystem = code[0];
  const payload = code.slice(1, 7);
  const lastDigit = payload[5];
  let upcA: string;
  if (lastDigit <= "2") {
    upcA = `${numberSystem}${payload.slice(0, 2)}${lastDigit}0000${payload.slice(2, 5)}`;
  } else if (lastDigit === "3") {
    upcA = `${numberSystem}${payload.slice(0, 3)}00000${payload.slice(3, 5)}`;
  } else if (lastDigit === "4") {
    upcA = `${numberSystem}${payload.slice(0, 4)}00000${payload[4]}`;
  } else {
    upcA = `${numberSystem}${payload.slice(0, 5)}0000${lastDigit}`;
  }
  return `${upcA}${code[7]}`;
}

function barcodeCandidates(code: string) {
  const candidates = new Set<string>([code]);
  if (code.length === 8) {
    const expanded = expandUpcE(code);
    if (expanded) candidates.add(expanded);
  }
  if (code.length === 12) candidates.add(`0${code}`);
  if (code.length === 13 && code.startsWith("0")) candidates.add(code.slice(1));
  if (code.length === 14 && code.startsWith("0")) candidates.add(code.slice(1));
  return [...candidates];
}

function normalizeBarcode(code: string) {
  return code.trim().replace(/^\](?:C1|E0|d2|Q3)/i, "").replace(/[\s-]/g, "");
}

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

function usdaNutrient(product: UsdaProduct, id: number) {
  const nutrient = product.foodNutrients?.find((item) => item.nutrientId === id);
  return toNumber(nutrient?.value);
}

function normalizeUsdaProduct(product: UsdaProduct, index: number): NormalizedFood | null {
  const name = product.description?.trim();
  const calories = usdaNutrient(product, 1008);
  const protein = usdaNutrient(product, 1003);
  const carbs = usdaNutrient(product, 1005);
  const fat = usdaNutrient(product, 1004);
  if (!name || calories === null || protein === null || carbs === null || fat === null) return null;

  const servingSize = toNumber(product.servingSize);
  const servingUnit = product.servingSizeUnit?.trim().toLowerCase();
  const isGramServing = servingSize !== null && servingUnit === "g";
  const multiplier = isGramServing ? servingSize / 100 : 1;
  return {
    id: product.fdcId ? `usda-${product.fdcId}` : `usda-${index}`,
    name,
    serving: isGramServing ? `${servingSize} g` : "100 g",
    calories: Math.round(calories * multiplier),
    protein: Math.round(protein * multiplier * 10) / 10,
    carbs: Math.round(carbs * multiplier * 10) / 10,
    fat: Math.round(fat * multiplier * 10) / 10,
  };
}

async function searchOpenFoodFacts(query: string, language: string, limit: number): Promise<NormalizedFood[]> {
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
  let providerResponse: Response | null = null;
  const providerStatuses: number[] = [];
  for (const providerUrl of OPEN_FOOD_FACTS_URLS) {
    const response = await fetch(`${providerUrl}?${params.toString()}`, {
      headers: { Accept: "application/json", "User-Agent": "ForgeFit/1.0 (nutrition search)" },
      signal: AbortSignal.timeout(10000),
    });
    providerStatuses.push(response.status);
    if (response.ok) {
      providerResponse = response;
      break;
    }
  }
  if (!providerResponse) throw new Error(`Open Food Facts returned ${providerStatuses.join(", ")}.`);
  const payload = await providerResponse.json() as ProviderResponse;
  return (payload.products ?? [])
    .map((product, index) => normalizeProduct(product, language, index))
    .filter((item): item is NonNullable<ReturnType<typeof normalizeProduct>> => item !== null);
}

async function searchOpenFoodFactsBarcode(code: string, language: string): Promise<NormalizedFood[]> {
  const fields = [
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
  ].join(",");
  const providerStatuses: number[] = [];
  const lookupResults = await Promise.allSettled(barcodeCandidates(code).map(async (candidate) => {
    for (const providerUrl of OPEN_FOOD_FACTS_PRODUCT_URLS) {
      try {
        const response = await fetch(`${providerUrl}/${encodeURIComponent(candidate)}.json?fields=${fields}`, {
          headers: { Accept: "application/json", "User-Agent": "ForgeFit/1.0 (barcode lookup)" },
          signal: AbortSignal.timeout(10000),
        });
        providerStatuses.push(response.status);
        if (!response.ok) continue;
        const payload = await response.json() as ProviderProductResponse;
        if (!payload.product) continue;
        const normalized = normalizeProduct(payload.product, language, 0);
        if (normalized) return normalized;
      } catch {
        // Try the alternate Open Food Facts host and the next barcode representation.
      }
    }
    return null;
  }));
  const match = lookupResults.find((result): result is PromiseFulfilledResult<NormalizedFood> => result.status === "fulfilled" && result.value !== null);
  if (match?.value) return [match.value];
  if (providerStatuses.some((status) => status === 200 || status === 404)) return [];
  throw new Error(`Open Food Facts barcode lookup returned ${providerStatuses.join(", ")}.`);
}

async function searchUsda(query: string, limit: number): Promise<NormalizedFood[]> {
  const params = new URLSearchParams({
    api_key: "DEMO_KEY",
    query,
    pageSize: String(Math.min(limit * 2, 20)),
    dataType: "Foundation,SR Legacy",
    fields: "fdcId,description,servingSize,servingSizeUnit,foodNutrients",
  });
  const response = await fetch(`${USDA_SEARCH_URL}?${params.toString()}`, {
    headers: { Accept: "application/json", "User-Agent": "ForgeFit/1.0 (nutrition search)" },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`USDA returned ${response.status}.`);
  const payload = await response.json() as UsdaResponse;
  return (payload.foods ?? [])
    .map((product, index) => normalizeUsdaProduct(product, index))
    .filter((item): item is NormalizedFood => item !== null);
}

router.get("/food/search", async (req, res) => {
  res.set("Cache-Control", "no-store");
  const rawQuery = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const query = /^\]?(?:C1|E0|d2|Q3)/i.test(rawQuery) || /^\d{8,14}$/.test(rawQuery)
    ? normalizeBarcode(rawQuery)
    : rawQuery;
  const language = typeof req.query.language === "string" && supportedLanguages.has(req.query.language)
    ? req.query.language
    : "en";
  const requestedLimit = typeof req.query.limit === "string" ? Number.parseInt(req.query.limit, 10) : 12;
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 20) : 12;

  if (query.length < 2) {
    return res.status(400).json({ error: "Search text must be at least 2 characters." });
  }

  try {
    const isBarcode = /^\d{8,14}$/.test(query);
    const providerResults = await Promise.allSettled(isBarcode
      ? [searchOpenFoodFactsBarcode(query, language)]
      : [searchUsda(query, limit), searchOpenFoodFacts(query, language, limit)]);
    const successfulProviders = providerResults
      .filter((result): result is PromiseFulfilledResult<NormalizedFood[]> => result.status === "fulfilled");
    if (successfulProviders.length === 0) {
      const failures = providerResults
        .filter((result): result is PromiseRejectedResult => result.status === "rejected")
        .map((result) => result.reason instanceof Error ? result.reason.message : "unknown error");
      throw new Error(`Food providers failed: ${failures.join(" | ")}`);
    }
    const successfulResults = successfulProviders.flatMap((result) => result.value);
    const seen = new Set<string>();
    const items = successfulResults
      .filter((item) => {
        if (seen.has(item.name.toLowerCase())) return false;
        seen.add(item.name.toLowerCase());
        return true;
      })
      .slice(0, limit);
    return res.json({ query, items });
  } catch (error) {
    req.log?.error?.({
      query,
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
    }, "Food search failed");
    return res.status(502).json({ error: "Food search is temporarily unavailable." });
  }
});

export default router;