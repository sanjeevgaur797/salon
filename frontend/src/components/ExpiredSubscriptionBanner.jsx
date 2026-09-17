import React from 'react';
import { AlertCircle, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ExpiredSubscriptionBanner = () => {
  const { subscriptionError, salon, user } = useAuth();

  const isExpired = subscriptionError || (salon && salon.subscriptionStatus === 'EXPIRED');

  if (!isExpired || (user && user.role === 'SUPER_ADMIN')) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.4) 100%)',
      border: '1px solid rgba(239, 68, 68, 0.5)',
      borderRadius: '12px',
      padding: '16px 20px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      color: '#fca5a5'
    }}>
      <div style={{
        background: 'rgba(239, 68, 68, 0.2)',
        padding: '10px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Lock size={24} color="#ef4444" />
      </div>
      <div>
        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>SUBSCRIPTION EXPIRED</span>
          <span style={{ fontSize: '0.75rem', background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px' }}>HTTP 403 ENFORCED</span>
        </h4>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#fca5a5' }}>
          {subscriptionError?.message || 'Your salon subscription has expired. Server-side RBAC and subscription gating are currently blocking write actions. Please contact your Super Admin to renew your plan.'}
        </p>
      </div>
    </div>
  );
};

export default ExpiredSubscriptionBanner;
