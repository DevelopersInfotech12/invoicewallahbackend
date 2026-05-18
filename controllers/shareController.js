// controllers/shareController.js
import crypto       from "crypto";
import asyncHandler from "../utils/asyncHandler.js";

/*
  In-memory store: token → { buffer, name, expires }
  For production replace with S3 / Cloudinary.
  Tokens expire after 24 hours.
*/
const store = new Map();

/* Cleanup expired entries every hour */
setInterval(() => {
  const now = Date.now();
  for (const [token, entry] of store.entries()) {
    if (entry.expires < now) store.delete(token);
  }
}, 60 * 60 * 1000);

/* ── POST /api/share/pdf ──────────────────────────────
   Body: multipart/form-data { pdf: <file>, name: "INV-001.pdf" }
   Returns: { success, url, expiresIn }
──────────────────────────────────────────────────── */
export const uploadPDF = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No PDF file uploaded.");
  }

  const token   = crypto.randomBytes(20).toString("hex");
  const name    = req.body.name || "invoice.pdf";
  const expires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  store.set(token, { buffer: req.file.buffer, name, expires });

  const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
  if (!process.env.BACKEND_URL) {
    console.warn("⚠️  BACKEND_URL not set in .env — WhatsApp share links will use localhost and won't work for recipients outside this machine. Set BACKEND_URL=https://your-domain.com in .env");
  }
  const url     = `${baseUrl}/api/share/${token}`;

  res.json({ success: true, url, expiresIn: "24 hours" });
});

/* ── GET /api/share/:token ────────────────────────────
   Serves the PDF publicly — no auth required
   so anyone with the link can open/download it.
──────────────────────────────────────────────────── */
export const getSharedPDF = asyncHandler(async (req, res) => {
  const entry = store.get(req.params.token);

  if (!entry) {
    res.status(404);
    throw new Error("Link expired or not found.");
  }

  if (entry.expires < Date.now()) {
    store.delete(req.params.token);
    res.status(410);
    throw new Error("This link has expired.");
  }

  res.set({
    "Content-Type":        "application/pdf",
    "Content-Disposition": `inline; filename="${entry.name}"`,
    "Content-Length":      entry.buffer.length,
    "Cache-Control":       "no-store",
  });
  res.send(entry.buffer);
});