import { useState } from 'react';
import api from './api';
import { LogIn, Mail, Lock, ShieldCheck } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.login(email, password);
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="premium-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <ShieldCheck size={32} color="#6366f1" />
          </div>
          <h1 className="title-gradient">Vayka Face</h1>
          <p>Secure Owner Authentication</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="badge badge-error" style={{ width: '100%', marginBottom: '1.5rem', padding: '0.75rem', borderRadius: '12px' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label><Mail size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Email Address</label>
            <input
              type="email"
              className="premium-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@vayka.com"
              required
            />
          </div>

          <div className="form-group">
            <label><Lock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Password</label>
            <input
              type="password"
              className="premium-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Authenticating...' : <><LogIn size={18} /> Sign In</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
