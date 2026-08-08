import { Router } from "express";

import {
  adminStatusController,
  adminRefreshController,
} from "../controllers/adminController.js";

const router = Router();

router.get("/status", adminStatusController);
router.post("/refresh", adminRefreshController);

export default router;
