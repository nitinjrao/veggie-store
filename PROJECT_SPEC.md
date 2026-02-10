# Veggie Store - Project Specification Document

## Project Overview

A web-based vegetable store application for a single store in India. The system allows customers to browse vegetables, place orders (in Kg or packets), and track order history. Store owners can manage inventory, pricing, and view sales analytics through an admin dashboard.

**Key Highlight**: Shareable order links via WhatsApp for easy customer ordering.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js + Vite |
| Styling | Tailwind CSS |
| State Management | Zustand or React Context |
| Backend | Node.js + Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT (simple email/password for admin, phone for customers) |
| Hosting | Vercel (frontend) + Railway/Render (backend + DB) |

---

## User Roles

### 1. Customer
- Browse vegetables with emojis and images
- Add items to cart (Kg or Packet units)
- Place orders
- View order history
- Mark favorite items
- Receive notifications if items unavailable

### 2. Admin (Store Owner)
- Manage inventory (add/edit/delete vegetables)
- Set prices (per Kg and per Packet)
- View and manage orders
- Update order status
- View sales reports and analytics
- Generate shareable links for WhatsApp

---

## Features Breakdown

### Customer Features

#### F1: Customer Registration & Login
- Phone number based registration
- OTP verification (can use simple 4-digit code for MVP)
- Customer profile with name, phone, address

#### F2: Vegetable Catalog
- Grid/List view of vegetables
- Each item displays:
  - Emoji + Image
  - Name (Hindi + English)
  - Price per Kg
  - Price per Packet (with weight mentioned)
  - Availability status
  - "Add to Favorites" button
- Search functionality
- Category filters (Leafy, Root, Exotic, Daily Essentials, etc.)

#### F3: Shopping Cart
- Add items with quantity selection
- Toggle between Kg and Packet units
- Real-time price calculation
- Edit quantities / remove items
- Cart persistence (localStorage + DB sync)

#### F4: Order Placement
- Review order summary
- Add delivery address
- Add order notes
- Place order button
- Order confirmation with order ID

#### F5: Order History
- List of past orders with status
- Order details view
- Reorder functionality (add previous order items to cart)

#### F6: Favorites
- Save favorite vegetables
- Quick add to cart from favorites
- Persistent across sessions

#### F7: Unavailability Notification
- When placing order, if item quantity not available:
  - Show alert with available quantity
  - Option to adjust quantity or remove item
  - Suggest alternatives if available

### Admin Features

#### A1: Admin Authentication
- Simple email/password login
- Credentials stored in database
- JWT based session

#### A2: Dashboard Overview
- Today's orders count
- Today's revenue
- Low stock alerts
- Quick stats cards

#### A3: Inventory Management
- Add new vegetable:
  - Name (English + Hindi)
  - Emoji selection
  - Image upload
  - Category
  - Current stock (in Kg)
  - Minimum stock alert threshold
- Edit existing vegetables
- Delete vegetables (soft delete)
- Bulk stock update

#### A4: Price Master
- Set price per Kg
- Set packet size (e.g., 250g, 500g, 1kg)
- Set price per packet
- Price history log

#### A5: Order Management
- View all orders (filterable by status, date)
- Order statuses: Pending, Confirmed, Ready, Completed, Cancelled
- Update order status
- View order details
- Contact customer (WhatsApp link)

#### A6: Auto Inventory Update
- When order is placed: Deduct from inventory
- When order is cancelled: Restore to inventory
- Low stock alerts when below threshold

#### A7: WhatsApp Shareable Links
- Generate store link for sharing
- Copy to clipboard functionality
- QR code generation for store link

#### A8: Sales Reports & Analytics
- Daily/Weekly/Monthly sales summary
- Revenue charts (line/bar graphs)
- Top selling vegetables
- Order trends
- Export reports (CSV)

#### A9: Customer Management
- View all registered customers
- Customer order history
- Total spend per customer

---

## Database Schema

