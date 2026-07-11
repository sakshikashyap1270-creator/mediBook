# Doctor Appointment and Patient Management System Implementation Plan

This document outlines the detailed architecture, database design, API specification, frontend layout, and setup instructions for the **Doctor Appointment and Patient Management System**.

---

## Technical Architecture

The application will be divided into two main folders inside `C:\Users\chaud\.gemini\antigravity\scratch\doctor-appointment-system`:
1. `backend/`: A Node.js + Express.js service written in TypeScript, using Prisma ORM with PostgreSQL, JWT-based authentication, role-based access control, and bcrypt password hashing.
2. `frontend/`: A React client initialized with Vite and TypeScript, styled with Tailwind CSS v4, containing routing with React Router v6, and state management via React Context.

```
doctor-appointment-system/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── doctor.controller.ts
│   │   │   └── appointment.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── doctor.routes.ts
│   │   │   └── appointment.routes.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.tsx
    │   │   ├── Layout.tsx
    │   │   ├── ProtectedRoute.tsx
    │   │   ├── AppointmentCard.tsx
    │   │   └── AvailabilitySelector.tsx
    │   ├── context/
    │   │   └── AuthContext.tsx
    │   ├── pages/
    │   │   ├── Login.tsx
    │   │   ├── Register.tsx
    │   │   ├── PatientDashboard.tsx
    │   │   ├── DoctorDashboard.tsx
    │   │   └── Profile.tsx
    │   ├── services/
    │   │   └── api.ts
    │   ├── App.tsx
    │   ├── index.css
    │   └── main.tsx
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    └── index.html
```

---

## Database Schema (Prisma PostgreSQL)

We will implement the following relational schema in `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  PATIENT
  DOCTOR
  ADMIN
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
}

model User {
  id            String         @id @default(uuid())
  name          String
  email         String         @unique
  passwordHash  String
  role          Role           @default(PATIENT)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  
  // Relations
  doctorProfile DoctorProfile?
  patientAppointments Appointment[] @relation("PatientAppointments")
  doctorAppointments  Appointment[] @relation("DoctorAppointments")
}

model DoctorProfile {
  id              String         @id @default(uuid())
  userId          String         @unique
  specialty       String
  licenseNumber   String         @unique
  consultationFee Float
  bio             String         @db.Text
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  // Relations
  user            User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  availabilities  Availability[]
}

model Availability {
  id        String   @id @default(uuid())
  doctorId  String
  date      DateTime @db.Date
  startTime String   // "HH:MM" e.g., "09:00"
  endTime   String   // "HH:MM" e.g., "10:00"
  isBooked  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  doctor    DoctorProfile @relation(fields: [doctorId], references: [id], onDelete: Cascade)

  @@unique([doctorId, date, startTime, endTime])
}

model Appointment {
  id        String            @id @default(uuid())
  patientId String
  doctorId  String
  date      DateTime          @db.Date
  time      String            // "HH:MM" e.g., "09:30"
  status    AppointmentStatus @default(PENDING)
  notes     String?           @db.Text
  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt

  // Relations
  patient   User              @relation("PatientAppointments", fields: [patientId], references: [id], onDelete: Cascade)
  doctor    User              @relation("DoctorAppointments", fields: [doctorId], references: [id], onDelete: Cascade)
}
```

---

## API Endpoints Design

We will expose the following RESTful API routes under `/api`:

### 1. Authentication
* `POST /api/auth/register` - Registers a new user. If the role is `DOCTOR`, it also validates and creates a `DoctorProfile`.
* `POST /api/auth/login` - Authenticates user credentials, returning a JWT and user payload.

### 2. User & Profile Management
* `GET /api/users/me` - Retrieves the authenticated user's profile detail.
* `PUT /api/users/profile` - Updates the authenticated user's base information and, if applicable, their doctor profile.

### 3. Doctor & Availability Management
* `GET /api/doctors` - Retrieves all doctors with their specialty details and active availability slots (for Patients to view).
* `POST /api/doctors/availability` - Allows a Doctor to set availability slots (multiple slots in one payload). Requires `DOCTOR` role.

### 4. Appointment Workflows
* `POST /api/appointments/book` - Places an appointment request. Creates the `Appointment` and marks the matching `Availability` slot as `isBooked: true`.
* `GET /api/appointments/my-appointments` - Lists appointments relative to the caller's role (Patients see their bookings, Doctors see scheduled appointments for them).
* `PATCH /api/appointments/:id/status` - Updates status (e.g., Doctor confirms/rejects, Patient or Doctor cancels). Requires RBAC verification.

---

## Frontend Design & UI/UX

We will adopt a **Premium Medical Theme** with the following characteristics:
- **Color Palette**: Soft Slate Grays (`bg-slate-50`), Pure White, and Teal/Blue accents (`text-teal-600`, `bg-blue-600`, `hover:bg-blue-700`).
- **Layout**: Unified layout header with a responsive context-aware Navigation Bar showing active login states and tabs corresponding to roles.
- **Patient Dashboard**:
  - Main panel showing status counters (Pending, Confirmed, Completed).
  - Searchable list of Doctors with quick-book drawers.
  - Responsive list/table of past and upcoming appointments with cancellation triggers.
- **Doctor Dashboard**:
  - Quick summary cards for today's bookings.
  - Tabbed schedule view with Accept/Reject/Complete buttons.
  - Weekly Availability Planner panel to easily set up dates and time intervals.
- **Forms**: Animated input elements with inline validation error states.

---

## Verification Plan

### Backend Verification
1. Run local tests by launching backend service and targeting routes via a script testing register, login, profile edit, availability creation, and appointment booking flows.
2. Verify token authorization constraints (e.g. patients cannot insert availability, doctors cannot accept appointments that aren't theirs).

### Frontend Verification
1. Verify routes navigation (`/login`, `/register`, `/patient-dashboard`, `/doctor-dashboard`).
2. Verify responsive layout down to mobile viewports.
3. Validate interactive booking flow: patient searches a doctor, expands availability, books, and confirms the schedule updates.

---

## Proposed Changes

### Backend Setup
#### [NEW] [package.json](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/backend/package.json)
#### [NEW] [tsconfig.json](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/backend/tsconfig.json)
#### [NEW] [.env](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/backend/.env)
#### [NEW] [schema.prisma](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/backend/prisma/schema.prisma)
#### [NEW] [seed.ts](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/backend/prisma/seed.ts)
#### [NEW] [index.ts](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/backend/src/index.ts)
#### [NEW] Controllers, Routes, and Middlewares in `backend/src/`

### Frontend Setup
#### [NEW] [package.json](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/frontend/package.json)
#### [NEW] [vite.config.ts](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/frontend/vite.config.ts)
#### [NEW] [index.html](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/frontend/index.html)
#### [NEW] [index.css](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/frontend/src/index.css)
#### [NEW] Pages, Components, Context, and Services in `frontend/src/`
