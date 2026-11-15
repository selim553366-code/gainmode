/**
 * Storage for the App Store countdown list: people who left an email or a phone number to hear
 * when GainMode launches on iOS. Rows live in Postgres; the table is created on first use so a
 * fresh database needs no migration step. Without DATABASE_URL the list is not stored.
 */
type Pool = { query: (text: string, values?: unknown[]) => Promise<{ rows: any[]; rowCount: number | null }> };

export type EarlyListSignup = {
  id: number;
  email: string | null;
  phone: string | null;
  country: string | null;
  platform: string;
  language: string | null;
  createdAt: string;
};

let poolPromise: Promise<Pool | null> | null = null;
let tableReady: Promise<void> | null = null;

async function getPool(): Promise<Pool | null> {
  if (!process.env.DATABASE_URL) return null;
  poolPromise ??= import("@workspace/db").then((mod) => mod.pool as unknown as Pool).catch(() => null);
  return poolPromise;
}

async function ensureTable(pool: Pool) {
  tableReady ??= (async () => {
    await pool.query(`CREATE TABLE IF NOT EXISTS early_list_signups (
      id serial PRIMARY KEY,
      email text,
      phone text,
      country text,
      platform text NOT NULL DEFAULT 'ios',
      language text,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS early_list_signups_email_idx ON early_list_signups (lower(email), platform) WHERE email IS NOT NULL`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS early_list_signups_phone_idx ON early_list_signups (phone, platform) WHERE phone IS NOT NULL`);
  })().catch((error) => {
    tableReady = null;
    throw error;
  });
  return tableReady;
}

export function isEarlyListStorageConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

/** Saves a signup; returns false when storage is not configured. A repeat signup is not an error. */
export async function saveEarlyListSignup(entry: { email: string | null; phone: string | null; country: string | null; platform: string; language: string }) {
  const pool = await getPool();
  if (!pool) return false;
  await ensureTable(pool);
  await pool.query(
    `INSERT INTO early_list_signups (email, phone, country, platform, language) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
    [entry.email, entry.phone, entry.country, entry.platform, entry.language],
  );
  return true;
}

export async function listEarlyListSignups(): Promise<EarlyListSignup[] | null> {
  const pool = await getPool();
  if (!pool) return null;
  await ensureTable(pool);
  const result = await pool.query(
    `SELECT id, email, phone, country, platform, language, created_at FROM early_list_signups ORDER BY created_at DESC`,
  );
  return result.rows.map((row) => ({
    id: row.id,
    email: row.email,
    phone: row.phone,
    country: row.country,
    platform: row.platform,
    language: row.language,
    createdAt: new Date(row.created_at).toISOString(),
  }));
}
