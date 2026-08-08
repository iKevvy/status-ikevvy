import { ENV } from "../config/env.js";

async function pelicanRequest(path, apiKey) {
  if (!ENV.pelican.url) {
    throw new Error("PELICAN_URL is not configured");
  }

  if (!apiKey) {
    throw new Error("Pelican API key is not configured");
  }

  const response = await fetch(
    `${ENV.pelican.url.replace(/\/$/, "")}${path}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `Pelican request failed (${response.status}): ${body}`
    );
  }

  return response.json();
}

export function getApplicationServers() {
  return pelicanRequest(
    "/api/application/servers",
    ENV.pelican.applicationApiKey
  );
}

export function getServerResources(identifier) {
  return pelicanRequest(
    `/api/client/servers/${identifier}/resources`,
    ENV.pelican.clientApiKey
  );
}
