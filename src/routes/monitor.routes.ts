import { Router } from "express";
import {
  createMonitor,
  getAllMonitors,
} from "../controllers/monitor.controller.js";
import { validate } from "../middleware/validate.js";
import { createMonitorSchema } from "../validations/monitor.validation.js";

const router = Router();
router.post("/create", validate(createMonitorSchema), createMonitor);
router.get("/getAll", getAllMonitors);
export default router;
