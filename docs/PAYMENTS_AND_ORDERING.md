# Payments & Customer Ordering

## Payment modes

| Mode | Flow | Customer reliability | Money to restaurant |
|------|------|----------------------|---------------------|
| **Pay at counter** | Customer chooses “Pay at counter” → staff notified → customer pays in person → admin marks session as paid | **Highest**: no gateway/card issues; customer pays in person | **Direct**: cash/card goes to restaurant at counter |
| **Pay online** | Customer chooses “Pay online” → Razorpay checkout → server verifies payment → session closed | **Good** if Razorpay is configured and server verification is used | Via Razorpay (see below) |

---

## Which payment mode to set for reliability

- **Default / recommended for in-person dining**: **Pay at counter**  
  - Most reliable: no gateway failures, no “I paid but it didn’t show.”  
  - Money goes directly to the restaurant.  
  - You still show “Pay online” as an option; many customers will choose counter for dine-in.

- **When to prefer Pay online**  
  - Quick service / takeaway where you want payment before serving.  
  - You have Razorpay configured and are okay with gateway dependency.

- **Implementation note**  
  - The app **offers both** on the bill page; you don’t “set” one mode globally.  
  - To emphasise counter: you could reorder the buttons (counter first) or add a short line like “Pay at counter recommended for dine-in.”

---

## Making sure payment goes to the restaurant

### Current setup (single Razorpay account)

- All online payments go to **one** Razorpay account (the one in `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`).
- That account is usually the **platform** (you). To get money to the restaurant you either:
  - **Settle manually**: transfer from your bank to each restaurant (e.g. weekly), or  
  - **Automate**: use Razorpay Route / Connect so part or all of the payment is sent to the restaurant (see below).

### Option A: Razorpay Route (recommended for “payment to restaurant”)

- Each restaurant has a **linked account** (bank details or Razorpay account).
- When a payment is captured, you use **Route** to transfer a share (e.g. 100%) to that linked account.
- Money reaches the restaurant’s bank; you can retain a platform fee if you want.
- Requires: Razorpay Route enabled, linked accounts per restaurant, and code that calls **transfers** after payment capture (e.g. in a webhook or after `verify-online-payment`).

### Option B: Razorpay Connect (marketplace)

- Restaurants onboard as **connected accounts**.
- Payments can be created with a “destination” so funds go to the restaurant’s connected account (with your fee).
- More setup (onboarding, compliance); suitable if you are a marketplace.

### Option C: Single account + manual settlement

- Keep one Razorpay account; use your dashboard or internal tooling to track “restaurant X is owed ₹Y” and pay them via NEFT/IMPS etc.
- No code change for “payment to restaurant”; only process and accounting.

**Summary**: For **customer reliability**, offer both options and nudge “Pay at counter” for dine-in. For **payment to restaurant** with online payments, use **Razorpay Route** (or Connect) so funds can be sent to the restaurant; otherwise use a single account and settle to restaurants manually.

---

## Security fix: online payment verification

- **Before**: Bill page closed the session with only `razorpay_payment_id` from the client; the server did not verify the payment. A malicious user could mark a session as paid without paying.
- **After**: On “Pay online” success, the client sends `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature` to **`POST /api/sessions/:sessionToken/verify-online-payment`**. The server verifies the Razorpay signature and only then marks the session and orders as paid. This is required for reliability and security.

---

## Edge cases – customer ordering (implemented)

| Edge case | Implementation |
|-----------|----------------|
| **Session already closed/paid** | **Close**, **request-counter-payment**, and **verify-online-payment** return `400` with “Session is already closed or paid.” **Orders/create** returns `400` “Session is closed or already paid. Please create a new session to order.” |
| **Customer pays online then closes tab before verify** | **Razorpay webhook** `POST /api/webhooks/razorpay` on `payment.captured`: verifies signature, fetches Razorpay order (receipt = session id), validates amount, marks session and orders paid. Set `RAZORPAY_WEBHOOK_SECRET` and configure the URL in Razorpay Dashboard. |
| **Duplicate “Place order”** | **Idempotency**: client sends `Idempotency-Key` header (UUID per “place order” attempt); server stores key → order_id (TTL 5 min). Duplicate request returns `200` with same order. Button disabled while `isSendingOrder` and key reused until success. DB table `order_idempotency`. |
| **Order when session is closed/paid** | **Backend**: `POST /api/orders/create` rejects with `400` if session is not active. **UI**: “Send to kitchen” disabled when `sessionStatus === "closed" \|\| "paid"`; token verification in `sendToKitchen` updates status and returns early with toast if session closed/paid. |
| **Invalid or expired session token** | All session APIs return `404` with `{ success: false, error: "Session not found or expired." }`. Bill page shows “Session not found or expired.” and “The link may have expired or the session was closed.” |
| **Payment gateway down** | Bill page: create-order failure or 5xx/“gateway” error shows “Online payment is temporarily unavailable. Please use Pay at counter.” |
| **Pay at counter but never pays** | Session stays pending; admin sees it in Sessions and can mark as paid when customer pays at counter. |
| **Razorpay key missing** | Create-order returns “Payment gateway not configured.” Bill page shows “Online payment is temporarily unavailable. Please use Pay at counter.” |

---

## Quick checklist for production

- [ ] Razorpay keys set in env (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`).
- [ ] **RAZORPAY_WEBHOOK_SECRET** set and webhook URL configured in Razorpay Dashboard: `https://your-domain.com/api/webhooks/razorpay`, event `payment.captured`.
- [ ] Online payments go through **verify-online-payment** (implemented).
- [ ] Razorpay webhook for `payment.captured` (implemented) so session is marked paid if client closed before verify.
- [ ] Run migration `0008_order_idempotency.sql` for duplicate-order protection.
- [ ] Optional: Razorpay Route (or Connect) so online payment goes to the restaurant; otherwise settle manually.
- [ ] UI: order submit disabled when session closed/paid; idempotency key sent with place-order (implemented).
