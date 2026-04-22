import { Router }        from "express";
import {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
}                        from "../controllers/invoiceController.js";
import { protect }       from "../middleware/authMiddleware.js";
import { apiLimiter }    from "../middleware/rateLimiter.js";

const router = Router();

/* All invoice routes are protected */
router.use(protect);
router.use(apiLimiter);

router.route("/")
  .get(getInvoices)
  .post(createInvoice);

router.route("/:id")
  .get(getInvoice)
  .put(updateInvoice)
  .delete(deleteInvoice);

export default router;
