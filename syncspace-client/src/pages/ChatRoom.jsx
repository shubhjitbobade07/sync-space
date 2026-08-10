import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useChannels } from '../context/ChannelContext';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { 
  Hash, 
  Send, 
  Smile, 
  Paperclip, 
  Users, 
  Circle,
  AlertCircle,
  Trash2,
  X,
  LogOut
} from 'lucide-react';

export default function ChatRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();
  const { channels, channelsLoaded, loadChannels, removeChannel } = useChannels();
  
  const [channel, setChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [managingRequestId, setManagingRequestId] = useState(null);
  const [leaving, setLeaving] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset state immediately when navigating to a different channel
  // so we never show stale channel name or old messages during the transition
  useEffect(() => {
    setChannel(null);
    setMessages([]);
    setText('');
  }, [id]);

  // Resolve channel from shared context — no extra API call needed
  useEffect(() => {
    if (!channelsLoaded) {
      loadChannels();
    }
  }, []);

  useEffect(() => {
    if (channels.length > 0) {
      // Always update channel (including null if not found) when id or channels change
      const found = channels.find(c => c._id === id) || null;
      setChannel(found);
    }
  }, [channels, id]);

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await api.get(`/channels/${id}/requests`);
      setRequests(res.data);
    } catch (err) {
      console.error('Failed to fetch requests', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (showRequestsModal && id) {
      fetchRequests();
    }
  }, [showRequestsModal, id]);

  const handleAcceptRequest = async (userId) => {
    setManagingRequestId(userId);
    try {
      await api.post(`/channels/${id}/requests/${userId}/accept`);
      setRequests(prev => prev.filter(r => r._id !== userId));
      loadChannels();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept request');
    } finally {
      setManagingRequestId(null);
    }
  };

  const handleRejectRequest = async (userId) => {
    setManagingRequestId(userId);
    try {
      await api.post(`/channels/${id}/requests/${userId}/reject`);
      setRequests(prev => prev.filter(r => r._id !== userId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setManagingRequestId(null);
    }
  };

  const canManageRequests = () => {
    if (!user || !channel) return false;
    const creatorId = typeof channel.createdBy === 'object' ? channel.createdBy?._id : channel.createdBy;
    const currentUserId = user.id || user.userId;
    const isCreator = creatorId?.toString() === currentUserId?.toString();
    const isOwnerOrAdmin = user.role === 'owner' || user.role === 'admin';
    return isCreator || isOwnerOrAdmin;
  };

  // Socket connection
  useEffect(() => {
    if (!accessToken) return; // wait until AuthContext has actually loaded a token

    const socket = io('http://localhost:5000', {
      auth: { token: accessToken } // <-- this replaces withCredentials
    });
    socketRef.current = socket;

    socket.on('connect', () => { setConnected(true); socket.emit('joinChannel', id); });
    socket.on('disconnect', () => setConnected(false));
    socket.on('newMessage', (msg) => setMessages((prev) => [...prev, msg]));
    socket.on('errorMessage', (msg) => console.error(msg));
    socket.on('connect_error', (err) => console.error('Socket auth failed:', err.message));

    return () => socket.disconnect();
  }, [id, accessToken]); // re-run if the token changes too

  const sendMessage = (e) => {
    e.preventDefault();
    socketRef.current.emit('sendMessage', { channelId: id, text });
    setText('');
  };

  const handleDeleteChannel = async () => {
    if (!channel) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/channels/${id}`);
      removeChannel(id); // instantly remove from shared context so sidebar updates
      navigate('/channels');
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete channel.');
      setDeleting(false);
    }
  };

  const canDeleteChannel = () => {
    if (!user || !channel) return false;
    if (user.role === 'owner') return true;
    if (user.role === 'admin') {
      const creatorId = typeof channel.createdBy === 'object' ? channel.createdBy?._id : channel.createdBy;
      const currentUserId = user.id || user.userId;
      return creatorId?.toString() === currentUserId?.toString();
    }
    return false;
  };

  const canLeaveChannel = () => {
    if (!user || !channel) return false;
    const creatorId = typeof channel.createdBy === 'object' ? channel.createdBy?._id : channel.createdBy;
    const currentUserId = user.id || user.userId;
    return creatorId?.toString() !== currentUserId?.toString();
  };

  const handleLeaveChannel = async () => {
    if (!channel) return;
    if (!window.confirm(`Are you sure you want to leave #${channel.name}?`)) return;
    setLeaving(true);
    try {
      await api.post(`/channels/${id}/leave`);
      removeChannel(id);
      navigate('/channels');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to leave channel.');
    } finally {
      setLeaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />

      {/* Main Chat Workspace */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: 'var(--bg-dark)',
      }}>
        {/* Channel Top Header */}
        <header style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(17, 24, 39, 0.4)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid var(--accent-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Hash size={18} color="var(--accent-light)" />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '700', lineHeight: '1.2' }}>
                {channel ? channel.name : 'Channel Chat'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <Circle size={8} fill={connected ? '#10b981' : '#f59e0b'} color="transparent" />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {connected ? 'Connected' : 'Connecting...'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {channel?.members && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
              }}>
                <Users size={14} color="var(--text-muted)" />
                <span>{channel.members.length} member{channel.members.length > 1 ? 's' : ''}</span>
              </div>
            )}

            {canManageRequests() && (
              <button
                onClick={() => setShowRequestsModal(true)}
                title="Manage Requests"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: 'var(--accent-light)',
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.25)';
                }}
              >
                <Users size={14} />
                <span>Join Requests</span>
                {channel?.requests && channel.requests.length > 0 && (
                  <span style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    borderRadius: '50%',
                    fontSize: '10px',
                    padding: '1px 5px',
                    marginLeft: '4px',
                    fontWeight: 'bold'
                  }}>
                    {channel.requests.length}
                  </span>
                )}
              </button>
            )}

            {canDeleteChannel() && (
              <button
                onClick={() => {
                  setShowDeleteModal(true);
                  setDeleteError('');
                }}
                title="Delete Channel"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#f87171',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)';
                }}
              >
                <Trash2 size={14} />
                <span>Delete Channel</span>
              </button>
            )}

            {canLeaveChannel() && (
              <button
                onClick={handleLeaveChannel}
                disabled={leaving}
                title="Leave Channel"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#f87171',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  opacity: leaving ? 0.6 : 1,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)';
                }}
              >
                <LogOut size={14} />
                <span>Leave Channel</span>
              </button>
            )}
          </div>
        </header>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            padding: '10px 24px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Messages Stream Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          {messages.length === 0 ? (
            <div style={{
              margin: 'auto',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '14px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Hash size={24} color="var(--text-muted)" />
              </div>
              <p>This is the start of the #{channel?.name || 'channel'} channel.</p>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Send a message to kick off the conversation!</span>
            </div>
          ) : (
            messages.map((m, i) => {
              const currentUserId = user?.id || user?.userId;
              const isSelf = m.sender?._id === currentUserId || m.sender === currentUserId;
              const senderName = m.sender?.name || 'User';

              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: isSelf ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  {/* Sender Avatar */}
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: isSelf 
                      ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' 
                      : 'linear-gradient(135deg, #374151, #4b5563)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontWeight: '600',
                    fontSize: '12px',
                    flexShrink: 0,
                    boxShadow: isSelf ? '0 2px 8px var(--accent-glow)' : 'none',
                  }}>
                    {getInitials(senderName)}
                  </div>

                  {/* Message Bubble */}
                  <div style={{
                    maxWidth: '65%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isSelf ? 'flex-end' : 'flex-start',
                  }}>
                    <span style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      marginBottom: '4px',
                      padding: '0 4px',
                    }}>
                      {senderName}
                    </span>

                    <div style={{
                      padding: '12px 16px',
                      borderRadius: isSelf ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isSelf 
                        ? 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)' 
                        : 'var(--bg-surface)',
                      color: '#ffffff',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      boxShadow: isSelf ? '0 4px 14px var(--accent-glow)' : '0 2px 8px rgba(0,0,0,0.2)',
                      border: isSelf ? 'none' : '1px solid var(--border-color)',
                      wordBreak: 'break-word',
                    }}>
                      {m.text}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Bottom Input Box */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(17, 24, 39, 0.4)',
          backdropFilter: 'blur(12px)',
          flexShrink: 0,
        }}>
          <form onSubmit={sendMessage} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '6px 12px 6px 16px',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
          }}>
            <input
              type="text"
              placeholder={`Message #${channel ? channel.name : 'channel'}...`}
              value={text}
              onChange={e => setText(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '14px',
                padding: '8px 0',
              }}
            />

            <button
              type="submit"
              disabled={!text.trim()}
              className="glow-button"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                opacity: text.trim() ? 1 : 0.4,
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </main>

      {/* Header Delete Channel Confirmation Modal */}
      {showDeleteModal && channel && (
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
              <button onClick={() => setShowDeleteModal(false)} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>#{channel.name}</strong>? This action will permanently remove all messages in this channel and cannot be undone.
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
                onClick={() => setShowDeleteModal(false)}
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

      {/* Join Requests Modal Overlay */}
      {showRequestsModal && channel && (
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
            maxWidth: '480px',
            padding: '24px',
            background: 'var(--bg-sidebar)',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="var(--accent-light)" />
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Pending Join Requests</h3>
              </div>
              <button onClick={() => setShowRequestsModal(false)} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', minHeight: '200px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {loadingRequests ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>Loading requests...</div>
              ) : requests.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No pending join requests for this channel.</div>
              ) : (
                requests.map(r => (
                  <div
                    key={r._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{r.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.email}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleRejectRequest(r._id)}
                        disabled={managingRequestId === r._id}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          borderRadius: '6px',
                          background: 'transparent',
                          color: '#f87171',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          cursor: 'pointer',
                        }}
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleAcceptRequest(r._id)}
                        disabled={managingRequestId === r._id}
                        className="glow-button"
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}