# SocietyOS - Activity & Migration Log (June 12, 2026)

This document log outlines all migrations and code fixes applied to the **SocietyOS** codebase to prepare it for a fully offline presentation and tomorrow's final submission.

---

## 🌐 1. Offline & Local Infrastructure Migration

To ensure the entire ecosystem (Frontend, Backend, and Mobile App) functions without any active internet connection, all cloud service dependencies have been refactored to use local alternatives.

### A. Local Media Uploads (Replaced Cloudinary)
* **File Modified:** [cloudinary.js](file:///D:/Computer_Science/projects/SocietyOS/Code/SocietyOS/backend/src/shared/config/cloudinary.js)
* **Changes:**
  * Replaced the Cloudinary client and SDK setup with a local disk storage engine using `multer`.
  * Uploaded images (user avatars, visitor passes, complaint attachments) are now saved directly to the server's local file system under `backend/uploads/`.
  * Configured Express in [app.js](file:///D:/Computer_Science/projects/SocietyOS/Code/SocietyOS/backend/src/app.js) to serve the `/uploads` directory statically.

### B. Local Database Services
* **File Modified:** `backend/.env`
* **Changes:**
  * Configured PostgreSQL connection string to point to local Postgres (`localhost:54322`) rather than Supabase.
  * Configured Redis connection URL to point to local Redis (`localhost:6379`) instead of Upstash.

### C. Local Assets & Fonts (No CDN dependencies)
* **File Modified:** [main.jsx](file:///D:/Computer_Science/projects/SocietyOS/Code/SocietyOS/frontend/src/main.jsx) & `frontend/index.html`
* **Changes:**
  * Installed `@fontsource/inter` and `material-symbols` locally in the frontend workspace.
  * Removed external Google Fonts `<link>` stylesheet URLs from `index.html` to prevent rendering delays or blank text issues when loading offline.
  * Imported the fonts directly from `node_modules` inside `main.jsx` for fully local serving.

### D. Hybrid Email Delivery System
* **File Modified:** [mailer.js](file:///D:/Computer_Science/projects/SocietyOS/Code/SocietyOS/backend/src/shared/utils/mailer.js)
* **Changes:**
  * Implemented an offline fallback wrapper around the `nodemailer` transporter.
  * When a notification email is triggered, the code attempts SMTP delivery with a strict 5-second timeout.
  * If the network is unreachable (offline mode), the system catches the error, logs the message contents locally to the backend console, and returns success, preventing frontend/backend requests from hanging or crashing.

---

## 🐛 2. Frontend Critical Bug Fixes (Linting & Runtime Stability)

Ran full builds and code audits across all frontend routes to resolve any issues causing page crashes during evaluation.

### A. Temporal Dead Zone (TDZ) Fixes
* **Files Modified:**
  * [Flats.jsx](file:///D:/Computer_Science/projects/SocietyOS/Code/SocietyOS/frontend/src/pages/admin/Flats.jsx)
  * [Guards.jsx](file:///D:/Computer_Science/projects/SocietyOS/Code/SocietyOS/frontend/src/pages/admin/Guards.jsx)
  * [Notices.jsx](file:///D:/Computer_Science/projects/SocietyOS/Code/SocietyOS/frontend/src/pages/admin/Notices.jsx)
  * [ServiceStaff.jsx](file:///D:/Computer_Science/projects/SocietyOS/Code/SocietyOS/frontend/src/pages/admin/ServiceStaff.jsx)
* **Issue:** React components were calling helper functions (such as `fetchFlats()`, `fetchGuards()`, etc.) within `useEffect` hooks before those functions were declared, causing immediate runtime script crashes when attempting to render those views.
* **Resolution:** Hoisted the declaration of all state-fetching helper functions above the `useEffect` hooks.

### B. Unused Variable Cleanup
* Cleaned up unused state imports, variables, and components inside administrative views (`LandingPage.jsx`, `Users.jsx`, and `Settings.jsx`) to resolve compiler/lint warnings during production building.

---

## 📱 3. Mobile Local Network Verification
* Checked the API configuration in `mobile/lib/api.ts`.
* Verified that the endpoint dynamically resolves the local network IP via Expo constants, ensuring testing on real mobile devices connected to the same Wi-Fi network operates seamlessly without hardcoded development IP addresses.

---

### Status Summary
* **Backend:** Operational & fully local (PostgreSQL, Redis, Storage, and Mailer).
* **Frontend:** Free of runtime TDZ crashes; all styles and fonts loaded locally.
* **Mobile:** Configured for dynamic local IP resolution.
