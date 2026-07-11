import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  // Create Doctor Form State
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [doctorForm, setDoctorForm] = useState({
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    date_of_birth: '',
    address: '',
    specialization: 'General Physician',
    consultation_fee: 500,
    experience_years: 0
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const statsRes = await API.get('admin/stats/');
      setStats(statsRes.data);

      const docsRes = await API.get('doctors/');
      setDoctors(docsRes.data);

      const patientsRes = await API.get('patients/');
      setPatients(patientsRes.data);

      const apptsRes = await API.get('appointments/');
      setAppointments(apptsRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch administrative data from the server.');
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

  // Manage Doctors
  const handleAddDoctorSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await API.post('auth/register/', {
        ...doctorForm,
        role: 'doctor'
      });
      setSuccess(`Doctor ${doctorForm.first_name} registered successfully.`);
      setShowAddDoctor(false);
      setDoctorForm({
        username: '', password: '', email: '', first_name: '', last_name: '',
        phone_number: '', date_of_birth: '', address: '',
        specialization: 'General Physician', consultation_fee: 500, experience_years: 0
      });
      fetchAdminData(); // Refresh all datasets
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.username?.[0] || 'Failed to add doctor account.');
    }
  };

  const handleDeleteUser = async (role, id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${role} account: ${name}?`)) return;
    setError('');
    setSuccess('');
    try {
      const endpoint = role === 'doctor' ? `doctors/${id}/` : `patients/${id}/`;
      await API.delete(endpoint);
      setSuccess(`${role.charAt(0).toUpperCase() + role.slice(1)} account deleted.`);
      fetchAdminData();
    } catch (err) {
      console.error(err);
      setError('Failed to delete account. Users with existing appointments cannot be deleted.');
    }
  };

  // Manage Appointments
  const handleCancelAppointment = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    setError('');
    setSuccess('');
    try {
      await API.patch(`appointments/${id}/`, { status: 'CANCELLED' });
      setSuccess('Appointment cancelled.');
      fetchAdminData();
    } catch (err) {
      console.error(err);
      setError('Failed to cancel appointment.');
    }
  };

  const currentUser = JSON.parse(localStorage.getItem('user'));

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--primary)', fontSize: '1.5rem' }}>
        Loading Admin Terminal...
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
              <Link to="/admin" className={`sidebar-link ${location.pathname === '/admin' ? 'active' : ''}`}>
                📊 System Statistics
              </Link>
            </li>
            <li>
              <Link to="/admin/doctors" className={`sidebar-link ${location.pathname === '/admin/doctors' ? 'active' : ''}`}>
                🥼 Manage Doctors
              </Link>
            </li>
            <li>
              <Link to="/admin/patients" className={`sidebar-link ${location.pathname === '/admin/patients' ? 'active' : ''}`}>
                🤕 Manage Patients
              </Link>
            </li>
            <li>
              <Link to="/admin/appointments" className={`sidebar-link ${location.pathname === '/admin/appointments' ? 'active' : ''}`}>
                🗓️ All Appointments
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
            <h1>Admin Control Panel</h1>
            <p style={{ color: 'var(--text-muted)' }}>Logged in as System Admin</p>
          </div>
          <div className="user-badge">
            <span>{currentUser?.email}</span>
            <span className="role-indicator" style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)' }}>Admin</span>
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
                  <span className="stat-num">{stats?.total_patients}</span>
                  <span className="stat-label">Total Patients</span>
                </div>
                <div className="stat-card">
                  <span className="stat-num">{stats?.total_doctors}</span>
                  <span className="stat-label">Registered Doctors</span>
                </div>
                <div className="stat-card">
                  <span className="stat-num">{stats?.total_appointments}</span>
                  <span className="stat-label">Total Appointments</span>
                </div>
              </div>

              <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Appointments Status Distribution</h2>
              <div className="grid-stats">
                <div className="stat-card" style={{ borderLeft: '4px solid var(--warning)' }}>
                  <span className="stat-num" style={{ color: 'var(--warning)' }}>{stats?.status_stats?.PENDING}</span>
                  <span className="stat-label">Pending</span>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
                  <span className="stat-num" style={{ color: 'var(--primary)' }}>{stats?.status_stats?.CONFIRMED}</span>
                  <span className="stat-label">Confirmed</span>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
                  <span className="stat-num" style={{ color: 'var(--success)' }}>{stats?.status_stats?.COMPLETED}</span>
                  <span className="stat-label">Completed</span>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--danger)' }}>
                  <span className="stat-num" style={{ color: 'var(--danger)' }}>{stats?.status_stats?.CANCELLED}</span>
                  <span className="stat-label">Cancelled</span>
                </div>
              </div>
            </div>
          } />

          {/* Manage Doctors */}
          <Route path="/doctors" element={
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>Registered Doctors ({doctors.length})</h2>
                <button onClick={() => setShowAddDoctor(true)} className="btn">
                  ➕ Add New Doctor
                </button>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Doctor</th>
                      <th>Specialty</th>
                      <th>Fee</th>
                      <th>Phone</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map(doc => (
                      <tr key={doc.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-white)' }}>
                          Dr. {doc.first_name} {doc.last_name}
                          <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                            @{doc.username}
                          </span>
                        </td>
                        <td>{doc.doctor_profile?.specialization}</td>
                        <td>₹{doc.doctor_profile?.consultation_fee}</td>
                        <td>{doc.phone_number || 'N/A'}</td>
                        <td>
                          <button 
                            onClick={() => handleDeleteUser('doctor', doc.id, `Dr. ${doc.first_name} ${doc.last_name}`)} 
                            className="btn btn-danger"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Doctor Modal */}
              {showAddDoctor && (
                <div className="modal-overlay">
                  <div className="modal-content" style={{ maxWidth: '650px' }}>
                    <h3>Add Doctor Account</h3>
                    <form onSubmit={handleAddDoctorSubmit}>
                      <div className="details-grid">
                        <div className="form-group">
                          <label htmlFor="username">Username</label>
                          <input 
                            type="text" 
                            id="username"
                            value={doctorForm.username} 
                            onChange={(e) => setDoctorForm({ ...doctorForm, username: e.target.value })}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="password">Password</label>
                          <input 
                            type="password" 
                            id="password"
                            value={doctorForm.password} 
                            onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="email">Email</label>
                          <input 
                            type="email" 
                            id="email"
                            value={doctorForm.email} 
                            onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="first_name">First Name</label>
                          <input 
                            type="text" 
                            id="first_name"
                            value={doctorForm.first_name} 
                            onChange={(e) => setDoctorForm({ ...doctorForm, first_name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="last_name">Last Name</label>
                          <input 
                            type="text" 
                            id="last_name"
                            value={doctorForm.last_name} 
                            onChange={(e) => setDoctorForm({ ...doctorForm, last_name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="phone_number">Phone</label>
                          <input 
                            type="text" 
                            id="phone_number"
                            value={doctorForm.phone_number} 
                            onChange={(e) => setDoctorForm({ ...doctorForm, phone_number: e.target.value })}
                          />
                        </div>
                      </div>

                      <fieldset style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', marginTop: '1rem' }}>
                        <legend style={{ color: 'var(--primary)', padding: '0 0.5rem', fontWeight: 600 }}>Professional Details</legend>
                        <div className="details-grid">
                          <div className="form-group">
                            <label htmlFor="specialization">Specialization</label>
                            <input 
                              type="text" 
                              id="specialization"
                              value={doctorForm.specialization} 
                              onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="consultation_fee">Consultation Fee</label>
                            <input 
                              type="number" 
                              id="consultation_fee"
                              value={doctorForm.consultation_fee} 
                              onChange={(e) => setDoctorForm({ ...doctorForm, consultation_fee: parseInt(e.target.value) })}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="experience_years">Experience (Years)</label>
                            <input 
                              type="number" 
                              id="experience_years"
                              value={doctorForm.experience_years} 
                              onChange={(e) => setDoctorForm({ ...doctorForm, experience_years: parseInt(e.target.value) })}
                              required
                            />
                          </div>
                        </div>
                      </fieldset>

                      <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                        <button type="button" onClick={() => setShowAddDoctor(false)} className="btn btn-secondary">
                          Cancel
                        </button>
                        <button type="submit" className="btn">
                          Register Doctor
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          } />

          {/* Manage Patients */}
          <Route path="/patients" element={
            <div>
              <h2>Registered Patients ({patients.length})</h2>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Email</th>
                      <th>Blood Group</th>
                      <th>Phone</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-white)' }}>
                          {p.first_name} {p.last_name}
                          <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                            @{p.username}
                          </span>
                        </td>
                        <td>{p.email}</td>
                        <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{p.patient_profile?.blood_group || 'N/A'}</td>
                        <td>{p.phone_number || 'N/A'}</td>
                        <td>
                          <button 
                            onClick={() => handleDeleteUser('patient', p.id, `${p.first_name} ${p.last_name}`)} 
                            className="btn btn-danger"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          } />

          {/* All Appointments List */}
          <Route path="/appointments" element={
            <div>
              <h2>Global Appointments Log ({appointments.length})</h2>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Date & Time</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map(appt => (
                      <tr key={appt.id}>
                        <td style={{ fontWeight: 500, color: 'var(--text-white)' }}>
                          {appt.patient_details?.first_name} {appt.patient_details?.last_name}
                        </td>
                        <td style={{ fontWeight: 500 }}>
                          Dr. {appt.doctor_details?.first_name} {appt.doctor_details?.last_name}
                        </td>
                        <td>{appt.appointment_date} @ {appt.appointment_time}</td>
                        <td>
                          <span className={`badge badge-${appt.status.toLowerCase()}`}>{appt.status}</span>
                        </td>
                        <td>
                          {appt.status === 'PENDING' && (
                            <button 
                              onClick={() => handleCancelAppointment(appt.id)} 
                              className="btn btn-danger"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default AdminDashboard;
