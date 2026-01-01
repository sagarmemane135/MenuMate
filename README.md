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
- ✅ **Mobile-First Admin** - Manage from any device
- ✅ **Real-Time Updates** - Change menu items instantly
- ✅ **Order Management** - Track orders from kitchen to payment
- ✅ **Kitchen Display System (KDS)** - Real-time order tracking with status updates
- ✅ **Table Session Management** - View and manage all active table sessions
- ✅ **Real-Time Notifications** - Instant WebSocket notifications for new orders
- ✅ **Counter Payment Tracking** - Track and manage counter payments
- ✅ **Beautiful Dashboard** - Professional, easy-to-use interface
- ✅ **Multi-Restaurant** - Manage multiple locations

### For Customers
- ✅ **Digital Menu** - Modern, easy-to-browse menu
- ✅ **Real-Time Availability** - See what's available now
- ✅ **Session-Based Ordering** - Place multiple orders per table session
- ✅ **Real-Time Order Status** - See order status updates instantly (Pending → Cooking → Ready)
- ✅ **Shopping Cart** - Add items and manage cart before ordering
- ✅ **Payment Options** - Pay online (Razorpay) or at counter
- ✅ **Consolidated Billing** - Single bill for all orders in a session
- ✅ **Item Images** - Visual menu with descriptions
- ✅ **Mobile Responsive** - Fully optimized for mobile devices
- ✅ **Fast & Clean** - No ads, no clutter

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
   # Create .env file in apps/next/
   # Copy from root .env.example or create manually with:
   # DATABASE_URL, JWT_SECRET, COOKIE_NAME, etc.
   
   # Required variables:
   # DATABASE_URL="postgresql://..."
   # JWT_SECRET="your-secret-key"
   # COOKIE_NAME="menumate_session"
   # NODE_ENV="development"
   ```

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
- **TypeScript** - Type-safe code
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Modern icon library

### Backend
- **Next.js API Routes** - RESTful APIs
- **Server Actions** - Server-side mutations
- **JWT Authentication** - Secure auth with jose
- **bcryptjs** - Password hashing

### Database
- **PostgreSQL 15** - Relational database (Supabase)
- **Drizzle ORM** - Type-safe ORM
- **Connection Pooling** - Optimized connections
- **Cloud Database** - Supabase PostgreSQL for production

### Real-Time Communication
- **Pusher** - Managed WebSocket service for real-time notifications
- **Real-Time Updates** - Instant order status updates for kitchen and customers

### Infrastructure
- **Docker** - Containerization (local development)
- **Vercel** - Production deployment
- **Supabase** - Cloud PostgreSQL database
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
- WebSocket-based real-time notifications (Pusher)
- Kitchen Display System (KDS) with real-time updates
- Real-time order status updates for customers
- Counter payment notifications
- Table session management with detailed view
- Mobile-responsive customer menu

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

- **Lines of Code**: ~5,000+
- **Components**: 30+
- **API Routes**: 15+
- **Database Tables**: 5
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

*Last Updated: January 2025*
