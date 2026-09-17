import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Clients from './pages/Clients';
import SubscriptionStatus from './pages/SubscriptionStatus';
import SuperAdminPlans from './pages/SuperAdminPlans';
import SuperAdminSalons from './pages/SuperAdminSalons';
import SuperAdminHistory from './pages/SuperAdminHistory';

const App = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Loading Salon CRM System...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'appointments':
        return <Appointments />;
      case 'clients':
        return <Clients />;
      case 'subscription':
        return <SubscriptionStatus />;
      case 'plans':
        return <SuperAdminPlans />;
      case 'salons':
        return <SuperAdminSalons />;
      case 'history':
        return <SuperAdminHistory />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main style={{ flex: 1, padding: '28px', maxWidth: '1400px' }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
