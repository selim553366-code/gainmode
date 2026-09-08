import { Router, type IRouter, type Request, type Response } from "express";
import { ReplitConnectors } from "@replit/connectors-sdk";

const router: IRouter = Router();
const ratingRecipient = "selim553366@gmail.com";
const maxMessageLength = 4_000;

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

router.post("/coach-rating", async (req: Request, res: Response) => {
  const rating = Number(req.body?.rating);
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  const language = normalizeValue(req.body?.language, "en");
  const username = normalizeValue(req.body?.username, "anonymous");

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Coach rating must be an integer from 1 to 5." });
  }
  if (!message) {
    return res.status(400).json({ error: "Coach message is required." });
  }
  if (message.length > maxMessageLength) {
    return res.status(413).json({ error: "Coach message is too long." });
  }

  const safeMessage = escapeHtml(message);
  const safeLanguage = escapeHtml(language);
  const safeUsername = escapeHtml(username);
  const subject = `Forge Fit coach rating — ${rating}/5`;
  const text = [
    "New Forge Fit coach rating",
    "",
    `Rating: ${rating}/5`,
    `Language: ${language}`,
    `Username: ${username}`,
    "",
    "Rated coach message:",
    message,
  ].join("\n");
  const html = `
    <h2>New Forge Fit coach rating</h2>
    <p><strong>Rating:</strong> ${rating}/5</p>
    <p><strong>Language:</strong> ${safeLanguage}</p>
    <p><strong>Username:</strong> ${safeUsername}</p>
    <hr />
    <p><strong>Rated coach message:</strong></p>
    <p style="white-space: pre-wrap">${safeMessage}</p>
  `;

  try {
    const connectors = new ReplitConnectors();
    const response = await connectors.proxy("resend", "/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Forge Fit <onboarding@resend.dev>",
        to: [ratingRecipient],
        subject,
        text,
        html,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      req.log?.error?.({ status: response.status, details }, "Coach rating email failed");
      return res.status(502).json({ error: "Coach rating could not be sent." });
    }

    return res.json({ ok: true });
  } catch (error) {
    req.log?.error?.({ error }, "Coach rating request failed");
    return res.status(502).json({ error: "Coach rating could not be sent." });
  }
});

export default router;