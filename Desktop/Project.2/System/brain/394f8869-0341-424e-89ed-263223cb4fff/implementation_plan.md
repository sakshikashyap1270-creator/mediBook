# Implementation Plan: Doctor Appointment and Patient Management System

We will build a complete, production-ready Doctor Appointment and Patient Management System from scratch. The system is split into a Django + Django REST Framework (DRF) backend (powered by MySQL) and a React (Vite + JS) frontend styled with custom CSS.

## Tech Stack
- **Frontend**: React (JavaScript only), Axios, React Router DOM, Custom CSS (Glassmorphism & modern palette)
- **Backend**: Python Django, Django REST Framework, JWT (`djangorestframework-simplejwt`), CORS (`django-cors-headers`)
- **Database**: MySQL (`doctor_appointment` database on localhost, password: `sera2005`)

---

## User Roles
1. **Patient**: Register, update medical profile, browse doctors, book appointments, cancel appointments, view history.
2. **Doctor**: Update professional profile, view today's appointments, accept/reject pending appointments, complete appointments, view patient details.
3. **Admin**: View system-wide stats (total users, status counts), manage doctor accounts, manage patient accounts, manage all appointments.

---

## Proposed Changes

### Database Setup & Schema
We will define Django models mapping to MySQL:
- **`CustomUser`**: Inherits from `AbstractUser`. Includes fields: `role` (patient, doctor, admin), `phone_number`, `date_of_birth`, `address`.
- **`DoctorProfile`**: Linked OneToOne to `CustomUser`. Includes `specialization`, `consultation_fee`, `bio`, `experience_years`, `availability_hours`.
- **`PatientProfile`**: Linked OneToOne to `CustomUser`. Includes `blood_group`, `medical_history`.
- **`Appointment`**: Links a patient (`User`) and a doctor (`User` or `DoctorProfile`). Fields: `appointment_date`, `appointment_time`, `status` (PENDING, CONFIRMED, CANCELLED, COMPLETED), `notes`, `status_notes`.

---

### Backend Setup (Django + DRF)

#### [NEW] [requirements.txt](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/backend/requirements.txt)
Define backend packages: `Django`, `djangorestframework`, `djangorestframework-simplejwt`, `django-cors-headers`, `mysqlclient`.

#### [NEW] [.env](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/backend/.env)
Store environment variables:
- `SECRET_KEY`, `DEBUG=True`, `DB_NAME=doctor_appointment`, `DB_USER=root`, `DB_PASSWORD=sera2005`, `DB_HOST=localhost`, `DB_PORT=3306`.

#### [MODIFY] [settings.py](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/backend/doctor_backend/settings.py)
Configure:
- `DATABASES` to use MySQL.
- `AUTH_USER_MODEL = 'api.CustomUser'`.
- `REST_FRAMEWORK` with SimpleJWT Authentication.
- `CORS_ALLOWED_ORIGINS` to allow local React app (port 5173).

#### [NEW] [models.py](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/backend/api/models.py)
Implement `CustomUser`, `DoctorProfile`, `PatientProfile`, and `Appointment` models.

#### [NEW] [serializers.py](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/backend/api/serializers.py)
Implement:
- `UserSerializer` / `RegisterSerializer` for user creation and role-based profiles.
- `DoctorProfileSerializer`, `PatientProfileSerializer`.
- `AppointmentSerializer` (with read/write fields for nested representations).

#### [NEW] [views.py](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/backend/api/views.py)
Implement:
- RegisterView: Creates `CustomUser` + matching profile.
- CustomTokenObtainPairView: Attaches user role, email, and full name inside JWT payload.
- DoctorViewSet: Manage doctor specific endpoints.
- PatientViewSet: Edit/view patients.
- AppointmentViewSet: Role-based filtering.
  - Patients can only see/book/cancel their own appointments.
  - Doctors can only see/update their own appointments.
  - Admins see all.
- AdminStatsView: Aggregate counts of appointments by status, total patients, total doctors.

#### [NEW] [urls.py](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/backend/api/urls.py) and [doctor_backend/urls.py](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/backend/doctor_backend/urls.py)
Route resources to views.

---

### Frontend Setup (React + Vite)

We will clean up the existing TypeScript-based structure and replace it with a clean JavaScript Vite React configuration.

#### [NEW] [package.json](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/frontend/package.json)
Standard dependencies: `react`, `react-dom`, `react-router-dom`, `axios`. Dev dependencies: `@vitejs/plugin-react`, `vite`.

#### [NEW] [vite.config.js](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/frontend/vite.config.js)
Vite JavaScript configuration.

#### [NEW] [index.html](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/frontend/index.html)
Clean setup with Google Fonts (`Outfit` or `Inter`) for rich styling.

#### [NEW] [index.css](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/frontend/src/index.css)
A beautiful modern design system with a dark-mode theme, sleek gradients, glassmorphism card panels (`backdrop-filter`), elegant buttons with hover animations, and fully responsive layouts.

#### [NEW] [App.jsx](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/frontend/src/App.jsx)
App entrypoint with React Router config, mapping pages to routes:
- Login (`/login`)
- Register (`/register`)
- Patient Dashboard (`/patient/*`)
- Doctor Dashboard (`/doctor/*`)
- Admin Dashboard (`/admin/*`)
- ProtectedRoute wrapper for role verification.

#### [NEW] [api.js](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/frontend/src/services/api.js)
Centralized Axios client that automatically intercepts requests to attach JWT token and handles automatic logouts on token expiry (401 response).

#### [NEW] [Dashboards & Pages](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/frontend/src/pages/)
- `Login.jsx` & `Register.jsx`
- `PatientDashboard.jsx`: Bookings, history, upcoming appointments, update profile.
- `DoctorDashboard.jsx`: Accept/reject list, today's schedule, patient details modal, profile setup.
- `AdminDashboard.jsx`: Statistics, doctor management, patient list, appointment overview.

---

## Verification Plan

### Automated Verification
1. Run backend migrations and test authentication endpoints using Pytest/Django tests or cURL.
2. Spin up the React frontend using `npm run dev` and ensure zero console errors.

### Manual Verification
1. **Auth Test**: Register a new Patient, a new Doctor, and run the Admin setup. Verify role redirection.
2. **Booking Flow**: Log in as a patient, book an appointment with a doctor. Check database state.
3. **Doctor Flow**: Log in as a doctor, accept/reject appointment, update status to COMPLETED.
4. **Admin Flow**: View aggregated stats, verify doctor and patient management actions.

## User Review Required

> [!NOTE]
> Database configurations are hardcoded to the local MySQL server with user `root` and password `sera2005` inside `.env`.
