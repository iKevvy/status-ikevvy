import { Router } from "express";
import {
  getStatusController,
  getRawStatusController,
} from "../controllers/statusController.js";

const router = Router();

router.get("/", getStatusController);
router.get("/raw", getRawStatusController);

export default router;
