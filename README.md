# 🍽️ MenuMate - Phygital Restaurant Management Platform

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Your Restaurant, Digitized in 5 Minutes**

MenuMate is a modern, cloud-based restaurant management platform that bridges the physical and digital dining experience. Manage your menu, track orders, and provide customers with a beautiful digital menu—all from your phone.

---

## 📚 Documentation

- **[Features Checklist](./docs/FEATURES_CHECKLIST.md)** - Detailed list of implemented and planned features
- **[Executive Summary](./docs/EXECUTIVE_SUMMARY.md)** - Quick overview for stakeholders and investors
- **[Product Documentation](./docs/PRODUCT_DOCUMENTATION.md)** - Complete product overview, market analysis, and go-to-market strategy

---

## ✨ Key Features (Current - v1.0)

### For Restaurant Owners
- ✅ **5-Minute Setup** - Create your digital menu instantly
- ✅ **Professional UI** - Modern blue theme with clean design
- ✅ **Mobile-First Admin** - Fixed sidebar, responsive across all devices
- ✅ **Real-Time Updates** - Change menu items instantly
- ✅ **Order Management** - Professional table layout with comprehensive order tracking
- ✅ **Kitchen Display System (KDS)** - Real-time kanban board (Pending → Cooking → Ready → Served)
- ✅ **Table Session Management** - Detailed session view with order history
- ✅ **Live Updates** - Polling-based updates for orders and sessions (no external services)
- ✅ **Counter Payment Tracking** - Dedicated notifications and tracking for counter payments
- ✅ **Session Auto-Cleanup** - Automatic cleanup of inactive sessions (1+ hour)
- ✅ **Beautiful Dashboard** - Stats cards, QR codes, quick actions
- ✅ **Multi-Restaurant** - Manage multiple locations

### For Customers
- ✅ **Mobile-First Design** - Fully optimized for mobile devices
- ✅ **Digital Menu** - Modern, easy-to-browse menu with images
- ✅ **Real-Time Availability** - See what's available now
- ✅ **Session-Based Ordering** - Place multiple orders per table session
- ✅ **Real-Time Order Status** - See order status updates instantly with toast notifications
- ✅ **Session Persistence** - Session persists across page refreshes
- ✅ **Shopping Cart** - Add items and manage cart before ordering
- ✅ **Order Confirmation** - Confirmation dialog before placing orders
- ✅ **Payment Options** - Pay online (Razorpay) or at counter
- ✅ **Consolidated Billing** - Single bill for all orders in a session
- ✅ **Customer Info Persistence** - Name and phone saved within session
- ✅ **Mobile-Friendly Notifications** - Bottom toast notifications on mobile, top on desktop
- ✅ **Fast & Clean** - No ads, no clutter, professional blue theme

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL 15 (via Docker)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sagarmemane135/MenuMate.git
   cd MenuMate
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start PostgreSQL database**
   ```bash
   docker-compose up -d
   ```

4. **Set up environment variables**
   ```bash
   # Copy .env.example to apps/next/.env (or root .env) and set:
   # DATABASE_URL="postgresql://admin:admin123@localhost:5432/mydb"  # Local Docker Postgres
   # JWT_SECRET="your-secret-key"
   # COOKIE_NAME="menumate_session"
   # NODE_ENV="development"
   ```
   For local Postgres (Docker): `docker run -d --name postgres-local -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=admin123 -e POSTGRES_DB=mydb -v pgdata:/var/lib/postgresql/data -p 5432:5432 postgres:15`

5. **Run database migrations**
   ```bash
   cd packages/db
   npm run generate
   npm run migrate
   cd ../..
   ```

6. **Create super admin user (optional)**
   ```bash
   # Use defaults (admin@menumate.com / admin123 / Super Admin)
   npm run create-admin
   
   # Or with custom values
   npm run create-admin -- email@example.com password123 "Full Name"
   ```

7. **Start development server**
   ```bash
   npm run dev
   ```

8. **Open your browser**
   - Admin: http://localhost:3000/admin
   - Login: http://localhost:3000/login
   - Public Menu: http://localhost:3000/r/[restaurant-slug]

---

