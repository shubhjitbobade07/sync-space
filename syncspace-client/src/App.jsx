import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChannelProvider } from './context/ChannelContext';
import AuthPage from './pages/AuthPage';
import ChannelsPage from './pages/ChannelsPage';
import ChatRoom from './pages/ChatRoom';
import { MessageSquare } from 'lucide-react';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        background: 'var(--bg-dark)',
        color: 'var(--text-secondary)'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)',
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          boxShadow: '0 8px 20px var(--accent-glow)'
        }}>
          <MessageSquare size={24} color="#ffffff" />
        </div>
        <p style={{ fontSize: '14px', fontWeight: '500' }}>Loading SyncSpace...</p>
      </div>
    );
  }

  return user ? children : <Navigate to="/" />;
}

export default function App() {
  return (
    <AuthProvider>
      <ChannelProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route path="/channels" element={<ProtectedRoute><ChannelsPage /></ProtectedRoute>} />
            <Route path="/channels/:id" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </ChannelProvider>
    </AuthProvider>
  );
}