import Razorpay from "razorpay";

// Get Razorpay instance - creates a fresh instance with current env vars
// This ensures we always use the latest credentials, not cached ones
export function getRazorpayInstance(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials not configured");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

// Legacy export for backward compatibility - but prefer using getRazorpayInstance()
export const razorpay = {
  get orders() {
    return getRazorpayInstance().orders;
  },
  get payments() {
    return getRazorpayInstance().payments;
  },
};

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



