# EduFlow Enterprise - Frontend Web Application & PWA 📱

[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

> **EduFlow Enterprise Frontend** is a state-of-the-art Progressive Web Application (PWA) built with **React 19**, **TypeScript**, and **Vite**. Engineered for extreme performance and responsiveness, it delivers three seamless user experiences (Student Classroom, Teacher Panel, and Admin Control Center) with 100% visual parity across desktop, tablet, and mobile devices.

---

## 🌟 Key Features & Design Highlights

* **Three Unified Portals in One SPA**:
  * **Student Portal**: Interactive video lesson viewer, assignment submission workspace, real-time exam taking with anti-cheat monitoring, certificate downloads, and live class attendance.
  * **Teacher Workspace**: Course authoring builder, curriculum management, live class scheduling, grading analytics, and interactive student chat.
  * **Admin Control Center**: Comprehensive telemetry dashboards, user session security revocation, role/permission matrices, system SQL backup management, and platform branding settings.
* **Progressive Web App (PWA) Offline Support**:
  Powered by Workbox Service Worker precaching (`sw.js`). Pre-loads 115 core JavaScript, CSS, and media assets for instantaneous page transitions and offline accessibility.
* **Mobile-First Responsive Parity**:
  Features horizontal swipeable KPI statistics rows (`.admin-stats-row`), compact mobile calendar pill selectors, and collapsible search/filter panels designed specifically for mobile and tablet usability.
* **Zero Mock Telemetry**:
  Directly integrated with backend TanStack Query hooks (`useQuery`, `useMutation`). Every chart, progress bar, badge, and trend calculation renders real-time data from live database records.

---

## 📂 Project Structure

```
src/
 ├── api/
 │    ├── client.ts         # Axios HTTP Client with Sanctum CSRF & Error Interceptors
 │    └── resources/        # Modular API Resource Hooks (auth, courses, exams, admin, media)
 ├── components/
 │    ├── layout/           # Navbar, Sidebar, Mobile Drawer & Portal Footers
 │    └── ui/               # Standard Design System Components (Card, Button, Badge, Modal)
 ├── features/              # Feature-Scoped UI Modules (admin, courses, exams, live-classes)
 ├── pages/                 # Public & Portal Route Pages (Home, Courses, Gallery, Results)
 ├── stores/                # Zustand State Stores (Auth, Theme, Workspace & Video Settings)
 └── utils/                 # Formatting Helpers, Date Utilities & Security Validators
```

---

## 🛠️ Quick Start & Development

### Prerequisites
* **Node.js >= 20.x**
* **npm >= 10.x**

### Installation

1. **Install Node Modules**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   Create a `.env` file pointing to your backend API server:
   ```env
   VITE_API_URL=http://localhost:8000/api/v1
   VITE_APP_NAME=EduFlow
   ```

3. **Start Local Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Production Build & Type Verification

To verify zero TypeScript errors and bundle the application for production deployment:

```bash
# Execute TypeScript compiler & Vite production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 📄 License & Ownership
Copyright © 2026 EduFlow Enterprise. All rights reserved. Developed for high-performance online tuition operations.
