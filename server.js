import "dotenv/config";
import express        from "express";
import cors           from "cors";
import helmet         from "helmet";
import morgan         from "morgan";
import { connectDB }  from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import authRoutes     from "./routes/authRoutes.js";
import invoiceRoutes  from "./routes/invoiceRoutes.js";
import shareRoutes    from "./routes/shareRoutes.js";

const app  = express();
const PORT = process.env.PORT || 5000;

/* ── Connect Database ── */
connectDB();

/* ── Global Middleware ── */
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // allow PDF served to WhatsApp/external
}));
app.use(cors({
  origin:      process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));
app.use(express.json({ limit: "10mb" }));         // increased for any base64 payloads
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* ── Health Check ── */
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV, timestamp: new Date() });
});

/* ── Routes ── */
app.use("/api/auth",    authRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/share",    shareRoutes);

/* ── Error Handling ── */
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🚀  Server running on http://localhost:${PORT}`);
  console.log(`📦  Environment : ${process.env.NODE_ENV}`);
});