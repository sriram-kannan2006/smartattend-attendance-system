# 🎓 KEC SmartAttend — Intelligent Attendance & Notification Management System
> **Kongu Engineering College (Autonomous), Perundurai**  
> *Next-Generation Biometric, Dynamic Anti-Proxy QR & Multi-Channel Notification Platform*

---

## 🌟 Overview
**SmartAttend** is a full-stack, enterprise-grade academic attendance management system designed for **Kongu Engineering College**. It replaces traditional manual roll calls with cryptographic 10-second rotating QR codes, OpenCV LBPH facial biometrics, automated OD workflows, multi-channel parent notifications (In-App, Gmail SMTP, and WhatsApp), and automated Excel session audit reporting.

---

## 🚀 Key Features

### 1. 📱 Dynamic Anti-Proxy QR System
- **10-Second Cryptographic Rotation**: Server generates unique UUID tokens every 10 seconds.
- **One-Scan Enforcement**: Single-use tokens prevent screen photos and remote proxy sharing.
- **Live Classroom Projector UI**: Real-time attendees counter via WebSockets (`Socket.IO`).

### 2. 🤖 OpenCV Biometric Facial Verification
- On-device real-time face landmark extraction and embedding verification.
- Biometric anti-spoofing and duplicate face prevention.

### 3. 📅 ECE Department Timetable & Session Management
- Complete 42-period weekly timetable mapped to official Kongu Engineering College faculty.
- 1-click **"Put Attendance"** session creation for scheduled teaching periods.
- Manual exception marking with documented audit reasons (Restroom, Met Staff, OD).

### 4. 📧 Multi-Channel Notifications & Gmail SMTP Integration
- Automated email dispatch with official `.xlsx` attendance reports attached to HOD/Wardens upon session finalization.
- In-App notification center for Students, Teachers, and Administrators.

### 5. 🔐 Dual Authentication (Password & Google OAuth 2.0)
- Single Sign-On (SSO) with official `@kongu.edu` and `@kongu.ac.in` Google accounts.
- Fallback institutional email/password authentication.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Recharts, Socket.IO Client, Axios
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Socket.IO, Nodemailer, ExcelJS, UUID
- **Security**: JWT, Helmet, Express Rate Limiting, CORS, Mongo Sanitize

---

## 📦 Project Structure

```
smartattend-attendance-system/
├── backend/
│   ├── config/              # Environment & service configurations
│   ├── controllers/         # Express request handlers
│   ├── middleware/          # Auth, Rate Limiting, Validation
│   ├── models/              # Mongoose DB schemas (User, Student, Session, Timetable...)
│   ├── routes/              # REST API route endpoints
│   ├── services/            # Business logic, QR service, Email & Notifications
│   ├── scripts/             # Database seed and maintenance scripts
│   ├── .env.example         # Backend environment template
│   ├── server.js            # Main backend entrypoint
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components, Layouts, QR Display, Modals
│   │   ├── context/         # AuthContext, ToastContext, SocketContext
│   │   ├── pages/           # Student, Teacher, and Admin portals
│   │   ├── services/        # Frontend API services
│   │   ├── App.jsx          # React Router hierarchy
│   │   └── main.jsx         # Vite entrypoint
│   ├── .env.example         # Frontend environment template
│   ├── vite.config.js       # Vite build configuration
│   └── package.json
└── README.md
```

---

## ⚙️ Installation & Local Development

### 1. Prerequisites
- **Node.js**: `v18+` or `v20+`
- **MongoDB**: Local MongoDB instance or MongoDB Atlas URI

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in your DATABASE_URL, JWT_SECRET, and SMTP credentials in .env
npm run seed     # Populate ECE III Year Sec D timetable, students & staff
npm start        # Starts backend on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev      # Starts frontend on http://localhost:5173
```

---

## 🌐 Cloud Deployment & Hosting

### Deploy Backend (Render / Railway / VPS / Heroku)
1. Set the root directory to `backend`.
2. Build command: `npm install`
3. Start command: `node server.js`
4. Configure Environment Variables matching `backend/.env.example`.

### Deploy Frontend (Vercel / Netlify / Cloudflare Pages)
1. Set the root directory to `frontend`.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set `VITE_API_URL` to your live backend API URL.

---

## 👥 Credits
Developed for **Kongu Engineering College (Autonomous), Perundurai**  
Department of Electronics and Communication Engineering (ECE).
