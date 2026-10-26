import { getInfrastructureStatus } from "./uptimeService.js";
import { getGameServerStatus } from "./pelicanService.js";
import { getPublishedServices } from "./publishedServicesService.js";
import { resolveMonitorStates } from "./monitorStateService.js";

import {
  attachHistory,
  recordServiceSamples,
} from "./historyService.js";

const KNOWN_SERVERS = {
  f6cfd224: { id: "minecraft", name: "Minecraft" },
  e0ae319a: { id: "project-zomboid", name: "Project Zomboid" },
  "66390126": { id: "palworld", name: "Palworld" },
  a663311e: { id: "abiotic-factor", name: "Abiotic Factor" },
};

let lastStatus = {
  overall: {
    status: "unknown",
    message: "Status data unavailable",
    lastUpdated: null,
  },
  groups: [],
};

let integrationHealth = {
  kuma: {
    status: "unknown",
    lastSuccess: null,
    lastError: null,
  },
  pelican: {
    status: "unknown",
    lastSuccess: null,
    lastError: null,
  },
};

let activeRefresh = null;

function fallbackGameServers() {
  const published = getPublishedServices();

  return (published.pelican ?? []).map((identifier) => {
    const known = KNOWN_SERVERS[identifier];

    return {
      id: known?.id ?? `pelican-${identifier}`,
      source: "pelican",
      sourceId: identifier,
      name: known?.name ?? identifier,
      status: "unknown",
      state: "unknown",
      latency: null,
      resources: null,
    };
  });
}

function buildOverallStatus(services) {
  if (!services.length) {
    return {
      status: "unknown",
      message: "Status data unavailable",
    };
  }

  const offline = services.filter(
    (service) => service.status === "offline"
  );

  const unknown = services.filter(
    (service) => service.status === "unknown"
  );

  if (offline.length) {
    return {
      status: "offline",
      message: `${offline.length} service(s) offline: ${offline.map((s) => s.name).join(", ")}`,
    };
  }

  if (unknown.length) {
    return {
      status: "unknown",
      message: `${unknown.length} service(s) status unknown`,
    };
  }

  return {
    status: "online",
    message: "All systems online",
  };
}

async function performRefresh() {
  let infrastructure = [];
  let games = [];

  try {
    infrastructure = await getInfrastructureStatus();

    integrationHealth.kuma = {
      status: "online",
      lastSuccess: new Date().toISOString(),
      lastError: null,
    };
  } catch (error) {
    console.error("Uptime Kuma refresh failed:", error.message);
    integrationHealth.kuma = {
      ...integrationHealth.kuma,
      status: "error",
      lastError: error.message,
    };
  }

  try {
    games = await getGameServerStatus();

    integrationHealth.pelican = {
      status: "online",
      lastSuccess: new Date().toISOString(),
      lastError: null,
    };
  } catch (error) {
    console.error("Pelican refresh failed:", error.message);

    integrationHealth.pelican = {
      ...integrationHealth.pelican,
      status: "error",
      lastError: error.message,
    };

    games = fallbackGameServers();
  }

  games = await resolveMonitorStates(games);

  await recordServiceSamples(games);

  const gamesWithHistory = await attachHistory(games);
  const allServices = [...infrastructure, ...gamesWithHistory];

  const overall = buildOverallStatus(allServices);

  lastStatus = {
    overall: {
      ...overall,
      lastUpdated: new Date().toISOString(),
    },
    groups: [
      {
        id: "infrastructure",
        name: "Infrastructure",
        services: infrastructure,
      },
      {
        id: "games",
        name: "Game Servers",
        services: gamesWithHistory,
      },
    ],
  };

  return lastStatus;
}

export function refreshStatus() {
  if (activeRefresh) {
    return activeRefresh;
  }

  activeRefresh = performRefresh().finally(() => {
    activeRefresh = null;
  });

  return activeRefresh;
}

export function getStatus() {
  return lastStatus;
}

export function getAdminStatus() {
  const infrastructure =
    lastStatus.groups.find(
      (group) => group.id === "infrastructure"
    )?.services ?? [];

  const games =
    lastStatus.groups.find(
      (group) => group.id === "games"
    )?.services ?? [];

  return {
    api: {
      status: "online",
      uptimeSeconds: Math.floor(process.uptime()),
    },
    integrations: integrationHealth,
    monitoring: {
      infrastructureServices: infrastructure.length,
      gameServers: games.length,
      totalServices: infrastructure.length + games.length,
      lastUpdated: lastStatus.overall.lastUpdated,
    },
  };
}
