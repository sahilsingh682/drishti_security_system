
# 🛡️ Drishti Security System

An enterprise-grade, full-stack e-commerce and administration platform tailored specifically for a CCTV and security solutions business. Built with a focus on high-performance, seamless UI/UX, and robust role-based access control.

## 🚀 Tech Stack

**Frontend:**
* [React](https://reactjs.org/) (via [Vite](https://vitejs.dev/))
* [TypeScript](https://www.typescriptlang.org/)
* [Tailwind CSS](https://tailwindcss.com/)
* [shadcn/ui](https://ui.shadcn.com/) (Component Library)
* [Framer Motion](https://www.framer.com/motion/) (Advanced Animations)
* [React Router](https://reactrouter.com/) (Routing & Navigation)
* [React Query](https://tanstack.com/query/latest) (State Management & Data Fetching)

**Backend & Database:**
* [Supabase](https://supabase.com/) (PostgreSQL Database, Authentication, and Storage)

---

## ✨ Key Features

### 🛍️ Customer Storefront
* **Cyber-Enterprise Design:** Premium dual-theme (Light/Dark) UI featuring glassmorphism, glowing accents, and parallax camera animations.
* **Smart Checkout (WhatsApp Integrated):** Seamless cart system that captures full delivery details (with automatic Pincode-to-City/State fetching) before pushing the order directly to the Admin DB and generating a pre-filled WhatsApp inquiry.
* **Custom Security Kit Builder:** An interactive, multi-step wizard allowing customers to build their own surveillance packages dynamically.
* **Customer Portal:** Dedicated user profiles with order history tracking, payment/installation status updates, and avatar uploads.
* **Dynamic Animations:** Infinite scrolling client marquees, 3D tilt-effect product cards, and a custom surveillance-scanner cursor.

### 🔐 Admin Control Panel
* **Role-Based Access Control (RBAC):** Strict separation of privileges between `User`, `Admin`, and `SuperAdmin`.
* **Dashboard Analytics:** High-level metrics visualization (Revenue, Pending Installs, Low Stock) using Recharts.
* **Advanced Order Management:** Full pipeline control. Admins can update payment statuses, schedule installations, generate instant GST Invoices, and log manual "Walk-in" orders.
* **Content Management System (CMS):** Full CRUD capabilities for adding, editing, and removing products and security packages.
* **SuperAdmin User Management:** Exclusive tools to view all registered accounts and dynamically upgrade/downgrade user roles.

---

## 🛠️ Local Development & Setup

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18+ recommended) and `npm` installed on your machine. You will also need a [Supabase](https://supabase.com/) project set up.

### 1. Clone the repository
```bash
git clone [https://github.com/sahilsingh682/drishti_security_system.git](https://github.com/sahilsingh682/drishti_security_system.git)
cd drishti_security_system

```

### 2. Install dependencies

```bash
npm install

```

### 3. Environment Variables

Create a `.env` file in the root directory and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

```

### 4. Database Setup

Run the SQL migrations found in the `supabase/migrations` folder inside your Supabase SQL Editor to generate the required tables:

* `profiles` (with RLS policies)
* `products`
* `orders`
* `contact_messages`
* *Make sure to create a public storage bucket named `avatars` for profile pictures.*

### 5. Run the development server

```bash
npm run dev

```

The application will be available at `http://localhost:5173`.

---

## 👨‍💻 Author

**Sahil Singh**

* GitHub: [@sahilsingh682](https://www.google.com/search?q=https://github.com/sahilsingh682)

---

*Designed and developed for Drishti Security Systems. All rights reserved.*

