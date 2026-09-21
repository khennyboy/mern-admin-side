import jwt from "jsonwebtoken";

export const protectRoute = (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    req.admin = decoded;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
};
