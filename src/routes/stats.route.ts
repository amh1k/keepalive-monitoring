import Router from "express";
import { verifyJWT } from "../middleware/auth.middleware";
import { getAllCounts } from "../controllers/stats.controller";
const router = Router();
router.get("/all-counts", verifyJWT, getAllCounts);
router.get("/uptime-percentage", verifyJWT, getAllCounts);
router.get("/latency-trend", verifyJWT, getAllCounts);
export default Router;
