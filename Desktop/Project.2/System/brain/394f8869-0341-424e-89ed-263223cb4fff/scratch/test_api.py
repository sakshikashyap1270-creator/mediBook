import os
import sys
import django

# Add backend directory to sys.path so doctor_backend and api can be imported
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'doctor_backend.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from api.models import Appointment

User = get_user_model()
client = Client()

print("--- STARTING API VERIFICATION ---")

# Clear existing test user if present
User.objects.filter(username__in=['test_patient', 'test_doctor']).delete()

# Test Case 1: Register Patient
print("\nTest Case 1: Registering a test patient...")
register_patient_data = {
    "username": "test_patient",
    "password": "testpassword123",
    "email": "patient@test.com",
    "first_name": "Test",
    "last_name": "Patient",
    "role": "patient",
    "phone_number": "1234567890",
    "date_of_birth": "1995-05-15",
    "address": "123 Patient Lane",
    "blood_group": "O+",
    "medical_history": "None"
}
res = client.post('/api/auth/register/', register_patient_data, content_type='application/json')
assert res.status_code == 201, f"Patient registration failed: {res.content}"
print("SUCCESS: Patient registered.")

# Test Case 2: Register Doctor
print("\nTest Case 2: Registering a test doctor...")
register_doctor_data = {
    "username": "test_doctor",
    "password": "testpassword123",
    "email": "doctor@test.com",
    "first_name": "Test",
    "last_name": "Doctor",
    "role": "doctor",
    "phone_number": "0987654321",
    "date_of_birth": "1980-10-10",
    "address": "456 Clinic Blvd",
    "specialization": "Cardiologist",
    "consultation_fee": 1000.00,
    "experience_years": 15
}
res = client.post('/api/auth/register/', register_doctor_data, content_type='application/json')
assert res.status_code == 201, f"Doctor registration failed: {res.content}"
print("SUCCESS: Doctor registered.")

# Test Case 3: Login and get JWT token
print("\nTest Case 3: Logging in as patient...")
login_data = {
    "username": "test_patient",
    "password": "testpassword123"
}
res = client.post('/api/auth/login/', login_data, content_type='application/json')
assert res.status_code == 200, f"Patient login failed: {res.content}"
data = res.json()
assert 'access' in data, "No access token in login response"
assert data['role'] == 'patient', "Incorrect role returned"
patient_token = data['access']
print(f"SUCCESS: Logged in. Role is {data['role']}.")

# Test Case 4: Book Appointment
print("\nTest Case 4: Booking an appointment with doctor...")
# Fetch doctor object
doctor_user = User.objects.get(username="test_doctor")
booking_headers = {'HTTP_AUTHORIZATION': f'Bearer {patient_token}'}
booking_data = {
    "doctor": doctor_user.id,
    "appointment_date": "2026-08-15",
    "appointment_time": "10:30:00",
    "notes": "Regular checkup"
}
res = client.post('/api/appointments/', booking_data, content_type='application/json', **booking_headers)
assert res.status_code == 201, f"Appointment booking failed: {res.content}"
appt_data = res.json()
assert appt_data['status'] == 'PENDING', "Appointment should start as PENDING"
print(f"SUCCESS: Booked appointment ID {appt_data['id']}.")

print("\n--- ALL BACKEND TEST CASES PASSED SUCCESSFULLY ---")
