import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Register with optional profile pic
export const registerUser = async (formData) => {
  const res = await api.post("/api/auth/register", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return res.data;
};

// Login
export const loginUser = async (data) => {
  const res = await api.post("/api/auth/login", data);
  return res.data;
};

// Update profile pic
export const updateProfilePic = async (formData) => {
  const res = await api.post("/api/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return res.data;
};

// Get current user
export const getMe = async () => {
  const res = await api.get("/api/auth/me");
  return res.data;
};

export default api;