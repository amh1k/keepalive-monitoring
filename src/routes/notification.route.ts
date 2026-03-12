import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
const router = Router();
import { addNotificationChannel } from "../controllers/notification.controller.js";
import { notificationChannelSchema } from "../validations/notification.channel.validation.js";

router.post(
  "/create-webhook",
  verifyJWT,
  validate(notificationChannelSchema),
  addNotificationChannel,
);
export default router;
