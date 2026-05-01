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
        <div className="premium-card-compact">
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <div style={{ background: 'rgba(99,102,241,0.08)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
              <ShieldAlert size={20} color="#6366f1" />
            </div>
            <h2 className="title-gradient" style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Staff Authorization</h2>
            <p style={{ fontSize: '0.75rem' }}>Verify identity to proceed.</p>
          </div>

          {status.type === 'error' && (
            <div className="badge-error" style={{ marginBottom: '0.8rem', padding: '0.5rem', fontSize: '0.7rem' }}>{status.msg}</div>
          )}

          <form onSubmit={handleAdminAuth}>
            <div className="form-group-compact">
              <label><Mail size={11} /> Email</label>
              <input type="email" className="premium-input-compact" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required />
            </div>
            <div className="form-group-compact">
              <label><Lock size={11} /> Password</label>
              <input type="password" className="premium-input-compact" value={adminPass} onChange={e => setAdminPass(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Authorize'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- MAIN REGISTRATION UI ---
  return (
    <div className="scanner-grid-wide">
      <div className="camera-section">
        <div className="video-container-wide">
          <video ref={videoRef} autoPlay muted playsInline className={!cameraReady ? 'hidden-video' : ''} />
          
          {!cameraReady && (
            <div className="camera-placeholder">
              <Loader2 className="animate-spin" size={32} color="#6366f1" />
              <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Initializing Biometrics...</span>
            </div>
          )}

          <div className="scanner-overlay">
            {loading && <div className="scan-line-v2"></div>}
            <div className="corner-decor top-left"></div>
            <div className="corner-decor top-right"></div>
            <div className="corner-decor bottom-left"></div>
            <div className="corner-decor bottom-right"></div>
            
            <div className="verification-status-v2" style={{ bottom: '15px', left: '15px', right: 'auto', maxWidth: '250px' }}>
              <div className={status.type === 'loading' ? 'pulse-indicator' : ''}>
                {status.type === 'success' ? <CheckCircle2 size={16} color="#10b981" /> : <AlertCircle size={16} color="#6366f1" />}
              </div>
              <div className="flex flex-col">
                <span className="status-label">System Status</span>
                <span className="status-value" style={{ fontSize: '0.75rem' }}>{status.msg}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="side-card-compact">
        <div className="auth-notice-v2">
          <ShieldAlert size={12} />
          <span>Secured Session</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <div className="icon-badge-small">
            <UserPlus color="var(--primary)" size={16} />
          </div>
          <h3 style={{ margin: 0, fontSize: '0.9rem' }}>Guest Onboarding</h3>
        </div>

        <p style={{ marginBottom: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          Assign biometric signature to a guest booking.
        </p>

        <div className="form-group-compact">
          <label style={{ fontSize: '0.65rem' }}>Select Booking</label>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <select className="premium-input-compact" value={selectedBooking} onChange={(e) => setSelectedBooking(e.target.value)}>
              <option value="">Choose guest...</option>
              {bookings.map(b => (
                <option key={b.id} value={b.id}>{b.guest_name} ({b.room?.name})</option>
              ))}
            </select>
            <button className="btn" style={{ width: 'auto', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', padding: '0 0.5rem' }} onClick={fetchBookings}>
              <RefreshCw size={12} color="var(--text-muted)" />
            </button>
          </div>
        </div>

        <button className="btn btn-primary" style={{ padding: '0.8rem' }} onClick={handleRegister} disabled={loading || !cameraReady}>
          <Camera size={14} /> {loading ? 'Processing...' : 'Capture & Save'}
        </button>

        <div className="guidelines-mini">
          <span className="text-[10px] uppercase opacity-40 font-bold tracking-widest">Biometric Guide</span>
          <ul className="mt-2 text-[10px] text-gray-500 pl-4 list-disc space-y-1">
            <li>Ensure neutral lighting</li>
            <li>Face directly forward</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Register;
