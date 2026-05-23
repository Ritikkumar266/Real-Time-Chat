import { create } from "zustand";

const useThemeStore = create((set) => ({
  theme: localStorage.getItem("zingchat-theme") || "dark",

  toggleTheme: () =>
    set((state) => {
      const next = state.theme === "dark" ? "light" : "dark";
      localStorage.setItem("zingchat-theme", next);
      document.documentElement.setAttribute("data-theme", next);
      return { theme: next };
    }),

  setTheme: (theme) => {
    localStorage.setItem("zingchat-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    set({ theme });
  },

  initTheme: () => {
    const saved = localStorage.getItem("zingchat-theme") || "dark";
    document.documentElement.setAttribute("data-theme", saved);
    set({ theme: saved });
  },
}));

export default useThemeStore;
