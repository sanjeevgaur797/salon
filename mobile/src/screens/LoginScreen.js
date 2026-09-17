import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import mobileApi, { setAuthToken } from '../api';

export default function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (userEmail, userPass) => {
    const e = userEmail || email;
    const p = userPass || password;

    if (!e || !p) {
      setErrorMsg('Please enter email and password');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await mobileApi.post('/auth/login', { email: e, password: p });
      const { token, user, salon } = res.data;
      setAuthToken(token);
      onLoginSuccess({ user, salon, token });
    } catch (err) {
      if (err.response && err.response.data) {
        setErrorMsg(err.response.data.message || 'Login failed');
      } else {
        setErrorMsg('Cannot connect to backend API server at http://localhost:5000');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Salon CRM Mobile</Text>
        <Text style={styles.subtitle}>Staff Check-In & Appointments Portal</Text>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="staff@glamour.com"
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#64748b"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.button}
          disabled={loading}
          onPress={() => handleLogin()}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.demoTitle}>QUICK DEMO CREDENTIALS</Text>
        <View style={styles.demoRow}>
          <TouchableOpacity
            style={styles.demoBtn}
            onPress={() => { setEmail('staff@glamour.com'); setPassword('password123'); handleLogin('staff@glamour.com', 'password123'); }}
          >
            <Text style={styles.demoBtnText}>💈 Staff</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoBtn}
            onPress={() => { setEmail('receptionist@glamour.com'); setPassword('password123'); handleLogin('receptionist@glamour.com', 'password123'); }}
          >
            <Text style={styles.demoBtnText}>📋 Receptionist</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoBtn}
            onPress={() => { setEmail('owner@glamour.com'); setPassword('password123'); handleLogin('owner@glamour.com', 'password123'); }}
          >
            <Text style={styles.demoBtnText}>💼 Owner</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    textAlign: 'center'
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 6
  },
  input: {
    backgroundColor: '#0f172a',
    borderColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 15,
    marginBottom: 16
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 20
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 10
  },
  demoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  demoBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 8,
    marginHorizontal: 3,
    borderRadius: 8,
    alignItems: 'center'
  },
  demoBtnText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600'
  }
});
