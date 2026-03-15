import { useState, useEffect } from 'react';
import api from './api';
import { LayoutDashboard, MapPin, Building2, ChevronRight, Loader2 } from 'lucide-react';

const HotelSelect = ({ token, onSelect }) => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const data = await api.getOwnerHotels(token);
        setHotels(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, [token]);

  return (
    <div className="auth-container">
      <div className="premium-card">
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <h1 className="title-gradient" style={{ fontSize: '2.5rem' }}>Managed Properties</h1>
          <p style={{ fontSize: '1rem' }}>Assign this terminal to a specific hotel location.</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--primary)' }}>
            <Loader2 className="animate-spin" size={40} style={{ margin: '0 auto 1rem' }} />
            <p>Retrieving your properties...</p>
          </div>
        ) : error ? (
          <div className="badge badge-error" style={{ width: '100%', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>{error}</div>
        ) : (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {hotels.map((hotel) => (
              <button
                key={hotel.id}
                onClick={() => onSelect(hotel)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  padding: '1.5rem',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border)',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                className="hotel-item"
              >
                <div style={{ background: 'linear-gradient(135deg, var(--primary), #4f46e5)', padding: '1rem', borderRadius: '16px', boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)' }}>
                  <Building2 size={28} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '1.25rem', marginBottom: '0.4rem', color: 'white' }}>{hotel.name}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} /> {hotel.address || 'Address Protected'}
                  </div>
                </div>
                <ChevronRight size={20} color="var(--text-muted)" />
              </button>
            ))}
          </div>
        )}

        <style dangerouslySetInnerHTML={{ __html: `
            .hotel-item:hover {
                background: rgba(255,255,255,0.06) !important;
                border-color: var(--primary) !important;
                transform: translateY(-2px) scale(1.02);
                box-shadow: 0 12px 24px rgba(0,0,0,0.2);
            }
            .animate-spin {
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `}} />
      </div>
    </div>
  );
};

export default HotelSelect;
