# Salon CRM — Multi-Tenant Backend, Web Panel & Mobile App

> **Full-Stack Technical Assessment Solution**
> Built with Node.js, Express, MongoDB (Mongoose / Memory Server), React.js (Vite, Material-UI, Lucide), and React Native (Expo).

---

## 🌟 Executive Summary

This repository contains a working slice of a **Salon CRM** designed for multi-tenant scalability, server-side RBAC enforcement, subscription gating, real-time appointment conflict prevention, and geo-fenced staff check-in using the Haversine distance algorithm.

---

## 🔑 Test Credentials Matrix

Every role has pre-seeded test accounts ready for instant testing. Password for all test accounts is **`password123`**.

| Role | Email | Scope & Permissions |
| :--- | :--- | :--- |
| **Super Admin** | `admin@salon.com` | Create/list plans, manage salon tenants, assign/renew/upgrade plans, view system-wide subscription history audit log. |
| **Salon Owner** | `owner@glamour.com` | View salon dashboard, manage appointments, view clients, view subscription status & expiration. |
| **Receptionist** | `receptionist@glamour.com` | View/create appointments, view clients. Blocked from subscription/salon config changes. |
| **Staff** | `staff@glamour.com` | View today's appointments, perform geo-fenced attendance check-in. |
| **Expired Salon Owner** | `expired@salon.com` | Linked to an expired salon. Used to test **HTTP 403 `SUBSCRIPTION_EXPIRED`** lockout. |

---

## 🚀 Quick Start Guide

The backend includes a **Zero-Config In-Memory MongoDB Fallback**. If no external MongoDB URI is provided, it automatically boots `mongodb-memory-server` and seeds realistic sample data on startup.

### 1. Start the Backend API Server
```bash
cd backend
npm install
npm run seed  # (Optional: Server auto-seeds if DB is empty)
npm start     # Runs Express backend on http://localhost:5000
```

### 2. Start the Web Panel (React + Vite + Material UI)
```bash
cd frontend
npm install
npm run dev   # Opens web dashboard on http://localhost:3000
```

### 3. Start the Mobile App (React Native / Expo)
```bash
cd mobile
npm install
npm start     # Runs Expo dev server (press 'w' for web or open in Expo Go)
```

---

## 🏗️ Architecture & Key Engineering Decisions

```
               ┌─────────────────────────────────────────┐
               │    React Web Panel / React Native App   │
               └────────────────────┬────────────────────┘
                                    │ Authorization: Bearer <JWT>
                                    ▼
               ┌─────────────────────────────────────────┐
               │          Express API Gateway            │
               └────────────────────┬────────────────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           ▼                        ▼                        ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│   Auth & RBAC       │  │  Subscription Gate  │  │  Tenant Isolation   │
│   Middleware        │  │  Middleware         │  │  req.user.salonId   │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌─────────────────────┐                           ┌─────────────────────┐
│ Appointment Engine  │                           │ Geo-Fencing Engine  │
│ • Working Hours     │                           │ • Haversine Math    │
│ • Overlap Conflict  │                           │ • Radius Enforcer   │
└─────────────────────┘                           └─────────────────────┘
```

### 1. Server-Side RBAC Enforcement
- Role checks (`SUPER_ADMIN`, `SALON_OWNER`, `RECEPTIONIST`, `STAFF`) are strictly executed on the server using route authorization middleware (`authorize(...roles)`).
- Frontend UI button hiding is purely for user experience; API endpoints validate every request independently.

### 2. Subscription Gating Middleware
- If a salon's `subscriptionEndDate` has passed or `subscriptionStatus === 'EXPIRED'`, non-Super Admin API requests return:
  ```json
  HTTP 403 Forbidden
  {
    "error": "SUBSCRIPTION_EXPIRED",
    "message": "Your subscription has expired. Please contact the administrator to renew your plan."
  }
  ```
