import mongoose from "mongoose";
import bcrypt   from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, "Name is required"],
      trim:     true,
      minLength:[2,  "Name must be at least 2 characters"],
      maxLength:[60, "Name cannot exceed 60 characters"],
    },
    email: {
      type:     String,
      required: [true, "Email is required"],
      unique:   true,
      trim:     true,
      lowercase: true,
      match:    [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type:   String,
      select: false,      // never return password by default
      minLength: [8, "Password must be at least 8 characters"],
    },
    provider: {
      type:    String,
      enum:    ["email", "google"],
      default: "email",
    },
    googleId: {
      type:   String,
      unique: true,
      sparse: true,       // allow null for email users
    },
    avatar: {
      type:    String,
      default: null,
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

/* ── Hash password before save ── */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

/* ── Instance method — compare passwords ── */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/* ── Strip sensitive fields when serialising to JSON ── */
userSchema.methods.toPublicJSON = function () {
  return {
    id:        this._id,
    name:      this.name,
    email:     this.email,
    avatar:    this.avatar,
    provider:  this.provider,
    createdAt: this.createdAt,
  };
};

const User = mongoose.model("User", userSchema);
export default User;
