import { getLoginUrl } from "@/const";
import { getFirebaseAuth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, type Unsubscribe, type User } from "firebase/auth";
import { useEffect, useState } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    try {
      const auth = getFirebaseAuth();
      unsubscribe = onAuthStateChanged(
        auth,
        async (currentUser) => {
          if (currentUser) {
            try {
              const idToken = await currentUser.getIdToken();
              const res = await fetch("/api/auth/firebase-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
              });
              if (!res.ok) {
                const errorText = await res.text();
                console.error("[Auth] Failed to create session cookie:", res.status, errorText);
                throw new Error(`Failed to create session cookie: ${res.status} ${errorText}`);
              }
              setUser(currentUser);
            } catch (err) {
              console.error("[Auth] Session creation failed:", err);
              setError(err as Error);
              setUser(null);
            }
          } else {
            setUser(null);
          }
          setLoading(false);
        },
        (err) => {
          setError(err);
          setLoading(false);
        }
      );
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      return;
    }

    return () => unsubscribe?.();
  }, []);

  const logout = async () => {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (loading) return;
    if (user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [redirectOnUnauthenticated, redirectPath, loading, user]);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    logout,
    refresh: () => {}, // Firebase handles refresh automatically
  };
}
