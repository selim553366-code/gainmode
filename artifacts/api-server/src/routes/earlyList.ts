import { timingSafeEqual } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { enforcePublicRateLimit } from "../lib/security";
import { isEarlyListStorageConfigured, listEarlyListSignups, saveEarlyListSignup } from "../lib/earlyListStore";

const router: IRouter = Router();
const earlyListRecipient = "globestudiosdev@gmail.com";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+[1-9]\d{6,14}$/;
const countryPattern = /^[A-Z]{2}$/;
const maxEmailLength = 254;
const platforms = new Set(["ios", "android"]);

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 16) : fallback;
}

/** Sends the team a note about a new signup. Best effort: the signup is already stored. */
async function notifyTeam(req: Request, lines: string[]) {
  try {
    const connectors = new ReplitConnectors();
    const response = await connectors.proxy("resend", "/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "GainMode <onboarding@resend.dev>",
        to: [earlyListRecipient],
        subject: "New GainMode countdown list signup",
        text: ["New GainMode countdown list signup", "", ...lines].join("\n"),
        html: `<h2>New GainMode countdown list signup</h2>${lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}`,
      }),
    });
    if (!response.ok) {
      req.log?.error?.({ status: response.status, details: await response.text() }, "Early list email failed");
      return false;
    }
    return true;
  } catch (error) {
    req.log?.error?.({ error }, "Early list email failed");
    return false;
  }
}

/**
 * Joins the countdown list with an email or a phone number (E.164, e.g. +905551234567). The entry
 * is stored for the launch message, and the team gets an email about it.
 */
router.post("/early-list", async (req: Request, res: Response) => {
  if (!enforcePublicRateLimit(req, res, "early-list", 5, 24 * 60 * 60 * 1000)) return;

  const rawEmail = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const rawPhone = typeof req.body?.phone === "string" ? req.body.phone.replace(/[\s()-]/g, "") : "";
  const rawCountry = typeof req.body?.country === "string" ? req.body.country.trim().toUpperCase() : "";
  const language = normalizeValue(req.body?.language, "en");
  const platform = platforms.has(req.body?.platform) ? req.body.platform as string : "ios";

  const email = rawEmail && rawEmail.length <= maxEmailLength && emailPattern.test(rawEmail) ? rawEmail : null;
  const phone = rawPhone && phonePattern.test(rawPhone) ? rawPhone : null;
  const country = countryPattern.test(rawCountry) ? rawCountry : null;
  if (!email && !phone) {
    return res.status(400).json({ error: "A valid email address or phone number is required." });
  }

  let stored = false;
  try {
    stored = await saveEarlyListSignup({ email, phone, country, platform, language });
  } catch (error) {
    req.log?.error?.({ error }, "Early list signup could not be stored");
  }
  const emailed = await notifyTeam(req, [
    email ? `Email: ${email}` : `Phone: ${phone}${country ? ` (${country})` : ""}`,
    `Platform: ${platform}`,
    `Language: ${language}`,
  ]);

  if (!stored && !emailed) return res.status(502).json({ error: "Early list signup could not be saved." });
  return res.json({ ok: true });
});

function isAdmin(req: Request) {
  const expected = process.env.EARLY_LIST_ADMIN_TOKEN;
  if (!expected) return false;
  const header = req.get("authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice(7) : req.get("x-admin-token") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** The stored list, for the team only (Bearer EARLY_LIST_ADMIN_TOKEN). Add ?format=csv for a spreadsheet. */
router.get("/early-list", async (req: Request, res: Response) => {
  if (!process.env.EARLY_LIST_ADMIN_TOKEN) return res.status(503).json({ error: "Early list admin access is not configured." });
  if (!isAdmin(req)) return res.status(401).json({ error: "Unauthorized." });
  if (!isEarlyListStorageConfigured()) return res.status(503).json({ error: "Early list storage is not configured." });
  try {
    const signups = await listEarlyListSignups() ?? [];
    res.setHeader("Cache-Control", "no-store");
    if (req.query.format === "csv") {
      const cell = (value: string | null) => `"${(value ?? "").replaceAll('"', '""')}"`;
      const csv = ["created_at,email,phone,country,platform,language", ...signups.map((s) =>
        [s.createdAt, s.email, s.phone, s.country, s.platform, s.language].map(cell).join(","))].join("\n");
      res.type("text/csv").send(csv);
      return;
    }
    return res.json({ count: signups.length, signups });
  } catch (error) {
    req.log?.error?.({ error }, "Early list could not be read");
    return res.status(500).json({ error: "Early list could not be read." });
  }
});

export default router;
