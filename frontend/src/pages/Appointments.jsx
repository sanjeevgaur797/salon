import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Filter, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import ExpiredSubscriptionBanner from '../components/ExpiredSubscriptionBanner';

const Appointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState('');

  // Create Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    client: '',
    service: '',
    staff: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '10:30',
    notes: ''
  });
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filterDate, filterStatus]);

  const fetchData = async () => {
    try {
      const params = {};
      if (filterDate) params.date = filterDate;
      if (filterStatus) params.status = filterStatus;

      const [apptsRes, clientsRes, dashboardRes] = await Promise.all([
        api.get('/appointments', { params }),
        api.get('/clients'),
        api.get('/dashboard')
      ]);

      setAppointments(apptsRes.data.appointments);
      setClients(clientsRes.data.clients);
      setServices(dashboardRes.data.serviceList || []);
      setStaffList(dashboardRes.data.staffList || []);
    } catch (err) {
      console.error('Failed to load appointments data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceChange = (serviceId) => {
    const selectedService = services.find(s => s._id === serviceId);
    let newEndTime = formData.endTime;

    if (selectedService && formData.startTime) {
      const [h, m] = formData.startTime.split(':').map(Number);
      const totalMins = h * 60 + m + selectedService.durationMinutes;
      const endH = String(Math.floor(totalMins / 60)).padStart(2, '0');
      const endM = String(totalMins % 60).padStart(2, '0');
      newEndTime = `${endH}:${endM}`;
    }

    setFormData({ ...formData, service: serviceId, endTime: newEndTime });
  };

  const handleStartTimeChange = (timeStr) => {
    const selectedService = services.find(s => s._id === formData.service);
    let newEndTime = formData.endTime;

    if (selectedService && timeStr) {
      const [h, m] = timeStr.split(':').map(Number);
      const totalMins = h * 60 + m + selectedService.durationMinutes;
      const endH = String(Math.floor(totalMins / 60)).padStart(2, '0');
      const endM = String(totalMins % 60).padStart(2, '0');
      newEndTime = `${endH}:${endM}`;
    }

    setFormData({ ...formData, startTime: timeStr, endTime: newEndTime });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);

    try {
      await api.post('/appointments', formData);
      setShowModal(false);
      fetchData();
      // Reset form
      setFormData({
        client: '',
        service: '',
        staff: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '10:30',
        notes: ''
      });
    } catch (err) {
      if (err.response && err.response.data) {
        setModalError(err.response.data.message || 'Failed to create appointment');
      } else {
        setModalError('Network error while booking appointment');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update appointment status');
    }
  };

  return (
    <div>
      <ExpiredSubscriptionBanner />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Appointment Schedule</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Operating Hours: 09:00 - 20:00 • Overlap Conflict Protection Active
          </p>
        </div>

        {['SALON_OWNER', 'RECEPTIONIST'].includes(user?.role) && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            <Plus size={18} /> Book New Appointment
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>FILTERS:</span>
        </div>

        <div>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="glass-input"
            style={{ fontSize: '0.85rem' }}
          />
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="glass-input"
            style={{ fontSize: '0.85rem' }}
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PENDING">PENDING</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        </div>

        <button onClick={() => { setFilterDate(''); setFilterStatus(''); }} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
          Reset Filters
        </button>
      </div>

      {/* Appointments List */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading appointment records...</p>
        ) : appointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <Calendar size={40} style={{ opacity: 0.4, marginBottom: '12px' }} />
            <p style={{ fontSize: '1rem', fontWeight: 500 }}>No appointments found for the selected date/filter.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 10px' }}>Date & Time</th>
                <th style={{ padding: '12px 10px' }}>Client</th>
                <th style={{ padding: '12px 10px' }}>Service</th>
                <th style={{ padding: '12px 10px' }}>Assigned Staff</th>
                <th style={{ padding: '12px 10px' }}>Status</th>
                <th style={{ padding: '12px 10px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => (
                <tr key={appt._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '14px 10px' }}>
                    <div style={{ fontWeight: 600, color: '#22d3ee' }}>{appt.startTime} - {appt.endTime}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{appt.date}</div>
                  </td>
                  <td style={{ padding: '14px 10px' }}>
                    <div style={{ fontWeight: 600 }}>{appt.client?.name || 'Client'}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{appt.client?.phone}</div>
                  </td>
                  <td style={{ padding: '14px 10px' }}>
                    <div>{appt.service?.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{appt.service?.durationMinutes}m • ${appt.service?.price}</div>
                  </td>
                  <td style={{ padding: '14px 10px' }}>
                    <div>{appt.staff?.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{appt.staff?.specialization}</div>
                  </td>
                  <td style={{ padding: '14px 10px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: appt.status === 'CONFIRMED' ? 'rgba(16, 185, 129, 0.2)' : appt.status === 'CANCELLED' ? 'rgba(239, 68, 68, 0.2)' : appt.status === 'COMPLETED' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: appt.status === 'CONFIRMED' ? '#34d399' : appt.status === 'CANCELLED' ? '#fca5a5' : appt.status === 'COMPLETED' ? '#818cf8' : '#fbbf24'
                    }}>
                      {appt.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 10px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {appt.status !== 'COMPLETED' && appt.status !== 'CANCELLED' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(appt._id, 'COMPLETED')}
                            className="btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#10b981' }}
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleStatusChange(appt._id, 'CANCELLED')}
                            className="btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#ef4444' }}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Book Appointment */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '520px', width: '100%', padding: '28px', borderRadius: '20px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '6px' }}>Book Appointment</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Backend enforces working hours (09:00 - 20:00) and prevents staff double-booking.
            </p>

            {modalError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#fca5a5',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '0.88rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertTriangle size={18} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Select Client</label>
                <select
                  required
                  value={formData.client}
                  onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                  className="glass-input"
                  style={{ width: '100%' }}
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map(c => <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Select Service</label>
                <select
                  required
                  value={formData.service}
                  onChange={(e) => handleServiceChange(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%' }}
                >
                  <option value="">-- Choose Service --</option>
                  {services.map(s => <option key={s._id} value={s._id}>{s.name} ({s.durationMinutes} mins - ${s.price})</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Assign Staff</label>
                <select
                  required
                  value={formData.staff}
                  onChange={(e) => setFormData({ ...formData, staff: e.target.value })}
                  className="glass-input"
                  style={{ width: '100%' }}
                >
                  <option value="">-- Choose Staff Member --</option>
                  {staffList.map(st => <option key={st._id} value={st._id}>{st.name} ({st.specialization})</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="glass-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Start Time</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className="glass-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>End Time</label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="glass-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Notes (Optional)</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Special instructions or preferences"
                  className="glass-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? 'Validating Slot...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
