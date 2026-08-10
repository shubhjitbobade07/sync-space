import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import { 
  Users, 
  Search, 
  UserMinus, 
  ShieldCheck, 
  ArrowLeft, 
  Mail, 
  Calendar,
  AlertCircle,
  Crown,
  Shield,
  User,
  RefreshCw
} from 'lucide-react';

const ROLE_OPTIONS = ['member', 'admin', 'owner'];

function RoleBadge({ role }) {
  const styles = {
    owner: { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.35)', color: '#f59e0b', Icon: Crown },
    admin: { bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.35)', color: '#818cf8', Icon: Shield },
    member: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', color: '#6ee7b7', Icon: User },
  };
  const s = styles[role] || styles.member;
  const { Icon } = s;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
    }}>
      <Icon size={11} />
      {role}
    </span>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isOwnerOrAdmin = user?.role === 'owner' || user?.role === 'admin';
    if (!isOwnerOrAdmin) {
      navigate('/channels');
      return;
    }
    fetchUsers();
  }, [user]);

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingUserId(userId);
    setError('');
    try {
      await api.patch(`/auth/users/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Permanently delete this user? This cannot be undone.')) return;
    setDeletingUserId(userId);
    setError('');
    try {
      await api.delete(`/auth/users/${userId}`);
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setDeletingUserId(null);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  const currentUserId = user?.id || user?.userId;

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-dark)', overflowY: 'auto' }}>

        {/* Header */}
        <header style={{
          padding: '16px 28px',
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(17, 24, 39, 0.6)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => navigate('/channels')}
              title="Back to Channels"
              style={{
                background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '6px',
                borderRadius: '8px', transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <ArrowLeft size={18} />
            </button>

            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(99,102,241,0.2))',
              border: '1px solid rgba(16,185,129,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(16,185,129,0.15)',
            }}>
              <ShieldCheck size={20} color="#10b981" />
            </div>

            <div>
              <h2 style={{ fontSize: '17px', fontWeight: '700', lineHeight: '1.2' }}>Admin Dashboard</h2>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Manage Users & Roles</span>
            </div>
          </div>

          <button
            onClick={fetchUsers}
            disabled={loading}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)', padding: '8px 14px', borderRadius: '8px',
              fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </header>

        {/* Error Banner */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)', borderBottom: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#f87171', padding: '10px 28px', fontSize: '13px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px', width: '100%', margin: '0 auto' }}>

          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
            {[
              { label: 'Total Users', value: users.length, color: '#818cf8', Icon: Users },
              { label: 'Owners', value: roleCounts['owner'] || 0, color: '#f59e0b', Icon: Crown },
              { label: 'Admins', value: roleCounts['admin'] || 0, color: '#818cf8', Icon: Shield },
              { label: 'Members', value: roleCounts['member'] || 0, color: '#6ee7b7', Icon: User },
            ].map(({ label, value, color, Icon }) => (
              <div key={label} className="glass-container" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <Icon size={18} color={color} />
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                </div>
                <div style={{ fontSize: '28px', fontWeight: '700', color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* User Table Card */}
          <div className="glass-container" style={{ padding: '0', overflow: 'hidden' }}>
            {/* Search Bar */}
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between', flexWrap: 'wrap',
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600' }}>All Users</h3>
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width: '100%', padding: '9px 12px 9px 36px',
                    background: 'rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-color)',
                    borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px',
                  }}
                />
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px', fontSize: '14px' }}>Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px', fontSize: '14px' }}>No users found.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                      {['User', 'Role', 'Joined', 'Actions'].map((h, i) => (
                        <th key={h} style={{
                          padding: '12px 20px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.06em',
                          textTransform: 'uppercase', color: 'var(--text-muted)',
                          textAlign: i === 3 ? 'right' : 'left',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, idx) => {
                      const isMe = u._id === currentUserId;
                      const isOwnerLocked = u.role === 'owner' && user?.role !== 'owner';
                      return (
                        <tr
                          key={u._id}
                          style={{
                            borderBottom: idx < filteredUsers.length - 1 ? '1px solid var(--border-color)' : 'none',
                            background: isMe ? 'rgba(99,102,241,0.04)' : 'transparent',
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => !isMe && (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                          onMouseLeave={e => e.currentTarget.style.background = isMe ? 'rgba(99,102,241,0.04)' : 'transparent'}
                        >
                          {/* User Info */}
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                                background: isMe ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'linear-gradient(135deg, #374151, #4b5563)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: '600', fontSize: '13px', color: '#fff',
                              }}>
                                {u.name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                              </div>
                              <div>
                                <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                  {u.name}
                                  {isMe && <span style={{ fontSize: '11px', color: 'var(--accent-light)', marginLeft: '6px', fontWeight: 400 }}>(you)</span>}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                  <Mail size={11} />
                                  {u.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td style={{ padding: '14px 20px' }}>
                            {isMe || isOwnerLocked ? (
                              <RoleBadge role={u.role} />
                            ) : (
                              <select
                                value={u.role}
                                disabled={updatingUserId === u._id}
                                onChange={e => handleRoleChange(u._id, e.target.value)}
                                style={{
                                  background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)',
                                  borderRadius: '6px', color: 'var(--text-primary)', padding: '6px 10px',
                                  fontSize: '13px', outline: 'none', cursor: 'pointer',
                                  opacity: updatingUserId === u._id ? 0.5 : 1,
                                }}
                              >
                                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                              </select>
                            )}
                          </td>

                          {/* Date Joined */}
                          <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Calendar size={12} />
                              {new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleDeleteUser(u._id)}
                              disabled={isMe || isOwnerLocked || deletingUserId === u._id}
                              title={isMe ? "Can't delete yourself" : isOwnerLocked ? "Only owners can remove owners" : "Remove user"}
                              style={{
                                background: 'transparent', border: 'none', borderRadius: '6px',
                                color: (isMe || isOwnerLocked) ? 'var(--text-muted)' : '#f87171',
                                cursor: (isMe || isOwnerLocked) ? 'not-allowed' : 'pointer',
                                padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px',
                                fontSize: '13px', fontWeight: '500',
                                opacity: (isMe || isOwnerLocked) ? 0.3 : 1,
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={e => { if (!isMe && !isOwnerLocked) e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <UserMinus size={14} />
                              {deletingUserId === u._id ? 'Removing...' : 'Remove'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
