# Doctor Appointment and Patient Management System Walkthrough

We have successfully built and verified the core components of the **Doctor Appointment and Patient Management System** (CareSync). Both the Node.js backend and React frontend compile without errors and are fully modular and production-ready.

---

## 1. Project Directory Structure

The system is set up in `C:\Users\chaud\.gemini\antigravity\scratch\doctor-appointment-system` with the following structure:

- **[backend/](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/backend)**
  - [package.json](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/backend/package.json): Handles dependencies (Express, CORS, JWT, BcryptJS, Zod, and Prisma Client).
  - [tsconfig.json](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/backend/tsconfig.json): Compile configurations for TypeScript.
  - [prisma/schema.prisma](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/backend/prisma/schema.prisma): Relational database models (User, DoctorProfile, Availability, Appointment).
  - [prisma/seed.ts](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/backend/prisma/seed.ts): Automatically hashes credentials and seeds initial doctor and patient entries.
  - [src/index.ts](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/backend/src/index.ts): Standard Express application bootstrap, route mapper, and error logger.
  - Controllers, routes, and middlewares for Auth, Users, Doctors, and Appointments.

- **[frontend/](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/frontend)**
  - [package.json](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/frontend/package.json): Frontend dependencies (React Router v6, Tailwind CSS v4, and Lucide icons).
  - [vite.config.ts](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/frontend/vite.config.ts): Integrates `@tailwindcss/vite` and proxy definitions.
  - [index.html](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/frontend/index.html): Configured with the premium *Outfit* typography font.
  - [src/index.css](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/frontend/src/index.css): Imports Tailwind CSS v4 and contains animation utilities.
  - [src/context/AuthContext.tsx](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/frontend/src/context/AuthContext.tsx): Manages global user sessions and persistent authorization.
  - Core views including [Login](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/frontend/src/pages/Login.tsx), [Register](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/frontend/src/pages/Register.tsx), [PatientDashboard](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/frontend/src/pages/PatientDashboard.tsx), [DoctorDashboard](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/frontend/src/pages/DoctorDashboard.tsx), and [Profile](file:///C:/Users/chaud/.gemini/antigravity/scratch/doctor-appointment-system/frontend/src/pages/Profile.tsx).

---

## 2. Dynamic Workflow Summary

1. **Self-Service Doctor Sign-up**: Registering as a doctor asks for their specialty, bio, consultation fee, and professional license. A `DoctorProfile` row is generated transactionally beside the base `User` credential.
2. **Interactive Availability Planner**: Inside the Doctor Dashboard, specialists choose dates and check time boxes. Saving launches a bulk database query generating unbooked slots.
3. **Seamless Scheduling**: Patients explore active slots, supply medical notes, and place bookings. The system marks the slot as booked and updates dashboards in real-time.
4. **Schedule Cancellation and Re-release**: If a patient cancels a pending or confirmed booking, the system updates the appointment state and releases the exact time slot back into the doctor's available pool.

---

## 3. Local Setup Instructions

Follow these step-by-step instructions to run the application on your computer:

### Step 3.1: Database Engine (SQLite)
We configured the project to use **SQLite** for development to allow the application to run out-of-the-box without requiring you to install or run any external database servers.

### Step 3.2: Configure Environment Variables
We have initialized a default `.env` file in the `backend/` folder. The `DATABASE_URL` is set to create a local file-based database:
```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="doctor_appointment_secret_key_2026_change_me"
```

### Step 3.3: Database Migrations & Seeding
The database tables have been set up and pre-seeded. To inspect or reset this setup manually in the future, you can run:

```bash
# 1. Navigate to backend directory
cd backend

# 2. Run Prisma migrations to rebuild the SQLite database
npx prisma migrate dev --name init

# 3. Seed database with initial patients, doctors, and slots
npm run prisma:seed
```

#### Seed Account Logins
After seeding, you can test the system using these preset credentials:
* **Patient account**:
  - Email: `patient@gmail.com`
  - Password: `password123`
* **Cardiologist account**:
  - Email: `dr.smith@clinic.com`
  - Password: `password123`
* **Pediatrician account**:
  - Email: `dr.jones@clinic.com`
  - Password: `password123`
* **Administrator account**:
  - Email: `admin@clinic.com`
  - Password: `password123`

### Step 3.4: Boot the Backend Service
Start the hot-reloading Express service inside the `backend/` directory:
```bash
npm run dev
```
The API server will listen at `http://localhost:5000`.

### Step 3.5: Boot the Frontend Client
In a new terminal window, navigate to the `frontend/` directory and start the Vite client:
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Boot Vite dev server
npm run dev
```
Open your browser and navigate to `http://localhost:3000` to interact with CareSync.
