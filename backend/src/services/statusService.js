import { getInfrastructureStatus } from "./uptimeService.js";
import { getGameServerStatus } from "./pelicanService.js";

import {
  attachHistory,
  recordServiceSamples,
} from "./historyService.js";

let lastStatus = {
  overall: {
    status: "offline",
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

function buildOverallStatus(services) {
  if (services.length === 0) {
    return {
      status: "offline",
      message: "Status data unavailable",
    };
  }

  const offlineServices = services.filter(
    (service) => service.status !== "online"
  );

  if (offlineServices.length === 0) {
    return {
      status: "online",
      message: "All systems online",
    };
  }

  const names = offlineServices.map(
    (service) => service.name
  );

  if (offlineServices.length === 1) {
    return {
      status: "offline",
      message: `${names[0]} is offline`,
    };
  }

  return {
    status: "offline",
    message: `${offlineServices.length} services offline: ${names.join(", ")}`,
  };
}

export async function refreshStatus() {
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
    console.error(
      "Uptime Kuma refresh failed:",
      error.message
    );

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
    console.error(
      "Pelican refresh failed:",
      error.message
    );

    integrationHealth.pelican = {
      ...integrationHealth.pelican,
      status: "error",
      lastError: error.message,
    };
  }

  await recordServiceSamples(games);

  const gamesWithHistory = await attachHistory(games);

  const allServices = [
    ...infrastructure,
    ...gamesWithHistory,
  ];

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
      totalServices:
        infrastructure.length + games.length,
      lastUpdated:
        lastStatus.overall.lastUpdated,
    },
  };
}
