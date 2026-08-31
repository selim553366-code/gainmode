import { integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const runForgeCampaigns = pgTable("run_forge_campaigns", {
  id: integer("id").primaryKey(),
  code: text("code").notNull().unique(),
  usageLimit: integer("usage_limit").notNull().default(10),
  usedCount: integer("used_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const runForgeRedemptions = pgTable(
  "run_forge_redemptions",
  {
    id: serial("id").primaryKey(),
    campaignId: integer("campaign_id")
      .notNull()
      .references(() => runForgeCampaigns.id, { onDelete: "cascade" }),
    clientId: text("client_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    campaignClientUnique: uniqueIndex("run_forge_redemptions_campaign_client_idx").on(
      table.campaignId,
      table.clientId,
    ),
  }),
);

export type RunForgeCampaign = typeof runForgeCampaigns.$inferSelect;
export type RunForgeRedemption = typeof runForgeRedemptions.$inferSelect;