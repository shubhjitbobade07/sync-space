import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChannels } from '../context/ChannelContext';
import { MessageSquare, AlertCircle } from 'lucide-react';

// Landing page for the Google OAuth redirect.
// The server redirects here with ?token=<accessToken> after a successful login.
// We grab the token, hydrate AuthContext, clear channels cache, then go to /channels.
export default function OAuthSuccess() {
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const { clearChannels } = useChannels();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setError('No token received from Google. Please try again.');
      return;
    }

    loginWithToken(token)
      .then(() => {
        clearChannels(); // clear any stale channel cache from a previous user
        navigate('/channels', { replace: true });
      })
      .catch(() => {
        setError('Failed to complete sign-in. Please try again.');
      });
  }, []); // runs once on mount

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        background: 'var(--bg-dark)',
        gap: '16px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          padding: '14px 18px',
          borderRadius: '12px',
          fontSize: '14px',
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
        <button
          onClick={() => navigate('/', { replace: true })}
          style={{
            padding: '10px 20px',
            background: 'var(--accent-primary)',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      background: 'var(--bg-dark)',
      color: 'var(--text-secondary)',
      gap: '16px',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)',
        width: '52px',
        height: '52px',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 24px var(--accent-glow)',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}>
        <MessageSquare size={26} color="#ffffff" />
      </div>
      <p style={{ fontSize: '14px', fontWeight: '500' }}>Signing you in with Google...</p>
    </div>
  );
}
