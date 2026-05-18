// controllers/shareController.js
import crypto       from "crypto";
import asyncHandler from "../utils/asyncHandler.js";

const store = new Map();

/* Cleanup expired entries every hour */
setInterval(() => {
  const now = Date.now();
  for (const [token, entry] of store.entries()) {
    if (entry.expires < now) store.delete(token);
  }
}, 60 * 60 * 1000);

/* ── POST /api/share/pdf ── */
export const uploadPDF = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No PDF file uploaded.");
  }

  const token   = crypto.randomBytes(20).toString("hex");
  const name    = req.body.name || "invoice.pdf";
  const expires = Date.now() + 24 * 60 * 60 * 1000;

  store.set(token, { buffer: req.file.buffer, name, expires });

  /* Auto-detect base URL from request if BACKEND_URL not set */
  const baseUrl =
    process.env.BACKEND_URL ||
    `${req.protocol}://${req.get("host")}`;

  const url = `${baseUrl}/api/share/${token}`;

  console.log("Share link generated:", url);

  res.json({ success: true, url, expiresIn: "24 hours" });
});

/* ── GET /api/share/:token ── */
export const getSharedPDF = asyncHandler(async (req, res) => {
  const entry = store.get(req.params.token);

  if (!entry || entry.expires < Date.now()) {
    store.delete(req.params.token);
    res.status(404);
    throw new Error("Link expired or not found.");
  }

  res.set({
    "Content-Type":        "application/pdf",
    "Content-Disposition": `inline; filename="${entry.name}"`,
    "Content-Length":      entry.buffer.length,
    "Cache-Control":       "no-store",
  });
  res.send(entry.buffer);
});