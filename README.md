# 🏙️ SocietyOS

**Next-Generation Residential Society Management Platform**

Seamlessly connecting Admins, Residents, and Security Guards through a unified, real-time ecosystem.

![React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-blue?style=for-the-badge&logo=react)
![Expo](https://img.shields.io/badge/Mobile-Expo%20%7C%20React%20Native-000020?style=for-the-badge&logo=expo)
![Node](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?style=for-the-badge&logo=nodedotjs)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Prisma-4169E1?style=for-the-badge&logo=postgresql)

---

## 🌟 Overview

**SocietyOS** is an end-to-end management solution designed to modernize the way residential societies operate. It eliminates manual logging and disjointed communication by offering a synchronized ecosystem across three primary interfaces:

1. **Admin Web Portal**: A powerful dashboard for society managers to monitor gate activity in real-time, manage residents, and handle administrative operations.
2. **Resident Mobile App**: A personalized app for residents to manage their profiles, pre-approve visitors (via dynamic QR codes), and receive instant notifications.
3. **Guard Mobile App**: A streamlined, fast interface for security personnel to scan visitor QRs and seamlessly log walk-in entries.

---

## ✨ Key Features

- 🔄 **Real-Time Synchronization**: Powered by **Socket.IO**, gate activities (entries/exits) are instantly broadcasted to the Admin Dashboard and relevant residents' mobile apps.
- 📱 **QR-Based Pre-Approval**: Residents can generate secure, scannable QR codes for expected guests, allowing for fast-tracked security checks and reduced congestion at the gate.
- 🛡️ **Role-Based Access Control**: Distinct permission scopes, secure authentications, and tailored UI workflows for Admins, Residents, and Guards.
- 🔔 **Instant Notifications**: Automated alerts, email integrations (via Nodemailer for actions like Forgot Password), and event-driven updates.
- 📸 **Cloud Media Management**: Integrated with **Cloudinary** for fast and secure handling of user avatars, visitor photos, and essential documents.
- ⚙️ **Job Queues & Scheduling**: Utilizes **Redis** and **BullMQ** for robust background task processing and **node-cron** for scheduled systemic operations.

---

## 🛠️ Technology Stack

### 🌐 Frontend (Admin Web Portal)
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4
- **State/Routing**: React Router DOM
- **Real-Time**: Socket.IO Client
- **UI/UX**: Lucide React, Recharts (Analytics), Three.js (3D integrations)

### 📱 Mobile (Resident & Guard Apps)
- **Framework**: React Native + Expo (v54)
- **Navigation**: Expo Router
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Hardware Integration**: Expo Camera, Image Picker, Haptics, Local Authentication
- **Utilities**: React Native QR Code SVG, Expo Notifications

### ⚙️ Backend (API Layer)
- **Server**: Node.js + Express
- **Database**: PostgreSQL (via Supabase) with Prisma ORM
- **Caching & Queues**: Redis, BullMQ
- **Authentication**: JWT (JSON Web Tokens), bcryptjs
- **Media**: Cloudinary, Multer
- **Real-Time**: Socket.IO

---

## 📂 Project Structure

```text
SocietyOS/
├── backend/          # Express API, Prisma Schema, WebSocket Logic, Controllers
├── frontend/         # React Admin Dashboard (Vite + Tailwind CSS)
├── mobile/           # React Native Expo app (Resident & Guard views)
├── design/           # UI/UX design references and prototyping files
└── design_assets/    # Logos, branding, and graphical assets
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [PostgreSQL](https://www.postgresql.org/) (Local or Cloud e.g., Supabase)
- [Redis](https://redis.io/) (For BullMQ background jobs)
- [Expo CLI](https://docs.expo.dev/) (For running the mobile applications)

### 1. Clone the repository
```bash
git clone https://github.com/shivammisra766/SocietyOS.git
cd SocietyOS
```

### 2. Backend Setup
```bash
cd backend
npm install
# Set up your .env file with DATABASE_URL, REDIS_URL, CLOUDINARY_URL, etc.
npx prisma generate
npx prisma db push
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
# Configure .env with the backend API URL (e.g., VITE_API_URL)
npm run dev
```

### 4. Mobile Setup
```bash
cd ../mobile
npm install
# Start the Expo development server
npx expo start -c
```
*(Use the Expo Go app on your phone or an emulator to run the mobile apps)*

---

## 🛣️ Roadmap & Upcoming Features

- [x] Basic Resident & Admin Authentication workflows
- [x] QR Code generation and scanning capabilities
- [x] Real-time gate logging with WebSockets
- [x] Forgot Password workflow with secure tokenized email links
- [ ] Comprehensive database logging & analytics dashboard for Admins
- [ ] Full Guard App UI/UX revamp with direct camera integration
- [ ] Enhanced profile matching and resident verification flows
- [ ] Complete logout functionality and state clearing across devices
- [ ] Real-time push notifications via Expo Notifications

---

## 📝 License

This project is licensed under the **ISC License**.

---
<p align="center">Built by <a href="https://github.com/shivammisra766">Shivam Misra</a></p>