import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface UserProfile {

  email: string;

  name: string;

  id?: string;

}

interface AuthContextType {

  user: UserProfile | null;

  isAuthenticated: boolean;

  isLoading: boolean;

  login: () => void;

  logout: () => void;

}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_LOGIN_URL =

  "https://devqfabricforge.azurewebsites.net/api/auth_login?code=z_EBjLFyiurPXQ0Lg2DrSPYLpyrKOfvz7Ww_sY_bJgISAzFuiI9tdQ==";

export function AuthProvider({ children }: { children: ReactNode }) {

  const [user, setUser] = useState<UserProfile | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  /**

   * 1️⃣ Load user from localStorage on app start

   */

  useEffect(() => {
    const storedUser = localStorage.getItem("userProfile");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("userProfile");
      }
    }
  }, []);

  /**

   * 2️⃣ Handle redirect FROM BACKEND (NOT Azure AD)

   * Backend redirects to:

   *   /auth/success?email=...&name=...&id=...

   */

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const email = params.get("email");
    const name = params.get("name");
    const id = params.get("id");

    if (email && name) {
      const userProfile: UserProfile = { email, name, id: id || undefined };

      localStorage.setItem("userProfile", JSON.stringify(userProfile));
      setUser(userProfile);

      // IMPORTANT: clean URL ONLY
      window.history.replaceState({}, document.title, "/hub");
    }

    // ✅ loading ends ONLY after redirect check
    setIsLoading(false);
  }, []);


  /**

   * 3️⃣ Login → redirect to backend ONLY

   */

  const login = () => {

    window.location.href = AUTH_LOGIN_URL;

  };

  /**

   * 4️⃣ Logout

   */

  const logout = () => {

    localStorage.removeItem("userProfile");

    setUser(null);

    window.location.href = "/login";

  };

  return (
    <AuthContext.Provider

      value={{

        user,

        isAuthenticated: !!user,

        isLoading,

        login,

        logout,

      }}
    >

      {children}
    </AuthContext.Provider>

  );

}

export function useAuth() {

  const context = useContext(AuthContext);

  if (!context) {

    throw new Error("useAuth must be used within AuthProvider");

  }

  return context;

}

