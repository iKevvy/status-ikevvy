import test from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/db.js";
import { resolveMonitorStates } from "../src/services/monitorStateService.js";

const originalQuery = db.query;
const states = new Map();

db.query = async (sql, params) => {
  if (sql.includes("INSERT INTO service_monitor_state")) {
    const [id, status, state, timestamp] = params;

    states.set(id, {
      last_confirmed_status: status,
      last_confirmed_state: state,
      last_successful_check_at: timestamp,
    });

    return { rows: [] };
  }

  if (sql.includes("FROM service_monitor_state")) {
    const state = states.get(params[0]);
    return { rows: state ? [state] : [] };
  }

  throw new Error("Unexpected database query");
};

function server(status, state = "missing", id = "test-server") {
  return {
    id,
    source: "pelican",
    status,
    state,
    latency: null,
    resources: null,
  };
}

test("Running → Missing → Running", async () => {
  states.clear();

  const first = await resolveMonitorStates([
    server("online", "running"),
  ]);

  assert.equal(first[0].sampleQuality, "confirmed");

  const missing = await resolveMonitorStates([
    server("unknown"),
  ]);

  assert.equal(missing[0].status, "online");
  assert.equal(missing[0].sampleQuality, "retained");

  const recovered = await resolveMonitorStates([
    server("online", "running"),
  ]);

  assert.equal(recovered[0].status, "online");
  assert.equal(recovered[0].sampleQuality, "confirmed");
});

test("Offline → Missing → Offline", async () => {
  states.clear();

  await resolveMonitorStates([
    server("offline", "offline"),
  ]);

  const missing = await resolveMonitorStates([
    server("unknown"),
  ]);

  assert.equal(missing[0].status, "offline");
  assert.equal(missing[0].sampleQuality, "retained");
});

test("Missing after 15 minutes becomes Unknown", async () => {
  states.clear();

  states.set("test-server", {
    last_confirmed_status: "online",
    last_confirmed_state: "running",
    last_successful_check_at: new Date(
      Date.now() - 16 * 60 * 1000
    ),
  });

  const result = await resolveMonitorStates([
    server("unknown"),
  ]);

  assert.equal(result[0].status, "unknown");
  assert.equal(result[0].sampleQuality, "stale");
});

test("Missing without previous confirmation is Unknown", async () => {
  states.clear();

  const result = await resolveMonitorStates([
    server("unknown"),
  ]);

  assert.equal(result[0].status, "unknown");
  assert.equal(result[0].sampleQuality, "stale");
});

test.after(() => {
  db.query = originalQuery;
});

test("Recent confirmation remains Online", async () => {
  states.clear();

  states.set("test-server", {
    last_confirmed_status: "online",
    last_confirmed_state: "running",
    last_successful_check_at: new Date(
      Date.now() - 14 * 60 * 1000
    ),
  });

  const result = await resolveMonitorStates([
    server("unknown"),
  ]);

  assert.equal(result[0].status, "online");
  assert.equal(result[0].sampleQuality, "retained");
});

test("Confirmation older than 15 minutes becomes Unknown", async () => {
  states.clear();

  states.set("test-server", {
    last_confirmed_status: "offline",
    last_confirmed_state: "offline",
    last_successful_check_at: new Date(
      Date.now() - 15 * 60 * 1000 - 1000
    ),
  });

  const result = await resolveMonitorStates([
    server("unknown"),
  ]);

  assert.equal(result[0].status, "unknown");
  assert.equal(result[0].sampleQuality, "stale");
});

test("Retained state does not refresh confirmation timestamp", async () => {
  states.clear();

  const originalTime = new Date(
    Date.now() - 14 * 60 * 1000
  );

  states.set("test-server", {
    last_confirmed_status: "online",
    last_confirmed_state: "running",
    last_successful_check_at: originalTime,
  });

  await resolveMonitorStates([server("unknown")]);
  await resolveMonitorStates([server("unknown")]);

  assert.equal(
    states.get("test-server").last_successful_check_at.getTime(),
    originalTime.getTime()
  );
});
