import { Router } from "express";
import {
  createMonitor,
  getAllMonitors,
} from "../controller/monitor.controller.js";

const router = Router();
router.post("/", createMonitor);
router.post("/", getAllMonitors);
export default Router;
