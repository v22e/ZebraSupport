import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchMe, loginUser, logoutUser, registerUser } from "../api/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const data = await fetchMe();
      setUser(data.user);
    } catch (_error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      async login(payload) {
        const data = await loginUser(payload);
        setUser(data.user);
        return data.user;
      },
      async register(payload) {
        const data = await registerUser(payload);
        setUser(data.user);
        return data.user;
      },
      async logout() {
        await logoutUser();
        setUser(null);
      }
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};