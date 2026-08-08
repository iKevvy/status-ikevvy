import {
  fetchKumaStatusPage,
  fetchKumaHeartbeats,
} from "../clients/uptimeClient.js";

import {
  getApplicationServers,
  getServerResources,
} from "../clients/pelicanClient.js";

import {
  getPublishedServices,
  setServicePublished,
} from "./publishedServicesService.js";

function normalizePelicanState(state) {
  return state === "running"
    ? "online"
    : "offline";
}

export async function getServices() {
  const published =
    getPublishedServices();

  const [
    kumaStatusPage,
    kumaHeartbeats,
    pelicanResponse,
  ] = await Promise.all([
    fetchKumaStatusPage(),
    fetchKumaHeartbeats(),
    getApplicationServers(),
  ]);

  /*
   * UPTIME KUMA
   */

  const heartbeatList =
    kumaHeartbeats.heartbeatList ?? {};

  const kumaMonitors =
    (kumaStatusPage.publicGroupList ?? [])
      .flatMap(
        (group) => group.monitorList ?? []
      )
      .map((monitor) => {
        const heartbeats =
          heartbeatList[monitor.id] ?? [];

        const latest =
          heartbeats.at(-1) ?? null;

        return {
          source: "kuma",

          id: monitor.id,

          name: monitor.name,

          type: monitor.type,

          status:
            latest?.status === 1
              ? "online"
              : "offline",

          latency:
            latest?.ping ?? null,

          published:
            published.kuma.includes(
              monitor.id
            ),
        };
      });

  /*
   * PELICAN
   */

  const rawServers =
    pelicanResponse.data ?? [];

  const pelicanServers =
    await Promise.all(
      rawServers.map(async (server) => {
        const attributes =
          server.attributes ?? server;

        const identifier =
          attributes.identifier;

        let state = "unknown";
        let resources = null;

        try {
          const resourceResponse =
            await getServerResources(
              identifier
            );

          state =
            resourceResponse.attributes
              ?.current_state ??
            "unknown";

          resources =
            resourceResponse.attributes
              ?.resources ??
            null;
        } catch (error) {
          console.error(
            `Unable to get live Pelican state for ${attributes.name}:`,
            error.message
          );
        }

        return {
          source: "pelican",

          id: identifier,

          uuid:
            attributes.uuid ?? null,

          name:
            attributes.name ??
            identifier,

          status:
            normalizePelicanState(
              state
            ),

          state,

          uptime:
            resources?.uptime ?? 0,

          published:
            published.pelican.includes(
              identifier
            ),
        };
      })
    );

  return {
    kuma: kumaMonitors,
    pelican: pelicanServers,
  };
}

export function updateServicePublished(
  source,
  id,
  published
) {
  return setServicePublished(
    source,
    id,
    published
  );
}
