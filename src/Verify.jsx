import { useState, useEffect, useRef } from 'react';
import { useFaceApi } from './useFaceApi';
import api from './api';
import './FaceScanner.css';
import { ShieldCheck, Search, CheckCircle2, XCircle, Loader2, Zap, Eye } from 'lucide-react';

const Verify = ({ hotel, token }) => {
  const { loadingStatus, modelsLoaded, cameraReady, videoRef, startVideo, captureDescriptor } = useFaceApi();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState({ type: 'info', msg: 'Initializing...' });
  const isVerifyingRef = useRef(false);

  useEffect(() => {
    setStatus({ type: 'info', msg: loadingStatus });
  }, [loadingStatus]);

  useEffect(() => {
    startVideo();
  }, []);

  useEffect(() => {
    if (modelsLoaded) {
      setStatus({ type: 'info', msg: 'Biometric system ready' });
    }
  }, [modelsLoaded]);

  // AUTO-VERIFY LOGIC
  useEffect(() => {
    let intervalId;

    if (cameraReady && modelsLoaded && !result && !loading) {
      intervalId = setInterval(async () => {
        if (isVerifyingRef.current) return;

        try {
          const descriptor = await captureDescriptor();
          if (descriptor) {
            isVerifyingRef.current = true;
            await handleAutoVerify(descriptor);
          }
        } catch (err) {
          console.error("Auto-scan error:", err);
        }
      }, 1000); // Scan every second
    }

    return () => clearInterval(intervalId);
  }, [cameraReady, modelsLoaded, result, loading]);

  const handleAutoVerify = async (descriptor) => {
    setLoading(true);
    setStatus({ type: 'loading', msg: 'Authenticating...' });
    try {
      const data = await api.verifyFace(hotel.id, descriptor, token);
      setResult(data);
      setStatus({ type: 'success', msg: `Welcome, ${data.guest_name}` });
      // Clear flag after success
      isVerifyingRef.current = false;
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || 'Verification failed' });
      // Reset after 3 seconds to try again
      setTimeout(() => {
        isVerifyingRef.current = false;
        setLoading(false);
        setStatus({ type: 'info', msg: 'System ready' });
      }, 3000);
    }
  };

  return (
    <div className="scanner-grid-full">
      <div className={`video-container-full ${loading ? 'scanning-active' : ''}`} >
        <video ref={videoRef} autoPlay muted playsInline className={!cameraReady ? 'hidden-video' : ''} />

        {!cameraReady && (
          <div className="camera-placeholder">
            <div className="pulsing-circle">
              <Loader2 className="animate-spin" size={40} color="var(--primary)" />
            </div>
            <span className="mt-4 font-mono uppercase tracking-widest text-xs opacity-60">{loadingStatus}</span>
          </div>
        )}

        <div className="scanner-overlay">
          {loading && <div className="scan-line-v2"></div>}
          <div className="corner-decor top-left"></div>
          <div className="corner-decor top-right"></div>
          <div className="corner-decor bottom-left"></div>
          <div className="corner-decor bottom-right"></div>

          {/* Verification Result Overlay */}
          {result && (
            <div className="result-overlay-premium">
              <div className="success-icon-wrapper">
                <CheckCircle2 size={48} color="#10b981" />
              </div>
              <div className="text-center">
                <div className="text-emerald-400 font-medium tracking-wide">{result.guest_name}</div>
              </div>

              <div className="result-details">
                <div className="detail-pill">
                  <span className="label">ROOM</span>
                  <span className="value">{result.room_number}</span>
                </div>
                <div className="detail-pill">
                  <span className="label">STATUS</span>
                  <span className="value">ACTIVE</span>
                </div>
              </div>

              <button onClick={() => { setResult(null); isVerifyingRef.current = false; setLoading(false); }} className="dismiss-btn">
                DISMISS
              </button>
            </div>
          )}

          {/* Status Indicator */}
          <div className={`verification-status-v2 ${status.type}`}>
            <div className="pulse-indicator"></div>
            <div className="flex flex-col">
              <span className="status-label">Biometric Status</span>
              <span className="status-value">{status.msg}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verify;
