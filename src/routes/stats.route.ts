import Router from "express";
import { verifyJWT } from "../middleware/auth.middleware";
import {
  getAllCounts,
  getLatencyTrend,
  getUptimePercentage,
} from "../controllers/stats.controller";
const router = Router();
router.get("/counts", verifyJWT, getAllCounts);
router.get("/uptime", verifyJWT, getUptimePercentage);
router.get("/latency", verifyJWT, getLatencyTrend);
export default router;
