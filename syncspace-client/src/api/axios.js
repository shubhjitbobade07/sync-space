import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true // still needed — this is how the refresh cookie gets sent to /auth/refresh
});

// Module-level variable — lives outside React, so the interceptor below
// (which runs outside any component) can always read the current token.
let accessToken = null;
export const setAccessToken = (token) => { accessToken = token; };

// Runs before every request — attaches the token automatically,
// so pages/components never have to think about headers manually.
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let isRefreshing = null;

// Runs after every response — catches an expired access token (401),
// tries ONE silent refresh, retries the original request, and gives up cleanly if that fails too.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true; // prevents an infinite retry loop

      try {
        // Deliberately using plain axios, NOT `api` — using `api` here would
        // re-trigger this same interceptor if /refresh itself ever 401s,
        // creating an infinite loop.
        if (!isRefreshing) {
          isRefreshing = axios.post('http://localhost:5000/api/auth/refresh', {}, { withCredentials: true });
        }
        const res = await isRefreshing;
        isRefreshing = null;

        setAccessToken(res.data.accessToken);
        original.headers.Authorization = `Bearer ${res.data.accessToken}`;
        return api(original); // retry the original request, now with a fresh token
      } catch (refreshErr) {
        isRefreshing = null;
        setAccessToken(null);
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  }
);

export default api;