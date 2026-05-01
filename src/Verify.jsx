import { useState, useEffect, useRef } from 'react';
import { useFaceApi } from './useFaceApi';
import api from './api';
import './FaceScanner.css';
import { ShieldCheck, Search, CheckCircle2, XCircle, Loader2, Zap, Eye, QrCode, ScanFace, Check } from 'lucide-react';
import jsQR from 'jsqr';

const Verify = ({ hotel, token }) => {
  const { loadingStatus, modelsLoaded, cameraReady, videoRef, startVideo, captureDescriptor } = useFaceApi();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState({ type: 'info', msg: 'Initializing...' });
  const [mode, setMode] = useState('face'); // 'face' or 'qr'
  const isVerifyingRef = useRef(false);
  const faceAttemptsRef = useRef(0);
  const canvasRef = useRef(null);

  useEffect(() => {
    setStatus({ type: 'info', msg: loadingStatus });
  }, [loadingStatus]);

  useEffect(() => {
    startVideo();
    // Create hidden canvas for QR processing
    canvasRef.current = document.createElement('canvas');
  }, []);

  useEffect(() => {
    if (modelsLoaded) {
      setStatus({ type: 'info', msg: 'Biometric system ready' });
    }
  }, [modelsLoaded]);

  // UNIFIED SCANNING LOOP
  useEffect(() => {
    let intervalId;

    if (cameraReady && !result && !loading) {
      intervalId = setInterval(async () => {
        if (isVerifyingRef.current) return;

        // In Face Mode: Only scan face
        // In QR Mode: Scan BOTH Face and QR (Hybrid Mode)
        
        if (mode === 'face' && modelsLoaded) {
          try {
            const descriptor = await captureDescriptor();
            if (descriptor) {
              isVerifyingRef.current = true;
              await handleAutoVerify(descriptor);
            }
          } catch (err) {
            console.error("Auto-scan error:", err);
          }
        } else if (mode === 'qr') {
          // 1. Try QR Scan
          scanQRCode();
          
          // 2. ALSO try Face Scan (Parallel) if models are ready
          if (modelsLoaded && !isVerifyingRef.current) {
            try {
              const descriptor = await captureDescriptor();
              if (descriptor) {
                // If face found in QR mode, we skip QR and just verify face
                isVerifyingRef.current = true;
                await handleAutoVerify(descriptor);
              }
            } catch (err) {
              // Ignore face errors in QR mode to avoid status spam
            }
          }
        }
      }, mode === 'face' ? 1000 : 300); 
    }

    return () => clearInterval(intervalId);
  }, [cameraReady, modelsLoaded, result, loading, mode]);

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        console.log("✅ QR Code Detected:", code.data);
        isVerifyingRef.current = true;
        handleQRSuccess(code.data);
      }
    }
  };

  // AUTO-DISMISS timer for success screen
  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => {
        setResult(null);
        isVerifyingRef.current = false;
        setLoading(false);
        setMode('face');
        faceAttemptsRef.current = 0;
      }, 4000); // 4 seconds
      return () => clearTimeout(timer);
    }
  }, [result]);

  const handleAutoVerify = async (descriptor) => {
    setLoading(true);
    setStatus({ type: 'loading', msg: 'Authenticating...' });
    try {
      const data = await api.verifyFace(hotel.id, descriptor, token);
      
      // Add scan time to result
      const now = new Date();
      const scanTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      setResult({ ...data, scan_time: scanTime });
      setStatus({ type: 'success', msg: `Welcome, ${data.guest_name}` });
      isVerifyingRef.current = false;
      faceAttemptsRef.current = 0;
    } catch (err) {
      console.error("Auth Error:", err);
      
      if (err.message.includes('401') || err.message.toLowerCase().includes('unauthorized')) {
          setStatus({ type: 'error', msg: 'Session Expired. Please Login again.' });
          setLoading(false);
          return;
      }

      faceAttemptsRef.current += 1;
      setStatus({ type: 'error', msg: err.message || 'Identity not found' });
      
      // AUTO-SWITCH logic: If failed 2 times, switch to QR
      if (faceAttemptsRef.current >= 2) {
          setStatus({ type: 'loading', msg: 'Identity not found. Switching to QR...' });
          isVerifyingRef.current = true;
          setTimeout(() => {
            setMode('qr');
            setStatus({ type: 'info', msg: 'QR Scanner ACTIVE - Scan your code' });
            isVerifyingRef.current = false;
            setLoading(false);
          }, 1500);
          return;
      }

      setTimeout(() => {
        isVerifyingRef.current = false;
        setLoading(false);
        if (faceAttemptsRef.current < 2) {
            setStatus({ type: 'info', msg: `Attempt ${faceAttemptsRef.current}/2 - Move closer` });
        }
      }, 2000);
    }
  };

  const handleQRSuccess = async (qrToken) => {
    setLoading(true);
    setStatus({ type: 'loading', msg: 'Key Detected! Verifying...' });
    
    try {
        const bookingData = await api.verifyQRCode(hotel.id, qrToken, token);
        
        // RESET ATTEMPTS so we don't immediately fallback to QR during enrollment
        faceAttemptsRef.current = 0;
        
        setStatus({ type: 'success', msg: `Identity Verified: ${bookingData.guest_name}` });
        
        setMode('face');
        setLoading(true);
        setStatus({ type: 'loading', msg: 'Success! Now look at the camera...' });
        
        // Enrollment window
        setTimeout(async () => {
            try {
                let descriptor = null;
                // Give it 10 attempts (10 seconds) to find the face
                for(let i=0; i<10; i++) {
                   setStatus({ type: 'loading', msg: `Capturing Biometrics... (${i+1}/10)` });
                   descriptor = await captureDescriptor();
                   if (descriptor) break;
                   await new Promise(r => setTimeout(r, 1000));
                }

                if (descriptor) {
                    await api.registerFace(bookingData.booking_id, descriptor, token);
                    
                    const now = new Date();
                    const scanTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    
                    setStatus({ type: 'success', msg: 'Face Linked! Welcome.' });
                    setResult({
                        guest_name: bookingData.guest_name,
                        room_number: bookingData.room_number,
                        scan_time: scanTime
                    });
                } else {
                    throw new Error("Could not capture face. Please try again.");
                }
            } catch (err) {
                setStatus({ type: 'error', msg: err.message });
                setTimeout(() => {
                   setLoading(false);
                   isVerifyingRef.current = false;
                   faceAttemptsRef.current = 0; // Ensure we stay in face mode
                }, 3000);
            }
        }, 2000);

    } catch (err) {
        setStatus({ type: 'error', msg: 'Invalid Key. Returning...' });
        setTimeout(() => {
            setLoading(false);
            setMode('face');
            isVerifyingRef.current = false;
            faceAttemptsRef.current = 0;
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
          {/* Face Positioning Guide */}
          <div className="face-guide-container">
            <div className={`face-guide-oval ${mode === 'qr' ? 'qr-guide' : (loading ? 'active' : '')}`}>
               {/* Show scanning line whenever we are not in 'success' state (result) */}
               {!result && <div className="scanning-bar"></div>}
               {mode === 'qr' && <div className="qr-focus-box-v2"></div>}
            </div>
            {!loading && !result && mode === 'face' && (
              <div className="position-prompt">Position Face Within Frame</div>
            )}
            {!loading && mode === 'qr' && (
              <div className="position-prompt">Scan QR Code</div>
            )}
          </div>

          <div className="corner-decor top-left"></div>
          <div className="corner-decor top-right"></div>
          <div className="corner-decor bottom-left"></div>
          <div className="corner-decor bottom-right"></div>

          {/* Verification Result Overlay */}
          {result && (
            <div className="result-overlay-premium">
              <div className="success-icon-wrapper">
                <CheckCircle2 size={80} color="#10b981" />
              </div>
              
              <div className="text-center">
                <h2>ACCESS GRANTED</h2>
                <h1 className="guest-name-display">{result.guest_name}</h1>
              </div>
              
              <div className="result-details">
                <div className="detail-pill-v3">
                  <span className="label">ALLOCATED ROOM</span>
                  <span className="value">{result.room_number}</span>
                </div>
                <div className="detail-pill-v3">
                  <span className="label">SCAN TIME</span>
                  <span className="value">{result.scan_time}</span>
                </div>
                <div className="detail-pill-v3">
                  <span className="label">STATUS</span>
                  <span className="value">VERIFIED</span>
                </div>
              </div>

              <button 
                onClick={() => {setResult(null); isVerifyingRef.current = false; setLoading(false); setMode('face'); faceAttemptsRef.current = 0;}} 
                className="dismiss-btn-v3"
              >
                PROCEED TO ROOM
              </button>
            </div>
          )}

          {/* Mode Toggle Button */}
          {!result && !loading && (
            <div className="flex flex-col items-center gap-4">
              {faceAttemptsRef.current >= 3 && mode === 'face' && (
                <div className="bg-red-500/20 text-red-200 px-4 py-2 rounded-xl text-xs font-bold animate-bounce border border-red-500/30">
                   FIRST TIME? TAP BUTTON BELOW
                </div>
              )}
            </div>
          )}

          {/* Status Indicator */}
          <div className={`verification-status-v2 ${status.type}`}>
            <div className="pulse-indicator"></div>
            <div className="flex flex-col">
              <span className="status-label">System Status </span>
              <span className="status-value">{status.msg}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verify;
