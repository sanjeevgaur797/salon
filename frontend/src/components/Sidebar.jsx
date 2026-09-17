import React from 'react';
import { LayoutDashboard, Calendar, Users, CreditCard, ShieldCheck, Building, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const role = user?.role;

  const getNavItems = () => {
    if (role === 'SUPER_ADMIN') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'plans', label: 'Plan Management', icon: ShieldCheck },
        { id: 'salons', label: 'Salon Tenants', icon: Building },
        { id: 'history', label: 'Subscription Audit', icon: History }
      ];
    }

    if (role === 'SALON_OWNER') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'appointments', label: 'Appointments', icon: Calendar },
        { id: 'clients', label: 'Clients Directory', icon: Users },
        { id: 'subscription', label: 'Subscription Plan', icon: CreditCard }
      ];
    }

    // RECEPTIONIST & STAFF
    return [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'appointments', label: 'Appointments', icon: Calendar },
      { id: 'clients', label: 'Clients Directory', icon: Users }
    ];
  };

  const items = getNavItems();

  return (
    <aside className="glass-panel" style={{
      width: '240px',
      borderRadius: 0,
      borderTop: 0,
      borderLeft: 0,
      borderBottom: 0,
      padding: '24px 16px',
      minHeight: 'calc(100vh - 67px)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <div style={{ padding: '0 12px 12px 12px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
        MAIN NAVIGATION
      </div>

      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              border: 'none',
              background: isActive ? 'var(--primary-gradient)' : 'transparent',
              color: isActive ? 'white' : 'var(--text-muted)',
              fontWeight: isActive ? 600 : 400,
              fontSize: '0.92rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
          >
            <Icon size={18} color={isActive ? 'white' : 'var(--text-muted)'} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </aside>
  );
};

export default Sidebar;
