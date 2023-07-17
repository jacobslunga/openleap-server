import { Router } from "express";
import {
  getUserById,
  getMe,
  refreshToken,
  register,
  registerWithProvider,
  login,
  updateMe,
} from "../controllers/userController";

const router = Router();

router.get("/me", getMe);
router.get("/:id", getUserById);

router.post("/auth/register", register);
router.post("/auth/register/provider", registerWithProvider);
router.post("/auth/login", login);
router.post("/auth/refresh-token", refreshToken);

router.put("/update/me", updateMe);

export default router;
