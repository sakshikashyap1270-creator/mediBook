import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api';

function PatientDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    doctor: '',
    appointment_date: '',
    appointment_time: '',
    notes: '',
  });

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    date_of_birth: '',
    address: '',
    patient_profile: {
      blood_group: '',
      medical_history: '',
    }
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      // Get current logged-in user profile
      const userRes = await API.get('auth/profile/');
      setCurrentUser(userRes.data);
      
      // Prefill profile form
      setProfileForm({
        first_name: userRes.data.first_name || '',
        last_name: userRes.data.last_name || '',
        phone_number: userRes.data.phone_number || '',
        date_of_birth: userRes.data.date_of_birth || '',
        address: userRes.data.address || '',
        patient_profile: {
          blood_group: userRes.data.patient_profile?.blood_group || '',
          medical_history: userRes.data.patient_profile?.medical_history || '',
        }
      });

      // Get appointments
      const apptRes = await API.get('appointments/');
      setAppointments(apptRes.data);

      // Get doctors list
      const docRes = await API.get('doctors/');
      setDoctors(docRes.data);

    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Appointment Actions
  const handleCancelAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setError('');
    setSuccess('');
    try {
      await API.patch(`appointments/${id}/`, { status: 'CANCELLED' });
      setSuccess('Appointment cancelled successfully.');
      // Refresh appointments
      const apptRes = await API.get('appointments/');
      setAppointments(apptRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to cancel appointment.');
    }
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!bookingForm.doctor) {
      setError('Please select a doctor.');
      return;
    }

    try {
      await API.post('appointments/', {
        ...bookingForm,
        patient: currentUser.id,
      });
      setSuccess('Appointment booked successfully!');
      setBookingForm({ doctor: '', appointment_date: '', appointment_time: '', notes: '' });
      
      // Refresh appointments
      const apptRes = await API.get('appointments/');
      setAppointments(apptRes.data);
      
      setTimeout(() => navigate('/patient/appointments'), 1000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to book appointment. Please check values.');
    }
  };

  // Profile Submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const response = await API.patch(`patients/${currentUser.id}/`, profileForm);
      setCurrentUser(response.data);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      console.error(err);
      setError('Failed to update profile details.');
    }
  };

  const upcomingAppts = appointments.filter(a => a.status === 'PENDING' || a.status === 'CONFIRMED');
  const pastAppts = appointments.filter(a => a.status === 'COMPLETED' || a.status === 'CANCELLED');

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--primary)', fontSize: '1.5rem' }}>
        Loading Patient Dashboard...
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar Nav */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-logo">
            Medi<span>Book</span> 🩺
          </div>
          <ul className="sidebar-menu">
            <li>
              <Link to="/patient" className={`sidebar-link ${location.pathname === '/patient' ? 'active' : ''}`}>
                🏠 Home / Overview
              </Link>
            </li>
            <li>
              <Link to="/patient/book" className={`sidebar-link ${location.pathname === '/patient/book' ? 'active' : ''}`}>
                📅 Book Appointment
              </Link>
            </li>
            <li>
              <Link to="/patient/appointments" className={`sidebar-link ${location.pathname === '/patient/appointments' ? 'active' : ''}`}>
                🗓️ My Appointments
              </Link>
            </li>
            <li>
              <Link to="/patient/profile" className={`sidebar-link ${location.pathname === '/patient/profile' ? 'active' : ''}`}>
                👤 Edit Profile
              </Link>
            </li>
          </ul>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', marginTop: '2rem' }}>
          🚪 Logout
        </button>
      </aside>

      {/* Main Panel */}
      <main className="main-content">
        {/* Header bar */}
        <header className="top-nav">
          <div>
            <h1>Patient Dashboard</h1>
            <p style={{ color: 'var(--text-muted)' }}>Welcome back, {currentUser?.first_name || currentUser?.username}!</p>
          </div>
          <div className="user-badge">
            <span>{currentUser?.email}</span>
            <span className="role-indicator">Patient</span>
          </div>
        </header>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <Routes>
          {/* Default Overview */}
          <Route path="/" element={
            <div>
              <div className="grid-stats">
                <div className="stat-card">
                  <span className="stat-num">{upcomingAppts.length}</span>
                  <span className="stat-label">Upcoming Visits</span>
                </div>
                <div className="stat-card">
                  <span className="stat-num">{pastAppts.length}</span>
                  <span className="stat-label">Past Appointments</span>
                </div>
                <div className="stat-card">
                  <span className="stat-num">{currentUser?.patient_profile?.blood_group || 'N/A'}</span>
                  <span className="stat-label">Blood Group</span>
                </div>
              </div>

              <div className="glass-panel" style={{ marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Patient Information Summary</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Full Name</span>
                    <span className="detail-value">{currentUser?.first_name} {currentUser?.last_name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Phone</span>
                    <span className="detail-value">{currentUser?.phone_number || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Date of Birth</span>
                    <span className="detail-value">{currentUser?.date_of_birth || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Address</span>
                    <span className="detail-value">{currentUser?.address || 'Not provided'}</span>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                  <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Medical History</h4>
                  <p style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    {currentUser?.patient_profile?.medical_history || 'No medical history reported yet.'}
                  </p>
                </div>
              </div>
            </div>
          } />

          {/* Book Appointment */}
          <Route path="/book" element={
            <div className="glass-panel" style={{ maxWidth: '700px', margin: '0 auto' }}>
              <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Book a Doctor Appointment</h2>
              <form onSubmit={handleBookSubmit}>
                <div className="form-group">
                  <label htmlFor="doctor">Select Doctor</label>
                  <select 
                    id="doctor" 
                    value={bookingForm.doctor} 
                    onChange={(e) => setBookingForm({ ...bookingForm, doctor: e.target.value })}
                    required
                  >
                    <option value="">-- Choose a Doctor --</option>
                    {doctors.map(doc => (
                      <option key={doc.id} value={doc.id}>
                        Dr. {doc.first_name} {doc.last_name} ({doc.doctor_profile?.specialization}) - Fee: ₹{doc.doctor_profile?.consultation_fee}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="details-grid">
                  <div className="form-group">
                    <label htmlFor="appointment_date">Appointment Date</label>
                    <input 
                      type="date" 
                      id="appointment_date"
                      value={bookingForm.appointment_date}
                      onChange={(e) => setBookingForm({ ...bookingForm, appointment_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="appointment_time">Appointment Time</label>
                    <input 
                      type="time" 
                      id="appointment_time"
                      value={bookingForm.appointment_time}
                      onChange={(e) => setBookingForm({ ...bookingForm, appointment_time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Symptoms / Notes</label>
                  <textarea 
                    id="notes"
                    placeholder="Describe your symptoms, concerns, or reason for booking."
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn" style={{ width: '100%', marginTop: '1rem' }}>
                  Confirm Booking 📅
                </button>
              </form>
            </div>
          } />

          {/* View Appointments */}
          <Route path="/appointments" element={
            <div>
              <h2 style={{ marginBottom: '1.5rem' }}>Upcoming Appointments</h2>
              {upcomingAppts.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '2rem' }}>
                  <p style={{ color: 'var(--text-muted)' }}>You have no upcoming appointments.</p>
                  <Link to="/patient/book" className="btn" style={{ marginTop: '1rem' }}>Book One Now</Link>
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Doctor</th>
                        <th>Date & Time</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingAppts.map(appt => (
                        <tr key={appt.id}>
                          <td style={{ fontWeight: 600, color: 'var(--text-white)' }}>
                            Dr. {appt.doctor_details?.first_name} {appt.doctor_details?.last_name}
                            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                              {appt.doctor_details?.doctor_profile?.specialization}
                            </span>
                          </td>
                          <td>{appt.appointment_date} @ {appt.appointment_time}</td>
                          <td>{appt.notes || 'N/A'}</td>
                          <td>
                            <span className={`badge badge-${appt.status.toLowerCase()}`}>{appt.status}</span>
                          </td>
                          <td>
                            {appt.status === 'PENDING' && (
                              <button onClick={() => handleCancelAppointment(appt.id)} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <h2 style={{ marginTop: '3rem', marginBottom: '1.5rem' }}>Appointment History</h2>
              {pastAppts.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No completed or cancelled appointments recorded.</p>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Doctor</th>
                        <th>Date & Time</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Prescription / Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastAppts.map(appt => (
                        <tr key={appt.id}>
                          <td style={{ fontWeight: 600, color: 'var(--text-white)' }}>
                            Dr. {appt.doctor_details?.first_name} {appt.doctor_details?.last_name}
                          </td>
                          <td>{appt.appointment_date} @ {appt.appointment_time}</td>
                          <td>{appt.notes || 'N/A'}</td>
                          <td>
                            <span className={`badge badge-${appt.status.toLowerCase()}`}>{appt.status}</span>
                          </td>
                          <td style={{ fontSize: '0.9rem', color: 'var(--accent)' }}>
                            {appt.status_notes || 'No prescription notes.'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          } />

          {/* Profile Edit */}
          <Route path="/profile" element={
            <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
              <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Update Profile</h2>
              <form onSubmit={handleProfileSubmit}>
                <div className="details-grid">
                  <div className="form-group">
                    <label htmlFor="first_name">First Name</label>
                    <input 
                      type="text" 
                      id="first_name"
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="last_name">Last Name</label>
                    <input 
                      type="text" 
                      id="last_name"
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone_number">Phone Number</label>
                    <input 
                      type="text" 
                      id="phone_number"
                      value={profileForm.phone_number}
                      onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="date_of_birth">Date of Birth</label>
                    <input 
                      type="date" 
                      id="date_of_birth"
                      value={profileForm.date_of_birth || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, date_of_birth: e.target.value })}
                    />
                  </div>
                </div>

                <div className="details-grid" style={{ marginTop: '1rem' }}>
                  <div className="form-group" style={{ maxWidth: '200px' }}>
                    <label htmlFor="blood_group">Blood Group</label>
                    <select 
                      id="blood_group"
                      value={profileForm.patient_profile.blood_group}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        patient_profile: { ...profileForm.patient_profile, blood_group: e.target.value }
                      })}
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label htmlFor="address">Address</label>
                  <textarea 
                    id="address"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="medical_history">Medical History</label>
                  <textarea 
                    id="medical_history"
                    placeholder="Chronic illnesses, allergies, past operations..."
                    value={profileForm.patient_profile.medical_history}
                    onChange={(e) => setProfileForm({
                      ...profileForm,
                      patient_profile: { ...profileForm.patient_profile, medical_history: e.target.value }
                    })}
                  />
                </div>

                <button type="submit" className="btn" style={{ width: '100%', marginTop: '1rem' }}>
                  Save Changes 💾
                </button>
              </form>
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default PatientDashboard;
