import { useState, useEffect } from 'react';
import { useFaceApi } from './useFaceApi';
import api from './api';
import { ShieldCheck, UserCheck, Search, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const Verify = ({ hotel, token }) => {
  const { loadingStatus, modelsLoaded, cameraReady, videoRef, startVideo, captureDescriptor } = useFaceApi();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState({ type: 'info', msg: 'Initializing...' });

  useEffect(() => {
    setStatus({ type: 'info', msg: loadingStatus });
  }, [loadingStatus]);

  useEffect(() => {
    startVideo();
  }, []);

  useEffect(() => {
    if (modelsLoaded) {
      setStatus({ type: 'info', msg: 'System ready' });
    }
  }, [modelsLoaded]);

  const handleVerify = async () => {
    setLoading(true);
    setResult(null);
    setStatus({ type: 'loading', msg: 'Analyzing...' });
    try {
      const descriptor = await captureDescriptor();
      if (!descriptor) {
        setStatus({ type: 'error', msg: 'No face found.' });
        setLoading(false);
        return;
      }
      const data = await api.verifyFace(hotel.id, descriptor, token);
      setResult(data);
      setStatus({ type: 'success', msg: `Verified: ${data.guest_name}` });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scanner-grid">
      <div>
        <div className="video-container" style={{aspectRatio:"5/3"}}>
          <video ref={videoRef} autoPlay muted playsInline className={!cameraReady ? 'hidden-video' : ''} />
          
          {!cameraReady && (
            <div className="camera-placeholder">
              <Loader2 className="animate-spin" size={32} color="#6366f1" />
              <span>{loadingStatus}...</span>
            </div>
          )}

          <div className="scanner-overlay">
            {loading && <div className="scan-line"></div>}

            {result && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(16,185,129,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 200, animation: 'fadeIn 0.35s ease-out', pointerEvents: 'auto' }}>
                <div style={{ background: 'white', padding: '0.85rem', borderRadius: '50%', marginBottom: '0.85rem', boxShadow: '0 10px 28px rgba(0,0,0,0.25)' }}>
                  <CheckCircle2 size={40} color="#10b981" />
                </div>
                <h2 style={{ fontSize: '1.75rem', margin: 0, fontWeight: '800' }}>VERIFIED</h2>
                <div style={{ fontSize: '1.1rem', marginTop: '0.25rem', opacity: 0.9 }}>{result.guest_name}</div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.4rem 1.25rem', borderRadius: '16px', marginTop: '0.75rem', fontSize: '0.85rem', fontWeight: '600' }}>
                  Room {result.room_number}
                </div>
                <button onClick={() => setResult(null)} className="btn" style={{ marginTop: '1.25rem', background: 'white', color: '#10b981', padding: '0.5rem 1.75rem', pointerEvents: 'auto', fontSize: '0.8rem' }}>
                  Dismiss
                </button>
              </div>
            )}

            {/* Status at BOTTOM */}
            <div className="verification-status" style={{ borderLeft: `1px solid ${status.type === 'success' ? '#10b981' : status.type === 'error' ? '#f43f5e' : '#6366f1'}` }}>
              {status.type === 'success' ? <CheckCircle2 size={12} color="#10b981" /> : status.type === 'error' ? <XCircle size={16} color="#f43f5e" /> : <ShieldCheck size={16} color="#6366f1" />}
              <div>
                <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{status.msg}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="side-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <ShieldCheck color="var(--primary)" size={20} />
          <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Entry Portal</h3>
        </div>

        <p style={{ marginBottom: '1.25rem', fontSize: '0.78rem', lineHeight: '1.6' }}>
          Look into the camera and press verify for instant biometric authentication.
        </p>

        <button className="btn btn-primary" onClick={handleVerify} disabled={loading || !cameraReady}>
          <Search size={15} /> {loading ? 'Scanning...' : 'Verify Identity'}
        </button>

        <div style={{ marginTop: '1.25rem', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <div style={{ fontWeight: '600', marginBottom: '0.4rem', color: 'white', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Guidelines</div>
          <ul style={{ paddingLeft: '1rem', color: 'var(--text-muted)', fontSize: '0.7rem', display: 'grid', gap: '0.35rem' }}>
            <li>Stand 0.5m – 1.2m away</li>
            <li>Look directly at the camera</li>
            <li>Remove obstructions if needed</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Verify;
