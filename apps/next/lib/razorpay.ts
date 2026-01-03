import Razorpay from "razorpay";

// Initialize Razorpay instance
// Check if credentials are available, otherwise create a dummy instance
const keyId = process.env.RAZORPAY_KEY_ID || "dummy_key_id";
const keySecret = process.env.RAZORPAY_KEY_SECRET || "dummy_key_secret";

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn("[RAZORPAY] Credentials not configured. Payment gateway will not work.");
}

export const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

// Verify Razorpay payment signature
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const crypto = require("crypto");
  
  const body = orderId + "|" + paymentId;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body.toString())
    .digest("hex");

  return expectedSignature === signature;
}



