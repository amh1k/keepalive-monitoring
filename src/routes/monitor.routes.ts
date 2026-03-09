import { Router } from "express";
import {
  createMonitor,
  getAllMonitors,
} from "../controllers/monitor.controller.js";
import { validate } from "../middleware/validate.js";
import { createMonitorSchema } from "../validations/monitor.validation.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
const router = Router();
router.post("/create", verifyJWT, validate(createMonitorSchema), createMonitor);
router.get("/getAll", verifyJWT, getAllMonitors);
export default router;