- When Super Admin assigns, renews, or upgrades a plan, an immutable `SubscriptionHistory` record is created containing `salonId`, `planId`, `startDate`, `endDate`, `price`, `action` (`ASSIGN` | `RENEW` | `UPGRADE`), and `createdAt`.

### 3. Appointment Conflict & Working Hours Logic
- **Working Hours**: Appointments must fall strictly within `09:00` – `20:00`.
- **Staff Overlap Check**: Calculates time intervals in minutes from midnight. Two appointments overlap if:
  $$\text{start}_1 < \text{end}_2 \quad \text{and} \quad \text{end}_1 > \text{start}_2$$
- **Cancelled Exemption**: Appointments marked as `CANCELLED` are ignored during overlap validation, freeing the time slot.
- **Service Duration Auto-Calculation**: Service durations (e.g. Haircut 30m, Facial 60m, Hair Color 120m) automatically compute the `endTime` when not specified.

### 4. Geo-Fencing Distance Calculation (Haversine Formula)
- Staff check-in (`POST /api/attendance/check-in`) computes the great-circle distance between staff device coordinates $(lat_1, lon_1)$ and salon location $(lat_2, lon_2)$ server-side:
  $$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)$$
  $$d = 2 \cdot R \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)$$
- If calculated distance $d \le \text{allowedRadius}$: check-in is saved with timestamp.
- If calculated distance $d > \text{allowedRadius}$: returns `403 { "error": "OUT_OF_RANGE" }`.
- Missing/invalid coordinates return `400 { "error": "INVALID_COORDINATES" }` without server crashes.

### 5. Tenant Data Isolation
- `salonId` is derived exclusively from `req.user.salonId` extracted from the decoded JWT token.
- User requests cannot overwrite or bypass `salonId` via payload fields or URL params.

---

## 📡 Key API Endpoints

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT token |
| `GET` | `/api/auth/me` | Authenticated | Get current user & salon profile |
| `GET` | `/api/dashboard` | Owner, Receptionist, Staff | Dashboard stats, check-in status, today's count |
| `POST` | `/api/appointments` | Owner, Receptionist | Book appointment (enforces hours & staff overlap) |
| `GET` | `/api/appointments` | Owner, Receptionist, Staff | List appointments (isolated to user's salon) |
| `PATCH` | `/api/appointments/:id/status` | Owner, Receptionist, Staff | Update status (`CONFIRMED`, `CANCELLED`, `COMPLETED`) |
| `POST` | `/api/attendance/check-in` | Owner, Receptionist, Staff | Staff check-in with server-side Haversine verification |
| `GET` | `/api/attendance/status` | Owner, Receptionist, Staff | View today's check-in record for current user |
| `POST` | `/api/plans` | Super Admin | Create new subscription plan |
| `GET` | `/api/plans` | Authenticated | List available subscription plans |
| `GET` | `/api/salons` | Super Admin | List all salon tenants & subscription details |
| `POST` | `/api/salons` | Super Admin | Register new salon tenant |
| `POST` | `/api/salons/:id/assign-plan` | Super Admin | Assign, renew, or upgrade salon plan |
| `GET` | `/api/subscriptions/history` | Super Admin | Audit trail of all plan assignments & renewals |

---

## 📝 Assumptions Made

1. **Working Hours**: Default opening/closing hours are fixed at 09:00 to 20:00 per specification.
2. **Simplified Staff Assignment**: Staff members belong to a salon tenant and can be linked to a user account for mobile check-in.
3. **Database Fallback**: In environments without a running MongoDB daemon, `mongodb-memory-server` provides zero-config startup so evaluators can run the project immediately.

---

## 🚀 Future Improvements & Scaling

1. **Redis Caching**: Cache active salon subscription status to eliminate DB lookups on high-frequency API routes.
2. **WebSocket Real-Time Calendar**: Push live appointment updates to the web panel when appointments are created or rescheduled.
3. **Push Notifications**: Notify staff when new appointments are assigned or when geo-check-in succeeds.
