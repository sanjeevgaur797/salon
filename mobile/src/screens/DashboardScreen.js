import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import mobileApi from '../api';

export default function DashboardScreen({ user, salon, onNavigate, onLogout }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const res = await mobileApi.get('/dashboard');
      setStats(res.data);
    } catch (err) {
      console.error('Mobile fetch dashboard stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDashboardStats} tintColor="#6366f1" />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Hello, {user?.name}</Text>
          <Text style={styles.salonText}>{salon?.name || 'Salon Mobile App'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Subscription Status Card */}
      <View style={[styles.card, { borderLeftColor: stats?.salon?.subscriptionStatus === 'ACTIVE' ? '#10b981' : '#ef4444', borderLeftWidth: 4 }]}>
        <Text style={styles.cardLabel}>SUBSCRIPTION STATUS</Text>
        <View style={styles.badgeRow}>
          <Text style={styles.planName}>{stats?.salon?.currentPlan?.name || 'No Plan'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: stats?.salon?.subscriptionStatus === 'ACTIVE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }]}>
            <Text style={[styles.statusBadgeText, { color: stats?.salon?.subscriptionStatus === 'ACTIVE' ? '#34d399' : '#fca5a5' }]}>
              {stats?.salon?.subscriptionStatus || 'NONE'}
            </Text>
          </View>
        </View>
      </View>

      {/* Attendance Status Card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>TODAY'S ATTENDANCE STATUS</Text>
        <View style={styles.badgeRow}>
          <Text style={styles.attendanceStateText}>
            {stats?.isCheckedIn ? 'Checked-In Today' : 'Not Checked-In Yet'}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: stats?.isCheckedIn ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)' }]}>
            <Text style={[styles.statusBadgeText, { color: stats?.isCheckedIn ? '#34d399' : '#fbbf24' }]}>
              {stats?.isCheckedIn ? 'CHECKED IN' : 'PENDING'}
            </Text>
          </View>
        </View>
        {stats?.checkInTime ? (
          <Text style={styles.timeSubtext}>Timestamp: {new Date(stats.checkInTime).toLocaleTimeString()}</Text>
        ) : null}
      </View>

      {/* Today's Appointments Count Card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>TODAY'S APPOINTMENTS</Text>
        <Text style={styles.countText}>{stats?.todayCount || 0}</Text>
        <Text style={styles.subtext}>Appointments scheduled for today</Text>
      </View>

      {/* Quick Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.actionBtnPrimary}
          onPress={() => onNavigate('CHECK_IN')}
        >
          <Text style={styles.actionBtnText}>📍 Geo-Fenced Location Check-In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtnSecondary}
          onPress={() => onNavigate('TODAY_APPOINTMENTS')}
        >
          <Text style={styles.actionBtnTextSecondary}>📅 View Today's Appointments</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  salonText: {
    fontSize: 13,
    color: '#94a3b8'
  },
  logoutBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: 'bold'
  },
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 8
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  attendanceStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc'
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold'
  },
  timeSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 6
  },
  countText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#6366f1',
    marginVertical: 4
  },
  subtext: {
    fontSize: 12,
    color: '#94a3b8'
  },
  actionSection: {
    marginTop: 10,
    marginBottom: 40,
    gap: 12
  },
  actionBtnPrimary: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center'
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold'
  },
  actionBtnSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)'
  },
  actionBtnTextSecondary: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600'
  }
});
