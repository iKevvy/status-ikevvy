import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.resolve("data");
const CONFIG_FILE = path.join(
  DATA_DIR,
  "published-services.json"
);

const DEFAULT_CONFIG = {
  kuma: [1, 3, 13],
  pelican: [
    "f6cfd224",
    "e0ae319a",
    "66390126",
    "a663311e",
  ],
};

function ensureConfig() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {
      recursive: true,
    });
  }

  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(
      CONFIG_FILE,
      JSON.stringify(DEFAULT_CONFIG, null, 2)
    );
  }
}

export function getPublishedServices() {
  ensureConfig();

  try {
    return JSON.parse(
      fs.readFileSync(CONFIG_FILE, "utf8")
    );
  } catch (error) {
    console.error(
      "Unable to read published service config:",
      error.message
    );

    return structuredClone(DEFAULT_CONFIG);
  }
}

export function setServicePublished(
  source,
  id,
  published
) {
  if (!["kuma", "pelican"].includes(source)) {
    throw new Error("Invalid service source");
  }

  const config = getPublishedServices();

  let normalizedId = id;

  if (source === "kuma") {
    normalizedId = Number(id);

    if (!Number.isInteger(normalizedId)) {
      throw new Error("Invalid Kuma monitor ID");
    }
  }

  const current = new Set(
    config[source] ?? []
  );

  if (published) {
    current.add(normalizedId);
  } else {
    current.delete(normalizedId);
  }

  config[source] = [...current];

  fs.writeFileSync(
    CONFIG_FILE,
    JSON.stringify(config, null, 2)
  );

  return config;
}
