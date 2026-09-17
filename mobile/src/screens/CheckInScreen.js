import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import mobileApi from '../api';

export default function CheckInScreen({ salon, onBack }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isError, setIsError] = useState(false);

  const performCheckIn = async (coords) => {
    setLoading(true);
    setResult(null);
    setIsError(false);

    try {
      const res = await mobileApi.post('/attendance/check-in', coords);
      setResult(res.data.message + ` (Distance: ${res.data.attendance.distanceMeters}m)`);
      setIsError(false);
    } catch (err) {
      setIsError(true);
      if (err.response && err.response.data) {
        setResult(err.response.data.message || err.response.data.error);
      } else {
        setResult('Check-in failed. Check device location or backend server.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceCheckIn = async () => {
    setLoading(true);
    setResult(null);
    setIsError(false);

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsError(true);
        setResult('Location permission denied. Please grant location access to check-in.');
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      performCheckIn({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
    } catch (err) {
      setIsError(true);
      setResult(`Location Error: ${err.message}. Try selecting a test preset below.`);
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backBtnText}>← Back to Dashboard</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Location Check-In</Text>
      <Text style={styles.subtitle}>
        Server-side Haversine Geo-Fencing Protection
      </Text>

      <View style={styles.salonBox}>
        <Text style={styles.salonName}>{salon?.name || 'Salon Location'}</Text>
        <Text style={styles.salonGeo}>
          Coords: ({salon?.latitude || 28.6139}, {salon?.longitude || 77.2090})
        </Text>
        <Text style={styles.radiusText}>
          Allowed Radius: <Text style={{ color: '#06b6d4', fontWeight: 'bold' }}>{salon?.allowedRadius || 100} meters</Text>
        </Text>
      </View>

      <TouchableOpacity
        style={styles.checkInBtn}
        disabled={loading}
        onPress={handleDeviceCheckIn}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.checkInBtnText}>📍 Check-In with Device Location</Text>
        )}
      </TouchableOpacity>

      {/* Preset Test Buttons for Emulator Evaluation */}
      <Text style={styles.presetTitle}>TEST GEO-FENCE PRESETS</Text>
      <View style={styles.presetRow}>
        <TouchableOpacity
          style={styles.presetInBtn}
          disabled={loading}
          onPress={() => performCheckIn({
            latitude: (salon?.latitude || 28.6139) + 0.0001,
            longitude: (salon?.longitude || 77.2090) + 0.0001
          })}
        >
          <Text style={styles.presetInText}>✓ Test In-Range (≤ {salon?.allowedRadius || 100}m)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.presetOutBtn}
          disabled={loading}
          onPress={() => performCheckIn({
            latitude: (salon?.latitude || 28.6139) + 0.05,
            longitude: (salon?.longitude || 77.2090) + 0.05
          })}
        >
          <Text style={styles.presetOutText}>✗ Test Out-of-Range (&gt; {salon?.allowedRadius || 100}m)</Text>
        </TouchableOpacity>
      </View>

      {result ? (
        <View style={[styles.resultCard, { backgroundColor: isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', borderColor: isError ? '#ef4444' : '#10b981' }]}>
          <Text style={[styles.resultText, { color: isError ? '#fca5a5' : '#6ee7b7' }]}>
            {result}
          </Text>
        </View>
      ) : null}
    </ScrollView>
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
    marginBottom: 20
  },
  salonBox: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  salonName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4
  },
  salonGeo: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4
  },
  radiusText: {
    fontSize: 13,
    color: '#f8fafc'
  },
  checkInBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24
  },
  checkInBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  presetTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 10
  },
  presetRow: {
    gap: 10,
    marginBottom: 20
  },
  presetInBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center'
  },
  presetInText: {
    color: '#34d399',
    fontWeight: 'bold',
    fontSize: 14
  },
  presetOutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center'
  },
  presetOutText: {
    color: '#fca5a5',
    fontWeight: 'bold',
    fontSize: 14
  },
  resultCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 40
  },
  resultText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center'
  }
});
