// routes/shareRoutes.js
import { Router }                    from "express";
import multer                         from "multer";
import { protect }                    from "../middleware/authMiddleware.js";
import { uploadPDF, getSharedPDF }    from "../controllers/shareController.js";

/* Memory storage — no disk writes */
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 15 * 1024 * 1024 }, // 15 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed."));
  },
});

const router = Router();

// Upload PDF → get back a public link (requires auth)
router.post("/pdf", protect, upload.single("pdf"), uploadPDF);

// Serve PDF publicly — anyone with the link can access
router.get("/:token", getSharedPDF);

export default router;
