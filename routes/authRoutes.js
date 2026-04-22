import { Router }          from "express";
import {
  register,
  login,
  googleAuth,
  getMe,
  updateProfile,
  changePassword,
}                          from "../controllers/authController.js";
import { protect }         from "../middleware/authMiddleware.js";
import { authLimiter }     from "../middleware/rateLimiter.js";

const router = Router();

/* Public routes */
router.post("/register",       authLimiter, register);
router.post("/login",          authLimiter, login);
router.post("/google",         authLimiter, googleAuth);

/* Protected routes */
router.get ("/me",             protect, getMe);
router.put ("/update-profile", protect, updateProfile);
router.put ("/change-password",protect, changePassword);

export default router;
