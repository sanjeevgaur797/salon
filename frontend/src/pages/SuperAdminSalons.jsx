import React, { useState, useEffect } from 'react';
import { Building, Plus, CreditCard, MapPin, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../api';

const SuperAdminSalons = () => {
  const [salons, setSalons] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal: Assign / Renew / Upgrade Plan
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [planAction, setPlanAction] = useState('RENEW'); // 'ASSIGN' | 'RENEW' | 'UPGRADE'
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [actionError, setActionError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modal: Create Salon
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSalon, setNewSalon] = useState({
    name: '', address: '', latitude: 28.6139, longitude: 77.2090, allowedRadius: 100,
    ownerName: '', ownerEmail: '', ownerPassword: 'password123'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [salonsRes, plansRes] = await Promise.all([
        api.get('/salons'),
        api.get('/plans')
      ]);
      setSalons(salonsRes.data.salons);
      setPlans(plansRes.data.plans);
    } catch (err) {
      console.error('Failed to fetch salons data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    setSubmitting(true);

    try {
      await api.post(`/salons/${selectedSalon._id}/assign-plan`, {
        planId: selectedPlanId,
        action: planAction
      });
      setSelectedSalon(null);
      fetchData();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSalonSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/salons', newSalon);
      setShowCreateModal(false);
      setNewSalon({
        name: '', address: '', latitude: 28.6139, longitude: 77.2090, allowedRadius: 100,
        ownerName: '', ownerEmail: '', ownerPassword: 'password123'
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create salon');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Salon Tenants</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Multi-Tenant Salon Monitoring, Geo-Fencing & Plan Assignment Engine
          </p>
        </div>

        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Plus size={18} /> Register New Salon
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading salon records...</p>
        ) : salons.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No salon tenants registered.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 10px' }}>Salon Name</th>
                <th style={{ padding: '12px 10px' }}>Active Plan</th>
                <th style={{ padding: '12px 10px' }}>Subscription Status</th>
                <th style={{ padding: '12px 10px' }}>Expiration Date</th>
                <th style={{ padding: '12px 10px' }}>Geo Location & Radius</th>
                <th style={{ padding: '12px 10px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {salons.map((salon) => (
                <tr key={salon._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '14px 10px', fontWeight: 600 }}>
                    <div>{salon.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{salon.address || 'No address'}</div>
                  </td>
                  <td style={{ padding: '14px 10px' }}>{salon.currentPlan?.name || 'None'}</td>
                  <td style={{ padding: '14px 10px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: salon.subscriptionStatus === 'ACTIVE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: salon.subscriptionStatus === 'ACTIVE' ? '#34d399' : '#fca5a5'
                    }}>
                      {salon.subscriptionStatus}
                    </span>
                  </td>
                  <td style={{ padding: '14px 10px' }}>
                    {salon.subscriptionEndDate ? new Date(salon.subscriptionEndDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td style={{ padding: '14px 10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    ({salon.latitude}, {salon.longitude}) • Radius: <strong style={{ color: '#06b6d4' }}>{salon.allowedRadius}m</strong>
                  </td>
                  <td style={{ padding: '14px 10px' }}>
                    <button
                      onClick={() => {
                        setSelectedSalon(salon);
                        setSelectedPlanId(salon.currentPlan?._id || (plans[0]?._id || ''));
                      }}
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <CreditCard size={14} /> Assign / Renew Plan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Plan Assignment Modal */}
      {selectedSalon && (
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
          <div className="glass-panel" style={{ maxWidth: '460px', width: '100%', padding: '28px', borderRadius: '20px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '6px' }}>Manage Plan for {selectedSalon.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '18px' }}>
              Creates an immutable SubscriptionHistory log entry upon confirmation.
            </p>

            {actionError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', padding: '10px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.85rem' }}>
                {actionError}
              </div>
            )}

            <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Action Type</label>
                <select
                  value={planAction}
                  onChange={(e) => setPlanAction(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%' }}
                >
                  <option value="RENEW">RENEW (Extend Current / Renew Plan)</option>
                  <option value="ASSIGN">ASSIGN (New Initial Plan Assignment)</option>
                  <option value="UPGRADE">UPGRADE (Upgrade to Higher Tier)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Select Plan</label>
                <select
                  required
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%' }}
                >
                  {plans.map(p => (
                    <option key={p._id} value={p._id}>{p.name} — ${p.price} ({p.durationInDays} days)</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" onClick={() => setSelectedSalon(null)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Updating...' : 'Confirm Subscription Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Salon Modal */}
      {showCreateModal && (
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
          <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '28px', borderRadius: '20px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '16px' }}>Register New Salon</h2>

            <form onSubmit={handleCreateSalonSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Salon Name</label>
                <input
                  type="text"
                  required
                  value={newSalon.name}
                  onChange={(e) => setNewSalon({ ...newSalon, name: e.target.value })}
                  placeholder="e.g. Royal Crown Salon"
                  className="glass-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Latitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newSalon.latitude}
                    onChange={(e) => setNewSalon({ ...newSalon, latitude: e.target.value })}
                    className="glass-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Longitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newSalon.longitude}
                    onChange={(e) => setNewSalon({ ...newSalon, longitude: e.target.value })}
                    className="glass-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Radius (m)</label>
                  <input
                    type="number"
                    required
                    value={newSalon.allowedRadius}
                    onChange={(e) => setNewSalon({ ...newSalon, allowedRadius: e.target.value })}
                    className="glass-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Salon Owner Credentials</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    type="text"
                    required
                    value={newSalon.ownerName}
                    onChange={(e) => setNewSalon({ ...newSalon, ownerName: e.target.value })}
                    placeholder="Owner Name"
                    className="glass-input"
                  />
                  <input
                    type="email"
                    required
                    value={newSalon.ownerEmail}
                    onChange={(e) => setNewSalon({ ...newSalon, ownerEmail: e.target.value })}
                    placeholder="Owner Email"
                    className="glass-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '14px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Creating...' : 'Register Salon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminSalons;
