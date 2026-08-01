import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  User, 
  Mail, 
  Lock, 
  Shield, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Sparkles,
  AlertCircle 
} from 'lucide-react';

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isRegister) {
        await register(form.name, form.email, form.password, form.role);
      } else {
        await login(form.email, form.password);
      }
      navigate('/channels');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      padding: '24px',
    }}>
      <div className="glass-container animate-fade-in" style={{
        display: 'flex',
        width: '100%',
        maxWidth: '960px',
        minHeight: '560px',
        overflow: 'hidden',
      }}>
        {/* Left Side: Brand & Feature Showcase (Visible on larger screens) */}
        <div style={{
          flex: '1.1',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.15) 100%)',
          borderRight: '1px solid var(--border-color)',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
              <div style={{
                background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)',
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px var(--accent-glow)'
              }}>
                <MessageSquare size={22} color="#ffffff" />
              </div>
              <span style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.5px' }}>
                SyncSpace
              </span>
            </div>

            <h1 style={{ fontSize: '32px', fontWeight: '700', lineHeight: '1.2', marginBottom: '16px' }}>
              Real-time collaboration for modern teams.
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6' }}>
              Connect with your team in real-time channels, manage roles, and stay in sync effortlessly.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255, 255, 255, 0.04)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <Sparkles size={18} color="var(--accent-light)" />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Instant Socket.IO Real-time Messaging</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255, 255, 255, 0.04)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <Shield size={18} color="var(--role-owner)" />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Role-based Access Control (Owner / Admin / Member)</span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div style={{
          flex: '1',
          padding: '40px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'rgba(17, 24, 39, 0.4)',
        }}>
          {/* Tab Switcher */}
          <div style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.25)',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '28px',
            border: '1px solid var(--border-color)'
          }}>
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                background: !isRegister ? 'var(--bg-surface)' : 'transparent',
                color: !isRegister ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: !isRegister ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                background: isRegister ? 'var(--bg-surface)' : 'transparent',
                color: isRegister ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: isRegister ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              Create Account
            </button>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '6px' }}>
            {isRegister ? 'Create an account' : 'Welcome back'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
            {isRegister ? 'Enter your details below to join SyncSpace' : 'Enter your credentials to access your workspace'}
          </p>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '12px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              marginBottom: '20px',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isRegister && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 42px',
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 42px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {isRegister && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Select Workspace Role
                </label>
                <div style={{ position: 'relative' }}>
                  <Shield size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <select
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 42px',
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                    }}
                  >
                    <option value="user">User (End Access)</option>
                    <option value="member">Member (Standard Access)</option>
                    <option value="admin">Admin (Channel Manager)</option>
                    <option value="owner">Owner (Full Control)</option>
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="glow-button"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '15px',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              <span>{submitting ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}</span>
              {!submitting && <ArrowRight size={18} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}