```sql
-- Customers
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(100),
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Admin Users
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    name_hindi VARCHAR(50),
    icon VARCHAR(10),
    sort_order INT DEFAULT 0
);

-- Vegetables
CREATE TABLE vegetables (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_hindi VARCHAR(100),
    emoji VARCHAR(10),
    image_url TEXT,
    category_id INT REFERENCES categories(id),
    stock_kg DECIMAL(10,2) DEFAULT 0,
    min_stock_alert DECIMAL(10,2) DEFAULT 5,
    is_available BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Price Master
CREATE TABLE prices (
    id SERIAL PRIMARY KEY,
    vegetable_id INT REFERENCES vegetables(id),
    price_per_kg DECIMAL(10,2) NOT NULL,
    packet_weight_grams INT, -- e.g., 250, 500, 1000
    price_per_packet DECIMAL(10,2),
    effective_from TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    customer_id INT REFERENCES customers(id),
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'ready', 'completed', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_address TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Order Items
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id),
    vegetable_id INT REFERENCES vegetables(id),
    unit_type VARCHAR(10) CHECK (unit_type IN ('kg', 'packet')),
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL
);

-- Favorites
CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(id),
    vegetable_id INT REFERENCES vegetables(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(customer_id, vegetable_id)
);

-- Price History (for analytics)
CREATE TABLE price_history (
    id SERIAL PRIMARY KEY,
    vegetable_id INT REFERENCES vegetables(id),
    old_price_kg DECIMAL(10,2),
    new_price_kg DECIMAL(10,2),
    changed_at TIMESTAMP DEFAULT NOW()
);

-- Inventory Log (for tracking stock changes)
CREATE TABLE inventory_log (
    id SERIAL PRIMARY KEY,
    vegetable_id INT REFERENCES vegetables(id),
    change_type VARCHAR(20) CHECK (change_type IN ('order', 'restock', 'adjustment', 'cancel')),
    quantity_change DECIMAL(10,2),
    order_id INT REFERENCES orders(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/customer/register` | Register customer with phone |
| POST | `/api/auth/customer/verify-otp` | Verify OTP |
| POST | `/api/auth/customer/login` | Customer login |
| POST | `/api/auth/admin/login` | Admin login |

### Vegetables (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vegetables` | List all vegetables with prices |
| GET | `/api/vegetables/:id` | Get vegetable details |
| GET | `/api/categories` | List all categories |
| GET | `/api/vegetables/category/:id` | Vegetables by category |
| GET | `/api/vegetables/search?q=` | Search vegetables |

### Cart & Orders (Customer)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get customer cart |
| POST | `/api/cart/add` | Add item to cart |
| PUT | `/api/cart/update` | Update cart item |
| DELETE | `/api/cart/remove/:itemId` | Remove from cart |
| POST | `/api/orders` | Place order |
| GET | `/api/orders` | Customer order history |
| GET | `/api/orders/:id` | Order details |

### Favorites (Customer)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/favorites` | Get favorites |
| POST | `/api/favorites/:vegetableId` | Add to favorites |
| DELETE | `/api/favorites/:vegetableId` | Remove from favorites |

### Admin - Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/vegetables` | List all (including deleted) |
| POST | `/api/admin/vegetables` | Add vegetable |
| PUT | `/api/admin/vegetables/:id` | Update vegetable |
| DELETE | `/api/admin/vegetables/:id` | Soft delete |
| PUT | `/api/admin/vegetables/:id/stock` | Update stock |
| POST | `/api/admin/vegetables/bulk-stock` | Bulk stock update |

### Admin - Prices
| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/api/admin/prices/:vegetableId` | Update prices |
| GET | `/api/admin/prices/history/:vegetableId` | Price history |

### Admin - Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/orders` | All orders (with filters) |
| GET | `/api/admin/orders/:id` | Order details |
| PUT | `/api/admin/orders/:id/status` | Update status |

