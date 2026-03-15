import { useState, useEffect } from 'react';
import { useFaceApi } from './useFaceApi';
import api from './api';
import { UserPlus, RefreshCw, Camera, CheckCircle2, AlertCircle, ShieldAlert, Lock, Mail, Loader2 } from 'lucide-react';

const Register = ({ hotel, token }) => {
  const { modelsLoaded, cameraReady, videoRef, startVideo, captureDescriptor } = useFaceApi();
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: 'info', msg: 'Awaiting staff auth' });

  useEffect(() => {
    if (isAdminAuth && modelsLoaded) {
      startVideo();
      fetchBookings();
      setStatus({ type: 'info', msg: 'Ready to register' });
    }
  }, [isAdminAuth, modelsLoaded]);

  const handleAdminAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.login(adminEmail, adminPass);
      setIsAdminAuth(true);
    } catch {
      setStatus({ type: 'error', msg: 'Invalid credentials.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const data = await api.getHotelBookings(hotel.id, token);
      setBookings(data);
    } catch {
      setStatus({ type: 'error', msg: 'Failed to load bookings' });
    }
  };

  const handleRegister = async () => {
    if (!selectedBooking) {
      setStatus({ type: 'error', msg: 'Select a guest first' });
      return;
    }
    setLoading(true);
    setStatus({ type: 'loading', msg: 'Scanning...' });
    try {
      const descriptor = await captureDescriptor();
      if (!descriptor) {
        setStatus({ type: 'error', msg: 'No face detected. Try again.' });
        setLoading(false);
        return;
      }
      await api.registerFace(selectedBooking, descriptor, token);
      setStatus({ type: 'success', msg: 'Biometric saved!' });
      fetchBookings();
      setSelectedBooking('');
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  // --- AUTH GATE ---
  if (!isAdminAuth) {
    return (
      <div className="auth-container">
        <div className="premium-card" style={{ maxWidth: '380px' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{ background: 'rgba(99,102,241,0.08)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <ShieldAlert size={24} color="#6366f1" />
            </div>
            <h2 className="title-gradient" style={{ fontSize: '1.35rem' }}>Staff Authorization</h2>
            <p style={{ fontSize: '0.8rem' }}>Verify your identity to proceed.</p>
          </div>

          {status.type === 'error' && (
            <div className="badge-error" style={{ marginBottom: '1rem' }}>{status.msg}</div>
          )}

          <form onSubmit={handleAdminAuth}>
            <div className="form-group">
              <label><Mail size={12} /> Email</label>
              <input type="email" className="premium-input" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label><Lock size={12} /> Password</label>
              <input type="password" className="premium-input" value={adminPass} onChange={e => setAdminPass(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Authorize'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- MAIN REGISTRATION UI ---
  return (
    <div className="scanner-grid">
      <div>
        <div className="video-container">
          <video ref={videoRef} autoPlay muted playsInline className={!cameraReady ? 'hidden-video' : ''} />
          
          {!cameraReady && (
            <div className="camera-placeholder">
              <Loader2 className="animate-spin" size={32} color="#6366f1" />
              <span>Connecting camera...</span>
            </div>
          )}

          <div className="scanner-overlay">
            {loading && <div className="scan-line"></div>}
            {/* Status at BOTTOM */}
            <div className="verification-status" style={{ borderLeft: `3px solid ${status.type === 'success' ? '#10b981' : status.type === 'error' ? '#f43f5e' : '#6366f1'}` }}>
              {status.type === 'success' ? <CheckCircle2 size={16} color="#10b981" /> : <AlertCircle size={16} color="#6366f1" />}
              <div>
                <div style={{ fontWeight: '600', fontSize: '0.72rem', color: 'white' }}>Status</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{status.msg}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="side-card">
        <div className="auth-notice">
          <ShieldAlert size={13} />
          <span>Session Active</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <UserPlus color="var(--primary)" size={20} />
          <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Guest Onboarding</h3>
        </div>

        <p style={{ marginBottom: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Select a guest and capture their biometric.
        </p>

        <div className="form-group">
          <label>Booking</label>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <select className="premium-input" value={selectedBooking} onChange={(e) => setSelectedBooking(e.target.value)}>
              <option value="">Choose guest...</option>
              {bookings.map(b => (
                <option key={b.id} value={b.id}>{b.guest_name} ({b.room?.name})</option>
              ))}
            </select>
            <button className="btn" style={{ width: 'auto', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', padding: '0 0.6rem' }} onClick={fetchBookings}>
              <RefreshCw size={14} color="var(--text-muted)" />
            </button>
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleRegister} disabled={loading || !cameraReady}>
          <Camera size={15} /> {loading ? 'Processing...' : 'Capture & Save'}
        </button>
      </div>
    </div>
  );
};

export default Register;
