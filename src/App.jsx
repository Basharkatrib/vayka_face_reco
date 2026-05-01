import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import Login from './Login'
import HotelSelect from './HotelSelect'
import Verify from './Verify'
import Register from './Register'
import Home from './Home'
import { LogOut, ShieldCheck, UserPlus, Menu, X, Settings, LayoutDashboard } from 'lucide-react'
import './App.css'

function AppContent() {
  const [user, setUser] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    setIsMenuOpen(false);
  };

  if (!initialized) return null;

  const isAuth = user && selectedHotel;

  return (
    <div className="app-main-container">
       {isAuth && (
         <>
            {/* Floating Menu Button */}
            <button className={`floating-menu-btn ${isMenuOpen ? 'active' : ''}`} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Backdrop */}
            {isMenuOpen && <div className="menu-backdrop" onClick={() => setIsMenuOpen(false)}></div>}

            {/* Floating Navigation Menu */}
            <div className={`floating-nav-panel ${isMenuOpen ? 'open' : ''}`}>
                <div className="menu-header">
                    <div className="menu-brand">
                        <ShieldCheck color="var(--primary)" size={24} />
                        <div className="flex flex-col">
                            <span className="text-sm font-black tracking-tighter">VAYKA SECURE </span>
                            <span className="text-[10px] opacity-50 uppercase">{selectedHotel.name}</span>
                        </div>
                    </div>
                </div>

                <div className="menu-items">
                    <Link to="/verify" className={`menu-item-link ${location.pathname === '/verify' ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
                        <div className="item-icon"><LayoutDashboard size={20} /></div>
                        <span>Security Monitor</span>
                    </Link>
                    <Link to="/register" className={`menu-item-link ${location.pathname === '/register' ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
                        <div className="item-icon"><UserPlus size={20} /></div>
                        <span>Guest Registration</span>
                    </Link>
                    <div className="menu-divider"></div>
                    <button onClick={handleLogout} className="menu-item-link logout">
                        <div className="item-icon"><LogOut size={20} /></div>
                        <span>Exit System</span>
                    </button>
                </div>

                <div className="menu-footer">
                    <span className="text-[9px] opacity-30 uppercase tracking-widest font-bold">Biometric v2.0.4</span>
                </div>
            </div>
         </>
       )}

       <main className={isAuth ? 'app-viewport' : ''}>
         <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/select" />} />
            <Route path="/select" element={user ? (!selectedHotel ? <HotelSelect token={user.access_token} onSelect={handleHotelSelect} /> : <Navigate to="/verify" />) : <Navigate to="/login" />} />
            <Route path="/verify" element={user && selectedHotel ? <Verify hotel={selectedHotel} token={user.access_token} /> : <Navigate to="/login" />} />
            <Route path="/register" element={user && selectedHotel ? <Register hotel={selectedHotel} token={user.access_token} /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/" />} />
         </Routes>
       </main>
    </div>
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
