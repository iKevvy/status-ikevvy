import { Router } from "express";

import {
  loginController,
  logoutController,
  sessionController,
  verifyEmailCodeController,
  resendEmailCodeController,
} from "../controllers/authController.js";

const router = Router();

router.post(
  "/login",
  loginController
);

router.post(
  "/verify-code",
  verifyEmailCodeController
);

router.post(
  "/resend-code",
  resendEmailCodeController
);

router.get(
  "/session",
  sessionController
);

router.post(
  "/logout",
  logoutController
);

export default router;
