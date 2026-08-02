import { createContext, useContext, useState, useEffect } from 'react';
import api, { setAccessToken } from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setToken] = useState(null); // React state copy — for components like ChatRoom to read
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On every fresh page load, in-memory state is gone (that's the whole point —
    // we chose not to persist it). Try to silently re-establish it using the
    // httpOnly refresh cookie, which DID survive the refresh.
    api.post('/auth/refresh')
      .then((res) => {
        setAccessToken(res.data.accessToken);
        setToken(res.data.accessToken);
        return api.get('/auth/me');
      })
      .then((res) => setUser(res.data))
      .catch(() => {
        setAccessToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setAccessToken(res.data.accessToken);
    setToken(res.data.accessToken);
    setUser(res.data.user);
  };

  const register = async (name, email, password, role) => {
    const res = await api.post('/auth/register', { name, email, password, role });
    setAccessToken(res.data.accessToken);
    setToken(res.data.accessToken);
    setUser(res.data.user);
  };

  // Called by the /oauth-success landing page after a Google OAuth redirect.
  // The token arrives via URL query param; refresh cookie was already set by
  // the server redirect, so silent refresh will work on future page loads too.
  const loginWithToken = async (token) => {
    setAccessToken(token);
    setToken(token);
    const res = await api.get('/auth/me');
    setUser(res.data);
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setAccessToken(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, register, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);