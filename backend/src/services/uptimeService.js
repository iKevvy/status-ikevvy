import {
  fetchKumaStatusPage,
  fetchKumaHeartbeats,
} from "../clients/uptimeClient.js";

import {
  getPublishedServices,
} from "./publishedServicesService.js";

const FRIENDLY_IDS = {
  1: "proxmox",
  3: "pelican-panel",
  13: "fileflows",
};

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeHeartbeat(
  heartbeat
) {
  return {
    timestamp: heartbeat.time,
    online:
      heartbeat.status === 1,
    latency:
      heartbeat.ping ?? null,
    players: null,
  };
}

export async function getInfrastructureStatus() {
  const [
    statusPage,
    heartbeatData,
  ] = await Promise.all([
    fetchKumaStatusPage(),
    fetchKumaHeartbeats(),
  ]);

  const published =
    getPublishedServices();

  const heartbeatList =
    heartbeatData.heartbeatList ?? {};

  const uptimeList =
    heartbeatData.uptimeList ?? {};

  const monitorList =
    (statusPage.publicGroupList ?? [])
      .flatMap(
        (group) =>
          group.monitorList ?? []
      );

  const services = [];

  for (const monitor of monitorList) {
    if (
      !published.kuma.includes(
        monitor.id
      )
    ) {
      continue;
    }

    const heartbeats =
      heartbeatList[monitor.id] ?? [];

    const latest =
      heartbeats.at(-1) ?? null;

    const history =
      heartbeats
        .slice(-60)
        .map(normalizeHeartbeat);

    const uptime24 =
      uptimeList[
        `${monitor.id}_24`
      ] ?? null;

    services.push({
      id:
        FRIENDLY_IDS[monitor.id] ??
        `kuma-${slugify(
          monitor.name
        )}`,

      sourceId:
        monitor.id,

      name:
        monitor.name === "Pelican"
          ? "Pelican Panel"
          : monitor.name,

      status:
        latest?.status === 1
          ? "online"
          : "offline",

      latency:
        latest?.ping ?? null,

      uptime24:
        uptime24 != null
          ? uptime24 * 100
          : null,

      history,
    });
  }

  return services;
}
