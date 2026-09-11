import { Router, type IRouter, type Request, type Response } from "express";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { enforcePublicRateLimit } from "../lib/security";

const router: IRouter = Router();
const earlyListRecipient = "globestudiosdev@gmail.com";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const maxEmailLength = 254;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

router.post("/early-list", async (req: Request, res: Response) => {
  if (!enforcePublicRateLimit(req, res, "early-list", 3, 24 * 60 * 60 * 1000)) return;

  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const language = normalizeValue(req.body?.language, "en");

  if (!email || email.length > maxEmailLength || !emailPattern.test(email)) {
    return res.status(400).json({ error: "A valid email address is required." });
  }

  const safeEmail = escapeHtml(email);
  const safeLanguage = escapeHtml(language);
  const subject = "New GainMode early list signup";
  const text = [
    "New GainMode early list signup",
    "",
    `Email: ${email}`,
    `Language: ${language}`,
  ].join("\n");
  const html = `
    <h2>New GainMode early list signup</h2>
    <p><strong>Email:</strong> ${safeEmail}</p>
    <p><strong>Language:</strong> ${safeLanguage}</p>
  `;

  try {
    const connectors = new ReplitConnectors();
    const response = await connectors.proxy("resend", "/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "GainMode <onboarding@resend.dev>",
        to: [earlyListRecipient],
        reply_to: email,
        subject,
        text,
        html,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      req.log?.error?.({ status: response.status, details }, "Early list email failed");
      return res.status(502).json({ error: "Early list signup could not be sent." });
    }

    return res.json({ ok: true });
  } catch (error) {
    req.log?.error?.({ error }, "Early list request failed");
    return res.status(502).json({ error: "Early list signup could not be sent." });
  }
});

export default router;