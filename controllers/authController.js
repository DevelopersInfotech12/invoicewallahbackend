import User              from "../models/User.js";
import { generateToken } from "../utils/jwtUtils.js";
import { verifyGoogleToken } from "../utils/googleVerify.js";
import asyncHandler      from "../utils/asyncHandler.js";

/* ── Helper: send token response ── */
const sendToken = (res, user, statusCode = 200, message = "Success") => {
  const token = generateToken({ id: user._id });
  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: user.toPublicJSON(),
  });
};

/* ────────────────────────────────────────────
   POST /api/auth/register
   Body: { name, email, password }
──────────────────────────────────────────── */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email and password are required.");
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error("Password must be at least 8 characters.");
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    res.status(409);
    throw new Error("An account with this email already exists.");
  }

  const user = await User.create({
    name:     name.trim(),
    email:    email.toLowerCase(),
    password,
    provider: "email",
  });

  sendToken(res, user, 201, "Account created successfully.");
});

/* ────────────────────────────────────────────
   POST /api/auth/login
   Body: { email, password }
──────────────────────────────────────────── */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required.");
  }

  /* Explicitly select password (it's excluded by default) */
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user || !user.password) {
    res.status(401);
    throw new Error("Invalid email or password.");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid email or password.");
  }

  sendToken(res, user, 200, "Logged in successfully.");
});

/* ────────────────────────────────────────────
   POST /api/auth/google
   Body: { idToken }  (ID token from Google GIS)
──────────────────────────────────────────── */
export const googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    res.status(400);
    throw new Error("Google ID token is required.");
  }

  const { googleId, email, name, avatar } = await verifyGoogleToken(idToken);

  /* Upsert user */
  let user = await User.findOne({ email: email.toLowerCase() });

  if (user) {
    /* Existing user — update Google details */
    user.googleId = googleId;
    user.avatar   = avatar;
    user.provider = "google";
    await user.save();
  } else {
    /* New user via Google */
    user = await User.create({
      name,
      email:    email.toLowerCase(),
      googleId,
      avatar,
      provider: "google",
    });
  }

  sendToken(res, user, 200, "Google sign-in successful.");
});

/* ────────────────────────────────────────────
   GET /api/auth/me
   Header: Authorization: Bearer <token>
──────────────────────────────────────────── */
export const getMe = asyncHandler(async (req, res) => {
  /* req.user is set by protect middleware */
  res.json({
    success: true,
    user:    req.user.toPublicJSON(),
  });
});

/* ────────────────────────────────────────────
   PUT /api/auth/update-profile
   Body: { name, avatar }
──────────────────────────────────────────── */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatar } = req.body;
  const user = await User.findById(req.user._id);

  if (name)   user.name   = name.trim();
  if (avatar) user.avatar = avatar;

  await user.save();

  res.json({
    success: true,
    message: "Profile updated.",
    user:    user.toPublicJSON(),
  });
});

/* ────────────────────────────────────────────
   PUT /api/auth/change-password
   Body: { currentPassword, newPassword }
──────────────────────────────────────────── */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("Current and new password are required.");
  }

  if (newPassword.length < 8) {
    res.status(400);
    throw new Error("New password must be at least 8 characters.");
  }

  const user = await User.findById(req.user._id).select("+password");

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    res.status(401);
    throw new Error("Current password is incorrect.");
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: "Password changed successfully." });
});
