import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  description: { type: String, default: "" },
  hsn:         { type: String, default: "" },
  quantity:    { type: Number, default: 1 },
  rate:        { type: Number, default: 0 },
  per:         { type: String, default: "Nos" },
  amount:      { type: Number, default: 0 },
});

const partySchema = new mongoose.Schema({
  name:      { type: String, default: "" },
  address:   { type: String, default: "" },
  city:      { type: String, default: "" },
  state:     { type: String, default: "" },
  zipCode:   { type: String, default: "" },
  stateCode: { type: String, default: "" },
  gstin:     { type: String, default: "" },
  pan:       { type: String, default: "" },
});

const bankSchema = new mongoose.Schema({
  bankName:    { type: String, default: "" },
  accountHolder:{ type: String, default: "" },
  accountNumber:{ type: String, default: "" },
  ifsc:        { type: String, default: "" },
  accountType: { type: String, enum: ["Current", "Savings"], default: "Current" },
  branch:      { type: String, default: "" },
});

const invoiceSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
    invoiceNumber:    { type: String, default: "" },
    date:             { type: String, default: "" },
    suppliersRef:     { type: String, default: "" },
    buyerOrderNo:     { type: String, default: "" },
    dispatchDocNo:    { type: String, default: "" },
    dispatchedThrough:{ type: String, default: "" },
    termsOfDelivery:  { type: String, default: "" },
    isProforma:       { type: Boolean, default: false },
    from:    partySchema,
    to:      partySchema,
    items:   [itemSchema],
    tax:     { type: Number, default: 18 },
    taxType: { type: String, enum: ["cgst_sgst", "igst"], default: "cgst_sgst" },
    notes:   { type: String, default: "" },
    bank:    bankSchema,
    subtotal:{ type: Number, default: 0 },
    taxAmt:  { type: Number, default: 0 },
    total:   { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
