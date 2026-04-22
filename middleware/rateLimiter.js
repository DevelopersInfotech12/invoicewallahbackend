import rateLimit from "express-rate-limit";

/* Strict limiter for auth endpoints */
export const authLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,  // 15 minutes
  max:              20,
  message:          { success: false, error: "Too many requests. Please try again in 15 minutes." },
  standardHeaders:  true,
  legacyHeaders:    false,
});

/* General API limiter */
export const apiLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              200,
  message:          { success: false, error: "Too many requests." },
  standardHeaders:  true,
  legacyHeaders:    false,
});
