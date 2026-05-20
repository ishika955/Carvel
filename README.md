# 🩺 Carvèl – Elder Care Monitoring System

> “Care Well for those who once cared for us.”

Carvèl is a web-based elderly care management platform designed to ensure **structured, transparent, and continuous care** for elderly individuals. It connects **caretakers and family members** on a single platform, enabling remote monitoring, medication tracking, health updates, and centralized care management.

The platform solves the challenge of **remote elderly monitoring** by providing **real-time health tracking, medication scheduling, appointment management, and emergency alerts**.

---

## 🚀 Features

### 👨‍⚕️ Caretaker Dashboard
- Manage daily medication schedules
- Log health vitals (BP, sugar, temperature, etc.)
- Record patient observations
- Mark medicines as **taken/missed**
- Monitor alerts and reports

### 👨‍👩‍👧 Family Dashboard
- Monitor elderly health remotely
- Edit medication timetable
- Receive emergency alerts & notifications
- View health history and trends
- Access centralized patient information

### 📌 Core Functionalities
- ✅ Role-based access control
- ✅ Medication schedule management
- ✅ Health vitals logging
- ✅ Appointment tracking
- ✅ Smart alerts for abnormal vitals
- ✅ Missed medication notifications
- ✅ PDF health report generation via email
- ✅ Centralized medical records
- ✅ Secure authentication system

---

## 👥 User Roles

### **Caretaker**
- Access only assigned patients
- Update medications and vitals
- View alerts and reports

### **Family Member**
- Monitor patient health remotely
- Manage medication timetable
- Receive emergency notifications
- View patient health history

---

## 🏗️ System Architecture

Carvèl follows a **Client–Server Architecture** with **role-based dashboards** to ensure privacy and accountability.

### Workflow

Client → HTTP Request → Server → Database → Response

### Architecture Pattern
- MVC Architecture
- Secure Authentication & Authorization
- Protected API Routes using JWT

---

## 🛠️ Tech Stack

### Frontend
- React.js
- CSS3
- JavaScript

### Backend
- Node.js
- Express.js

### Database
- MongoDB (NoSQL)

### Authentication & Security
- JWT Authentication
- Google OAuth
- Passport.js
- bcrypt Password Hashing

### Cloud & Storage
- Multer
- Cloudinary

### Utilities
- Nodemailer
- dotenv
- express-session

### Development Tools
- npm
- Nodemon
- Visual Studio Code
- Thunder Client

---

## 📦 Packages Used

| Package | Purpose |
|----------|----------|
| mongoose | MongoDB object modeling |
| bcrypt | Password hashing |
| jsonwebtoken | JWT authentication |
| passport | Authentication middleware |
| passport-google-oauth20 | Google OAuth login |
| express-session | Session handling |
| dotenv | Environment variable management |
| multer | Image upload handling |
| cloudinary | Cloud image storage |
| nodemailer | Email alerts & PDF reports |

---

## 🔐 Authentication & Security

Carvèl ensures secure access through:

- JWT Authentication for secure login sessions
- Google OAuth for simplified sign-in
- Role-Based Authorization for controlled access
- Protected Routes to prevent unauthorized access

---


## 📅 Additional Features

### 💊 Medication Timetable
- Add/Edit medicines
- Set dosage and timing
- Caretaker-friendly medication view

### 🚨 Smart Alerts & Email Reports
- Emergency alerts for abnormal vitals
- Dashboard notifications
- Automated PDF health reports via email

### 📆 Appointment Calendar
- Schedule appointments
- Track upcoming visits
- Organized healthcare planning

### ☁️ Cloudinary Integration
- Secure profile image uploads
- Fast cloud-based image delivery
- Multi-format support

---


## 🌍 Real-World Impact

With the rise of **nuclear families** and increasing elderly healthcare concerns, Carvèl helps bridge the caregiving gap through **digital health monitoring and remote care management**.

---


## 👩‍💻 Team Members

- Ishika (Team Leader)
- Ishika Singla
- Ishita Kalra
- Varinda Aggarwal

---



## ❤️ Conclusion

Carvèl enables **structured remote elderly care**, improves transparency between caretakers and families, reduces risks from delayed medical attention, and promotes **proactive health monitoring**.

### *“Care Well for those who once cared for us.”*
