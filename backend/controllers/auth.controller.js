import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";
import RefreshToken from "../models/refreshToken.model.js";
import {
  signAccessToken,
  signRefreshToken,
  hashToken,
  accessCookieOptions,
  refreshCookieOptions,
  clearAuthCookies,
  REFRESH_TTL_MS,
} from "../utils/tokens.js";

// Creates both tokens, saves the refresh token hash, sets both cookies
const issueTokens = async (res, admin) => {
  const accessToken = signAccessToken(admin);
  const refreshToken = signRefreshToken(admin);

  await RefreshToken.create({
    admin: admin._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  });

  res.cookie("accessToken", accessToken, accessCookieOptions);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
};

// login fxn
export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide username and password",
    });
  }

  try {
    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    await issueTokens(res, admin);

    return res
      .status(200)
      .json({ success: true, message: "Logged in successfully" });
  } catch (error) {
    console.log("Error logging in:", error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// refresh fxn
export const refresh = async (req, res) => {
  const oldToken = req.cookies?.refreshToken;

  if (!oldToken) {
    return res
      .status(401)
      .json({ success: false, message: "No refresh token" });
  }

  try {
    const payload = jwt.verify(oldToken, process.env.JWT_REFRESH_SECRET);

    const stored = await RefreshToken.findOneAndDelete({
      tokenHash: hashToken(oldToken),
    });

    if (!stored) {
      await RefreshToken.deleteMany({ admin: payload.id });
      clearAuthCookies(res);
      return res
        .status(401)
        .json({ success: false, message: "Refresh token reused" });
    }

    const admin = await Admin.findById(payload.id);

    if (!admin) {
      clearAuthCookies(res);
      return res
        .status(401)
        .json({ success: false, message: "Admin not found" });
    }

    await issueTokens(res, admin);

    return res.status(200).json({ success: true, message: "Token refreshed" });
  } catch (error) {
    clearAuthCookies(res);
    return res
      .status(401)
      .json({ success: false, message: "Invalid refresh token" });
  }
};

// logout fxn
export const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      await RefreshToken.deleteOne({ tokenHash: hashToken(token) });
    }
  } catch (error) {
    console.log("Error logging out:", error.message);
  }

  clearAuthCookies(res);
  return res
    .status(200)
    .json({ success: true, message: "Logged out successfully" });
};

// check auth fxn
export const checkAuth = (_, res) => {
  return res.status(200).json({ success: true, message: "Authenticated" });
};
