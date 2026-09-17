import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CheckInScreen from './src/screens/CheckInScreen';
import TodayAppointmentsScreen from './src/screens/TodayAppointmentsScreen';

export default function App() {
  const [authState, setAuthState] = useState(null); // { user, salon, token }
  const [currentScreen, setCurrentScreen] = useState('DASHBOARD'); // 'DASHBOARD' | 'CHECK_IN' | 'TODAY_APPOINTMENTS'

  const handleLoginSuccess = (data) => {
    setAuthState(data);
    setCurrentScreen('DASHBOARD');
  };

  const handleLogout = () => {
    setAuthState(null);
    setCurrentScreen('DASHBOARD');
  };

  if (!authState) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      {currentScreen === 'DASHBOARD' && (
        <DashboardScreen
          user={authState.user}
          salon={authState.salon}
          onNavigate={setCurrentScreen}
          onLogout={handleLogout}
        />
      )}

      {currentScreen === 'CHECK_IN' && (
        <CheckInScreen
          salon={authState.salon}
          onBack={() => setCurrentScreen('DASHBOARD')}
        />
      )}

      {currentScreen === 'TODAY_APPOINTMENTS' && (
        <TodayAppointmentsScreen
          onBack={() => setCurrentScreen('DASHBOARD')}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a'
  }
});
