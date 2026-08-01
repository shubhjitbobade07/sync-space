import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { 
  MessageSquare, 
  Hash, 
  Plus, 
  LogOut, 
  Search, 
  ShieldCheck, 
  X, 
  FolderPlus,
  Lock,
  Trash2
} from 'lucide-react';

export default function Sidebar() {
  const [channels, setChannels] = useState([]);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const [channelToDelete, setChannelToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { id: activeChannelId } = useParams();

  const loadChannels = async () => {
    try {
      const res = await api.get('/channels');
      setChannels(res.data);
    } catch (err) {
      console.error('Failed to load channels', err);
    }
  };

  useEffect(() => {
    loadChannels();
  }, []);

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    setCreateError('');
    setCreating(true);

    try {
      const res = await api.post('/channels', { name: newChannelName.trim() });
      setNewChannelName('');
      setShowCreateModal(false);
      await loadChannels();
      navigate(`/channels/${res.data._id}`);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Could not create channel. Require Admin or Owner role.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteChannel = async () => {
    if (!channelToDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/channels/${channelToDelete._id}`);
      const deletedId = channelToDelete._id;
      setChannelToDelete(null);
      setChannels(prev => prev.filter(c => c._id !== deletedId));
      if (activeChannelId === deletedId) {
        navigate('/channels');
      }
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete channel.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredChannels = channels.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const canCreateChannel = user?.role === 'admin' || user?.role === 'owner';

  const canDeleteChannel = (c) => {
    if (!user || !c) return false;
    if (user.role === 'owner') return true;
    if (user.role === 'admin') {
      const creatorId = typeof c.createdBy === 'object' ? c.createdBy?._id : c.createdBy;
      const currentUserId = user.id || user.userId;
      return creatorId?.toString() === currentUserId?.toString();
    }
    return false;
  };

  return (
    <aside style={{
      width: '280px',
      height: '100vh',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Workspace Header */}
      <div style={{
        padding: '20px 20px 16px 20px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)',
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px var(--accent-glow)'
          }}>
            <MessageSquare size={18} color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', lineHeight: '1.2' }}>SyncSpace</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Workspace</span>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          title="Create Channel"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Channel Search Bar */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search channels..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '13px',
            }}
          />
        </div>
      </div>

      {/* Channels List Header */}
      <div style={{
        padding: '8px 20px 6px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
          Channels ({channels.length})
        </span>
      </div>

      {/* Channels Scroll Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px' }}>
        {filteredChannels.length === 0 ? (
          <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No channels found.
          </div>
        ) : (
          filteredChannels.map(c => {
            const isActive = c._id === activeChannelId;
            const isDeletable = canDeleteChannel(c);
            return (
              <div
                key={c._id}
                onClick={() => navigate(`/channels/${c._id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  margin: '2px 0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: isActive ? 'var(--accent-glow)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--accent-border)' : '1px solid transparent',
                  fontWeight: isActive ? '600' : '400',
                  transition: 'all 0.15s ease',
                }}
              >
                <Hash size={16} color={isActive ? 'var(--accent-light)' : 'var(--text-muted)'} />
                <span style={{ fontSize: '14px', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.name}
                </span>

                {isDeletable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setChannelToDelete(c);
                      setDeleteError('');
                    }}
                    title="Delete Channel"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      padding: '4px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'color 0.15s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* User Profile Footer */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--border-color)',
        background: 'rgba(0, 0, 0, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: '600',
            fontSize: '13px',
            flexShrink: 0,
          }}>
            {getInitials(user?.name)}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'User'}
            </div>
            <div style={{ marginTop: '2px' }}>
              <span className={`badge-role ${user?.role || 'member'}`}>
                {user?.role || 'member'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign Out"
          style={{
            background: 'transparent',
            color: 'var(--text-muted)',
            padding: '8px',
            borderRadius: '8px',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* Create Channel Modal Overlay */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
        }}>
          <div className="glass-container animate-fade-in" style={{
            width: '100%',
            maxWidth: '420px',
            padding: '24px',
            background: 'var(--bg-sidebar)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderPlus size={20} color="var(--accent-light)" />
                <h3 style={{ fontSize: '18px' }}>Create Channel</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            {!canCreateChannel && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: 'var(--role-owner)',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Lock size={15} />
                <span>Only Admins or Owners can create new channels.</span>
              </div>
            )}

            {createError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                marginBottom: '14px',
              }}>
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateChannel}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Channel Name
              </label>
              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <Hash size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="e.g. general, announcements"
                  value={newChannelName}
                  onChange={e => setNewChannelName(e.target.value)}
                  disabled={!canCreateChannel || creating}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '10px 16px',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canCreateChannel || creating}
                  className="glow-button"
                  style={{
                    padding: '10px 18px',
                    fontSize: '13px',
                    opacity: (!canCreateChannel || creating) ? 0.5 : 1,
                  }}
                >
                  {creating ? 'Creating...' : 'Create Channel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Channel Confirmation Modal Overlay */}
      {channelToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
        }}>
          <div className="glass-container animate-fade-in" style={{
            width: '100%',
            maxWidth: '420px',
            padding: '24px',
            background: 'var(--bg-sidebar)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 size={20} color="#f87171" />
                <h3 style={{ fontSize: '18px' }}>Delete Channel</h3>
              </div>
              <button onClick={() => setChannelToDelete(null)} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>#{channelToDelete.name}</strong>? This action will permanently remove all messages in this channel and cannot be undone.
            </p>

            {deleteError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                marginBottom: '16px',
              }}>
                {deleteError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setChannelToDelete(null)}
                disabled={deleting}
                style={{
                  padding: '10px 16px',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteChannel}
                disabled={deleting}
                style={{
                  padding: '10px 18px',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#ffffff',
                  fontWeight: '500',
                  borderRadius: '10px',
                  fontSize: '13px',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? 'Deleting...' : 'Delete Channel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
