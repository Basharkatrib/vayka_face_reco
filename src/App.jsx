import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import Login from './Login'
import HotelSelect from './HotelSelect'
import Verify from './Verify'
import Register from './Register'
import { LogOut, ShieldCheck, UserPlus, Home } from 'lucide-react'
import './App.css'

function AppContent() {
  const [user, setUser] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const savedToken = localStorage.getItem('owner_token');
    const savedUser = localStorage.getItem('owner_user');
    const savedHotel = localStorage.getItem('selected_hotel');
    if (savedToken && savedUser) {
        setUser({ access_token: savedToken, user: JSON.parse(savedUser) });
        if (savedHotel) setSelectedHotel(JSON.parse(savedHotel));
    }
    setInitialized(true);
  }, []);

  const handleLogin = (data) => {
    setUser(data);
    localStorage.setItem('owner_token', data.access_token);
    localStorage.setItem('owner_user', JSON.stringify(data.user));
  };

  const handleHotelSelect = (hotel) => {
    setSelectedHotel(hotel);
    localStorage.setItem('selected_hotel', JSON.stringify(hotel));
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setSelectedHotel(null);
  };

  if (!initialized) return null;

  return (
    <>
       {user && selectedHotel && (
         <nav className="navbar">
            <div className="nav-brand">
                <div className="nav-logo">
                    <ShieldCheck color="white" size={18} />
                </div>
                <div className="nav-brand-text">
                   <div style={{ fontWeight: '800', fontSize: '0.85rem', color: 'white', letterSpacing: '0.04em' }}>VAYKA</div>
                   <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: '500', maxWidth: '120px', whiteSpace: 'nowrap' }}>{selectedHotel.name}</div>
                </div>
            </div>

            <div className="nav-links">
                <Link to="/verify" className={`nav-link ${location.pathname === '/verify' ? 'active' : ''}`}>
                    <Home size={14} /> <span className="link-text">Monitor</span>
                </Link>
                <Link to="/register" className={`nav-link ${location.pathname === '/register' ? 'active' : ''}`}>
                    <UserPlus size={14} /> <span className="link-text">Register</span>
                </Link>
            </div>

            <button onClick={handleLogout} className="nav-logout">
                <LogOut size={14} /> <span>Exit</span>
            </button>
         </nav>
       )}

       <div className={user && selectedHotel ? 'page-content' : ''}>
         <Routes>
            <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/select" />} />
            <Route path="/select" element={user ? (!selectedHotel ? <HotelSelect token={user.access_token} onSelect={handleHotelSelect} /> : <Navigate to="/verify" />) : <Navigate to="/login" />} />
            <Route path="/verify" element={user && selectedHotel ? <Verify hotel={selectedHotel} token={user.access_token} /> : <Navigate to="/login" />} />
            <Route path="/register" element={user && selectedHotel ? <Register hotel={selectedHotel} token={user.access_token} /> : <Navigate to="/login" />} />
            <Route path="/" element={<Navigate to={user ? (selectedHotel ? "/verify" : "/select") : "/login"} />} />
         </Routes>
       </div>
    </>
  )
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    )
}

export default App
