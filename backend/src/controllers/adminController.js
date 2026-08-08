import {
  getAdminStatus,
  refreshStatus,
} from "../services/statusService.js";

export function adminStatusController(req, res) {
  res.json(getAdminStatus());
}

export async function adminRefreshController(req, res) {
  try {
    await refreshStatus();

    res.json({
      success: true,
      message: "Status refreshed",
      data: getAdminStatus(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Refresh failed",
    });
  }
}
