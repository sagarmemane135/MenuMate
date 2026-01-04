# 📊 Advanced Analytics Dashboard - Pro Feature

## Overview
MenuMate now includes a comprehensive analytics dashboard exclusively for **Pro subscribers**. This powerful feature provides deep insights into restaurant performance, helping owners make data-driven decisions.

---

## 🎯 Features Implemented

### **1. Pro Subscription System**
- ✅ Added `subscription_tier` field to users table (`free`, `pro`, `enterprise`)
- ✅ Pro feature gating with beautiful upgrade prompts
- ✅ "Pro" badge in navigation
- ✅ Migration script: `packages/db/migrations/0005_add_subscription_tier.sql`

### **2. Daily Analytics** (`/admin/analytics?view=daily`)
**Metrics:**
- Total Revenue (₹)
- Total Orders
- Average Order Value
- Active Sessions
- Paid vs Pending Orders

**Visualizations:**
- Hourly revenue breakdown (24-hour chart)
- Hourly order count
- Interactive tooltips

**Use Cases:**
- Identify peak hours
- Optimize staff scheduling
- Track daily performance

---

### **3. Monthly Analytics** (`/admin/analytics?view=monthly`)
**Metrics:**
- Current month revenue & orders
- Previous month comparison
- Revenue growth percentage
- Orders growth percentage
- Peak day identification

**Visualizations:**
- Daily revenue trend (full month)
- Growth indicators (up/down arrows)
- Day-by-day breakdown

**Use Cases:**
- Track monthly trends
- Measure growth
- Identify best-performing days

---

### **4. Item Performance** (`/admin/analytics?view=items`)
**Metrics:**
- Top 10 sellers by quantity
- Top 10 sellers by revenue
- Least selling items
- Never ordered items

**Data Points:**
- Quantity sold
- Revenue generated
- Orders count
- Average per order

**Actionable Insights:**
- ✅ **Top Sellers**: Promote these items, ensure stock availability
- ⚠️ **Least Selling**: Consider promotions or menu optimization
- ❌ **Never Ordered**: Review pricing, descriptions, or remove

---

### **5. Category Performance** (`/admin/analytics?view=categories`)
**Metrics:**
- Revenue by category
- Revenue percentage distribution
- Items sold per category
- Unique items sold

**Visualizations:**
- Horizontal bar chart with percentages
- Color-coded categories
- Detailed breakdown table

**Use Cases:**
- Identify most profitable categories
- Balance menu offerings
- Optimize inventory

---

## 🎨 UI/UX Design

### **Professional Theme**
- Clean, business-focused interface
- Blue/neutral color palette
- Data tables with hover effects
- Responsive charts

### **Navigation**
- New "Analytics" menu item with "Pro" badge
- Tab-based navigation (Daily/Monthly/Items/Categories)
- Smooth transitions

### **Pro Gate**
- Beautiful upgrade prompt for free users
- Feature showcase
- Pricing display (₹999/month)
- Benefits highlight

---

## 🔧 Technical Implementation

### **API Endpoints**
All endpoints require Pro subscription:

1. **`GET /api/analytics/daily`**
   - Query params: `restaurantId`, `date` (optional)
   - Returns: Daily metrics + hourly breakdown

2. **`GET /api/analytics/monthly`**
   - Query params: `restaurantId`, `year`, `month`
   - Returns: Monthly metrics + daily breakdown + growth

3. **`GET /api/analytics/items`**
   - Query params: `restaurantId`, `period` (days, default 30)
   - Returns: Top/least/never ordered items

4. **`GET /api/analytics/categories`**
   - Query params: `restaurantId`, `period` (days, default 30)
   - Returns: Category performance + revenue distribution

### **Components**
- `apps/next/app/admin/analytics/page.tsx` - Server component
- `apps/next/app/admin/analytics/analytics-page-client.tsx` - Client component
- `apps/next/components/pro-gate.tsx` - Upgrade prompt
- `apps/next/components/analytics/daily-chart.tsx` - Hourly chart
- `apps/next/components/analytics/monthly-chart.tsx` - Daily trend
- `apps/next/components/analytics/category-chart.tsx` - Category bars
- `apps/next/components/analytics/items-table.tsx` - Items data table

### **Database Schema**
```sql
-- New fields in users table
subscription_tier: enum('free', 'pro', 'enterprise') DEFAULT 'free'
subscription_expires_at: timestamp (nullable)
```

---

## 📈 Business Value

### **For Restaurant Owners**
1. **Increase Revenue**: Identify and promote best sellers
2. **Reduce Waste**: Spot slow-moving items
3. **Optimize Operations**: Schedule staff based on peak hours
4. **Data-Driven Decisions**: Replace guesswork with facts
5. **Menu Optimization**: Balance offerings across categories

### **For MenuMate**
1. **Premium Feature**: Justifies Pro subscription
2. **Competitive Advantage**: Advanced analytics rare in restaurant POS
3. **Recurring Revenue**: Monthly subscription model
4. **User Retention**: Valuable insights keep users engaged

---

## 🚀 Access Instructions

### **For Testing (Grant Pro Access)**
Run this SQL migration to grant Pro access to a user:

```sql
UPDATE users 
SET subscription_tier = 'pro', 
    subscription_expires_at = NOW() + INTERVAL '1 year'
WHERE email = 'your-email@example.com';
```

### **For Users**
1. Navigate to `/admin/analytics`
2. If free tier → See upgrade prompt
3. If pro tier → Access full analytics dashboard

---

## 🎯 Future Enhancements

### **Phase 2 (Suggested)**
- [ ] Payment integration for Pro upgrades
- [ ] Export reports to PDF/Excel
- [ ] Email weekly/monthly reports
- [ ] Custom date range selection
- [ ] Comparison with industry benchmarks
- [ ] Staff performance analytics
- [ ] Customer behavior insights
- [ ] Predictive analytics (AI-powered)

### **Phase 3 (Advanced)**
- [ ] Real-time analytics dashboard
- [ ] Mobile app with analytics
- [ ] Multi-location comparison
- [ ] Inventory forecasting
- [ ] Dynamic pricing recommendations

---

## 📊 Sample Metrics (Example Data)

### Daily Analytics
```
Total Revenue: ₹12,450
Total Orders: 47
Avg Order Value: ₹265
Active Sessions: 8
Peak Hour: 7 PM (₹3,200 revenue)
```

### Monthly Analytics
```
Current Month: ₹3,45,000 (142 orders)
Previous Month: ₹2,98,000 (128 orders)
Revenue Growth: +15.8%
Orders Growth: +10.9%
Peak Day: 15th (₹18,500)
```

### Top Items
```
1. Butter Chicken - 145 sold, ₹43,500 revenue
2. Paneer Tikka - 132 sold, ₹39,600 revenue
3. Dal Makhani - 98 sold, ₹19,600 revenue
```

---

## 🔐 Security & Performance

- ✅ Pro tier validation on every API call
- ✅ User authentication required
- ✅ Restaurant ownership verification
- ✅ Efficient database queries with indexes
- ✅ Caching-ready architecture
- ✅ No sensitive data exposed to client

---

## 📝 Notes

- All monetary values in Indian Rupees (₹)
- Date ranges configurable
- Charts are responsive and mobile-friendly
- Color-coded for quick insights
- Tooltips provide detailed information

---

**Deployed:** ✅ Live at https://menu-mate-ochre.vercel.app/admin/analytics
**Status:** Production Ready
**Subscription Required:** Pro or Enterprise