### Admin - Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/analytics/dashboard` | Dashboard stats |
| GET | `/api/admin/analytics/sales` | Sales data |
| GET | `/api/admin/analytics/top-products` | Top selling items |
| GET | `/api/admin/analytics/export` | Export CSV |

### Admin - Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/customers` | List customers |
| GET | `/api/admin/customers/:id` | Customer details + orders |

---

## Vegetable Emoji Reference

```
Leafy Greens:
🥬 Cabbage (पत्ता गोभी)
🥗 Lettuce (सलाद पत्ता)
🌿 Spinach (पालक)
🍀 Methi (मेथी)

Root Vegetables:
🥕 Carrot (गाजर)
🥔 Potato (आलू)
🧅 Onion (प्याज)
🧄 Garlic (लहसुन)
🫚 Ginger (अदरक)

Gourds & Squash:
🥒 Cucumber (खीरा)
🫛 Bottle Gourd (लौकी)
🎃 Pumpkin (कद्दू)

Nightshades:
🍅 Tomato (टमाटर)
🍆 Brinjal (बैंगन)
🫑 Capsicum (शिमला मिर्च)
🌶️ Green Chilli (हरी मिर्च)

Others:
🌽 Corn (मक्का)
🥦 Broccoli (ब्रोकली)
🫘 Beans (फलियां)
🥜 Peas (मटर)
🍋 Lemon (नींबू)
🥭 Raw Mango (कच्चा आम)
```

---

## UI/UX Guidelines

### Color Palette
```css
:root {
  --primary-green: #22C55E;      /* Fresh green */
  --primary-dark: #15803D;       /* Dark green */
  --secondary-orange: #F97316;   /* Accent */
  --background: #F0FDF4;         /* Light green tint */
  --card-bg: #FFFFFF;
  --text-primary: #1F2937;
  --text-secondary: #6B7280;
  --error: #EF4444;
  --success: #10B981;
  --warning: #F59E0B;
}
```

### Typography
- Headings: Inter or Poppins (Bold)
- Body: Inter (Regular)
- Hindi text: Noto Sans Devanagari

### Component Guidelines

#### Vegetable Card
```
┌─────────────────────────────┐
│  🥕                    ❤️   │
│  [Vegetable Image]          │
│                             │
│  Carrot                     │
│  गाजर                       │
│                             │
│  ₹40/kg  |  ₹25/500g packet │
│                             │
│  [- ] 1 kg [+]  [Add 🛒]   │
└─────────────────────────────┘
```

#### Order Card
```
┌─────────────────────────────┐
│ Order #VG20240115001        │
│ 15 Jan 2024, 10:30 AM       │
│                             │
│ 🥕 Carrot 1kg    ₹40        │
│ 🍅 Tomato 2kg    ₹80        │
│ 🧅 Onion 500g    ₹20        │
│ ─────────────────────────── │
│ Total: ₹140                 │
│                             │
│ Status: [🟢 Confirmed]      │
│                             │
│ [Reorder]  [View Details]   │
└─────────────────────────────┘
```

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

---

## Sprint Plan

### Sprint 1: Foundation (Week 1-2)
**Goal**: Project setup, database, basic auth, vegetable catalog

| Task ID | Task | Priority |
|---------|------|----------|
| S1-01 | Project setup (React + Vite, Node.js, Prisma) | High |
| S1-02 | Database schema setup with Prisma | High |
| S1-03 | Seed database with sample vegetables | High |
| S1-04 | Admin authentication (login/logout) | High |
| S1-05 | Customer registration/login with phone | High |
| S1-06 | Vegetable listing API | High |
| S1-07 | Vegetable catalog UI (grid view with emojis) | High |
| S1-08 | Category filter component | Medium |
| S1-09 | Search functionality | Medium |
| S1-10 | Basic responsive layout | High |

**Deliverables**:
- Working auth system
- Vegetable catalog with search and filters
- Basic admin login

---

### Sprint 2: Cart & Orders (Week 3-4)
**Goal**: Complete ordering flow for customers

