import express from "express";
import { upload, uploadImages } from "../controllers/upload.controller.js";
import { protectRoute } from "../middleware/protected-route.js";

const router = express.Router();

const handleUpload = (req, res, next) =>
  upload.array("images", 5)(req, res, (err) =>
    err
      ? res.status(400).json({ success: false, message: err.message })
      : next(),
  );

router.post("/", protectRoute, handleUpload, uploadImages);

export default router;