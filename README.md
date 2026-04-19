# Yantrix Core — GST Billing SaaS Platform for Indian SMEs

> 🇮🇳 India's simplest GST invoicing and billing platform — built for 63 million SMEs.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-blue)](https://prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://postgresql.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.0-red)](https://turbo.build/)

---

## 📋 Overview

Yantrix Core is a **production-grade SaaS platform** with **Yantrix Invoice** as its first module — a complete GST billing solution designed specifically for Indian small and medium businesses.

### Key Features

- ✅ **GST-Compliant Invoicing** — CGST, SGST, IGST auto-calculation
- ✅ **Multi-Business Support** — Manage multiple businesses from one account
- ✅ **Team Roles & Permissions** — OWNER, ACCOUNTANT, STAFF roles with RBAC
- ✅ **Customer & Product Management** — Complete CRM with GST details
- ✅ **Payment Tracking** — Record payments, generate receipts, track dues
- ✅ **GST Reports** — GSTR-1, GSTR-3B, HSN summary for easy filing
- ✅ **Razorpay Integration** — Accept online payments & manage subscriptions
- ✅ **Phone OTP Auth** — Login via mobile OTP or email/password
- ✅ **Super Admin Panel** — Manage all businesses, plans, reviews, audit logs
- ✅ **REST API** — Full OpenAPI/Swagger documentation

---

## 🏗️ Monorepo Structure

```
yantrx_invoive/
├── apps/
│   ├── web/          # Next.js 14 SaaS app + Landing Page (Port 3000)
│   ├── admin/        # Next.js 14 Super Admin Dashboard (Port 3001)
│   └── api/          # Express + TypeScript REST API (Port 4000)
├── packages/
│   ├── shared-types/ # TypeScript types, enums, interfaces
│   ├── ui/           # Shared ShadCN UI components
│   ├── auth/         # JWT utilities, RBAC helpers
│   └── billing/      # Razorpay integration, tax calculations
├── prisma/
│   ├── schema.prisma # Complete PostgreSQL schema (20 models)
│   └── seed.ts       # Seed data with test accounts
├── future/
│   ├── crm/          # CRM module (planned)
│   └── hrms/         # HRMS module (planned)
├── turbo.json
└── .env.example
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 9+
- PostgreSQL 14+
- Redis

### 1. Clone & Install

```bash
git clone https://github.com/pixAndroid/yantrx_invoive.git
cd yantrx_invoive
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your database URL, JWT secrets, Razorpay keys, etc.
```

### 3. Start Database

Start PostgreSQL and Redis locally, then make sure they are accessible at the URLs configured in your `.env` file.

### 4. Setup Database

**Fresh database (recommended):**

```bash
# Generate Prisma client
pnpm db:generate

# Apply all migrations to create the schema
pnpm db:deploy

# Seed with test data
pnpm db:seed
```

**Existing database (already set up via `db:push` without migrations):**

If you get errors like `The column 'businesses.defaultTemplateId' does not exist`, your database schema is out of sync. Run:

```bash
# Option A — use db:push to sync the schema (safe for development)
pnpm db:push

# Option B — use migration baseline + deploy (recommended for production)
# 1. Mark the initial schema migration as already applied (tables already exist)
pnpm exec prisma migrate resolve --applied "20230101000000_init" --schema=./prisma/schema.prisma
# 2. Apply any pending migrations (adds the missing columns)
pnpm db:deploy
```

### 5. Start Development Servers

```bash
pnpm dev
```

This starts:
- **Web App**: http://localhost:3000
- **Admin Panel**: http://localhost:3001
- **API Server**: http://localhost:4000
- **API Docs**: http://localhost:4000/api/docs

---

## 🔑 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@yantrix.in | Admin@123 |
| Business Owner | demo@yantrix.in | Demo@123 |

**Demo Business**: Demo Tech Solutions Pvt Ltd  
**GSTIN**: 29AABCD1234E1ZX | **Plan**: Pro

---

## 💰 Pricing Plans

| Plan | Price | Invoices | Team |
|------|-------|----------|------|
| Free | ₹0/mo | 5/month | 1 user |
| Starter | ₹149/mo | 100/month | 2 users |
| **Pro** ⭐ | ₹299/mo | 500/month | 5 users |
| Business | ₹599/mo | Unlimited | 20 users |

---

## 🛣️ API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register user + business |
| POST | `/api/v1/auth/login` | Login with email/password |
| POST | `/api/v1/auth/otp/send` | Send OTP to phone |
| POST | `/api/v1/auth/otp/verify` | Verify OTP and login |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/auth/me` | Get current user profile |
| POST | `/api/v1/auth/logout` | Logout and revoke token |

### Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/invoices` | List invoices with filters |
| POST | `/api/v1/invoices` | Create invoice with GST calc |
| GET | `/api/v1/invoices/:id` | Get invoice details |
| PUT | `/api/v1/invoices/:id` | Update invoice |
| DELETE | `/api/v1/invoices/:id` | Cancel invoice |
| POST | `/api/v1/invoices/:id/send` | Send invoice to customer |
| POST | `/api/v1/invoices/:id/mark-paid` | Record payment |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/reports/dashboard` | Dashboard stats |
| GET | `/api/v1/reports/gst-summary` | Monthly GST summary |

Full docs at `/api/docs` (Swagger UI).

---

## 🗄️ Database Schema

The Prisma schema includes **18 models**:

```
User, Business, Branch, Membership,
Plan, Subscription,
Module, BusinessModule,
Customer, Product,
Invoice, InvoiceItem,
Payment, Expense,
Review, AuditLog,
Notification, ApiKey,
OtpCode, RefreshToken
```

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion |
| UI Components | ShadCN UI, Radix UI, Lucide Icons |
| Backend | Express.js, TypeScript |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 |
| Auth | JWT (access + refresh tokens), OTP via SMS |
| Payments | Razorpay |
| Build | Turborepo, pnpm workspaces |
| DevOps | Nginx |
| API Docs | Swagger UI (swagger-jsdoc) |

---

## 🔐 Security Features

- **JWT Access Tokens** (7d expiry) + **Refresh Tokens** (30d)
- **RBAC** — Role-Based Access Control (SUPER_ADMIN, OWNER, ACCOUNTANT, STAFF)
- **Rate Limiting** — Per-IP rate limiting on all routes
- **CORS** — Whitelist-based CORS policy
- **Helmet.js** — Security headers
- **Input Validation** — express-validator on all endpoints
- **Password Hashing** — bcryptjs with 12 rounds
- **API Keys** — Business API key support with hashed storage

---

## 📁 Future Modules (Roadmap)

- 🔜 **CRM** — Customer relationship management
- 🔜 **HRMS** — HR and payroll management
- 🔜 **Inventory** — Advanced inventory management
- 🔜 **POS** — Point of Sale system
- 🔜 **Purchase Orders** — Vendor management
- 🔜 **WhatsApp Integration** — Send invoices via WhatsApp

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

---

## 📄 License

Proprietary — © 2024 Yantrix. All rights reserved.

---

<p align="center">Made with ❤️ in India 🇮🇳 for Indian Businesses</p>