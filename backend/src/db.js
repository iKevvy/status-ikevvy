import pg from "pg";

const { Pool } = pg;

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDatabase() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS service_history (
      id BIGSERIAL PRIMARY KEY,
      service_id TEXT NOT NULL,
      status BOOLEAN NOT NULL,
      latency_ms INTEGER,
      checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_service_history_service_time
    ON service_history(service_id, checked_at DESC);
  `);

  await db.query(`
    DELETE FROM service_history
    WHERE checked_at < NOW() - INTERVAL '7 days';
  `);
}
