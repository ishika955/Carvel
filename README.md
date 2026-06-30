<h1 align="center">Carvel</h1>

<h3 align="center">Elder Care Monitoring and Management System</h3>

<p align="center">
  <i>Care well for those who once cared for us.</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React.js-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Framework-Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
</p>

---

## Overview

**Carvel** is a full-stack elderly care monitoring and management system designed to support structured, transparent, and continuous care for elderly individuals.

The platform connects **family members** and **caretakers** on a single system, allowing families to remotely monitor health updates, medication schedules, appointments, alerts, and medical records.

The project focuses on solving a real-world problem: many elderly people need regular health tracking and medication supervision, while family members may not always be physically present to monitor their care.

---

## Live Demo

| Type | Link |
|---|---|
| Frontend Live Demo | https://carvel.vercel.app |
| Backend/API | https://carvel.onrender.com |
| GitHub Repository | https://github.com/ishika955/Carvel |

> Note: The backend is deployed on Render, so the first request may take a few seconds if the server is waking up.

---

## Problem Statement

Elderly family members often require regular medication, health vitals monitoring, appointment tracking, and emergency communication. In nuclear families or remote caregiving situations, family members may not always be available to monitor these details daily.

This can lead to:

- Missed medications
- Delayed response to abnormal health vitals
- Lack of centralized health records
- Poor communication between caretakers and family members
- Difficulty in monitoring elderly care remotely

**Carvel** aims to reduce this gap by providing a centralized digital care management system.

---

## Key Features

### Caretaker Dashboard

- Manage assigned elderly patients
- Log daily health vitals such as blood pressure, sugar level, and temperature
- Record patient observations
- Mark medicines as taken or missed
- View alerts and reports
- Update daily care entries

### Family Dashboard

- Monitor elderly health remotely
- View health history and care updates
- Edit medication timetable
- Receive emergency alerts and notifications
- Access centralized patient information
- Track upcoming appointments

### Medication Management

- Add and edit medicine details
- Set dosage and timing
- Track taken and missed medicines
- Generate missed medication alerts

### Smart Alerts

- Alerts for abnormal health vitals
- Notifications for missed medicines
- Emergency updates for family members
- Health-related alert history

### Appointment Tracking

- Schedule doctor appointments
- Track upcoming visits
- Organize healthcare planning

### PDF Health Reports

- Generate health reports in PDF format
- Send reports through email using Nodemailer
- Automated scheduled reporting using node-cron
- Maintain structured health summaries for better monitoring

### Cloud Image Upload

- Upload profile images securely
- Store images using Cloudinary
- Support cloud-based image delivery

---

## User Roles

### 1. Caretaker

Caretakers are responsible for updating the daily care and health status of assigned elderly patients.

**Caretaker can:**

- Access assigned patients
- Add health vitals
- Update medication status
- Record patient observations
- View alerts and reports

### 2. Family Member

Family members can remotely monitor the health and care status of elderly patients.

**Family member can:**

- View patient health records
- Manage medication timetable
- Receive emergency notifications
- Track care history
- Monitor health updates remotely

---

## System Architecture

Carvel follows a **Client-Server Architecture** with role-based dashboards.

```txt
Client -> HTTP Request -> Server -> Database / File Storage -> Response
```

### Architecture Pattern

The project follows the **MVC Architecture** pattern.

```txt
Model      -> Handles database schemas and data structure
View       -> Handles user interface
Controller -> Handles business logic and request processing
Routes     -> Defines API endpoints
Middleware -> Handles authentication and authorization
```

---

## Tech Stack

### Frontend

- React.js
- JavaScript
- CSS3
- Vite
- Vercel for deployment

### Backend

- Node.js
- Express.js
- Render for deployment

### Database and Storage

- MongoDB
- Mongoose
- JSON file storage for some care logs and alert data

### Authentication and Security

- JWT Authentication
- Google OAuth
- Passport.js
- bcrypt password hashing
- Role-based authorization
- Protected routes

### Cloud and File Upload

- Multer
- Cloudinary

### Reports and Email

- PDFKit
- Nodemailer
- node-cron

### Development Tools

- Git
- GitHub
- npm
- Nodemon
- Visual Studio Code
- Thunder Client

---

## Packages Used

| Package | Purpose |
|---|---|
| `express` | Backend framework |
| `mongoose` | MongoDB object modeling |
| `bcrypt` | Password hashing |
| `jsonwebtoken` | JWT authentication |
| `passport` | Authentication middleware |
| `passport-google-oauth20` | Google OAuth login |
| `express-session` | Session handling |
| `dotenv` | Environment variable management |
| `multer` | File upload handling |
| `cloudinary` | Cloud image storage |
| `nodemailer` | Email alerts and reports |
| `pdfkit` | PDF report generation |
| `node-cron` | Scheduled report generation |
| `nodemon` | Development server auto-restart |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user with optional `profilePic` upload |
| `POST` | `/api/auth/login` | Login existing user |
| `GET` | `/api/auth/me` | Get current logged-in user |
| `POST` | `/api/auth/logout` | Logout user |
| `GET` | `/api/patients` | Fetch patient records |
| `POST` | `/api/patients` | Add a new patient |
| `GET` | `/api/patients/:id/timetable` | Fetch medicine timetable |
| `PUT` | `/api/patients/:id/timetable` | Update medicine timetable |
| `GET` | `/api/alerts` | Fetch patient alerts |
| `POST` | `/api/alerts/run` | Run missed medication alert check |
| `POST` | `/api/upload` | Upload profile image using `image` form-data field |

