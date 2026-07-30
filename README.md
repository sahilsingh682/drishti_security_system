<div align="center">

# 🛡️ Drishti Security System
**Enterprise-Grade Surveillance & Security E-Commerce Platform**

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

An end-to-end full-stack e-commerce and operations management platform engineered specifically for modern CCTV and security solutions. Built with a relentless focus on high-performance architecture, frictionless UI/UX, secure payment gateways, and robust role-based access control (RBAC).

[Live Demo](https://drishti-security-systems.vercel.app/) · [Report Bug](https://github.com/sahilsingh682/drishti_security_system/issues) · [Request Feature](https://github.com/sahilsingh682/drishti_security_system/issues)

</div>

---

## 📖 Table of Contents

- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Local Development Setup](#️-local-development-setup)
- [Project Structure](#-project-structure)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## ✨ Key Features

### 🛍️ The Storefront (Customer Experience)

- **Cyber-Enterprise UI/UX** — Premium dual-theme (Light/Dark) interface featuring glassmorphism, glowing accents, 3D tilt-effect product cards, and custom Framer Motion animations.
- **MapmyIndia (Mappls) Integration** — Enterprise-grade smart address search and live GPS reverse-geocoding to capture pinpoint-accurate installation locations automatically.
- **Frictionless Secure Checkout** — 100% encrypted "Soft-Wall" checkout flow integrating **Razorpay** for online payments, alongside automated WhatsApp receipt generation.
- **Guest & User Order Tracking** — A robust tracking engine allowing both authenticated users and guests to track real-time installation status using Order ID and Phone Number.
- **Custom Security Kit Builder** — An interactive, multi-step configuration wizard allowing customers to dynamically build their own surveillance packages.

### 🔐 The Operations Hub (Admin & Technician Control)

- **Strict Role-Based Access Control (RBAC)** — Military-grade routing separation between `User`, `Technician`, `Admin`, and `SuperAdmin`.
- **Real-Time Analytics Dashboard** — High-level metrics visualization (Revenue, Pending Installs, Low Stock) powered by Recharts.
- **Order Pipeline Management** — Full lifecycle control: verify payments, schedule installations, generate instant GST invoices, and log manual "Walk-in" orders.
- **Technician Portal** — Mobile-optimized views for on-ground staff to update installation statuses on the fly.
- **Content Management System (CMS)** — Full CRUD capabilities with secure image bucket uploads for managing inventory and custom security packages.

---

## 🚀 Tech Stack

### Frontend (Client)

| Layer | Technology |
|---|---|
| Framework | React + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State & Data Fetching | React Query, React Router DOM |
| Animations | Framer Motion |
| Maps / Location | MapmyIndia (Mappls) Web SDK |

### Backend (Server)

| Layer | Technology |
|---|---|
| Runtime | Node.js + Express |
| Language | TypeScript |
| Database & Auth | Supabase (PostgreSQL, Row Level Security, Auth, Storage Buckets) |
| Payment Gateway | Razorpay API |
| Security | Helmet, CORS, RESTful API architecture |

---

## 🛠️ Local Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Git](https://git-scm.com/)
- A [Supabase](https://supabase.com/) project
- A [Razorpay](https://razorpay.com/) developer account
- A [MapmyIndia](https://mappls.com/) developer account

### 1. Clone the repository

```bash
git clone https://github.com/sahilsingh682/drishti_security_system.git
cd drishti_security_system
```

### 2. Install dependencies

```bash
# Client
cd client
npm install

# Server
cd ../server
npm install
```

### 3. Environment variables

Create a `.env` file in both the `client` and `server` directories.

**`client/.env`**
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_MAPPLS_API_KEY=your_mappls_api_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

**`server/.env`**
```env
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### 4. Run the development servers

```bash
# Terminal 1 — Client
cd client
npm run dev

# Terminal 2 — Server
cd server
npm run dev
```

The app should now be running at `http://localhost:5173` (client) and `http://localhost:5000` (server).

---

## 📁 Project Structure

```
drishti_security_system/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-level pages
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities & API clients
│   │   └── types/          # TypeScript type definitions
│   └── package.json
│
├── server/                 # Node.js + Express backend
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── controllers/    # Business logic
│   │   ├── middleware/     # Auth & RBAC middleware
│   │   └── config/         # Supabase & Razorpay config
│   └── package.json
│
└── README.md
```

> ℹ️ Update this section if your actual folder layout differs.

---

## 🗺️ Roadmap

- [ ] SMS/OTP-based order verification
- [ ] AMC (Annual Maintenance Contract) subscription module
- [ ] Multi-language support (Hindi/English)
- [ ] Technician live-location tracking during installation visits
- [ ] Customer review & rating system

See the [open issues](https://github.com/sahilsingh682/drishti_security_system/issues) for a full list of proposed features and known issues.

---

## 🤝 Contributing

Contributions make the open-source community an amazing place to learn and build. Any contributions are **greatly appreciated**.

1. Fork the project
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

---

## 📜 License

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for more information.

---

## 📬 Contact

**Sahil Singh** — [@sahilsingh682](https://github.com/sahilsingh682)

Project Link: [https://github.com/sahilsingh682/drishti_security_system](https://github.com/sahilsingh682/drishti_security_system)

Linkedin: [www.linkedin.com/in/sahilsingh0521]
<div align="center">
  <sub>Built with ❤️ for smarter, safer spaces.</sub>
</div>
