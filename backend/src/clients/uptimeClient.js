import { ENV } from "../config/env.js";

function kumaUrl(path) {
  if (!ENV.kuma.url) {
    throw new Error("KUMA_URL is not configured");
  }

  return `${ENV.kuma.url.replace(/\/$/, "")}${path}`;
}

export async function fetchKumaStatusPage() {
  const response = await fetch(
    kumaUrl("/api/status-page/ikevvy-status"),
    {
      headers: {
        Host: "ct100:3001",
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Kuma status-page request failed: ${response.status}`
    );
  }

  return response.json();
}

export async function fetchKumaHeartbeats() {
  const response = await fetch(
    kumaUrl("/api/status-page/heartbeat/ikevvy-status"),
    {
      headers: {
        Host: "ct100:3001",
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Kuma heartbeat request failed: ${response.status}`
    );
  }

  return response.json();
}
