import Invoice      from "../models/Invoice.js";
import asyncHandler from "../utils/asyncHandler.js";

/* ── Compute totals from items + tax settings ── */
const computeTotals = (items, tax, taxType) => {
  const subtotal = items.reduce((s, i) => s + (i.quantity * i.rate), 0);
  const igstAmt  = subtotal * tax / 100;
  const cgst     = subtotal * tax / 200;
  const sgst     = subtotal * tax / 200;
  const taxAmt   = taxType === "igst" ? igstAmt : cgst + sgst;
  const total    = subtotal + taxAmt;
  return { subtotal, taxAmt, total };
};

/* ── GET /api/invoices ── */
export const getInvoices = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const query = { user: req.user._id };

  if (search) {
    query.$or = [
      { invoiceNumber: { $regex: search, $options: "i" } },
      { "to.name":     { $regex: search, $options: "i" } },
    ];
  }

  const total    = await Invoice.countDocuments(query);
  const invoices = await Invoice.find(query)
    .sort({ isPinned: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .select("invoiceNumber date to.name from.name total isProforma isPinned createdAt");

  res.json({
    success: true,
    count:   invoices.length,
    total,
    page:    Number(page),
    pages:   Math.ceil(total / limit),
    invoices,
  });
});

/* ── GET /api/invoices/:id ── */
export const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id });

  if (!invoice) {
    res.status(404);
    throw new Error("Invoice not found.");
  }

  res.json({ success: true, invoice });
});

/* ── POST /api/invoices ── */
export const createInvoice = asyncHandler(async (req, res) => {
  const data = req.body;
  const { subtotal, taxAmt, total } = computeTotals(
    data.items || [], data.tax || 18, data.taxType || "cgst_sgst"
  );

  const invoice = await Invoice.create({
    ...data,
    user: req.user._id,
    subtotal,
    taxAmt,
    total,
  });

  res.status(201).json({ success: true, message: "Invoice created.", invoice });
});

/* ── PUT /api/invoices/:id ── */
export const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id });

  if (!invoice) {
    res.status(404);
    throw new Error("Invoice not found.");
  }

  const data = req.body;
  const { subtotal, taxAmt, total } = computeTotals(
    data.items || invoice.items, data.tax ?? invoice.tax, data.taxType || invoice.taxType
  );

  const updated = await Invoice.findByIdAndUpdate(
    req.params.id,
    { ...data, subtotal, taxAmt, total },
    { new: true, runValidators: true }
  );

  res.json({ success: true, message: "Invoice updated.", invoice: updated });
});

/* ── PATCH /api/invoices/:id/pin ── */
export const togglePin = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id });
  if (!invoice) { res.status(404); throw new Error("Invoice not found."); }
  invoice.isPinned = !invoice.isPinned;
  await invoice.save();
  res.json({ success: true, isPinned: invoice.isPinned });
});

/* ── DELETE /api/invoices/:id ── */
export const deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!invoice) {
    res.status(404);
    throw new Error("Invoice not found.");
  }

  res.json({ success: true, message: "Invoice deleted." });
});