# Edge Case Testing Guide

How to test each edge case we fixed for customer ordering and payments.

---

## Prerequisites

- App running (`npm run dev`), localhost or ngrok.
- **Two browsers** (or one normal + one incognito): one for **customer** (menu at `/r/{slug}`), one for **admin** (login → dashboard, orders, sessions, kitchen).
- A **restaurant** with menu items; know the **restaurant slug** (e.g. from Super Admin → All restaurants).
- Optional: Razorpay in test mode + ngrok for webhook tests.

---

## 1. Session already closed/paid → API returns error

**Goal:** APIs reject actions on a session that is already closed or paid.

### 1a. Close session twice

1. **Customer:** Open `/r/{slug}?table=5` → create session → place one order → go to **Bill** (`/bill?session=...`).
2. **Customer:** Choose **Pay at counter** → “Payment request sent”.
3. **Admin:** Sessions → find table 5 → open session → **Mark as paid**.
4. **Customer:** On the same bill page, try again to choose **Pay at counter** (or refresh and click again).

**Expected:** Request fails; no duplicate “closed” or “paid” state. (If the UI hides the button after paid, use the next test.)

### 1b. Call close API again (DevTools)

1. Get a **session token** from a session you just closed/paid (e.g. from bill URL or from a previous order).
2. In browser console or Postman:
   ```bash
   fetch('/api/sessions/YOUR_SESSION_TOKEN/close', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ paymentMethod: 'counter' }),
     credentials: 'include'
   }).then(r => r.json()).then(console.log)
   ```
   Use the same token again for a second call.

**Expected:** First call may succeed; second returns **400** with message like “Session is already closed or paid.”

---

## 2. Order when session is closed/paid

**Goal:** Backend rejects new orders; UI disables ordering and shows a clear message.

### 2a. Backend

1. **Customer:** Create session at `/r/{slug}?table=6` → place one order.
2. **Admin:** Sessions → find table 6 → **Mark as paid** (or close session).
3. **Customer:** Stay on menu, add items to cart, click **Send to kitchen** (or **Confirm & Send**).

**Expected:** Toast: “This session is closed or already paid. Create a new session to order.” No new order is created.

### 2b. UI disabled state

1. **Customer:** Create session → place order → go to Bill → **Pay at counter**.
2. **Admin:** Mark that session as paid.
3. **Customer:** Go back to menu (same table/session). Try to place another order.

**Expected:** “Send to kitchen” / “Confirm & Send” should be disabled or, when clicked, show the closed/paid toast above.

---

## 3. Duplicate “Place order” (idempotency)

**Goal:** Double submit or retry does not create two orders; same order is returned.

### 3a. Double-click (UI)

1. **Customer:** `/r/{slug}?table=7` → create session → add item → open confirmation dialog.
2. Quickly **double-click** “Confirm & Send” (or the final submit button).

**Expected:** Only **one** order appears in Kitchen/Orders; toast once. No duplicate order.

### 3b. Retry after network glitch (optional)

1. **Customer:** Add items → submit order.
2. In DevTools → Network: set throttling to “Offline” right after clicking submit, then back to “Online” and click submit again (same cart/session).

**Expected:** Second request returns **200** with the **same** order id (idempotency); no second order created.

---

## 4. Invalid or expired session token

**Goal:** Invalid/missing token returns 404; bill page shows a clear message.

### 4a. Bill page with bad token

1. Open: `/bill?session=invalid-token-12345`.

**Expected:** After load, page shows **“Session not found or expired.”** and text like “The link may have expired or the session was closed.” (No crash.)

### 4b. API

1. In console or Postman:
   ```bash
   fetch('/api/sessions/invalid-token-123').then(r => r.json()).then(console.log)
   ```
**Expected:** **404** and body like `{ success: false, error: "Session not found or expired." }`.

---

## 5. Payment gateway down / Razorpay not configured

**Goal:** User sees a friendly message and is nudged to “Pay at counter.”

### 5a. Razorpay keys removed (simulate gateway down)

1. In `apps/next/.env`, temporarily rename or comment out:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
2. Restart dev server.
3. **Customer:** Create session → place order → go to Bill → click **Pay online**.

**Expected:** Error toast: **“Online payment is temporarily unavailable. Please use Pay at counter.”** (No raw “gateway not configured” or 500.)

4. Restore the env vars and restart.

---

## 6. Pay at counter but never pays

**Goal:** Session stays pending until admin marks it paid.

1. **Customer:** Bill → **Pay at counter** → “Payment request sent”.
2. **Admin:** Sessions → see that session (e.g. “Pay at counter” or pending).
3. Do **not** mark as paid.
4. **Admin:** Refresh Sessions; session still pending.

**Expected:** Session remains in “pending” / “Pay at counter” until admin clicks **Mark as paid**. No automatic close.

---

## 7. Customer pays online then closes tab before verify (webhook)

**Goal:** Razorpay webhook still marks the session paid so next time they open the bill link it shows paid.

**Needs:** Razorpay test mode, ngrok, `RAZORPAY_WEBHOOK_SECRET` set, webhook URL `https://your-ngrok-url/api/webhooks/razorpay` with event `payment.captured`.

1. **Customer:** Bill → **Pay online** → complete payment in Razorpay test (use test card).
2. **Immediately** close the tab (or kill the tab) **before** the app’s “Payment successful!” or redirect.
3. **Customer:** Open the **same** bill link again (e.g. from email or history): `/bill?session=...`.

**Expected:** After a few seconds, bill page shows session as **paid** (webhook ran and marked session paid). No need to pay again.

---

## 8. Kitchen: no “New order received!” on refresh

**Goal:** Refreshing the Kitchen page does not trigger a false “New order received!”.

1. **Admin:** Open **Kitchen** with some existing orders.
2. **Refresh** the page (F5 or Ctrl+R).

**Expected:** No “New order received!” toast and no sound. Toast/sound only when a **new** order actually appears (e.g. customer places one while Kitchen is open).

---

## Quick checklist

| # | Edge case | How to test | Pass? |
|---|-----------|-------------|--------|
| 1 | Session already closed/paid | Close/mark paid, then call close again or repeat action | 400 / no duplicate state |
| 2 | Order when session closed/paid | Mark session paid, then try to place order from menu | Toast + no new order |
| 3 | Duplicate place order | Double-click submit or retry with same idempotency key | One order, 200 on retry |
| 4 | Invalid session token | Bill with bad token, or GET session API with bad token | 404 + clear message on bill |
| 5 | Gateway down | Disable Razorpay env → Pay online | “Use Pay at counter” message |
| 6 | Pay at counter never pays | Request counter payment, don’t mark paid | Stays pending until admin marks |
| 7 | Tab closed after pay (webhook) | Pay online, close tab before verify, reopen bill link | Session shows paid |
| 8 | Kitchen refresh | Refresh Kitchen page | No false “New order received!” |

Use this guide to run through each scenario and confirm the app behaves as in the “Expected” and “Pass?” columns.
