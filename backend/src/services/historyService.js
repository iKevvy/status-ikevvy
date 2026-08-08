import { db } from "../db.js";

export async function recordServiceSamples(services) {
  if (!services.length) {
    return;
  }

  const values = [];
  const placeholders = [];

  services.forEach((service, index) => {
    const base = index * 3;

    values.push(
      service.id,
      service.status === "online",
      service.latency ?? null
    );

    placeholders.push(
      `($${base + 1}, $${base + 2}, $${base + 3})`
    );
  });

  await db.query(
    `
      INSERT INTO service_history (
        service_id,
        status,
        latency_ms
      )
      VALUES ${placeholders.join(", ")}
    `,
    values
  );

  await db.query(`
    DELETE FROM service_history
    WHERE checked_at < NOW() - INTERVAL '7 days';
  `);
}

export async function attachHistory(services) {
  return Promise.all(
    services.map(async (service) => {
      const result = await db.query(
        `
          SELECT
            status,
            latency_ms,
            checked_at
          FROM service_history
          WHERE service_id = $1
          ORDER BY checked_at DESC
          LIMIT 60
        `,
        [service.id]
      );

      const history = result.rows
        .reverse()
        .map((row) => ({
          timestamp:
            row.checked_at.toISOString(),

          online:
            row.status,

          latency:
            row.latency_ms,

          players:
            null,
        }));

      return {
        ...service,
        history,
      };
    })
  );
}
