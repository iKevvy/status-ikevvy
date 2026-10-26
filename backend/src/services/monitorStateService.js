import { db } from "../db.js";

const STALE_AFTER_MS = 15 * 60 * 1000;

export async function resolveMonitorStates(services) {
  const resolved = [];

  for (const service of services) {
    const now = new Date();

    const confirmed =
      service.status === "online" ||
      service.status === "offline";

    if (confirmed) {
      await db.query(
        `
          INSERT INTO service_monitor_state (
            service_id,
            last_confirmed_status,
            last_confirmed_state,
            last_successful_check_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (service_id)
          DO UPDATE SET
            last_confirmed_status = EXCLUDED.last_confirmed_status,
            last_confirmed_state = EXCLUDED.last_confirmed_state,
            last_successful_check_at = EXCLUDED.last_successful_check_at,
            updated_at = NOW()
        `,
        [service.id, service.status, service.state, now]
      );

      resolved.push({
        ...service,
        sampleQuality: "confirmed",
        lastConfirmedAt: now.toISOString(),
      });

      continue;
    }

    const result = await db.query(
      `
        SELECT
          last_confirmed_status,
          last_confirmed_state,
          last_successful_check_at
        FROM service_monitor_state
        WHERE service_id = $1
      `,
      [service.id]
    );

    const previous = result.rows[0];

    if (!previous) {
      resolved.push({
        ...service,
        status: "unknown",
        sampleQuality: "stale",
        lastConfirmedAt: null,
      });

      continue;
    }

    const lastConfirmedAt =
      previous.last_successful_check_at;

    const age =
      now.getTime() -
      new Date(lastConfirmedAt).getTime();

    const stale = age >= STALE_AFTER_MS;

    resolved.push({
      ...service,
      status: stale
        ? "unknown"
        : previous.last_confirmed_status,
      sampleQuality: stale
        ? "stale"
        : "retained",
      lastConfirmedAt:
        new Date(lastConfirmedAt).toISOString(),
    });
  }

  return resolved;
}
