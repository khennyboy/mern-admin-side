import express from "express";
import {
  login,
  logout,
  checkAuth,
  refresh,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/protected-route.js";

const router = express.Router();
router.post("/refresh", refresh);
router.post("/login", login);
router.post("/logout", logout);
router.get("/check", protectRoute, checkAuth);

export default router;
