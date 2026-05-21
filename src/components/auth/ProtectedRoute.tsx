import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Wraps any route that requires authentication.
 * - While auth state is being restored from localStorage → renders nothing (avoids flash).
 * - If not authenticated → redirects to /login.
 * - If authenticated → renders the child page normally.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Don't render anything while we check localStorage to avoid a flash
  if (isLoading) return null;

  if (!isAuthenticated) {
    document.title = "Nori";
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <>{children}</>;
}
