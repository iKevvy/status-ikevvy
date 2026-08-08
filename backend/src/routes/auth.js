import { Router } from "express";

import {
  loginController,
  logoutController,
  sessionController,
} from "../controllers/authController.js";

const router = Router();

router.post("/login", loginController);
router.post("/logout", logoutController);
router.get("/session", sessionController);

export default router;
