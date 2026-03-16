import { Router } from "express";
import { validate } from "../middleware/validate";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  refreshAccessToken,
} from "../controllers/user.controller";
import { loginSchema, registerSchema } from "../validations/user.validation";
import { verifyJWT } from "../middleware/auth.middleware";

const router = Router();
router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);
router.post("/logout", verifyJWT, logoutUser);
router.post("/refresh-token", refreshAccessToken);
router.get("/me", verifyJWT, getCurrentUser);
export default router;
