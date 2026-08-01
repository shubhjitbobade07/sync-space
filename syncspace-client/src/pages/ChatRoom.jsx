import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { 
  Hash, 
  Send, 
  Smile, 
  Paperclip, 
  Users, 
  Circle,
  AlertCircle 
} from 'lucide-react';

export default function ChatRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  
  const [channel, setChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load channel details
  useEffect(() => {
    api.get('/channels')
      .then(res => {
        const found = res.data.find(c => c._id === id);
        if (found) setChannel(found);
      })
      .catch(() => {});
  }, [id]);

  // Socket connection
  useEffect(() => {
    setMessages([]);
    setError('');

    const socket = io('http://localhost:5000', { withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('joinChannel', id);
    });

    socket.on('joinedChannel', () => {
      console.log(`Joined channel ${id}`);
    });

    socket.on('newMessage', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('errorMessage', (msg) => {
      setError(msg);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [id]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (!socketRef.current) return;

    socketRef.current.emit('sendMessage', { channelId: id, text: text.trim() });
    setText('');
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
              const isSelf = m.sender?._id === user?.id || m.sender === user?.id;
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
    </div>
  );
}