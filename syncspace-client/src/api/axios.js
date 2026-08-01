import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true // CRITICAL — without this, the browser won't send/receive the session cookie cross-origin
});

export default api;