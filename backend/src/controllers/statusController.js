import { getStatus } from "../services/statusService.js";

export function getStatusController(req, res) {
  res.json(getStatus());
}

export function getRawStatusController(req, res) {
  res.json({
    source: "live",
    data: getStatus(),
  });
}
