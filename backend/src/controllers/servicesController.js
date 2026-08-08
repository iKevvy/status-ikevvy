import {
  getServices,
  updateServicePublished,
} from "../services/servicesService.js";

import {
  refreshStatus,
} from "../services/statusService.js";

export async function listServices(
  req,
  res
) {
  try {
    const services =
      await getServices();

    res.json(services);
  } catch (error) {
    console.error(
      "Unable to discover services:",
      error.message
    );

    res.status(500).json({
      error:
        "Unable to discover services",
    });
  }
}

export async function updateService(
  req,
  res
) {
  try {
    const {
      source,
      id,
    } = req.params;

    const {
      published,
    } = req.body ?? {};

    if (
      typeof published !== "boolean"
    ) {
      return res.status(400).json({
        error:
          "published must be boolean",
      });
    }

    updateServicePublished(
      source,
      id,
      published
    );

    /*
     * Immediately regenerate the
     * public status payload.
     */
    await refreshStatus();

    res.json({
      success: true,
      source,
      id,
      published,
    });
  } catch (error) {
    console.error(
      "Unable to update service:",
      error.message
    );

    res.status(400).json({
      error: error.message,
    });
  }
}
