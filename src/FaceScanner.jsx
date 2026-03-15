import { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import api from './api';
import './FaceScanner.css';

const FaceScanner = ({ hotel, token, onLogout }) => {
  const videoRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState({ type: 'loading', msg: 'جاري تحميل الأنظمة...' });
  const [matchResult, setMatchResult] = useState(null);
  const [mode, setMode] = useState('verify'); // verify | register
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState('');

  // Load models and bookings
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        setStatus({ type: 'loading', msg: 'تم تحميل النماذج. جاري تشغيل الكاميرا...' });
        startVideo();
      } catch (err) {
        console.error("Model loading error:", err);
        setStatus({ type: 'error', msg: 'خطأ في تحميل الموديلات. تأكد من وجود الملفات في مجلد public/models' });
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
     if (mode === 'register') {
         fetchBookings();
     }
  }, [mode]);

  const fetchBookings = async () => {
      try {
          const data = await api.getHotelBookings(hotel.id, token);
          setBookings(data);
      } catch (err) {
          console.error("Fetch bookings error:", err);
      }
  };

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStatus({ type: 'success', msg: 'النظام جاهز - ' + hotel.name });
        }
      })
      .catch((err) => {
        console.error("Camera error:", err);
        setStatus({ type: 'error', msg: 'فشل الوصول إلى الكاميرا' });
      });
  };

  const handleAction = async () => {
    if (!videoRef.current || isScanning) return;
    if (mode === 'register' && !selectedBooking) {
        alert('يرجى اختيار ضيف أولاً');
        return;
    }

    setIsScanning(true);
    setStatus({ type: 'loading', msg: 'جاري مسح الوجه...' });
    setMatchResult(null);

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setStatus({ type: 'error', msg: 'لم يتم العثور على وجه. حاول التحرك قليلاً' });
        setIsScanning(false);
        return;
      }

      const descriptorArray = Array.from(detection.descriptor);

      if (mode === 'verify') {
        setStatus({ type: 'loading', msg: 'جاري التحقق من الهوية مع السحابة...' });
        const result = await api.verifyFace(hotel.id, descriptorArray, token);
        setMatchResult(result);
        setStatus({ type: 'success', msg: `تم التحقق! أهلاً بك يا ${result.guest_name}` });
      } else {
        setStatus({ type: 'loading', msg: 'جاري تسجيل البصمة للضيف...' });
        await api.registerFace(selectedBooking, descriptorArray, token);
        setStatus({ type: 'success', msg: 'تم تسجيل بصمة الوجه بنجاح!' });
        fetchBookings(); // Refresh list
        setSelectedBooking('');
      }

    } catch (err) {
      console.error("Action error:", err);
      setStatus({ type: 'error', msg: err.message || 'حدث خطأ في العملية' });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="face-scanner-container">
      <div className="scanner-card">
        <div className="header">
           <div className="mode-toggle">
               <button 
                  className={mode === 'verify' ? 'active' : ''} 
                  onClick={() => {setMode('verify'); setMatchResult(null);}}
               >
                  مراقبة دخول
               </button>
               <button 
                  className={mode === 'register' ? 'active' : ''} 
                  onClick={() => {setMode('register'); setMatchResult(null);}}
               >
                  تسجيل ضيف
               </button>
           </div>
           <button className="btn-logout" onClick={onLogout}>خروج</button>
        </div>
        
        <div className="hotel-info">
            <strong>الفندق:</strong> {hotel.name}
        </div>

        {mode === 'register' && (
            <div className="registration-controls">
                <select 
                    value={selectedBooking} 
                    onChange={(e) => setSelectedBooking(e.target.value)}
                    className="booking-select"
                >
                    <option value="">-- اختر الضيف للتسجيل --</option>
                    {bookings.map(b => (
                        <option key={b.id} value={b.id}>
                            {b.guest_name} ({b.room?.name})
                        </option>
                    ))}
                </select>
                <button className="btn-refresh" onClick={fetchBookings}>🔄</button>
            </div>
        )}

        <div className={`status-badge status-${status.type}`}>
          {status.msg}
        </div>

        <div className="video-wrapper">
          <video
            ref={videoRef}
            autoPlay
            muted
            onPlay={() => setIsScanning(false)}
          />
          <div className="scan-overlay">
            {isScanning && <div className="scan-line"></div>}
          </div>
          
          {matchResult && mode === 'verify' && (
            <div className="match-overlay">
                <div className="match-content">
                    <div className="icon">✅</div>
                    <h2>مرحباً بزيارتك</h2>
                    <div className="guest-name">{matchResult.guest_name}</div>
                    <div className="room-info">غرفة رقم: {matchResult.room_number}</div>
                </div>
            </div>
          )}
        </div>

        <div className="controls">
          <button 
            className="btn btn-primary" 
            onClick={handleAction}
            disabled={!modelsLoaded || isScanning}
          >
            {isScanning ? 'جاري العمل...' : 
             (mode === 'verify' ? '🔍 تحقق من هويتي' : '📸 حفظ بصمة الوجه')}
          </button>
        </div>
        
        <p className="footer-text">
            {mode === 'verify' ? 'قرب وجهك من الكاميرا للتحقق من حجزك' : 'اختر الضيف ثم التقط بصمة وجهه لإتمام التسجيل'}
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .mode-toggle {
            display: flex;
            background: #e2e8f0;
            padding: 4px;
            border-radius: 8px;
        }
        .mode-toggle button {
            padding: 6px 16px;
            border: none;
            background: transparent;
            cursor: pointer;
            border-radius: 6px;
            font-weight: bold;
            color: #64748b;
        }
        .mode-toggle button.active {
            background: white;
            color: #3b82f6;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .registration-controls {
            display: flex;
            gap: 8px;
            margin-bottom: 1rem;
        }
        .booking-select {
            flex: 1;
            padding: 0.75rem;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            font-size: 1rem;
            text-align: right;
        }
        .btn-refresh {
            padding: 0 12px;
            border: 1px solid #cbd5e1;
            background: white;
            border-radius: 8px;
            cursor: pointer;
        }
      `}} />
    </div>
  );
};

export default FaceScanner;
