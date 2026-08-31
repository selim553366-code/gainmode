import { and, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db, runForgeCampaigns, runForgeRedemptions } from "@workspace/db";

const router: IRouter = Router();
const CAMPAIGN_ID = 1;
const CAMPAIGN_LIMIT = 10;
const SHARED_CODE = "Forge36BB8E0E24";

type RunForgeDiscountResponse = {
  available: boolean;
  code: string | null;
  remaining: number;
  limit: number;
};

router.post("/runforge/discount", async (req, res) => {
  const clientId = typeof req.body?.clientId === "string" ? req.body.clientId.trim() : "";
  if (!clientId || clientId.length > 200) {
    return res.status(400).json({ error: "A valid client ID is required." });
  }

  try {
    const result = await db.transaction(async (tx) => {
      await tx
        .insert(runForgeCampaigns)
        .values({
          id: CAMPAIGN_ID,
          code: SHARED_CODE,
          usageLimit: CAMPAIGN_LIMIT,
          usedCount: 0,
        })
        .onConflictDoNothing({ target: runForgeCampaigns.id });

      const [campaign] = await tx
        .select()
        .from(runForgeCampaigns)
        .where(eq(runForgeCampaigns.id, CAMPAIGN_ID))
        .for("update");

      if (!campaign) throw new Error("RunForge campaign could not be initialized.");

      const [existingRedemption] = await tx
        .select({ id: runForgeRedemptions.id })
        .from(runForgeRedemptions)
        .where(
          and(
            eq(runForgeRedemptions.campaignId, CAMPAIGN_ID),
            eq(runForgeRedemptions.clientId, clientId),
          ),
        );

      const remaining = Math.max(campaign.usageLimit - campaign.usedCount, 0);
      if (existingRedemption || remaining === 0) {
        return {
          available: Boolean(existingRedemption),
          code: existingRedemption ? campaign.code : null,
          remaining,
          limit: campaign.usageLimit,
        } satisfies RunForgeDiscountResponse;
      }

      await tx.insert(runForgeRedemptions).values({
        campaignId: CAMPAIGN_ID,
        clientId,
      });

      const [updatedCampaign] = await tx
        .update(runForgeCampaigns)
        .set({ usedCount: campaign.usedCount + 1 })
        .where(eq(runForgeCampaigns.id, CAMPAIGN_ID))
        .returning();

      return {
        available: true,
        code: campaign.code,
        remaining: Math.max((updatedCampaign?.usageLimit ?? campaign.usageLimit) - (updatedCampaign?.usedCount ?? campaign.usedCount + 1), 0),
        limit: updatedCampaign?.usageLimit ?? campaign.usageLimit,
      } satisfies RunForgeDiscountResponse;
    });

    return res.json(result);
  } catch (error) {
    req.log?.error?.({ error }, "RunForge discount allocation failed");
    return res.status(503).json({ error: "RunForge discount allocation is unavailable." });
  }
});

export default router;