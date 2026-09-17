import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import mobileApi from '../api';

export default function TodayAppointmentsScreen({ onBack }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTodayAppointments = async () => {
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await mobileApi.get('/appointments', { params: { date: todayStr } });
      setAppointments(res.data.appointments || []);
    } catch (err) {
      console.error('Mobile fetch today appointments error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayAppointments();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.timeText}>{item.startTime} - {item.endTime}</Text>
        <View style={[styles.badge, { backgroundColor: item.status === 'CONFIRMED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)' }]}>
          <Text style={[styles.badgeText, { color: item.status === 'CONFIRMED' ? '#34d399' : '#fbbf24' }]}>{item.status}</Text>
        </View>
      </View>

      <Text style={styles.clientName}>{item.client?.name || 'Walk-in Client'}</Text>
      <Text style={styles.serviceText}>Service: {item.service?.name} ({item.service?.durationMinutes}m)</Text>
      <Text style={styles.staffText}>Staff: {item.staff?.name}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backBtnText}>← Back to Dashboard</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Today's Appointments</Text>
      <Text style={styles.subtitle}>Read-only appointment schedule</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
      ) : appointments.length === 0 ? (
        <Text style={styles.emptyText}>No appointments scheduled for today.</Text>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 20
  },
  backBtn: {
    marginTop: 40,
    marginBottom: 16
  },
  backBtnText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: 'bold'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    marginBottom: 16
  },
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  timeText: {
    color: '#22d3ee',
    fontWeight: 'bold',
    fontSize: 15
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold'
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4
  },
  serviceText: {
    fontSize: 13,
    color: '#cbd5e1',
    marginBottom: 2
  },
  staffText: {
    fontSize: 12,
    color: '#94a3b8'
  },
  emptyText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15
  }
});