> Most `/api/patients` and `/api/alerts` routes require a JWT token in the `Authorization` header.

Example:

```txt
Authorization: Bearer your_jwt_token
```

---

## Authentication and Security

Carvel includes secure authentication and authorization features.

- JWT-based authentication for secure login sessions
- Google OAuth for simplified sign-in
- Password hashing using bcrypt
- Role-based access control
- Protected API routes
- Separate access permissions for caretaker and family member roles

---

## Data Storage Clarification

Carvel uses a mixed storage approach:

- **MongoDB** is used for structured database models such as users and patient-related schemas.
- **JSON file storage** is used in some parts of the project for care logs, patient entries, and alerts.

This structure was used during development to support faster prototyping and feature implementation.

---

## Project Structure

```txt
Carvel/
|
|-- client/          # Frontend React application
|-- config/          # Configuration files
|-- controllers/     # Request handling and business logic
|-- data/            # JSON data storage for some logs and alerts
|-- middleware/      # Authentication and authorization middleware
|-- models/          # MongoDB models and schemas
|-- routes/          # API routes
|-- services/        # Helper services and business utilities
|-- views/           # Static or server-rendered view files
|-- server.js        # Main backend server file
|-- .gitignore
|-- README.md
```

---

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/ishika955/Carvel.git
```

### 2. Navigate to the project folder

```bash
cd Carvel
```

### 3. Install backend dependencies

```bash
npm install
```

### 4. Create environment file

Create a `.env` file in the root directory and add the required environment variables.

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

### 5. Run the backend server

```bash
npm run dev
```

The backend runs on:

```txt
http://localhost:3000
```

### 6. Navigate to the client folder

```bash
cd client
```

### 7. Install frontend dependencies

```bash
npm install
```

### 8. Run the frontend

```bash
npm run dev
```

The frontend runs on the local Vite development server:

```txt
http://localhost:5173
```

---

## Screenshots

Project screenshots will be added in the next update.

Planned screenshots:

| Screenshot | Description |
|---|---|
| Login Page | User login interface |
| Signup Page | User registration interface |
| Family Dashboard | Remote health monitoring dashboard for family members |
| Caretaker Dashboard | Daily patient care management dashboard |
| Health Vitals Form | Form to record blood pressure, sugar level, temperature, and observations |
| Medication Timetable | Medicine schedule and dosage tracking |
| Alerts Page | Missed medication and abnormal vitals alerts |
| Appointment Calendar | Appointment scheduling and tracking interface |

---

## Current Limitations

- Real-time WebSocket alerts are not implemented yet.
- Some dashboard pages are served using static HTML.
- Some care logs and alerts currently use JSON file storage.
- Automated testing has not been added yet.
- UI responsiveness can be improved further.

---

## Real-World Impact

With the rise of nuclear families and increasing elderly healthcare needs, remote care management has become an important challenge.

Carvel helps bridge this caregiving gap by:

- Improving communication between caretakers and family members
- Reducing risks caused by missed medication
- Helping families monitor elderly health remotely
- Maintaining centralized medical records
- Supporting faster response during emergencies

---

## What I Learned

While building Carvel, I learned and practiced:

- Full-stack project structure
- MVC architecture
- REST API development
- Authentication and authorization
- MongoDB schema design
- Role-based dashboards
- Secure password handling
- Cloud image upload using Cloudinary
- Email integration using Nodemailer
- PDF generation using PDFKit
- Scheduled tasks using node-cron
- Git and GitHub collaboration workflow
- Full-stack deployment using Vercel and Render

---

## Future Improvements

- Add real-time notifications using Socket.io
- Fully migrate JSON file storage to MongoDB
- Add data visualization for health trends
- Improve UI responsiveness
- Add admin dashboard
- Add prescription upload feature
- Add AI-based health risk suggestions
- Add automated reminder system for medicines and appointments
- Add automated testing
- Add more detailed health analytics for family members

---

## Team Members

| Name | Role |
|---|---|
| Ishika Bedi | Team Leader |
| Ishika Singla | Team Member |
| Ishita Kalra | Team Member |
| Varinda Aggarwal | Team Member |

---

## Conclusion

Carvel enables structured remote elderly care by improving transparency between caretakers and family members. It helps reduce risks caused by delayed medical attention, missed medication, and scattered medical information.

The project promotes proactive health monitoring and supports better elderly care through technology.

<p align="center">
  <b>Care well for those who once cared for us.</b>
</p>
