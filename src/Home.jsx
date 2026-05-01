import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Zap, Scan, ArrowRight } from 'lucide-react';
import './App.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <div className="landing-content">
        <div className="logo-section">
          <div className="landing-logo">
            <ShieldCheck size={60} color="var(--primary)" />
            <div className="logo-glow"></div>
          </div>
          <h1 className="landing-title" style={{color:'white'}}>VAYKA <span className="text-primary">SECURE</span></h1>
        </div>

        <div className="description-section">
          <p className="landing-subtitle">
            Next-generation biometric authentication powered by advanced neural networks.
          </p>
          <div className="feature-badges">
            <div className="feature-badge">
              <Zap size={14} />
              <span>Real-time detection</span>
            </div>
            <div className="feature-badge">
              <Scan size={14} />
              <span>High Precision</span>
            </div>
          </div>

        </div>

        <button className="enter-btn" onClick={() => navigate('/login')}>
          <span>Enter Portal</span>
          <ArrowRight size={20} />
        </button>

        <div className="landing-footer">
          <div className="status-dot"></div>
          <span>Biometric Engine Online</span>
        </div>
      </div>

      {/* Decorative Background Elements */}
      <div className="bg-blur-circle circle-1"></div>
      <div className="bg-blur-circle circle-2"></div>
    </div>
  );
};

export default Home;
