import multer from "multer";
import cloudinary from "../config/cloudinary.js";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith("image/")
      ? cb(null, true)
      : cb(new Error("Only image files are allowed")),
});

const uploadBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "products",
          transformation: [
            { width: 1200, height: 1200, crop: "limit" },
            { quality: "auto", fetch_format: "auto" },
          ],
        },
        (error, result) =>
          error ? reject(error) : resolve(result),
      )
      .end(buffer);
  });

export const uploadImages = async (req, res) => {
  try {
    if (!req.files?.length) {
      return res
        .status(400)
        .json({ success: false, message: "No images provided" });
    }

    const results = await Promise.all(
      req.files.map((file) => uploadBuffer(file.buffer)),
    );

    const images = results.map((r) => ({
      url: r.secure_url,
      publicId: r.public_id,
    }));

    return res.status(200).json({ success: true, images });
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Upload failed" });
  }
};

export const deleteImages = async (publicIds = []) => {
  if (!publicIds.length) return;
  await Promise.all(
    publicIds.map((id) =>
      cloudinary.uploader
        .destroy(id)
        .catch((err) =>
          console.error(`Failed to delete ${id}:`, err.message),
        ),
    ),
  );
};