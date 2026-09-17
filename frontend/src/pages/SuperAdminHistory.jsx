import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, Building } from 'lucide-react';
import api from '../api';

const SuperAdminHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/subscriptions/history');
      setHistory(res.data.history);
    } catch (err) {
      console.error('Failed to fetch subscription history:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Subscription History Audit Log</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Complete historical audit trail of all plan assignments, renewals, and upgrades
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading audit history log...</p>
        ) : history.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No subscription history recorded yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 10px' }}>Salon Name</th>
                <th style={{ padding: '12px 10px' }}>Plan Name</th>
                <th style={{ padding: '12px 10px' }}>Price</th>
                <th style={{ padding: '12px 10px' }}>Action</th>
                <th style={{ padding: '12px 10px' }}>Start Date</th>
                <th style={{ padding: '12px 10px' }}>End Date</th>
                <th style={{ padding: '12px 10px' }}>Logged At</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '14px 10px', fontWeight: 600 }}>{item.salonId?.name || 'Salon'}</td>
                  <td style={{ padding: '14px 10px' }}>{item.planId?.name || 'Plan'}</td>
                  <td style={{ padding: '14px 10px', color: '#22d3ee', fontWeight: 600 }}>${item.price}</td>
                  <td style={{ padding: '14px 10px' }}>
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
                  <td style={{ padding: '14px 10px' }}>{new Date(item.startDate).toLocaleDateString()}</td>
                  <td style={{ padding: '14px 10px' }}>{new Date(item.endDate).toLocaleDateString()}</td>
                  <td style={{ padding: '14px 10px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
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

export default SuperAdminHistory;
