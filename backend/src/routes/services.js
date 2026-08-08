import { Router } from "express";

import {
  listServices,
  updateService,
} from "../controllers/servicesController.js";

const router = Router();

router.get("/", listServices);

router.patch(
  "/:source/:id",
  updateService
);

export default router;