## 🏗️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React features
- **TypeScript** - Type-safe code with strict checks
- **Tailwind CSS** - Professional blue/neutral color theme
- **Lucide React** - Modern icon library
- **Professional UI** - Fixed sidebar, data tables, stat cards

### Backend
- **Next.js API Routes** - RESTful APIs with standardized responses
- **Server Actions** - Server-side mutations
- **JWT Authentication** - Secure auth with jose
- **bcryptjs** - Password hashing
- **Error Boundaries** - Robust error handling
- **Rate Limiting** - API protection

### Database
- **PostgreSQL 15** - Relational database (local or self-hosted)
- **Drizzle ORM** - Type-safe ORM
- **Connection Pooling** - Optimized connections
- **Database** - PostgreSQL (local Docker or self-hosted)
- **Migrations** - Version-controlled schema changes

### Real-Time Communication
- **Polling** - Built-in polling for orders and sessions (no external real-time service)
- **Real-Time Updates** - Instant order status updates for kitchen and customers
- **Channel Management** - Restaurant and session-based channels
- **Optimistic UI Updates** - Immediate feedback for actions

### Infrastructure
- **Docker** - Containerization (local development)
- **Vercel** - Production deployment
- **PostgreSQL** - Local or self-hosted database
- **Turborepo** - Monorepo management
- **npm Workspaces** - Package management

---

## 📁 Project Structure

```
MenuMate2/
├── apps/
│   └── next/                    # Main Next.js application
│       ├── app/
│       │   ├── admin/          # Admin dashboard
│       │   │   ├── page.tsx    # Dashboard home
│       │   │   ├── menu/       # Menu management
│       │   │   ├── orders/     # Order management
│       │   │   └── super/      # Platform admin
│       │   ├── api/            # API routes
│       │   │   ├── auth/       # Authentication
│       │   │   ├── categories/ # Category CRUD
│       │   │   ├── menu-items/ # Menu item CRUD
│       │   │   └── orders/     # Order management
│       │   ├── login/          # Login/Register page
│       │   └── r/[slug]/       # Public menu
│       ├── lib/
│       │   └── auth.ts         # Auth utilities
│       └── middleware.ts       # Route protection
│
├── packages/
│   ├── app/                    # Shared UI components
│   │   ├── ui/                 # Base components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   └── card.tsx
│   │   └── features/           # Feature components
│   │       ├── auth/           # Auth forms
│   │       └── menu/           # Menu display
│   │
│   └── db/                     # Database package
│       ├── src/
│       │   ├── schema.ts       # Database schema
│       │   ├── client.ts       # Drizzle client
│       │   └── index.ts        # Exports
│       ├── drizzle/            # Migrations
│       └── scripts/            # DB scripts
│
├── docker-compose.yml          # PostgreSQL setup
├── turbo.json                  # Turborepo config
└── package.json                # Root package.json
```

---

## 🎨 Screenshots

### Admin Dashboard
*Professional, mobile-responsive dashboard for restaurant owners*

### Menu Management
*Add, edit, delete menu items with instant updates*

### Public Menu
*Beautiful customer-facing menu with real-time availability*

---

## 🗺️ Roadmap

### ✅ Phase 1 - MVP (Complete)
- Authentication & authorization
- Restaurant management
- Menu management (CRUD)
- Order management
- Public menu display
- Mobile responsive design

### ✅ Phase 2 - Essential Features (Complete)
- QR code generation
- Customer ordering flow
- Payment integration (Razorpay)
- Shopping cart functionality
- Bill/invoice generation

### ✅ Phase 5A - Session-Based Ordering (Complete)
- Table session management
- Multiple orders per session
- Consolidated billing
- "Send to Kitchen" without payment
- "Pay at Counter" option
- Customer name and phone persistence
- Session persistence across page refreshes

### ✅ Phase 3 - Real-Time Features (Complete)
- Polling-based live updates for orders and sessions
- Kitchen Display System (KDS) with real-time updates (4 columns: Pending, Cooking, Ready, Served)
- Real-time order status updates for customers with toast notifications
- Counter payment notifications with persistent alerts
- Table session management with detailed view and order history
- Mobile-responsive customer menu with session persistence
- Order confirmation dialog
- Double order submission prevention
- Session auto-cleanup (1+ hour inactive)

