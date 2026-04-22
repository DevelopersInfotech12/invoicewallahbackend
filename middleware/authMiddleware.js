import { verifyToken }  from "../utils/jwtUtils.js";
import User             from "../models/User.js";
import asyncHandler     from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  /* Read from Authorization: Bearer <token> header */
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authenticated. No token provided.");
  }

  /* Verify */
  const decoded = verifyToken(token);

  /* Attach fresh user to request */
  req.user = await User.findById(decoded.id).select("-password");
  if (!req.user) {
    res.status(401);
    throw new Error("User belonging to this token no longer exists.");
  }

  next();
});
