import "./config/env.js";

import express from "express";
import path, { dirname } from "path";
import { connectDB } from "./config/db.js";
import productRoutes from "./routes/products.route.js";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.route.js";
import orderRoutes from "./routes/order.route.js";
import webhookRoutes from "./routes/webhook.route.js";
import cors from "cors";
import { fileURLToPath } from "url";

const app = express();
app.use("/api/webhook", webhookRoutes);

const PORT = process.env.PORT || 8000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(
  cors({
    origin: process.env.CUSTOMER_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "..", "frontend/dist")));

  app.get("/*splat", (_, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", "dist", "index.html"));
  });
}

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();
