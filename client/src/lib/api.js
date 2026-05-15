import axios from "axios";

// In production, frontend is served from the same server, so use relative URLs
// In development, proxy to localhost:5000
const isDev = import.meta.env.DEV;

export const SERVER_URL = isDev ? "http://localhost:5000" : "";

const API = axios.create({
  baseURL: `${SERVER_URL}/api`,
  withCredentials: true,
});

export default API;
