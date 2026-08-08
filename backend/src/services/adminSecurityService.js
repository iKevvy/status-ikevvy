import crypto from "node:crypto";
import { db } from "../db.js";

const TRUST_DAYS = 30;
const OTP_LIFETIME_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

function hashValue(value) {
  return crypto
    .createHash("sha256")
    .update(String(value))
    .digest("hex");
}

export function generateLoginCode() {
  return String(
    crypto.randomInt(0, 1000000)
  ).padStart(6, "0");
}

export async function createLoginCode(code) {
  // Invalidate all previous unused codes.
  await db.query(`
    UPDATE admin_login_codes
    SET used_at = NOW()
    WHERE used_at IS NULL
  `);

  await db.query(
    `
      INSERT INTO admin_login_codes (
        code_hash,
        expires_at
      )
      VALUES (
        $1,
        NOW() + INTERVAL '${OTP_LIFETIME_MINUTES} minutes'
      )
    `,
    [hashValue(code)]
  );
}

export async function verifyLoginCode(code) {
  const result = await db.query(`
    SELECT
      id,
      code_hash,
      expires_at,
      attempts
    FROM admin_login_codes
    WHERE used_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1
  `);

  const row = result.rows[0];

  if (!row) {
    return {
      valid: false,
      reason: "No active verification code",
    };
  }

  if (new Date(row.expires_at) <= new Date()) {
    return {
      valid: false,
      reason: "Verification code expired",
    };
  }

  if (row.attempts >= MAX_OTP_ATTEMPTS) {
    return {
      valid: false,
      reason: "Too many verification attempts",
    };
  }

  const suppliedHash = hashValue(code);

  const valid = crypto.timingSafeEqual(
    Buffer.from(row.code_hash, "hex"),
    Buffer.from(suppliedHash, "hex")
  );

  if (!valid) {
    await db.query(
      `
        UPDATE admin_login_codes
        SET attempts = attempts + 1
        WHERE id = $1
      `,
      [row.id]
    );

    return {
      valid: false,
      reason: "Invalid verification code",
    };
  }

  await db.query(
    `
      UPDATE admin_login_codes
      SET used_at = NOW()
      WHERE id = $1
    `,
    [row.id]
  );

  return {
    valid: true,
  };
}

export function generateTrustedToken() {
  return crypto
    .randomBytes(32)
    .toString("base64url");
}

export async function createTrustedDevice(
  token,
  userAgent
) {
  await db.query(
    `
      INSERT INTO trusted_devices (
        token_hash,
        user_agent,
        expires_at
      )
      VALUES (
        $1,
        $2,
        NOW() + INTERVAL '${TRUST_DAYS} days'
      )
    `,
    [
      hashValue(token),
      userAgent ?? null,
    ]
  );
}

export async function validateTrustedDevice(token) {
  if (!token) {
    return false;
  }

  const result = await db.query(
    `
      UPDATE trusted_devices
      SET last_used_at = NOW()
      WHERE
        token_hash = $1
        AND expires_at > NOW()
      RETURNING id
    `,
    [hashValue(token)]
  );

  return result.rowCount === 1;
}

export async function revokeTrustedDevice(token) {
  if (!token) {
    return;
  }

  await db.query(
    `
      DELETE FROM trusted_devices
      WHERE token_hash = $1
    `,
    [hashValue(token)]
  );
}
