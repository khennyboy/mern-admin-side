import express from "express";
import { upload, uploadImage } from "../controllers/upload.controller.js";
import { protectRoute } from "../middleware/protected-route.js";


const router = express.Router();

// multer errors (file too big, wrong type) happen outside the controller's try/catch
const handleUpload = (req, res, next) =>
    upload.single("image")(req, res, (err) =>
        err ? res.status(400).json({ success: false, message: err.message }) : next(),
    );

router.post("/", protectRoute, handleUpload, uploadImage);

export default router;