| Task ID | Task | Priority |
|---------|------|----------|
| S2-01 | Shopping cart state management | High |
| S2-02 | Add to cart functionality | High |
| S2-03 | Cart page with quantity controls | High |
| S2-04 | Kg/Packet toggle for items | High |
| S2-05 | Cart persistence (localStorage + API) | Medium |
| S2-06 | Order placement API | High |
| S2-07 | Order confirmation page | High |
| S2-08 | Auto inventory deduction on order | High |
| S2-09 | Unavailability check before order | High |
| S2-10 | Unavailability alert UI | High |
| S2-11 | Order history page | Medium |
| S2-12 | Order details page | Medium |
| S2-13 | Reorder functionality | Low |

**Deliverables**:
- Complete ordering flow
- Cart with Kg/Packet options
- Order history for customers
- Auto inventory update

---

### Sprint 3: Admin - Inventory & Prices (Week 5-6)
**Goal**: Admin can manage products and prices

| Task ID | Task | Priority |
|---------|------|----------|
| S3-01 | Admin dashboard layout | High |
| S3-02 | Dashboard overview cards (stats) | Medium |
| S3-03 | Vegetable CRUD - List view | High |
| S3-04 | Vegetable CRUD - Add form | High |
| S3-05 | Vegetable CRUD - Edit form | High |
| S3-06 | Vegetable CRUD - Delete (soft) | Medium |
| S3-07 | Image upload for vegetables | Medium |
| S3-08 | Emoji picker component | Low |
| S3-09 | Stock management UI | High |
| S3-10 | Bulk stock update | Medium |
| S3-11 | Price update functionality | High |
| S3-12 | Price history view | Low |
| S3-13 | Low stock alerts | Medium |
| S3-14 | Category management | Medium |

**Deliverables**:
- Complete inventory management
- Price management
- Admin dashboard overview

---

### Sprint 4: Admin - Orders (Week 7-8)
**Goal**: Order management system

| Task ID | Task | Priority |
|---------|------|----------|
| S4-01 | Orders list with filters | High |
| S4-02 | Order detail view | High |
| S4-03 | Order status update | High |
| S4-04 | Inventory restore on cancel | High |
| S4-05 | WhatsApp contact link | Medium |

**Deliverables**:
- Complete order management

---

### Sprint 5: Favorites, WhatsApp & Polish (Week 9-10)
**Goal**: Favorites, sharing, and UI polish

| Task ID | Task | Priority |
|---------|------|----------|
| S5-01 | Favorites - Add/Remove | High |
| S5-02 | Favorites page | High |
| S5-03 | Quick add from favorites | Medium |
| S5-04 | WhatsApp shareable link generation | High |
| S5-05 | QR code for store link | Medium |
| S5-06 | Copy link functionality | High |
| S5-07 | Customer management page | Medium |
| S5-08 | Customer order history view | Medium |
| S5-09 | UI polish and animations | Medium |
| S5-10 | Loading states and skeletons | Medium |
| S5-11 | Error handling and toasts | High |
| S5-12 | Mobile responsive fixes | High |

**Deliverables**:
- Favorites feature
- WhatsApp sharing
- Polished UI

---

### Sprint 6: Analytics & Final (Week 11-12)
**Goal**: Analytics, reports, and deployment

| Task ID | Task | Priority |
|---------|------|----------|
| S6-01 | Sales analytics API | High |
| S6-02 | Dashboard charts (revenue) | High |
| S6-03 | Top selling products chart | Medium |
| S6-04 | Order trends visualization | Medium |
| S6-05 | Date range filter for reports | Medium |
| S6-06 | CSV export functionality | Medium |
| S6-07 | Performance optimization | High |
| S6-08 | Security review | High |
| S6-09 | Testing and bug fixes | High |
| S6-10 | Deployment setup | High |
| S6-11 | Documentation | Medium |
| S6-12 | Final UAT | High |

**Deliverables**:
- Sales analytics dashboard
- Export functionality
- Production deployment

