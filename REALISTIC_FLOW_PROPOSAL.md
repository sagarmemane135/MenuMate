# 🍽️ MenuMate - Realistic Restaurant Flow (Improved)

## 🎯 Current Problems

### ❌ **Rigid Payment Flow**
- Customer MUST pay immediately after ordering
- Can't order appetizer, then main course, then dessert
- Each order = separate payment
- Not realistic for dining experience

---

## ✅ Proposed Solution: **Table Sessions**

### 💡 Concept:
Instead of **"Order → Pay → Done"**, we use:
**"Scan QR → Start Session → Order Multiple Times → Pay Once at End"**

---

## 🔄 New Flow Architecture

### **Option A: Session-Based Ordering (Recommended)**

```
┌─────────────────────────────────────────────┐
│  Customer scans QR code on Table 5          │
│  System creates "Table Session"             │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Customer browses menu                      │
│  Adds items to cart                         │
│  Clicks "Send to Kitchen"                   │
│  → Order sent WITHOUT payment               │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Kitchen receives order (Status: PENDING)   │
│  Starts preparing                           │
│  Customer keeps browsing menu               │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Customer can order MORE items:             │
│  • "Order another round of drinks"          │
│  • "Add dessert"                            │
│  • "One more appetizer"                     │
│  All added to SAME table session            │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  When ready to leave:                       │
│  Customer clicks "View Bill" or "Pay Now"   │
│  Sees all items ordered during session      │
│  THEN chooses payment method                │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Payment Options:                           │
│  • Pay Online (Razorpay) 💳                │
│  • Pay at Counter 🏪                       │
│  • Split Bill (between friends) 👥         │
└─────────────────────────────────────────────┘
```

---

## 📊 Database Changes Needed

### **New Table: `table_sessions`**
```sql
CREATE TABLE table_sessions (
  id UUID PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  table_number VARCHAR(20) NOT NULL,
  session_token VARCHAR(100) UNIQUE, -- For linking orders
  status ENUM('active', 'closed', 'paid'),
  started_at TIMESTAMP,
  closed_at TIMESTAMP,
  total_amount DECIMAL(10, 2),
  payment_method VARCHAR(50), -- 'online', 'counter', 'split'
  payment_status VARCHAR(20)
);
```

### **Update `orders` Table:**
```sql
ALTER TABLE orders 
  ADD COLUMN session_id UUID REFERENCES table_sessions(id),
  ADD COLUMN is_paid BOOLEAN DEFAULT false,
  ADD COLUMN ordered_at TIMESTAMP;
```

---

## 🎨 UI/UX Changes

### **1. Menu Page (`/r/[slug]`)**
```
┌──────────────────────────────────────┐
│  🍽️ Restaurant Name                  │
│  📍 Table 5 • Session Active         │
├──────────────────────────────────────┤
│                                      │
│  [Browse Menu Items...]              │
│                                      │
│  🛒 Cart (3 items)                   │
├──────────────────────────────────────┤
│  [Send to Kitchen]  [View My Bill]   │
└──────────────────────────────────────┘
```

### **2. Bill Summary Page (`/bill`)**
```
┌──────────────────────────────────────┐
│  📋 Your Bill - Table 5              │
├──────────────────────────────────────┤
│  Order #1 (7:30 PM)                  │
│    • Paneer Tikka x1     ₹180        │
│    • Naan x2             ₹80         │
│                                      │
│  Order #2 (8:15 PM)                  │
│    • Biryani x2          ₹500        │
│                                      │
│  Order #3 (9:00 PM)                  │
│    • Ice Cream x2        ₹120        │
├──────────────────────────────────────┤
│  Total: ₹880                         │
├──────────────────────────────────────┤
│  [Pay Online 💳]  [Pay at Counter 🏪]│
│  [Split Bill 👥]                     │
└──────────────────────────────────────┘
```

---

## 🔐 Session Management

### **How Sessions Work:**

1. **QR Code includes Table Number**
   ```
   URL: /r/restaurant-slug?table=5
   ```

2. **Create Session on First Scan**
   ```javascript
   // Check if active session exists for this table
   const session = await getActiveSession(restaurantId, tableNumber);
   
   if (!session) {
     // Create new session
     session = await createTableSession({
       restaurantId,
       tableNumber,
       sessionToken: generateToken(),
       status: 'active'
     });
   }
   
   // Store session token in localStorage
   localStorage.setItem('table_session', session.sessionToken);
   ```

