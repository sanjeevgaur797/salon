import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, CheckCircle2, AlertOctagon, RefreshCw } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const AttendanceCheckInWidget = () => {
  const { salon } = useAuth();
  const [loading, setLoading] = useState(false);
  const [todayStatus, setTodayStatus] = useState(null);
  const [responseMsg, setResponseMsg] = useState(null);
  const [isError, setIsError] = useState(false);

  // Custom coordinate testing inputs
  const [testLat, setTestLat] = useState('');
  const [testLon, setTestLon] = useState('');
  const [mode, setMode] = useState('GPS'); // 'GPS' | 'CUSTOM'

  useEffect(() => {
    fetchAttendanceStatus();
    if (salon) {
      setTestLat(salon.latitude.toString());
      setTestLon(salon.longitude.toString());
    }
  }, [salon]);

  const fetchAttendanceStatus = async () => {
    try {
      const res = await api.get('/attendance/status');
      setTodayStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch attendance status:', err);
    }
  };

  const handleCheckIn = async (coords) => {
    setLoading(true);
    setResponseMsg(null);
    setIsError(false);

    try {
      const res = await api.post('/attendance/check-in', coords);
      setResponseMsg(res.data.message + ` (Distance: ${res.data.attendance.distanceMeters}m)`);
      setIsError(false);
      fetchAttendanceStatus();
    } catch (err) {
      setIsError(true);
      if (err.response && err.response.data) {
        const { error, message, distanceMeters, allowedRadius } = err.response.data;
        if (error === 'OUT_OF_RANGE') {
          setResponseMsg(`❌ 403 OUT_OF_RANGE: ${message}`);
        } else {
          setResponseMsg(`❌ ${error}: ${message}`);
        }
      } else {
        setResponseMsg('❌ Check-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const triggerGpsCheckIn = () => {
    if (!navigator.geolocation) {
      setIsError(true);
      setResponseMsg('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleCheckIn({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        setLoading(false);
        setIsError(true);
        setResponseMsg(`GPS Error: ${error.message} (Code: ${error.code})`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const presetInBounds = () => {
    if (!salon) return;
    // Add tiny offset (~20 meters)
    handleCheckIn({
      latitude: salon.latitude + 0.0001,
      longitude: salon.longitude + 0.0001
    });
  };

  const presetOutBounds = () => {
    if (!salon) return;
    // Add large offset (~5000 meters)
    handleCheckIn({
      latitude: salon.latitude + 0.05,
      longitude: salon.longitude + 0.05
    });
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '8px', borderRadius: '10px' }}>
            <MapPin size={20} color="#6366f1" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Geo-Fenced Attendance Check-In</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Server-side Haversine distance verification • Allowed Radius: <strong style={{ color: '#06b6d4' }}>{salon?.allowedRadius || 100}m</strong>
            </p>
          </div>
        </div>

        {todayStatus?.isCheckedIn ? (
          <span style={{
            background: 'rgba(16, 185, 129, 0.2)',
            color: '#10b981',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <CheckCircle2 size={14} /> Checked-in Today ({new Date(todayStatus.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
          </span>
        ) : (
          <span style={{
            background: 'rgba(245, 158, 11, 0.2)',
            color: '#f59e0b',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: 600
          }}>
            Not Checked-In Yet
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px' }}>
        <button 
          onClick={triggerGpsCheckIn} 
          disabled={loading}
          className="btn-primary"
          style={{ fontSize: '0.9rem' }}
        >
          {loading ? <RefreshCw size={16} className="spin" /> : <Navigation size={16} />}
          Check-In with Live Device GPS
        </button>

        <button 
          onClick={presetInBounds} 
          disabled={loading}
          className="btn-secondary"
          style={{ fontSize: '0.85rem', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}
        >
          Test In-Range (≤ {salon?.allowedRadius}m)
        </button>

        <button 
          onClick={presetOutBounds} 
          disabled={loading}
          className="btn-secondary"
          style={{ fontSize: '0.85rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
        >
          Test Out-of-Range (&gt; {salon?.allowedRadius}m)
        </button>
      </div>

      {responseMsg && (
        <div style={{
          marginTop: '12px',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '0.9rem',
          fontWeight: 500,
          background: isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          border: `1px solid ${isError ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
          color: isError ? '#fca5a5' : '#6ee7b7',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {isError ? <AlertOctagon size={18} /> : <CheckCircle2 size={18} />}
          <span>{responseMsg}</span>
        </div>
      )}
    </div>
  );
};

export default AttendanceCheckInWidget;