### ✅ Phase 6 - Professional UI Redesign (Complete)
- Complete theme overhaul to professional blue/neutral palette
- Fixed sidebar navigation for admin pages
- Data tables for Orders and Sessions pages
- Stats dashboards with metrics visualization
- Professional stat cards, buttons, and form inputs
- Mobile-friendly toast notifications (bottom on mobile, top on desktop)
- Consistent styling across all admin and customer pages
- Removed all orange colors, replaced with professional blue theme
- Modern, clean, and accessible UI components

### 🚧 Phase 4 - Next Features (Next 2-3 Months)
- Email/SMS notifications
- Basic analytics dashboard
- Print receipts
- Order history and tracking

### 📅 Phase 3 - Advanced Features (2-4 Months)
- Item variants and add-ons
- Staff management
- Table management
- Inventory tracking
- Advanced analytics
- Custom branding

### 🎯 Phase 4 - Enterprise (4-6 Months)
- Multi-location management
- Customer mobile app
- Loyalty program
- Marketing features
- API access
- White-label solution

See [FEATURES_CHECKLIST.md](./docs/FEATURES_CHECKLIST.md) for complete roadmap.

---

## 💰 Business Model

### Pricing Tiers

| Tier | Price | Features |
|------|-------|----------|
| **Free** | ₹0/month | 1 restaurant, 25 items, 50 orders/month |
| **Basic** | ₹999/month | Unlimited items, 500 orders, basic analytics |
| **Pro** ⭐ | ₹2,999/month | Everything + payments, staff accounts, custom branding |
| **Enterprise** | Custom | Multi-location, API, white-label, dedicated support |

See [PRODUCT_DOCUMENTATION.md](./docs/PRODUCT_DOCUMENTATION.md) for detailed pricing strategy.

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Type checking
npm run type-check
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Next.js team for an amazing framework
- Drizzle team for the ORM
- Lucide for beautiful icons
- All open-source contributors

---

## 📞 Contact & Support

- **Website**: www.menumate.in (coming soon)
- **Email**: founders@menumate.in
- **Twitter**: @menumate_in
- **LinkedIn**: /company/menumate

For investors and partnerships: investors@menumate.in

---

## 📊 Stats

- **Lines of Code**: ~8,000+
- **Components**: 45+
- **API Routes**: 25+
- **Database Tables**: 7 (users, restaurants, categories, menu_items, orders, table_sessions, pending_users)
- **Real-Time Channels**: Restaurant + Session channels
- **Test Coverage**: (Coming soon)

---

**Built with ❤️ for the restaurant industry**

*Making restaurant management simple, fast, and affordable.*

---

## 🚀 Quick Links

- [Live Demo](https://menumate.in/demo) (Coming soon)
- [Documentation](./docs/PRODUCT_DOCUMENTATION.md)
- [Roadmap](./docs/FEATURES_CHECKLIST.md)
- [Pricing](./docs/PRODUCT_DOCUMENTATION.md#pricing-strategy)
- [Pitch Deck](./pitch-deck.pdf) (Coming soon)

---

## 🎨 Design System

### Color Theme
- **Primary**: Professional Blue (`primary-600`, `primary-700`) - Main actions and branding
- **Success**: Green (`success-600`) - Positive actions and confirmations
- **Warning**: Yellow (`warning-600`) - Cautions and pending states
- **Error**: Red (`error-600`) - Errors and destructive actions
- **Neutral**: Grays (`neutral-50` to `neutral-900`) - Backgrounds, text, borders

### Components
- **Professional Data Tables** - Sortable, paginated tables for Orders and Sessions
- **Stat Cards** - Real-time metrics with icons
- **Toast Notifications** - Mobile-responsive (bottom on mobile, top on desktop)
- **Fixed Sidebar** - Desktop navigation with mobile hamburger menu
- **Professional Buttons** - Consistent primary, secondary, outline, and ghost variants
- **Form Inputs** - Clean, accessible inputs with focus states

---

*Last Updated: January 2025*
