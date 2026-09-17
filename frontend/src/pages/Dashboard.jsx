import React, { useState, useEffect } from 'react';
import { Calendar, Users, Scissors, CreditCard, Clock, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import AttendanceCheckInWidget from '../components/AttendanceCheckInWidget';
import ExpiredSubscriptionBanner from '../components/ExpiredSubscriptionBanner';

const Dashboard = () => {
  const { user, salon } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      if (user?.role === 'SUPER_ADMIN') {
        const [salonsRes, plansRes] = await Promise.all([
          api.get('/salons'),
          api.get('/plans')
        ]);
        setStats({
          totalSalons: salonsRes.data.salons.length,
          totalPlans: plansRes.data.plans.length,
          activeSubscriptions: salonsRes.data.salons.filter(s => s.subscriptionStatus === 'ACTIVE').length
        });
      } else {
        const res = await api.get('/dashboard');
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading dashboard metrics...</div>;
  }

  if (user?.role === 'SUPER_ADMIN') {
    return (
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '8px' }}>Super Admin Overview</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>System-wide multi-tenant subscription monitoring</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '28px' }}>
          <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>TOTAL SALONS</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '8px' }}>{stats?.totalSalons || 0}</div>
          </div>
          <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--success)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>ACTIVE SUBSCRIPTIONS</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '8px', color: '#34d399' }}>{stats?.activeSubscriptions || 0}</div>
          </div>
          <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--accent)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>TOTAL SUBSCRIPTION PLANS</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '8px', color: '#22d3ee' }}>{stats?.totalPlans || 0}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ExpiredSubscriptionBanner />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Welcome back, {user?.name}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {salon?.name} • Operating Hours: 09:00 - 20:00
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.82rem',
            fontWeight: 700,
            background: stats?.salon?.subscriptionStatus === 'ACTIVE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: stats?.salon?.subscriptionStatus === 'ACTIVE' ? '#34d399' : '#fca5a5',
            border: `1px solid ${stats?.salon?.subscriptionStatus === 'ACTIVE' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
          }}>
            PLAN: {stats?.salon?.currentPlan?.name || 'No Plan'} ({stats?.salon?.subscriptionStatus || 'NONE'})
          </span>
        </div>
      </div>

      {/* Quick Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #6366f1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>TODAY'S APPOINTMENTS</span>
            <Calendar size={20} color="#6366f1" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, marginTop: '10px' }}>{stats?.todayCount || 0}</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #06b6d4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL CLIENTS</span>
            <Users size={20} color="#06b6d4" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, marginTop: '10px' }}>{stats?.totalClients || 0}</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>ACTIVE STAFF</span>
            <Scissors size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, marginTop: '10px' }}>{stats?.totalStaff || 0}</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #a855f7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>SERVICE MENU</span>
            <CreditCard size={20} color="#a855f7" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, marginTop: '10px' }}>{stats?.totalServices || 0}</div>
        </div>
      </div>

      {/* Attendance Check-in Widget */}
      <AttendanceCheckInWidget />

      {/* Today's Appointments Section */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="#6366f1" /> Today's Scheduled Appointments
        </h3>

        {!stats?.recentAppointments || stats.recentAppointments.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>No appointments scheduled for today yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px' }}>Time Slot</th>
                <th style={{ padding: '10px' }}>Client</th>
                <th style={{ padding: '10px' }}>Service</th>
                <th style={{ padding: '10px' }}>Assigned Staff</th>
                <th style={{ padding: '10px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentAppointments.map((appt) => (
                <tr key={appt._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 10px', fontWeight: 600, color: '#22d3ee' }}>
                    {appt.startTime} - {appt.endTime}
                  </td>
                  <td style={{ padding: '12px 10px' }}>{appt.client?.name || 'Walk-in'}</td>
                  <td style={{ padding: '12px 10px' }}>{appt.service?.name} ({appt.service?.durationMinutes}m)</td>
                  <td style={{ padding: '12px 10px' }}>{appt.staff?.name}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: appt.status === 'CONFIRMED' ? 'rgba(16, 185, 129, 0.2)' : appt.status === 'CANCELLED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: appt.status === 'CONFIRMED' ? '#34d399' : appt.status === 'CANCELLED' ? '#fca5a5' : '#fbbf24'
                    }}>
                      {appt.status}
                    </span>
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

export default Dashboard;
