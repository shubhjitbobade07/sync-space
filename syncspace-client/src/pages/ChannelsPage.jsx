import Sidebar from '../components/Sidebar';
import { MessageSquare, Hash, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ChannelsPage() {
  const { user } = useAuth();

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />

      {/* Main Empty State View */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-dark)',
        padding: '32px',
        textAlign: 'center',
      }}>
        <div className="glass-container animate-fade-in" style={{
          maxWidth: '480px',
          width: '100%',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            boxShadow: '0 8px 24px var(--accent-glow)'
          }}>
            <MessageSquare size={32} color="#ffffff" />
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
            Welcome to SyncSpace, {user?.name || 'Teammate'}!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
            Select a channel from the left sidebar to start chatting, or create a new channel to collaborate with your team.
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '12px 18px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            fontSize: '13px',
            color: 'var(--text-muted)'
          }}>
            <Hash size={16} color="var(--accent-light)" />
            <span>Click any channel name on the sidebar to join</span>
          </div>
        </div>
      </main>
    </div>
  );
}