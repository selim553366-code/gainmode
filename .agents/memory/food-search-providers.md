---
name: Food search provider resilience
description: External nutrition search behavior and fallback constraints for Forge Fit.
---

Open Food Facts' `world.openfoodfacts.org` search endpoint can return HTTP 503 to anonymous requests even when the same query is available. The `world.openfoodfacts.net` endpoint has been a working alternate, so provider fallback should remain in place rather than treating one domain as authoritative.

**Why:** A live search returned 503 from the primary domain during verification while the alternate domain returned valid product data.

**How to apply:** Keep external provider calls server-side, use bounded timeouts and fallback handling, and combine Open Food Facts with USDA Foundation/SR Legacy data so generic foods are searchable even when packaged-product results are sparse. For packaged products, search alternate UPC/EAN/GTIN representations because the same item may be stored with a leading zero, a 12/13-digit equivalent, or an expanded UPC-E code.