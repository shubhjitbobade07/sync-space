import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/axios';

const ChannelContext = createContext();

export function ChannelProvider({ children }) {
  const [channels, setChannels] = useState([]);
  const [channelsLoaded, setChannelsLoaded] = useState(false);

  const loadChannels = useCallback(async () => {
    try {
      const res = await api.get('/channels');
      setChannels(res.data);
      setChannelsLoaded(true);
    } catch (err) {
      console.error('Failed to load channels', err);
    }
  }, []);

  const removeChannel = useCallback((id) => {
    setChannels(prev => prev.filter(c => c._id !== id));
  }, []);

  // Call this on logout or user switch — clears stale data so the
  // next user gets a fresh fetch and never sees another user's channels
  const clearChannels = useCallback(() => {
    setChannels([]);
    setChannelsLoaded(false);
  }, []);

  return (
    <ChannelContext.Provider value={{ channels, setChannels, channelsLoaded, loadChannels, removeChannel, clearChannels }}>
      {children}
    </ChannelContext.Provider>
  );
}

export const useChannels = () => useContext(ChannelContext);