---

## Folder Structure

```
veggie-store/
├── client/                    # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/        # Button, Input, Card, Modal
│   │   │   ├── customer/      # Customer-specific components
│   │   │   └── admin/         # Admin-specific components
│   │   ├── pages/
│   │   │   ├── customer/      # Customer pages
│   │   │   └── admin/         # Admin pages
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── services/          # API calls
│   │   ├── utils/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                    # Node.js Backend
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── utils/
│   │   └── index.js
│   ├── package.json
│   └── .env.example
│
├── PROJECT_SPEC.md            # This file
└── README.md
```

---

## Environment Variables

### Server (.env)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/veggie_store
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
```

### Client (.env)
```env
VITE_API_URL=http://localhost:3000/api
```

---

## Success Metrics

1. **Customer Experience**
   - Page load time < 2 seconds
   - Order placement in < 3 clicks from cart
   - Mobile-friendly score > 90

2. **Admin Efficiency**
   - Add new vegetable in < 1 minute
   - Update stock in < 30 seconds
   - View daily sales at a glance

3. **System Reliability**
   - 99.9% uptime
   - Accurate inventory tracking
   - No duplicate orders

---

## Notes for Developer

1. **Start with Sprint 1** - Get the foundation right
2. **Use Prisma migrations** for database changes
3. **Implement proper error handling** from day 1
4. **Write reusable components** - Card, Button, Input, Modal
5. **Use TypeScript** if comfortable (optional but recommended)
6. **Test inventory deduction logic** thoroughly
7. **Mobile-first approach** for customer UI
8. **Keep admin UI simple and functional**

---

## Appendix: Sample Seed Data

```javascript
// Sample vegetables for seeding
const vegetables = [
  { name: 'Tomato', name_hindi: 'टमाटर', emoji: '🍅', category: 'Daily Essentials', price_kg: 40, stock: 50 },
  { name: 'Potato', name_hindi: 'आलू', emoji: '🥔', category: 'Daily Essentials', price_kg: 30, stock: 100 },
  { name: 'Onion', name_hindi: 'प्याज', emoji: '🧅', category: 'Daily Essentials', price_kg: 35, stock: 80 },
  { name: 'Carrot', name_hindi: 'गाजर', emoji: '🥕', category: 'Root Vegetables', price_kg: 45, stock: 40 },
  { name: 'Cabbage', name_hindi: 'पत्ता गोभी', emoji: '🥬', category: 'Leafy Greens', price_kg: 25, stock: 30 },
  { name: 'Spinach', name_hindi: 'पालक', emoji: '🌿', category: 'Leafy Greens', price_kg: 30, stock: 25 },
  { name: 'Capsicum', name_hindi: 'शिमला मिर्च', emoji: '🫑', category: 'Exotic', price_kg: 80, stock: 20 },
  { name: 'Brinjal', name_hindi: 'बैंगन', emoji: '🍆', category: 'Daily Essentials', price_kg: 35, stock: 35 },
  { name: 'Cucumber', name_hindi: 'खीरा', emoji: '🥒', category: 'Salad', price_kg: 30, stock: 45 },
  { name: 'Green Chilli', name_hindi: 'हरी मिर्च', emoji: '🌶️', category: 'Daily Essentials', price_kg: 60, stock: 15 },
];

const categories = [
  { name: 'Daily Essentials', name_hindi: 'रोज़ाना', icon: '🛒' },
  { name: 'Leafy Greens', name_hindi: 'हरी सब्जियां', icon: '🥬' },
  { name: 'Root Vegetables', name_hindi: 'जड़ वाली सब्जियां', icon: '🥕' },
  { name: 'Exotic', name_hindi: 'विशेष', icon: '✨' },
  { name: 'Salad', name_hindi: 'सलाद', icon: '🥗' },
];
```

---

**Document Version**: 1.0
**Created**: January 2024
**Last Updated**: January 2024
**Author**: Project Manager (AI)
