import {
  getApplicationServers,
  getServerResources,
} from "../clients/pelicanClient.js";

import {
  getPublishedServices,
} from "./publishedServicesService.js";

const KNOWN_SERVERS = {
  f6cfd224: {
    id: "minecraft",
    name: "Minecraft",
  },

  e0ae319a: {
    id: "project-zomboid",
    name: "Project Zomboid",
  },

  66390126: {
    id: "palworld",
    name: "Palworld",
  },

  a663311e: {
    id: "abiotic-factor",
    name: "Abiotic Factor",
  },
};

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeState(state) {
  return state === "running"
    ? "online"
    : "offline";
}

async function getGameServer(
  identifier,
  attributes
) {
  const known =
    KNOWN_SERVERS[identifier];

  const publicId =
    known?.id ??
    `pelican-${slugify(
      attributes.name ??
      identifier
    )}`;

  const publicName =
    known?.name ??
    attributes.name ??
    identifier;

  try {
    const response =
      await getServerResources(
        identifier
      );

    const live =
      response.attributes ?? {};

    const resources =
      live.resources ?? {};

    return {
      id: publicId,

      source: "pelican",

      sourceId:
        identifier,

      name:
        publicName,

      status:
        normalizeState(
          live.current_state
        ),

      state:
        live.current_state ??
        "unknown",

      latency: null,

      resources: {
        memoryBytes:
          resources.memory_bytes ??
          null,

        cpuAbsolute:
          resources.cpu_absolute ??
          null,

        diskBytes:
          resources.disk_bytes ??
          null,

        networkRxBytes:
          resources.network_rx_bytes ??
          null,

        networkTxBytes:
          resources.network_tx_bytes ??
          null,

        uptime:
          resources.uptime ?? null,
      },
    };
  } catch (error) {
    console.error(
      `Pelican status failed for ${publicName}:`,
      error.message
    );

    return {
      id: publicId,

      source: "pelican",

      sourceId:
        identifier,

      name:
        publicName,

      status: "offline",

      state: "unknown",

      latency: null,

      resources: null,
    };
  }
}

export async function getGameServerStatus() {
  const published =
    getPublishedServices();

  const response =
    await getApplicationServers();

  const servers =
    response.data ?? [];

  const selected =
    servers.filter((server) => {
      const attributes =
        server.attributes ?? server;

      return (
        published.pelican.includes(
          attributes.identifier
        )
      );
    });

  return Promise.all(
    selected.map((server) => {
      const attributes =
        server.attributes ?? server;

      return getGameServer(
        attributes.identifier,
        attributes
      );
    })
  );
}
