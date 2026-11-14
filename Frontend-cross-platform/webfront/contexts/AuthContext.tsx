"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CurrentUser } from "@/lib/auth";
import { useAuth as useAppAuth } from "@/lib/auth-context";
import { clearAccessToken, onUnauthorized } from "@/services/api";

export type Portal = "client" | "optician" | "employee";

interface PortalAuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  portal: Portal;
  storeId: string;
  setStoreId: (storeId: string) => void;
  logout: () => void;
}

const PortalAuthContext = createContext<PortalAuthContextValue | null>(null);

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const { user, status, signOut } = useAppAuth();
  const [storeId, setStoreIdState] = useState("");

  const setStoreId = useCallback((id: string) => {
    setStoreIdState(id);
  }, []);

  const logout = useCallback(() => {
    clearAccessToken();
    setStoreId("");
    signOut();
  }, [setStoreId, signOut]);

  useEffect(() => onUnauthorized(logout), [logout]);

  const portal: Portal = user?.accountType === "OPTICIAN" ? "optician" : "client";
  const value = useMemo(
    () => ({ user, loading: status === "loading", portal, storeId, setStoreId, logout }),
    [user, status, portal, storeId, setStoreId, logout],
  );

  return (
    <PortalAuthContext.Provider value={value}>
      {children}
    </PortalAuthContext.Provider>
  );
}

export function useAuth(): PortalAuthContextValue {
  const value = useContext(PortalAuthContext);
  if (!value) throw new Error("useAuth must be used inside PortalAuthProvider");
  return value;
}
