import jwt from "jsonwebtoken";
import crypto from "crypto";

export const ACCESS_TTL_MS = 15 * 60 * 1000; // 15 minutes
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const signAccessToken = (admin) =>
  jwt.sign(
    { id: admin._id, username: admin.username },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" },
  );

export const signRefreshToken = (admin) =>
  jwt.sign(
    { id: admin._id, jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" },
  );

export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const baseCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

export const accessCookieOptions = { ...baseCookie, maxAge: ACCESS_TTL_MS };

export const REFRESH_PATH = "/api/auth";
export const refreshCookieOptions = {
  ...baseCookie,
  maxAge: REFRESH_TTL_MS,
  path: REFRESH_PATH,
};

export const clearAuthCookies = (res) => {
  res.clearCookie("accessToken", baseCookie);
  res.clearCookie("refreshToken", { ...baseCookie, path: REFRESH_PATH });
};
