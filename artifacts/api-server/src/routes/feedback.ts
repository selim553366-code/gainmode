import { Router, type IRouter, type Request, type Response } from "express";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { enforcePublicRateLimit, releasePublicRateLimit } from "../lib/security";

const router: IRouter = Router();
const maxFeedbackLength = 4_000;
const supportedCategories = new Set(["bug", "suggestion", "subscription", "payment", "notifications", "other"]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

router.post("/feedback", async (req: Request, res: Response) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  const category = normalizeValue(req.body?.category, "other").toLowerCase();
  const language = normalizeValue(req.body?.language, "en");
  const screen = normalizeValue(req.body?.screen, "settings");
  const replyTo = typeof req.body?.replyTo === "string" ? req.body.replyTo.trim().toLowerCase() : "";

  if (!message) {
    return res.status(400).json({ error: "Feedback message is required." });
  }
  if (message.length > maxFeedbackLength) {
    return res.status(413).json({ error: "Feedback message is too long." });
  }
  if (!supportedCategories.has(category)) {
    return res.status(400).json({ error: "Feedback category is invalid." });
  }
  if (!emailPattern.test(replyTo) || replyTo.length > 254) {
    return res.status(400).json({ error: "A valid reply email is required." });
  }
  if (!enforcePublicRateLimit(req, res, "feedback", 3, 60 * 60 * 1000)) return;

  const feedbackRecipient = process.env["GAINMODE_FEEDBACK_RECIPIENT"]?.trim();
  if (!feedbackRecipient) {
    releasePublicRateLimit(req, "feedback");
    req.log?.error?.("Feedback recipient is not configured");
    return res.status(503).json({ error: "Feedback email is not configured." });
  }

  const safeMessage = escapeHtml(message);
  const safeCategory = escapeHtml(category);
  const safeLanguage = escapeHtml(language);
  const safeScreen = escapeHtml(screen);
  const safeReplyTo = escapeHtml(replyTo);
  const subject = `Forge Fit feedback — ${category}`;
  const text = [
    "New Forge Fit feedback",
    "",
    `Category: ${category}`,
    `Language: ${language}`,
    `Screen: ${screen}`,
    `Reply-to: ${replyTo}`,
    "",
    message,
  ].join("\n");
  const html = `
    <h2>New Forge Fit feedback</h2>
    <p><strong>Category:</strong> ${safeCategory}</p>
    <p><strong>Language:</strong> ${safeLanguage}</p>
    <p><strong>Screen:</strong> ${safeScreen}</p>
    <p><strong>Reply-to:</strong> ${safeReplyTo}</p>
    <hr />
    <p style="white-space: pre-wrap">${safeMessage}</p>
  `;

  try {
    const connectors = new ReplitConnectors();
    const response = await connectors.proxy("resend", "/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Forge Fit <onboarding@resend.dev>",
        to: [feedbackRecipient],
        reply_to: replyTo,
        subject,
        text,
        html,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      releasePublicRateLimit(req, "feedback");
      req.log?.error?.({ status: response.status, details }, "Feedback email failed");
      return res.status(502).json({ error: "Feedback email could not be sent." });
    }

    return res.json({ ok: true });
  } catch (error) {
    releasePublicRateLimit(req, "feedback");
    req.log?.error?.({ error }, "Feedback request failed");
    return res.status(502).json({ error: "Feedback email could not be sent." });
  }
});

export default router;