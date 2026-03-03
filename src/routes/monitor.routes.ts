import { Router } from "express";
import {
  createMonitor,
  getAllMonitors,
} from "../controllers/monitor.controller.js";
import { validate } from "../middleware/validate.js";
import { createMonitorSchema } from "../validations/monitor.validation.js";

const router = Router();
router.post("/", validate(createMonitorSchema), createMonitor);
router.get("/", getAllMonitors);
export default router;
