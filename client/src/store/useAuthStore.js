import { create } from "zustand";
import API from "../lib/api";
import toast from "react-hot-toast";

const useAuthStore = create((set) => ({
  user: null,
  isLoading: false,
  isCheckingAuth: true,

  signup: async (formData) => {
    set({ isLoading: true });
    try {
      const res = await API.post("/auth/signup", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      set({ user: res.data });
      toast.success("Account created successfully! 🎉");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await API.post("/auth/login", { email, password });
      set({ user: res.data });
      toast.success("Welcome back! 👋");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await API.post("/auth/logout");
      set({ user: null });
      toast.success("Logged out");
    } catch (error) {
      toast.error("Logout failed");
    }
  },

  checkAuth: async () => {
    try {
      const res = await API.get("/auth/check");
      set({ user: res.data });
    } catch {
      set({ user: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    set({ isLoading: true });
    try {
      await API.put("/auth/change-password", { currentPassword, newPassword });
      toast.success("Password changed successfully! 🔒");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Password change failed");
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (formData) => {
    set({ isLoading: true });
    try {
      const res = await API.put("/users/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      set({ user: res.data });
      toast.success("Profile updated! ✨");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useAuthStore;
