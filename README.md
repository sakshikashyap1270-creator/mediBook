# MediBook - Doctor Appointment & Patient Management System

A beginner-friendly, clean-architecture application built with React on the frontend and Python Django + Django REST Framework on the backend, using MySQL for persistence.

## Tech Stack
- **Frontend**: React (JavaScript/JSX), React Router, Axios, Custom Vanilla CSS (Glassmorphism design system)
- **Backend**: Django, Django REST Framework, SimpleJWT (JWT Auth), CORS Headers
- **Database**: MySQL

---

## Project Structure
```text
doctor-appointment-system/
│
├── frontend/
│   ├── src/
│   │   ├── pages/            # Login, Register, Dashboards
│   │   ├── services/         # Axios API service (JWT Interceptors)
│   │   ├── App.jsx           # Routing & Protection Guard
│   │   ├── main.jsx          # Entrypoint
│   │   └── index.css         # Modern design tokens & layout rules
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── doctor_backend/       # Project configuration
│   ├── api/                  # Django business logic & models
│   ├── manage.py
│   ├── requirements.txt
│   └── .env                  # Port & MySQL credentials
│
└── README.md
```

---

## Setup Instructions

### 1. Database Creation
In MySQL Workbench or command line, run:
```sql
CREATE DATABASE IF NOT EXISTS doctor_appointment;
```

### 2. Backend Setup
1. Open a terminal inside `backend/`.
2. Start the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Verify your MySQL credentials in the `.env` file (currently configured for user `root` and password `sera2005` on `127.0.0.1:3306`).
5. Run migrations:
   ```bash
   python manage.py migrate
   ```
6. Start the server:
   ```bash
   python manage.py runserver
   ```

### 3. Frontend Setup
1. Open a terminal inside `frontend/`.
2. Install packages:
   ```bash
   npm install
   ```
3. Start the Vite React app:
   ```bash
   npm run dev
   ```
4. Open your browser to the URL shown in terminal (typically `http://localhost:5173`).

---

## Test Credentials

We have initialized the database with test accounts. You can also register new accounts dynamically via the Register form.

- **System Admin**:
  - Username: `admin`
  - Password: `adminpassword`
- **Patient**:
  - Username: `test_patient`
  - Password: `testpassword123`
- **Doctor**:
  - Username: `test_doctor`
  - Password: `testpassword123`
