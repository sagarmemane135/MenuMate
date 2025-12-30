# 🍽️ MenuMate - Phygital Restaurant Management Platform

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Your Restaurant, Digitized in 5 Minutes**

MenuMate is a modern, cloud-based restaurant management platform that bridges the physical and digital dining experience. Manage your menu, track orders, and provide customers with a beautiful digital menu—all from your phone.

---

## 📚 Documentation

- **[Product Documentation](./docs/PRODUCT_DOCUMENTATION.md)** - Complete product overview, market analysis, and go-to-market strategy (18,000+ words)
- **[Features Checklist](./docs/FEATURES_CHECKLIST.md)** - Detailed list of implemented and planned features
- **[Executive Summary](./docs/EXECUTIVE_SUMMARY.md)** - Quick overview for stakeholders and investors

---

## ✨ Key Features (Current - v1.0)

### For Restaurant Owners
- ✅ **5-Minute Setup** - Create your digital menu instantly
- ✅ **Mobile-First Admin** - Manage from any device
- ✅ **Real-Time Updates** - Change menu items instantly
- ✅ **Order Management** - Track orders from kitchen to payment
- ✅ **Beautiful Dashboard** - Professional, easy-to-use interface
- ✅ **Multi-Restaurant** - Manage multiple locations

### For Customers
- ✅ **Digital Menu** - Modern, easy-to-browse menu
- ✅ **Real-Time Availability** - See what's available now
- ✅ **Item Images** - Visual menu with descriptions
- ✅ **Mobile Responsive** - Works on any device
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
   # Copy example env files
   cp apps/next/.env.example apps/next/.env
   cp packages/db/.env.example packages/db/.env
   
   # Edit .env files with your values
   # DATABASE_URL, JWT_SECRET, etc.
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
   cd packages/db
   npm run create-super-admin
   cd ../..
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
- **PostgreSQL 15** - Relational database
- **Drizzle ORM** - Type-safe ORM
- **Connection Pooling** - Optimized connections

### Infrastructure
- **Docker** - Containerization
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

### 🚧 Phase 2 - Essential Features (Next 2 Months)
- QR code generation
- Customer ordering flow
- Payment integration (Razorpay)
- Email/SMS notifications
- Basic analytics dashboard

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

*Last Updated: December 2024*
