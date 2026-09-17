import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, CheckCircle2, AlertOctagon, History, ShieldCheck } from 'lucide-react';
import api from '../api';
import ExpiredSubscriptionBanner from '../components/ExpiredSubscriptionBanner';

const SubscriptionStatus = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const res = await api.get('/salons/subscription-status');
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch subscription status:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-muted)' }}>Loading subscription status...</div>;
  }

  const isExpired = data?.isExpired || data?.subscriptionStatus === 'EXPIRED';

  return (
    <div>
      <ExpiredSubscriptionBanner />

      <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '8px' }}>Salon Subscription Status</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
        Current Plan Gating & Renewal Details for {data?.salonName}
      </p>

      {/* Main Plan Status Card */}
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '28px', borderLeft: `6px solid ${isExpired ? '#ef4444' : '#10b981'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>CURRENT ACTIVE PLAN</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: '6px 0', color: isExpired ? '#fca5a5' : '#34d399' }}>
              {data?.currentPlan?.name || 'No Plan Assigned'}
            </h2>
            <p style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f8fafc' }}>
              ${data?.currentPlan?.price} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ {data?.currentPlan?.durationInDays} days</span>
            </p>
          </div>

          <div>
            <span style={{
              padding: '8px 18px',
              borderRadius: '24px',
              fontSize: '0.9rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: isExpired ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              color: isExpired ? '#fca5a5' : '#34d399',
              border: `1px solid ${isExpired ? 'rgba(239, 68, 68, 0.5)' : 'rgba(16, 185, 129, 0.5)'}`
            }}>
              {isExpired ? <AlertOctagon size={18} /> : <CheckCircle2 size={18} />}
              SUBSCRIPTION STATUS: {isExpired ? 'EXPIRED' : 'ACTIVE'}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Subscription Start Date</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, marginTop: '4px' }}>
              {data?.subscriptionStartDate ? new Date(data.subscriptionStartDate).toLocaleDateString() : 'N/A'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Subscription Expiration Date</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, marginTop: '4px', color: isExpired ? '#ef4444' : '#22d3ee' }}>
              {data?.subscriptionEndDate ? new Date(data.subscriptionEndDate).toLocaleDateString() : 'N/A'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Max Staff Capacity</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, marginTop: '4px' }}>
              {data?.currentPlan?.maxStaff || 'N/A'} staff members
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Max Monthly Appointments</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, marginTop: '4px' }}>
              {data?.currentPlan?.maxAppointments || 'N/A'} appointments
            </div>
          </div>
        </div>
      </div>

      {/* Subscription History Logs for this Tenant */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={18} color="#6366f1" /> Subscription History Log
        </h3>

        {!data?.history || data.history.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No subscription history recorded yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px' }}>Action</th>
                <th style={{ padding: '10px' }}>Plan</th>
                <th style={{ padding: '10px' }}>Price</th>
                <th style={{ padding: '10px' }}>Start Date</th>
                <th style={{ padding: '10px' }}>End Date</th>
                <th style={{ padding: '10px' }}>Logged At</th>
              </tr>
            </thead>
            <tbody>
              {data.history.map((item) => (
                <tr key={item._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: item.action === 'ASSIGN' ? 'rgba(99, 102, 241, 0.2)' : item.action === 'RENEW' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                      color: item.action === 'ASSIGN' ? '#818cf8' : item.action === 'RENEW' ? '#34d399' : '#c084fc'
                    }}>
                      {item.action}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', fontWeight: 600 }}>{item.planId?.name || 'Plan'}</td>
                  <td style={{ padding: '12px 10px', color: '#22d3ee' }}>${item.price}</td>
                  <td style={{ padding: '12px 10px' }}>{new Date(item.startDate).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 10px' }}>{new Date(item.endDate).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SubscriptionStatus;
