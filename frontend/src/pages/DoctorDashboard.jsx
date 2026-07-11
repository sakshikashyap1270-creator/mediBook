import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api';

function DoctorDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activePatient, setActivePatient] = useState(null);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    date_of_birth: '',
    address: '',
    doctor_profile: {
      specialization: '',
      consultation_fee: 0,
      bio: '',
      experience_years: 0,
      availability_hours: '',
    }
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      const userRes = await API.get('auth/profile/');
      setCurrentUser(userRes.data);

      setProfileForm({
        first_name: userRes.data.first_name || '',
        last_name: userRes.data.last_name || '',
        phone_number: userRes.data.phone_number || '',
        date_of_birth: userRes.data.date_of_birth || '',
        address: userRes.data.address || '',
        doctor_profile: {
          specialization: userRes.data.doctor_profile?.specialization || '',
          consultation_fee: userRes.data.doctor_profile?.consultation_fee || 0,
          bio: userRes.data.doctor_profile?.bio || '',
          experience_years: userRes.data.doctor_profile?.experience_years || 0,
          availability_hours: userRes.data.doctor_profile?.availability_hours || '',
        }
      });

      const apptRes = await API.get('appointments/');
      setAppointments(apptRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch doctor dashboard details.');
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

  // Appointment Status Updates
  const handleUpdateStatus = async (apptId, statusVal, notes = '') => {
    setError('');
    setSuccess('');
    try {
      await API.patch(`appointments/${apptId}/`, {
        status: statusVal,
        status_notes: notes
      });
      setSuccess(`Appointment status updated to ${statusVal}.`);
      setShowStatusModal(false);
      setSelectedAppt(null);
      setPrescriptionNotes('');
      
      // Refresh appointments
      const apptRes = await API.get('appointments/');
      setAppointments(apptRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to update status.');
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const response = await API.patch(`doctors/${currentUser.id}/`, profileForm);
      setCurrentUser(response.data);
      setSuccess('Doctor profile details updated successfully.');
    } catch (err) {
      console.error(err);
      setError('Failed to update profile data.');
    }
  };

  // Get Today's Date String in YYYY-MM-DD
  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = getTodayString();
  const todayAppts = appointments.filter(a => a.appointment_date === todayStr);
  const pendingAppts = appointments.filter(a => a.status === 'PENDING');
  const otherAppts = appointments.filter(a => a.appointment_date !== todayStr || a.status !== 'PENDING');

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--primary)', fontSize: '1.5rem' }}>
        Loading Doctor Dashboard...
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
              <Link to="/doctor" className={`sidebar-link ${location.pathname === '/doctor' ? 'active' : ''}`}>
                🏠 Home / Today's Schedule
              </Link>
            </li>
            <li>
              <Link to="/doctor/appointments" className={`sidebar-link ${location.pathname === '/doctor/appointments' ? 'active' : ''}`}>
                🗓️ All Appointments
              </Link>
            </li>
            <li>
              <Link to="/doctor/profile" className={`sidebar-link ${location.pathname === '/doctor/profile' ? 'active' : ''}`}>
                👤 Manage Profile
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
            <h1>Doctor Dashboard</h1>
            <p style={{ color: 'var(--text-muted)' }}>Welcome back, Dr. {currentUser?.first_name || currentUser?.username}!</p>
          </div>
          <div className="user-badge">
            <span>{currentUser?.email}</span>
            <span className="role-indicator">Doctor</span>
          </div>
        </header>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <Routes>
          {/* Default Overview / Today's Appointments */}
          <Route path="/" element={
            <div>
              <div className="grid-stats">
                <div className="stat-card">
                  <span className="stat-num">{todayAppts.length}</span>
                  <span className="stat-label">Today's Visits</span>
                </div>
                <div className="stat-card">
                  <span className="stat-num">{pendingAppts.length}</span>
                  <span className="stat-label">Pending Requests</span>
                </div>
                <div className="stat-card">
                  <span className="stat-num">₹{currentUser?.doctor_profile?.consultation_fee}</span>
                  <span className="stat-label">Consultation Fee</span>
                </div>
              </div>

              <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Today's Appointments ({todayAppts.length})</h2>
              {todayAppts.length === 0 ? (
                <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No appointments scheduled for today ({todayStr}).
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>Reason</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayAppts.map(appt => (
                        <tr key={appt.id}>
                          <td style={{ fontWeight: 600, color: 'var(--text-white)' }}>
                            {appt.patient_details?.first_name} {appt.patient_details?.last_name}
                            <button 
                              onClick={() => setActivePatient(appt.patient_details)} 
                              className="btn-secondary" 
                              style={{ display: 'block', border: 'none', background: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, fontSize: '0.8rem', marginTop: '0.2rem', textDecoration: 'underline' }}
                            >
                              View Medical Details
                            </button>
                          </td>
                          <td>{appt.appointment_time}</td>
                          <td>
                            <span className={`badge badge-${appt.status.toLowerCase()}`}>{appt.status}</span>
                          </td>
                          <td>{appt.notes || 'N/A'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              {appt.status === 'PENDING' && (
                                <>
                                  <button onClick={() => handleUpdateStatus(appt.id, 'CONFIRMED')} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                                    Accept
                                  </button>
                                  <button onClick={() => handleUpdateStatus(appt.id, 'CANCELLED')} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                                    Reject
                                  </button>
                                </>
                              )}
                              {appt.status === 'CONFIRMED' && (
                                <button 
                                  onClick={() => {
                                    setSelectedAppt(appt);
                                    setShowStatusModal(true);
                                  }} 
                                  className="btn" 
                                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: 'var(--success)', color: '#000' }}
                                >
                                  Complete Visit
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          } />

          {/* All Appointments (Manage Requests) */}
          <Route path="/appointments" element={
            <div>
              <h2 style={{ marginBottom: '1.5rem' }}>All Appointments & Scheduling Requests</h2>
              {appointments.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No appointments found.</p>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Date & Time</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map(appt => (
                        <tr key={appt.id}>
                          <td style={{ fontWeight: 600, color: 'var(--text-white)' }}>
                            {appt.patient_details?.first_name} {appt.patient_details?.last_name}
                            <button 
                              onClick={() => setActivePatient(appt.patient_details)} 
                              className="btn-secondary" 
                              style={{ display: 'block', border: 'none', background: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, fontSize: '0.8rem', marginTop: '0.2rem', textDecoration: 'underline' }}
                            >
                              View Medical Details
                            </button>
                          </td>
                          <td>{appt.appointment_date} @ {appt.appointment_time}</td>
                          <td>{appt.notes || 'N/A'}</td>
                          <td>
                            <span className={`badge badge-${appt.status.toLowerCase()}`}>{appt.status}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              {appt.status === 'PENDING' && (
                                <>
                                  <button onClick={() => handleUpdateStatus(appt.id, 'CONFIRMED')} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                                    Accept
                                  </button>
                                  <button onClick={() => handleUpdateStatus(appt.id, 'CANCELLED')} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                                    Reject
                                  </button>
                                </>
                              )}
                              {appt.status === 'CONFIRMED' && (
                                <button 
                                  onClick={() => {
                                    setSelectedAppt(appt);
                                    setShowStatusModal(true);
                                  }} 
                                  className="btn" 
                                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: 'var(--success)', color: '#000' }}
                                >
                                  Complete Visit
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          } />

          {/* Manage Profile */}
          <Route path="/profile" element={
            <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
              <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Doctor Profile Settings</h2>
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
                  <div className="form-group">
                    <label htmlFor="specialization">Specialization</label>
                    <input 
                      type="text" 
                      id="specialization"
                      value={profileForm.doctor_profile.specialization}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        doctor_profile: { ...profileForm.doctor_profile, specialization: e.target.value }
                      })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="consultation_fee">Consultation Fee (INR)</label>
                    <input 
                      type="number" 
                      id="consultation_fee"
                      value={profileForm.doctor_profile.consultation_fee}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        doctor_profile: { ...profileForm.doctor_profile, consultation_fee: parseFloat(e.target.value) }
                      })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="experience_years">Experience (Years)</label>
                    <input 
                      type="number" 
                      id="experience_years"
                      value={profileForm.doctor_profile.experience_years}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        doctor_profile: { ...profileForm.doctor_profile, experience_years: parseInt(e.target.value) }
                      })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="availability_hours">Availability Hours</label>
                    <input 
                      type="text" 
                      id="availability_hours"
                      value={profileForm.doctor_profile.availability_hours}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        doctor_profile: { ...profileForm.doctor_profile, availability_hours: e.target.value }
                      })}
                      placeholder="e.g. 9 AM - 5 PM"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label htmlFor="address">Clinic / Hospital Address</label>
                  <textarea 
                    id="address"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bio">Professional Bio</label>
                  <textarea 
                    id="bio"
                    placeholder="Short biography about your background, training, and achievements..."
                    value={profileForm.doctor_profile.bio}
                    onChange={(e) => setProfileForm({
                      ...profileForm,
                      doctor_profile: { ...profileForm.doctor_profile, bio: e.target.value }
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

        {/* Patient Details Modal */}
        {activePatient && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px' }}>
              <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', color: 'var(--primary)' }}>
                Patient Medical File
              </h3>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Full Name</span>
                  <span className="detail-value">{activePatient.first_name} {activePatient.last_name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Contact Email</span>
                  <span className="detail-value">{activePatient.email}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">{activePatient.phone_number || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Date of Birth</span>
                  <span className="detail-value">{activePatient.date_of_birth || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Blood Group</span>
                  <span className="detail-value" style={{ color: 'var(--danger)', fontWeight: 'bold' }}>
                    {activePatient.patient_profile?.blood_group || 'N/A'}
                  </span>
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <span className="detail-label" style={{ display: 'block', marginBottom: '0.25rem' }}>Medical Records & History</span>
                <p style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', whiteSpace: 'pre-wrap' }}>
                  {activePatient.patient_profile?.medical_history || 'No records provided.'}
                </p>
              </div>
              <div className="modal-actions">
                <button onClick={() => setActivePatient(null)} className="btn btn-secondary">Close File</button>
              </div>
            </div>
          </div>
        )}

        {/* Complete Appointment Status Modal */}
        {showStatusModal && selectedAppt && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Complete Patient Session</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Add prescription, advice, or summary notes for <strong>{selectedAppt.patient_details?.first_name} {selectedAppt.patient_details?.last_name}</strong>.
              </p>
              <div className="form-group">
                <label htmlFor="prescription">Doctor Notes / Prescription</label>
                <textarea 
                  id="prescription" 
                  rows={5}
                  value={prescriptionNotes}
                  onChange={(e) => setPrescriptionNotes(e.target.value)}
                  placeholder="e.g. Paracetamol 500mg twice a day. Take rest for 3 days."
                  required
                />
              </div>
              <div className="modal-actions">
                <button onClick={() => {
                  setShowStatusModal(false);
                  setSelectedAppt(null);
                  setPrescriptionNotes('');
                }} className="btn btn-secondary">
                  Cancel
                </button>
                <button 
                  onClick={() => handleUpdateStatus(selectedAppt.id, 'COMPLETED', prescriptionNotes)} 
                  className="btn" 
                  style={{ background: 'var(--success)', color: '#000' }}
                >
                  Mark Completed ✅
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default DoctorDashboard;
