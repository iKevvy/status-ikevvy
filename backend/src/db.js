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
    CREATE TABLE IF NOT EXISTS admin_login_codes (
      id BIGSERIAL PRIMARY KEY,
      code_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      attempts INTEGER NOT NULL DEFAULT 0
    );
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_admin_login_codes_active
    ON admin_login_codes(created_at DESC);
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS trusted_devices (
      id BIGSERIAL PRIMARY KEY,
      token_hash TEXT NOT NULL UNIQUE,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL
    );
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_trusted_devices_token_hash
    ON trusted_devices(token_hash);
  `);

  await db.query(`
    DELETE FROM service_history
    WHERE checked_at < NOW() - INTERVAL '7 days';
  `);

  await db.query(`
    DELETE FROM admin_login_codes
    WHERE created_at < NOW() - INTERVAL '1 day';
  `);

  await db.query(`
    DELETE FROM trusted_devices
    WHERE expires_at < NOW();
  `);
}
