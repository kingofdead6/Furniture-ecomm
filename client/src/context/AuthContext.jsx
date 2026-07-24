import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { api } from "../lib/api";

// Auth state derived from the JWT in localStorage/sessionStorage (the existing
// "token" contract). Exposes the decoded usertype immediately and hydrates the
// full customer profile from /auth/me in the background.

const AuthContext = createContext(null);

const readToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

function decode(token) {
  try {
    const d = jwtDecode(token);
    if (d.exp && d.exp * 1000 < Date.now()) return null;
    return d;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(readToken);
  const [decoded, setDecoded] = useState(() => (readToken() ? decode(readToken()) : null));
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const t = readToken();
    const d = t ? decode(t) : null;
    setToken(t);
    setDecoded(d);
    if (d && d.usertype === "user") {
      setLoading(true);
      try {
        const { data } = await api.get("/auth/me");
        setProfile(data);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    } else {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onAuth = () => refresh();
    window.addEventListener("authChanged", onAuth);
    window.addEventListener("storage", onAuth);
    return () => {
      window.removeEventListener("authChanged", onAuth);
      window.removeEventListener("storage", onAuth);
    };
  }, [refresh]);

  const login = useCallback((newToken, remember = true) => {
    if (remember) localStorage.setItem("token", newToken);
    else sessionStorage.setItem("token", newToken);
    window.dispatchEvent(new Event("authChanged"));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setProfile(null);
    window.dispatchEvent(new Event("authChanged"));
  }, []);

  const usertype = decoded?.usertype || null;
  const isAdmin = usertype === "admin" || usertype === "superadmin";
  const isCustomer = usertype === "user";

  return (
    <AuthContext.Provider
      value={{
        token,
        usertype,
        isAuthenticated: Boolean(decoded),
        isAdmin,
        isCustomer,
        profile,
        setProfile,
        loading,
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