3. **Link Orders to Session**
   ```javascript
   // When customer sends order to kitchen
   await createOrder({
     sessionId: session.id,
     items: cartItems,
     isPaid: false, // Not paid yet!
     status: 'pending'
   });
   ```

4. **Close Session on Payment**
   ```javascript
   // When customer pays
   await closeSession(sessionId, {
     status: 'paid',
     paymentMethod: 'online',
     closedAt: new Date()
   });
   ```

---

## 💳 Payment Options

### **Option 1: Pay Online (Current)**
- Razorpay integration
- Pay entire bill at once
- Immediate confirmation

### **Option 2: Pay at Counter (New)**
```javascript
// Mark session as "pending counter payment"
await updateSession(sessionId, {
  status: 'closed',
  paymentMethod: 'counter',
  paymentStatus: 'pending'
});

// Admin dashboard shows:
// "Table 5 - ₹880 - Waiting at counter"
```

### **Option 3: Split Bill (New)**
```javascript
// Calculate per person amount
const perPerson = totalAmount / numberOfPeople;

// Generate multiple payment links
// Each person pays their share
```

---

## 🎯 Edge Cases Handled

### ✅ **Case 1: Customer Leaves Without Paying**
**Solution:**
- Session stays "active" for 2 hours
- Admin can manually close/mark as unpaid
- Add to "unpaid bills" report

### ✅ **Case 2: Multiple People at Same Table**
**Solution:**
- Each person scans QR separately
- All linked to same table session
- Can split bill at end

### ✅ **Case 3: Customer Wants to Cancel Item**
**Solution:**
- Before payment: Can modify freely
- After payment: Contact waiter (admin dashboard)

### ✅ **Case 4: Network Issues During Payment**
**Solution:**
- Save order first (isPaid=false)
- Attempt payment
- If fails: Show "Pay Later" option
- Order still sent to kitchen

### ✅ **Case 5: Wrong Table Number**
**Solution:**
- Admin can reassign orders to correct table
- Customer can scan different QR (new session)

---

## 📱 User Experience

### **Customer Perspective:**
```
1. Arrive at restaurant
2. Scan QR code → Menu opens
3. Order appetizers → "Send to Kitchen"
4. Wait & eat
5. Order main course → "Send to Kitchen"
6. Wait & eat
7. Order dessert → "Send to Kitchen"
8. Ready to leave → "View Bill"
9. See all orders (₹880)
10. Choose: Pay Online OR Pay at Counter
11. Leave happy! 😊
```

### **Admin Perspective:**
```
Dashboard shows:
┌─────────────────────────────────────┐
│ Active Tables                       │
├─────────────────────────────────────┤
│ Table 5 • 3 orders • ₹880           │
│ [View Orders] [Close Session]       │
│                                     │
│ Table 8 • 2 orders • ₹450           │
│ [View Orders] [Close Session]       │
└─────────────────────────────────────┘
```

---

## 🚀 Implementation Priority

### **Phase 5A: Session Management (CRITICAL)**
1. Create table_sessions table
2. QR code with table number
3. Session creation & management
4. Link orders to sessions
5. "Send to Kitchen" without payment

### **Phase 5B: Bill Management**
1. View bill page (all session orders)
2. Pay online (existing Razorpay)
3. "Pay at Counter" option
4. Admin: Mark as paid manually

### **Phase 5C: Advanced Features**
1. Split bill functionality
2. Real-time notifications
3. Session timeout handling
4. Order modification

---

## 💡 Recommendation

**Build in this order:**

1. ✅ **Phase 5A first** (Session Management)
   - Most critical for realistic flow
   - Enables multiple orders per table
   - Better customer experience

2. 🔔 **Then add Real-time Notifications**
   - Makes it feel professional
   - Live order updates
   - Sound alerts

3. 📊 **Then Analytics**
   - Business intelligence
   - Sales reports

---

## 🤔 Questions to Consider

1. **Session Timeout:** How long before auto-close? (2 hours?)
2. **Payment Required:** Should payment be optional? (some restaurants want prepaid only)
3. **Table Verification:** How to prevent wrong table orders? (waiter verification?)
4. **Offline Mode:** What if customer's phone dies mid-session? (admin can close)

---

**What do you think? Should we implement Session Management first?** 🎯

