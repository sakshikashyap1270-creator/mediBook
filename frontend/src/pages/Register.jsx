import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'patient',
    phone_number: '',
    date_of_birth: '',
    address: '',
    // Doctor fields
    specialization: 'General Physician',
    consultation_fee: 500,
    experience_years: 0,
    // Patient fields
    blood_group: '',
    medical_history: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Basic Validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      const payload = { ...formData };
      
      // Clean up fields that don't match the selected role
      if (formData.role === 'patient') {
        delete payload.specialization;
        delete payload.consultation_fee;
        delete payload.experience_years;
      } else if (formData.role === 'doctor') {
        delete payload.blood_group;
        delete payload.medical_history;
      } else if (formData.role === 'admin') {
        delete payload.specialization;
        delete payload.consultation_fee;
        delete payload.experience_years;
        delete payload.blood_group;
        delete payload.medical_history;
      }

      await API.post('auth/register/', payload);
      
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      
    } catch (err) {
      console.error(err);
      if (err.response?.data) {
        const errors = err.response.data;
        const firstErrorKey = Object.keys(errors)[0];
        const errorVal = errors[firstErrorKey];
        setError(`${firstErrorKey.toUpperCase()}: ${Array.isArray(errorVal) ? errorVal[0] : errorVal}`);
      } else {
        setError('Something went wrong during registration. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ padding: '3rem 2rem' }}>
      <div className="glass-panel auth-card" style={{ maxWidth: '650px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '2rem' }}>
          Register Account 🩺
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Create an account as a Patient or Doctor to get started
        </p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="details-grid">
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select id="role" value={formData.role} onChange={handleInputChange}>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                placeholder="Unique username"
                value={formData.username}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                placeholder="yourname@domain.com"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Min 6 characters"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="first_name">First Name</label>
              <input
                type="text"
                id="first_name"
                placeholder="First name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="last_name">Last Name</label>
              <input
                type="text"
                id="last_name"
                placeholder="Last name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone_number">Phone Number</label>
              <input
                type="text"
                id="phone_number"
                placeholder="+1 234-567-890"
                value={formData.phone_number}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="date_of_birth">Date of Birth</label>
              <input
                type="date"
                id="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '0.5rem' }}>
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              placeholder="Full address details"
              value={formData.address}
              onChange={handleInputChange}
            />
          </div>

          {/* Doctor Specific Fields */}
          {formData.role === 'doctor' && (
            <fieldset style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
              <legend style={{ color: 'var(--primary)', padding: '0 0.5rem', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.85rem' }}>Doctor Profile Info</legend>
              <div className="details-grid" style={{ marginTop: '0.5rem' }}>
                <div className="form-group">
                  <label htmlFor="specialization">Specialization</label>
                  <input
                    type="text"
                    id="specialization"
                    placeholder="e.g. Cardiologist"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="consultation_fee">Consultation Fee (INR)</label>
                  <input
                    type="number"
                    id="consultation_fee"
                    placeholder="500"
                    value={formData.consultation_fee}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="experience_years">Experience (Years)</label>
                  <input
                    type="number"
                    id="experience_years"
                    placeholder="5"
                    value={formData.experience_years}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </fieldset>
          )}

          {/* Patient Specific Fields */}
          {formData.role === 'patient' && (
            <fieldset style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
              <legend style={{ color: 'var(--primary)', padding: '0 0.5rem', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.85rem' }}>Patient Profile Info</legend>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                <div className="form-group" style={{ maxWidth: '200px' }}>
                  <label htmlFor="blood_group">Blood Group</label>
                  <select id="blood_group" value={formData.blood_group} onChange={handleInputChange}>
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
                <div className="form-group">
                  <label htmlFor="medical_history">Medical History</label>
                  <textarea
                    id="medical_history"
                    placeholder="Chronic illnesses, allergies, past operations..."
                    value={formData.medical_history}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </fieldset>
          )}

          <button 
            type="submit" 
            className="btn" 
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login">Login Here</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
